// Типы для Virtual Tour Creator

export interface TourMeta {
  title: string;
  address: string;
  price: string;
  area: string;
  rooms: string;
  description: string;
  agentName: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  email: string;
  logo: string;
  createdAt: string;
}

export interface Scene {
  id: string;
  name: string;
  fileName: string;
  thumbnail: string;
  position: { x: number; y: number; z: number };
  hotspots: Hotspot[];
}

export interface Hotspot {
  id: string;
  type: 'transition' | 'info';
  position: { x: number; y: number; z: number };
  targetSceneId?: string;
  label: string;
  info?: {
    title: string;
    description: string;
    image?: string;
  };
}

export interface MinimapConfig {
  enabled: boolean;
  image: string;
  points: Record<string, { x: number; y: number }>;
}

export interface UIConfig {
  theme: 'dark' | 'light';
  accent: string;
  showContacts: boolean;
  showMinimap: boolean;
  showHotspotLabels: boolean;
}

export interface TourConfig {
  meta: TourMeta;
  scenes: Scene[];
  minimap: MinimapConfig;
  ui: UIConfig;
  version: string;
}

export interface ProjectFile {
  config: TourConfig;
  originalFiles: string[];
  exportedAt?: string;
}

export type QualityMode = 'fast' | 'high' | 'original';

export interface ProcessingOptions {
  quality: QualityMode;
  maxWidth: number;
  jpegQuality: number;
}

export const DEFAULT_CONFIG: TourConfig = {
  meta: {
    title: '',
    address: '',
    price: '',
    area: '',
    rooms: '',
    description: '',
    agentName: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    email: '',
    logo: '',
    createdAt: new Date().toISOString()
  },
  scenes: [],
  minimap: {
    enabled: false,
    image: '',
    points: {}
  },
  ui: {
    theme: 'dark',
    accent: '#d4af37',
    showContacts: true,
    showMinimap: true,
    showHotspotLabels: true
  },
  version: '1.0'
};
