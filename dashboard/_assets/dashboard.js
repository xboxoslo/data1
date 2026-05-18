/* data1.no admin dashboard
   Henter JSON-data fra /dashboard-data/, switcher tabs, rendrer Chart.js. */
(function () {
  'use strict';

  const DATA_BASE = '/dashboard-data';
  const TABS = ['seo', 'ai', 'email', 'competitors'];
  const loaded = {}; // cache: { tab: data }
  const chartInstances = {};

  // ── Tab switching ─────────────────────────────────────────────
  function activateTab(name) {
    document.querySelectorAll('.db-tab').forEach((b) => {
      const active = b.dataset.tab === name;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.db-panel').forEach((p) => {
      p.classList.toggle('is-active', p.id === `panel-${name}`);
    });
    loadTab(name);
  }

  document.querySelectorAll('.db-tab').forEach((b) => {
    b.addEventListener('click', () => activateTab(b.dataset.tab));
  });

  // ── Data loading ──────────────────────────────────────────────
  async function loadTab(name) {
    if (loaded[name]) return; // allerede rendret
    const loadingEl = document.querySelector(`[data-loading-for="${name}"]`);
    const contentEl = document.querySelector(`[data-content-for="${name}"]`);
    try {
      const r = await fetch(`${DATA_BASE}/${name}.json`, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      loaded[name] = data;
      loadingEl.style.display = 'none';
      contentEl.hidden = false;
      renderers[name](data);
    } catch (e) {
      loadingEl.innerHTML = `<span style="color:#dc2626">Kunne ikke laste data: ${e.message}</span>`;
    }
  }

  // ── Meta info i header ────────────────────────────────────────
  fetch(`${DATA_BASE}/meta.json`, { cache: 'no-cache' })
    .then((r) => r.json())
    .then((m) => {
      const d = new Date(m.lastUpdated);
      const txt = `Sist oppdatert ${d.toLocaleString('nb-NO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
      document.getElementById('meta-info').textContent = txt;
      document.getElementById('footer-meta').textContent = `Dashboard for Micronet AS · ${txt}`;
    })
    .catch(() => {});

  // ── Hjelpere ──────────────────────────────────────────────────
  function fmt(n) {
    return new Intl.NumberFormat('nb-NO').format(n);
  }
  function chartColors() {
    return ['#14b8a6', '#0f172a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];
  }
  function destroyChart(id) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }
  }
  function makeChart(canvasId, config) {
    const el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return;
    destroyChart(canvasId);
    chartInstances[canvasId] = new Chart(el, config);
  }
  function gradeClass(grade) {
    return 'grade-' + (grade || '').toLowerCase().replace('+', '').charAt(0);
  }

  // ── Renderers ─────────────────────────────────────────────────
  const renderers = {

    seo(d) {
      const s = d.summary;
      document.getElementById('seo-indexed').textContent = fmt(s.indexedPages);
      document.getElementById('seo-indexed-sub').textContent = `av ${fmt(s.totalPages)} totalt`;
      document.getElementById('seo-clicks').textContent = fmt(s.clicks28d);
      document.getElementById('seo-impressions').textContent = fmt(s.impressions28d);
      document.getElementById('seo-ctr').textContent = `CTR ${s.ctr.toFixed(2)}%`;
      document.getElementById('seo-position').textContent = s.avgPosition.toFixed(1);

      makeChart('chart-seo-timeline', {
        type: 'line',
        data: {
          labels: d.timeline.map((x) => x.date),
          datasets: [
            { label: 'Klikk', data: d.timeline.map((x) => x.clicks), borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,.1)', tension: 0.3, yAxisID: 'y' },
            { label: 'Visninger', data: d.timeline.map((x) => x.impressions), borderColor: '#0f172a', backgroundColor: 'rgba(15,23,42,.05)', tension: 0.3, yAxisID: 'y1' },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: { type: 'linear', position: 'left', title: { display: true, text: 'Klikk' } },
            y1: { type: 'linear', position: 'right', title: { display: true, text: 'Visninger' }, grid: { drawOnChartArea: false } },
          },
        },
      });

      makeChart('chart-seo-queries', {
        type: 'bar',
        data: {
          labels: d.topQueries.slice(0, 10).map((q) => q.query),
          datasets: [{ label: 'Klikk', data: d.topQueries.slice(0, 10).map((q) => q.clicks), backgroundColor: '#14b8a6' }],
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } },
      });

      makeChart('chart-seo-pages', {
        type: 'bar',
        data: {
          labels: d.topPages.slice(0, 10).map((p) => p.url),
          datasets: [{ label: 'Klikk', data: d.topPages.slice(0, 10).map((p) => p.clicks), backgroundColor: '#0f172a' }],
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } },
      });

      const tbody = document.getElementById('seo-queries-tbody');
      tbody.innerHTML = d.topQueries
        .map((q) => `<tr><td>${q.query}</td><td class="right">${fmt(q.clicks)}</td><td class="right">${fmt(q.impressions)}</td><td class="right">${q.position.toFixed(1)}</td><td class="right">${((q.clicks / q.impressions) * 100).toFixed(2)}%</td></tr>`)
        .join('');

      const ix = document.getElementById('seo-indexing-tbody');
      const statusPill = (st) => {
        const map = { indexed: ['ok', 'Indeksert'], 'crawled-not-indexed': ['warn', 'Crawlet, ikke indeksert'], discovered: ['info', 'Oppdaget'], excluded: ['err', 'Ekskludert'], unknown: ['mute', 'Ukjent'] };
        const [cls, label] = map[st] || map.unknown;
        return `<span class="db-pill db-pill-${cls}">${label}</span>`;
      };
      ix.innerHTML = d.indexingStatus
        .map((u) => `<tr><td><a href="${u.url}" target="_blank" rel="noopener" style="color:#0f766e;text-decoration:none">${u.url}</a></td><td>${statusPill(u.status)}</td><td>${u.lastCrawl ? new Date(u.lastCrawl).toLocaleDateString('nb-NO') : '—'}</td></tr>`)
        .join('');
    },

    ai(d) {
      const s = d.summary;
      document.getElementById('ai-prompts').textContent = fmt(s.promptsTested);
      document.getElementById('ai-data1').textContent = fmt(s.data1noMentions);
      document.getElementById('ai-data1-rate').textContent = `${s.data1noMentionRate.toFixed(0)}% av svar`;
      document.getElementById('ai-micronet').textContent = fmt(s.micronetMentions);
      const compTotal = Object.values(s.competitorMentions).reduce((a, b) => a + b, 0);
      document.getElementById('ai-competitors').textContent = fmt(compTotal);

      const compLabels = Object.keys(s.competitorMentions);
      const compData = compLabels.map((k) => s.competitorMentions[k]);

      makeChart('chart-ai-sources', {
        type: 'bar',
        data: {
          labels: ['data1.no', ...compLabels],
          datasets: [{ label: 'Nevninger', data: [s.data1noMentions, ...compData], backgroundColor: ['#14b8a6', ...compLabels.map((_, i) => chartColors()[(i % 6) + 2])] }],
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } },
      });

      makeChart('chart-ai-timeline', {
        type: 'line',
        data: {
          labels: d.timeline.map((x) => x.week),
          datasets: [
            { label: 'data1.no', data: d.timeline.map((x) => x.data1no), borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,.15)', tension: 0.3, fill: true },
            { label: 'Micronet', data: d.timeline.map((x) => x.micronet), borderColor: '#0f172a', backgroundColor: 'rgba(15,23,42,.05)', tension: 0.3 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });

      const tbody = document.getElementById('ai-prompts-tbody');
      const cell = (r) => (r && r.data1noMentioned ? '<span class="db-check">✓</span>' : '<span class="db-cross">✗</span>');
      tbody.innerHTML = d.promptResults
        .map((p) => {
          const hits = ['claude', 'gpt4', 'perplexity', 'gemini'].filter((m) => p.results[m] && p.results[m].data1noMentioned).length;
          return `<tr><td>${p.prompt}</td><td class="center">${cell(p.results.claude)}</td><td class="center">${cell(p.results.gpt4)}</td><td class="center">${cell(p.results.perplexity)}</td><td class="center">${cell(p.results.gemini)}</td><td class="center"><strong>${hits}/4</strong></td></tr>`;
        })
        .join('');
    },

    email(d) {
      const data1 = d.ownDomains.find((o) => o.domain === 'data1.no') || d.ownDomains[0];
      const micro = d.ownDomains.find((o) => o.domain === 'micronet.no') || d.ownDomains[1] || {};
      const t = d.trackedDomains;

      document.getElementById('email-data1-grade').textContent = data1?.grade || '—';
      document.getElementById('email-data1-score').textContent = `${data1?.score || 0}/100`;
      document.getElementById('email-micronet-grade').textContent = micro?.grade || '—';
      document.getElementById('email-micronet-score').textContent = `${micro?.score || 0}/100`;
      document.getElementById('email-tracked').textContent = fmt(t.total);
      document.getElementById('email-reject').textContent = fmt(t.withReject);
      document.getElementById('email-reject-pct').textContent = `${t.rejectPercent.toFixed(1)}% av total`;

      // Own status list
      const own = document.getElementById('email-own-list');
      own.innerHTML = d.ownDomains
        .map(
          (o) => `<div class="db-own-row">
        <div>
          <div class="db-own-domain">${o.domain}</div>
          <div class="db-own-details">
            ${o.spf ? `<code>SPF</code>${o.spf.substring(0, 60)}${o.spf.length > 60 ? '…' : ''}<br>` : ''}
            ${o.dmarc ? `<code>DMARC</code>${o.dmarc.substring(0, 80)}${o.dmarc.length > 80 ? '…' : ''}` : ''}
          </div>
        </div>
        <div class="db-own-grade ${gradeClass(o.grade)}">${o.grade}</div>
      </div>`
        )
        .join('');

      makeChart('chart-email-policy', {
        type: 'doughnut',
        data: {
          labels: ['p=reject', 'p=quarantine', 'p=none', 'mangler'],
          datasets: [{ data: [t.withReject, t.withQuarantine, t.withNone, t.missing], backgroundColor: ['#16a34a', '#f59e0b', '#94a3b8', '#ef4444'] }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });

      makeChart('chart-email-timeline', {
        type: 'line',
        data: {
          labels: d.timeline.map((x) => x.week),
          datasets: [{ label: '% p=reject', data: d.timeline.map((x) => x.rejectPercent), borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,.15)', tension: 0.3, fill: true }],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } },
      });

      const fmtRow = (r, sign) =>
        `<tr><td>${r.domain}</td><td><code>${r.from}</code></td><td><code>${r.to}</code></td><td class="right" style="color:${sign === '+' ? '#16a34a' : '#dc2626'};font-weight:700">${sign}${Math.abs(r.scoreDelta)}</td></tr>`;

      document.getElementById('email-improved-tbody').innerHTML = d.weeklyChanges.improved.map((r) => fmtRow(r, '+')).join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:24px">Ingen endringer denne uken</td></tr>';
      document.getElementById('email-regressed-tbody').innerHTML = d.weeklyChanges.regressed.map((r) => fmtRow(r, '−')).join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:24px">Ingen forverring 🎉</td></tr>';
    },

    competitors(d) {
      const tbody = document.getElementById('comp-tbody');
      tbody.innerHTML = d.competitors
        .map(
          (c) => `<tr${c.isOwn ? ' style="background:#f0fdfa"' : ''}>
        <td><strong>${c.name}</strong>${c.isOwn ? ' <span class="db-pill db-pill-info">oss</span>' : ''}</td>
        <td class="right">${fmt(c.indexedPages)}</td>
        <td class="right">${c.domainRating != null ? fmt(c.domainRating) : '—'}</td>
        <td class="right">${c.backlinks != null ? fmt(c.backlinks) : '—'}</td>
        <td>${c.lastArticle || '—'}</td>
        <td class="right">${c.clicksPerMonth != null ? fmt(c.clicksPerMonth) : '—'}</td>
      </tr>`
        )
        .join('');

      const labels = d.competitors.map((c) => c.name);

      makeChart('chart-comp-dr', {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Domain Rating', data: d.competitors.map((c) => c.domainRating || 0), backgroundColor: d.competitors.map((c) => (c.isOwn ? '#14b8a6' : '#94a3b8')) }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
      });

      makeChart('chart-comp-backlinks', {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Backlinks', data: d.competitors.map((c) => c.backlinks || 0), backgroundColor: d.competitors.map((c) => (c.isOwn ? '#14b8a6' : '#94a3b8')) }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { type: 'logarithmic' } } },
      });
    },
  };

  // ── Initial load ──────────────────────────────────────────────
  // Chart.js lastes med defer — vent til DOM + Chart er klar
  function init() {
    if (typeof Chart === 'undefined') {
      setTimeout(init, 50);
      return;
    }
    activateTab('seo');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
