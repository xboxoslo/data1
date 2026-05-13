/* HaloTimer — PWA for å logge tid på Halo PSA-tickets via n8n proxy.
 *
 * Auth: MSAL.js mot Entra ID → access token sendes til n8n → n8n verifiserer
 * mot Microsoft Graph /me og bruker Halo system-credentials til å hente
 * tickets / opprette Actions på vegne av tekniker.
 *
 * KONFIGURASJON: fyll inn ENTRA_TENANT_ID + ENTRA_CLIENT_ID nedenfor før deploy.
 * N8N-webhooks må eksistere før appen virker.
 */

const CONFIG = {
  entra: {
    tenantId: 'ENTRA_TENANT_ID_HERE',
    clientId: 'ENTRA_CLIENT_ID_HERE',
    scopes: ['User.Read'],
  },
  n8n: {
    base: 'https://azuren8n.micronet.no',
    ticketsPath: '/webhook/timer-tickets',
    logPath: '/webhook/timer-log',
  },
};

// ─────── State ───────
const state = {
  msal: null,
  account: null,
  accessToken: null,
  tickets: [],
  selectedTicket: null,
  timerInterval: null,
};

const TIMER_KEY = 'halotimer.active';
const ACCOUNT_KEY = 'halotimer.account.homeId';

// ─────── DOM helpers ───────
const $ = (id) => document.getElementById(id);
const show = (viewId) => {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $(viewId).classList.add('active');
};
const toast = (msg, isError = false) => {
  const t = $('toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
};
const fmtTime = (totalSec) => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ─────── MSAL ───────
async function initMsal() {
  state.msal = new msal.PublicClientApplication({
    auth: {
      clientId: CONFIG.entra.clientId,
      authority: `https://login.microsoftonline.com/${CONFIG.entra.tenantId}`,
      redirectUri: window.location.origin + window.location.pathname,
    },
    cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false },
  });
  await state.msal.initialize();

  const savedId = localStorage.getItem(ACCOUNT_KEY);
  const accounts = state.msal.getAllAccounts();
  if (savedId && accounts.length) {
    state.account = accounts.find((a) => a.homeAccountId === savedId) || accounts[0];
  } else if (accounts.length === 1) {
    state.account = accounts[0];
  }
  if (state.account) state.msal.setActiveAccount(state.account);
}

async function login() {
  $('btn-login').disabled = true;
  $('login-error').style.display = 'none';
  try {
    const result = await state.msal.loginPopup({
      scopes: CONFIG.entra.scopes,
      prompt: 'select_account',
    });
    state.account = result.account;
    state.msal.setActiveAccount(state.account);
    localStorage.setItem(ACCOUNT_KEY, state.account.homeAccountId);
    await afterLogin();
  } catch (err) {
    $('login-error').textContent = `Pålogging feilet: ${err.message || err}`;
    $('login-error').style.display = 'block';
  } finally {
    $('btn-login').disabled = false;
  }
}

async function getAccessToken() {
  try {
    const res = await state.msal.acquireTokenSilent({
      scopes: CONFIG.entra.scopes,
      account: state.account,
    });
    state.accessToken = res.accessToken;
    return res.accessToken;
  } catch (silentErr) {
    const res = await state.msal.acquireTokenPopup({
      scopes: CONFIG.entra.scopes,
      account: state.account,
    });
    state.accessToken = res.accessToken;
    return res.accessToken;
  }
}

function signOut() {
  if (!state.account) return;
  state.msal.logoutPopup({ account: state.account }).finally(() => {
    localStorage.removeItem(ACCOUNT_KEY);
    state.account = null;
    state.accessToken = null;
    state.tickets = [];
    $('user-chip').style.display = 'none';
    show('view-login');
  });
}

// ─────── n8n API ───────
async function apiGetTickets() {
  const token = await getAccessToken();
  const url = CONFIG.n8n.base + CONFIG.n8n.ticketsPath;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.tickets || []);
}

async function apiLogTime(ticketId, minutes, note) {
  const token = await getAccessToken();
  const url = CONFIG.n8n.base + CONFIG.n8n.logPath;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ticket_id: ticketId, minutes, note }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─────── Views ───────
async function afterLogin() {
  const name = state.account?.name || state.account?.username || 'Bruker';
  const chip = $('user-chip');
  chip.textContent = name;
  chip.classList.add('signout');
  chip.title = 'Klikk for å logge ut';
  chip.style.display = 'block';
  chip.onclick = signOut;

  const active = readActiveTimer();
  if (active) {
    state.selectedTicket = active.ticket;
    show('view-timer');
    renderTimerView();
    startTimerDisplay(active.startMs);
  } else {
    show('view-list');
    await loadTickets();
  }
}

async function loadTickets() {
  $('list-error').style.display = 'none';
  $('ticket-list').innerHTML = '<div class="spinner"></div>';
  $('btn-refresh').disabled = true;
  try {
    state.tickets = await apiGetTickets();
    renderTicketList();
  } catch (err) {
    $('ticket-list').innerHTML = '';
    $('list-error').textContent = `Kunne ikke hente tickets: ${err.message}`;
    $('list-error').style.display = 'block';
  } finally {
    $('btn-refresh').disabled = false;
  }
}

