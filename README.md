# Windowseat

A window to anywhere. Search for a place on Earth, watch the map fly there, pick a photo, then open it as a window with a frame, curtains and a clock.

Everything runs in the browser with free, open data. No API keys required.

## What it does

- Search any landmark, city or address via **Photon** (OpenStreetMap geocoder).
- Explore the location on a **MapLibre + OpenFreeMap** map; save places in your browser.
- Pull nearby photos from **Wikipedia** and **Wikimedia Commons** around the coordinates.
- Optionally add a free **Mapillary** access token for street-level panoramas. The token is stored only in `localStorage`.
- Open the selected photo in fullscreen "window" mode: frame, mullions, curtains, glass glare, mouse parallax, clock and photo credit.
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

Deploy the `dist` folder to Netlify, Vercel or Cloudflare Pages. No backend needed.

## Cost

$0 for normal use. All services used have free tiers with no credit card:

| Service | Purpose | Key | Limit |
| --- | --- | --- | --- |
| Photon | Place search | No | Fair use |
| OpenFreeMap | Map tiles/style | No | Fair use |
| Wikipedia / Commons | Photos | No | API rate limits |
| Mapillary | Street-level photos | Optional free token | Token quota |

Google Maps / Street View is deliberately **not** used — it bills after its monthly free credit.

## Limitations

- Photos are crowdsourced snapshots, not live feeds. Coverage and quality vary; remote places may have none.
- Commons geosearch looks within 2 km, so nearby results can be loosely related to the landmark.
- Mapillary requires you to create a free developer token and enable CORS for your domain.
- Map canvas capture requires `preserveDrawingBuffer`, which has a small performance cost.

## Attribution

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Map style by [OpenFreeMap](https://openfreemap.org/). Photos credited in-app from Wikipedia / Wikimedia Commons under their respective licenses. Street-level imagery © Mapillary contributors, CC BY-SA.

## Stack

Vite + React + TypeScript + MapLibre GL JS. No UI framework.
