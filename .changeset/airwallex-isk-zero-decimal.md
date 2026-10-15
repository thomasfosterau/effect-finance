---
"@thomasfosterau/effect-payments-airwallex": patch
---

Treat ISK (Icelandic króna) as a zero-decimal currency, as ISO 4217 and Airwallex do. An ISK amount of 2000 minor units is sent as `2000`, not `20`, and a response amount is read the same way. HUF, IDR and TWD keep two decimals, and IQD and LYD keep three.
