<?php
/**
 * Plugin Name: PC-Gutta Google Ads-attribusjon (klikk-ID til HaloPSA)
 * Description: Fanger gclid/gbraid/wbraid i en førsteparts-cookie (bak Complianz
 *              marketing-samtykke) og legger klikk-ID-en inn i Halo-ticketen fra
 *              kontaktskjemaet (mkrit-halo-psa-form). Grunnlag for offline
 *              conversion import til Google Ads når verkstedjobber vinnes.
 * Version: 1.0.1
 * Author: Micronet AS
 */

if (!defined('ABSPATH')) { exit; }

/* -------------------------------------------------------------------------
 * Klient: fange klikk-ID ved landing.
 * Samme samtykke-mønster som pcg_google_consent_mode_v2 i pcgutta-seo.php:
 * cmplz_marketing-cookien er sannhetskilden, og cmplz_status_change fanger
 * samtykke som gis ETTER at landingssiden lastet (klikk-ID-en ligger fortsatt
 * i URL-en da). Cookie framfor URL-lesing ved innsending fordi folk klikker
 * annonsen én dag og sender skjemaet en annen. 90 dager = Google Ads' vindu
 * for offline-import. Nyeste klikk overskriver (last click).
 * ---------------------------------------------------------------------- */
add_action('wp_footer', 'pcg_gclid_fangst', 5);
function pcg_gclid_fangst() {
	if (is_admin() || is_preview() || is_customize_preview()) { return; }
	// Bevisst INGEN innlogget-guard (ulikt gtag-koden): cookien er inert til et
	// skjema sendes, og guarden ville bare blokkert admin-testing av flyten.
	?>
<script>
(function () {
  var q = new URLSearchParams(window.location.search);
  var id = q.get('gclid') || q.get('gbraid') || q.get('wbraid');
  if (!id || !/^[A-Za-z0-9_.-]{4,200}$/.test(id)) { return; }
  var type = q.get('gclid') ? 'gclid' : (q.get('gbraid') ? 'gbraid' : 'wbraid');
  var cmp = (q.get('utm_campaign') || '').replace(/[^A-Za-z0-9 ._-]/g, '').slice(0, 100);
  function pcgCookie(name) {
    var parts = ('; ' + document.cookie).split('; ' + name + '=');
    return parts.length === 2 ? decodeURIComponent(parts.pop().split(';').shift()) : '';
  }
  function skriv() {
    if (pcgCookie('cmplz_marketing') !== 'allow') { return; }
    var data = { id: id, type: type, ts: new Date().toISOString(), cmp: cmp };
    document.cookie = 'pcg_attr=' + encodeURIComponent(JSON.stringify(data)) +
      '; max-age=' + 90 * 24 * 60 * 60 + '; path=/; samesite=lax; secure';
  }
  skriv();
  document.addEventListener('cmplz_status_change', function () { window.setTimeout(skriv, 0); });
})();
</script>
	<?php
}

/* -------------------------------------------------------------------------
 * Server: legge attribusjonen på Halo-ticketen.
 * Kjører på priority 1 — FØR halo_psa_handle_submit (priority 10) i
 * mkrit-halo-psa-form. Begge modi (existing/new) POSTer feltet «message»,
 * som blir ticket-details. Vi beriker $_POST i stedet for å endre
 * tredjepartspluginen, så endringen overlever plugin-oppdateringer.
 * Én maskinlesbar linje: [Google Ads] klikkid= type= klikk= kampanje=
 * Må ALDRI stoppe eller ugyldiggjøre en innsending — alt er defensivt.
 * ---------------------------------------------------------------------- */
add_action('wp_ajax_halo_psa_submit', 'pcg_gclid_paa_ticket', 1);
add_action('wp_ajax_nopriv_halo_psa_submit', 'pcg_gclid_paa_ticket', 1);
function pcg_gclid_paa_ticket() {
	try {
		if (empty($_COOKIE['pcg_attr']) || !is_string($_COOKIE['pcg_attr'])) { return; }
		$raa = wp_unslash($_COOKIE['pcg_attr']);
		if (strlen($raa) > 600) { return; }
		$attr = json_decode($raa, true);
		if (!is_array($attr) || empty($attr['id']) || !is_string($attr['id'])) { return; }
		if (!preg_match('/^[A-Za-z0-9_.\-]{4,200}$/', $attr['id'])) { return; }

		$type = 'gclid';
		if (isset($attr['type']) && in_array($attr['type'], array('gclid', 'gbraid', 'wbraid'), true)) {
			$type = $attr['type'];
		}
		$ts = '';
		if (isset($attr['ts']) && is_string($attr['ts']) && preg_match('/^\d{4}-\d{2}-\d{2}T[0-9:.]{8,15}Z?$/', $attr['ts'])) {
			$ts = $attr['ts'];
		}
		$cmp = '';
		if (isset($attr['cmp']) && is_string($attr['cmp'])) {
			$cmp = substr(preg_replace('/[^A-Za-z0-9 ._\-]/', '', $attr['cmp']), 0, 100);
		}

		// Aldri gjør en tom melding gyldig, og aldri legg til to ganger.
		if (empty($_POST['message']) || !is_string($_POST['message']) || trim($_POST['message']) === '') { return; }
		if (strpos($_POST['message'], '[Google Ads] klikkid=') !== false) { return; }

		$linje = '[Google Ads] klikkid=' . $attr['id'] . ' type=' . $type;
		if ($ts !== '')  { $linje .= ' klikk=' . $ts; }
		if ($cmp !== '') { $linje .= ' kampanje=' . $cmp; }

		$_POST['message'] .= "\n\n" . $linje;
	} catch (\Throwable $e) {
		// Attribusjon skal aldri velte en kundehenvendelse.
	}
}
