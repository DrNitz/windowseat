export interface Place {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lon: number;
}

export type ImageSource = 'wikipedia' | 'commons' | 'mapillary' | 'map';

export interface ViewImage {
  id: string;
  url: string;
  credit: string;
  source: ImageSource;
  license?: string;
  link?: string;
  description?: string;
}