function renderTicketList() {
  const container = $('ticket-list');
  if (!state.tickets.length) {
    container.innerHTML = '<div class="empty">Ingen åpne tickets tildelt deg.</div>';
    return;
  }
  container.innerHTML = state.tickets.map((t) => `
    <div class="ticket" data-id="${t.id}">
      <div class="id">#${t.id}</div>
      <div class="summary">${escapeHtml(t.summary || '(uten emne)')}</div>
      <div class="client">${escapeHtml(t.client_name || '')}</div>
    </div>
  `).join('');
  container.querySelectorAll('.ticket').forEach((el) => {
    el.addEventListener('click', () => {
      const id = Number(el.dataset.id);
      const ticket = state.tickets.find((t) => t.id === id);
      openTimerView(ticket);
    });
  });
}

function openTimerView(ticket) {
  state.selectedTicket = ticket;
  show('view-timer');
  renderTimerView();
  const active = readActiveTimer();
  if (active && active.ticket.id === ticket.id) {
    startTimerDisplay(active.startMs);
  } else {
    resetTimerDisplay();
  }
}

function renderTimerView() {
  const t = state.selectedTicket;
  $('timer-ticket-id').textContent = `#${t.id}`;
  $('timer-summary').textContent = t.summary || '(uten emne)';
  $('timer-client').textContent = t.client_name || '';
}

function resetTimerDisplay() {
  document.body.classList.remove('timer-state-running');
  $('timer-display').textContent = '00:00:00';
  $('timer-label').textContent = 'Klar til start';
  $('btn-start').style.display = '';
  $('btn-stop').style.display = 'none';
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function startTimerDisplay(startMs) {
  document.body.classList.add('timer-state-running');
  $('btn-start').style.display = 'none';
  $('btn-stop').style.display = '';
  $('timer-label').textContent = 'Pågår';
  const tick = () => {
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    $('timer-display').textContent = fmtTime(elapsed);
  };
  tick();
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(tick, 1000);
}

function startTimer() {
  const startMs = Date.now();
  writeActiveTimer({ ticket: state.selectedTicket, startMs });
  startTimerDisplay(startMs);
}

function stopTimer() {
  const active = readActiveTimer();
  if (!active) return;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  const elapsedSec = Math.floor((Date.now() - active.startMs) / 1000);
  const minutes = Math.max(1, Math.round(elapsedSec / 60));

  $('confirm-ticket-id').textContent = `#${active.ticket.id}`;
  $('confirm-summary').textContent = active.ticket.summary || '(uten emne)';
  $('confirm-minutes').textContent = `${minutes} min`;
  $('confirm-duration').textContent = `Faktisk varighet: ${fmtTime(elapsedSec)}`;
  $('note-input').value = '';
  $('confirm-error').style.display = 'none';
  show('view-confirm');
}

async function confirmLog() {
  const active = readActiveTimer();
  if (!active) return;
  const elapsedSec = Math.floor((Date.now() - active.startMs) / 1000);
  const minutes = Math.max(1, Math.round(elapsedSec / 60));
  const note = $('note-input').value.trim();
  const btn = $('btn-confirm-log');
  btn.disabled = true;
  btn.textContent = 'Lagrer...';
  $('confirm-error').style.display = 'none';
  try {
    await apiLogTime(active.ticket.id, minutes, note);
    clearActiveTimer();
    toast(`${minutes} min logget på #${active.ticket.id}`);
    show('view-list');
    await loadTickets();
  } catch (err) {
    $('confirm-error').textContent = `Feil: ${err.message}`;
    $('confirm-error').style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Logg på ticket';
  }
}

// ─────── Local timer state ───────
function writeActiveTimer(obj) {
  localStorage.setItem(TIMER_KEY, JSON.stringify(obj));
}
function readActiveTimer() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearActiveTimer() {
  localStorage.removeItem(TIMER_KEY);
  resetTimerDisplay();
}

// ─────── Util ───────
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// ─────── Wire up ───────
$('btn-login').addEventListener('click', login);
$('btn-refresh').addEventListener('click', loadTickets);
$('btn-back-list').addEventListener('click', () => {
  if (readActiveTimer()) {
    if (!confirm('En timer pågår. Den fortsetter i bakgrunnen. Tilbake til listen?')) return;
  }
  show('view-list');
});
$('btn-back-timer').addEventListener('click', () => show('view-timer'));
$('btn-start').addEventListener('click', startTimer);
$('btn-stop').addEventListener('click', stopTimer);
$('btn-cancel-log').addEventListener('click', () => show('view-timer'));
$('btn-confirm-log').addEventListener('click', confirmLog);

// ─────── Service worker registration ───────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ─────── Boot ───────
(async () => {
  try {
    await initMsal();
    if (state.account) {
      await afterLogin();
    }
  } catch (err) {
    $('login-error').textContent = `MSAL init feilet: ${err.message}`;
    $('login-error').style.display = 'block';
  }
})();
