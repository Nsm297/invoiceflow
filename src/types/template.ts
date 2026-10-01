export type JpgTemplateId = 'classic' | 'modern' | 'compact' | 'elegant';

export interface JpgTemplateInfo {
  id: JpgTemplateId;
  name: string;
  tagline: string;
  icon: string;
  badgeColor: string;
  primaryColor: string;
  accentColor: string;
  description: string;
}

export const JPG_TEMPLATES: JpgTemplateInfo[] = [
  {
    id: 'classic',
    name: 'Classic Corporate',
    tagline: 'Traditional & Formal',
    icon: 'fa-solid fa-building-columns',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    primaryColor: '#1e3a8a',
    accentColor: '#2563eb',
    description: 'Traditional formal header, crisp borders, and professional navy/blue corporate accents.',
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    tagline: 'Clean & Contemporary',
    icon: 'fa-solid fa-shapes',
    badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
    primaryColor: '#0f172a',
    accentColor: '#475569',
    description: 'Sleek typography, subtle grey dividers, borderless clean table layout, and airy whitespace.',
  },
  {
    id: 'compact',
    name: 'Compact Receipt',
    tagline: 'WhatsApp & Mobile Optimized',
    icon: 'fa-solid fa-receipt',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    primaryColor: '#18181b',
    accentColor: '#d97706',
    description: 'Dense receipt-style layout with dashed dividers, high contrast, ideal for WhatsApp sharing.',
  },
  {
    id: 'elegant',
    name: 'Elegant Brand',
    tagline: 'Premium Dark Header Band',
    icon: 'fa-solid fa-crown',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    primaryColor: '#064e3b',
    accentColor: '#059669',
    description: 'Bold dark brand header banner, vibrant badges, and premium financial cards.',
  },
];

export const DEFAULT_JPG_TEMPLATE: JpgTemplateId = 'classic';
export const JPG_TEMPLATE_STORAGE_KEY = 'preferred_jpg_template';

export const getSavedJpgTemplate = (): JpgTemplateId => {
  if (typeof window === 'undefined') return DEFAULT_JPG_TEMPLATE;
  const saved = localStorage.getItem(JPG_TEMPLATE_STORAGE_KEY) as JpgTemplateId | null;
  if (saved && ['classic', 'modern', 'compact', 'elegant'].includes(saved)) {
    return saved;
  }
  return DEFAULT_JPG_TEMPLATE;
};

export const saveJpgTemplate = (template: JpgTemplateId): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(JPG_TEMPLATE_STORAGE_KEY, template);
  } catch (err) {
    console.warn('Could not save JPG template to localStorage', err);
  }
};
