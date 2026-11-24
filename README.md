# Windowseat

A window to anywhere. Search for a place on Earth, watch the map fly there, pick a photo, then open it as a window with a frame, curtains and a clock.

Everything runs in the browser with free, open data. No API keys required.

## What it does

- Search any landmark, city or address via **Photon** (OpenStreetMap geocoder).
- Explore the location on a **MapLibre + OpenFreeMap** map; save places in your browser.
- Pull nearby photos from **Wikipedia** and **Wikimedia Commons** around the coordinates.
- **Street view** from KartaView needs no key. A dedicated "Open street view" button appears when nearby street photos exist.
- Optionally add a **Mapillary Graph API access token** for extra panoramas. A short numeric ID is not a valid token; the token is stored only in `localStorage`.
- Open the selected photo in fullscreen "window" mode: frame, mullions, curtains, glass glare, a desk with books, mug, plant, lamp and analog/digital clock, plus photo credit.
- The image fits by default; zoom with buttons or scroll wheel, drag to pan, switch between Fit and Fill, and reset the view. Keyboard: `+`, `-`, `0`, arrow keys, `Esc`.
- A real local clock for the place (offline timezone lookup via `tz-lookup`) plus lighting that changes with the local hour: morning warmth, afternoon daylight, golden hour and a night lamp.
- If no photo exists nearby, capture the live map as the window view instead.

## Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Deploy

GitHub Pages is already configured. Every push to `main` builds and publishes automatically via
`.github/workflows/deploy.yml`. Enable it once under **Settings → Pages → Source: GitHub Actions**,
then open <https://drnitz.github.io/windowseat/>.

The production build uses the `/windowseat/` base path. For a custom domain, change `base` in
`vite.config.ts` to `/` and add a CNAME file. No backend needed.

## Cost

$0 for normal use. All services used have free tiers with no credit card:

| Service | Purpose | Key | Limit |
| --- | --- | --- | --- |
| Photon | Place search | No | Fair use |
| OpenFreeMap | Map tiles/style | No | Fair use |
| Wikipedia / Commons | Photos | No | API rate limits |
| KartaView | Street-level photos | No | Fair use |
| Mapillary | Extra street-level photos | Optional Graph API token | Token quota |

Google Maps / Street View is deliberately **not** used — it bills after its monthly free credit.

## Limitations

- Photos are crowdsourced snapshots, not live feeds. Coverage and quality vary; remote places may have none.
- Commons geosearch looks within 2 km, so nearby results can be loosely related to the landmark.
- KartaView coverage is uneven; dense in many cities, absent in remote areas. Mapillary needs a valid Graph API access token from the Mapillary developer dashboard.
- Map canvas capture requires `preserveDrawingBuffer`, which has a small performance cost.

## Attribution

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Map style by [OpenFreeMap](https://openfreemap.org/). Photos credited in-app from Wikipedia / Wikimedia Commons under their respective licenses. Street-level imagery © KartaView and Mapillary contributors, CC BY-SA.

## Stack

Vite + React + TypeScript + MapLibre GL JS. No UI framework.
