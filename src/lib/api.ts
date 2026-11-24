import type { Place, ViewImage } from '../types';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    label?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    osm_value?: string;
  };
}

interface ApiImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string }>;
}

interface ApiPage {
  pageid?: number;
  title?: string;
  imageinfo?: ApiImageInfo[];
  original?: { source?: string };
  thumbnail?: { source?: string };
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

function cleanHtml(value?: string): string {
  if (!value) return '';
  const parsed = new DOMParser().parseFromString(value, 'text/html');
  return (parsed.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=6&lang=en`;
  const data = await fetchJson<{ features?: PhotonFeature[] }>(url, signal);

  return (data.features ?? [])
    .map((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      const properties = feature.properties;
      const name = properties.name || properties.label || properties.osm_value || 'Unnamed place';
      const region = [properties.city || properties.town || properties.village, properties.state, properties.country]
        .filter(Boolean)
        .join(', ');
      return {
        id: `${properties.osm_type ?? 'place'}-${properties.osm_id ?? `${lat},${lon}`}`,
        name,
        detail: region || properties.label || '',
        lat,
        lon,
      };
    })
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon));
}

async function wikipediaImage(place: Place, signal?: AbortSignal): Promise<ViewImage[]> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages` +
    `&piprop=original|thumbnail&pithumbsize=1600&redirects=1` +
    `&titles=${encodeURIComponent(place.name)}&origin=*`;
  const data = await fetchJson<{ query?: { pages?: Record<string, ApiPage> } }>(url, signal);
  const page = Object.values(data.query?.pages ?? {})[0];
  const source = page?.original?.source || page?.thumbnail?.source;
  if (!source || !/\.(jpe?g|png|webp)(\?|$)/i.test(source)) return [];
  const title = page?.title ?? place.name;
  return [
    {
      id: `wiki-${title}`,
      url: source,
      credit: 'Wikipedia',
      source: 'wikipedia',
      license: 'Wikimedia Commons',
      link: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      description: 'Featured image from Wikipedia',
    },
  ];
}

async function commonsImages(place: Place, signal?: AbortSignal): Promise<ViewImage[]> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
    `&generator=geosearch&ggsprimary=all&ggsnamespace=6&ggsradius=2000` +
    `&ggscoord=${encodeURIComponent(`${place.lat}|${place.lon}`)}&ggslimit=24` +
    `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&origin=*`;
  const data = await fetchJson<{ query?: { pages?: Record<string, ApiPage> } }>(url, signal);

  return Object.values(data.query?.pages ?? {})
    .flatMap((page) => {
      const info = page?.imageinfo?.[0];
      const source = info?.thumburl || info?.url;
      if (!source || !/\.(jpe?g|png|webp)(\?|$)/i.test(source)) return [];
      const title = cleanHtml(info?.extmetadata?.ObjectName?.value) || page?.title || '';
      if (/map|logo|diagram|icon|coat of arms|plaque|\bpdf\b/i.test(title)) return [];
      return [
        {
          id: `commons-${page?.pageid ?? source}`,
          url: source,
          credit: cleanHtml(info?.extmetadata?.Artist?.value).slice(0, 80) || 'Wikimedia Commons',
          source: 'commons' as const,
          license: cleanHtml(info?.extmetadata?.LicenseShortName?.value) || undefined,
          link: info?.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page?.title ?? '')}`,
          description: cleanHtml(info?.extmetadata?.ImageDescription?.value).slice(0, 180) || undefined,
        },
      ];
    })
    .slice(0, 10);
}

async function mapillaryImages(
  place: Place,
  token: string,
  signal?: AbortSignal,
): Promise<ViewImage[]> {
  const spread = 0.012;
  const bbox = [
    place.lon - spread,
    place.lat - spread * 0.7,
    place.lon + spread,
    place.lat + spread * 0.7,
  ].join(',');
  const url =
    `https://graph.mapillary.com/images?fields=id,thumb_2048_url,captured_at` +
    `&bbox=${encodeURIComponent(bbox)}&limit=20&access_token=${encodeURIComponent(token)}`;
  const data = await fetchJson<{
    data?: Array<{ id: string; thumb_2048_url?: string; captured_at?: string }>;
  }>(url, signal);

  return (data.data ?? [])
    .filter((item) => Boolean(item.thumb_2048_url))
    .map((item) => ({
      id: `mapillary-${item.id}`,
      url: item.thumb_2048_url!,
      credit: 'Mapillary contributor',
      source: 'mapillary' as const,
      license: 'CC BY-SA',
      link: `https://www.mapillary.com/app/?pKey=${item.id}`,
      description: item.captured_at ? `Captured ${item.captured_at.slice(0, 10)}` : 'Street-level image',
    }));
}

export async function fetchPlaceImages(
  place: Place,
  signal?: AbortSignal,
  mapillaryToken?: string,
): Promise<ViewImage[]> {
  const requests = [wikipediaImage(place, signal), commonsImages(place, signal)];
  if (mapillaryToken?.trim()) requests.push(mapillaryImages(place, mapillaryToken, signal));

  const settled = await Promise.allSettled(requests);
  const images: ViewImage[] = [];
  const seen = new Set<string>();

  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    for (const image of result.value) {
      if (seen.has(image.url)) continue;
      seen.add(image.url);
      images.push(image);
    }
  }
  return images;
}
