# pc-gutta.no — Google Ads-attribusjon (gclid → HaloPSA)

`pcg-gclid-halo.php` deployes til `wp-content/novamira-sandbox/` på pc-gutta.no
(Novamira laster sandbox-filer på alle forespørsler, med krasj-gjenoppretting).

- Klient: fanger gclid/gbraid/wbraid + utm_campaign i førsteparts-cookien
  `pcg_attr` (90 dager), kun med Complianz marketing-samtykke.
- Server: hook før mkrit-halo-psa-form sin AJAX-handler legger én linje
  `[Google Ads] klikkid=… type=… klikk=… kampanje=…` i ticket-details.

Felles arbeidsdokument: `xboxoslo/chatgpt` → `projects/pc-gutta/GCLID-HALOPSA.md`.
Denne kopien er deploy-kilde og versjonshistorikk. Repoet er offentlig — fila
inneholder ingen hemmeligheter (klientdelen serveres uansett til alle besøkende).
