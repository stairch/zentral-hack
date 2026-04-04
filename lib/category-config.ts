import {
  Bot,
  Brain,
  Briefcase,
  Cpu,
  GraduationCap,
  Lightbulb,
  MapPin,
  Mountain,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export type CategoryIconName =
  | 'sparkles'
  | 'brain'
  | 'graduation-cap'
  | 'mountain'
  | 'bot'
  | 'cpu'
  | 'briefcase'
  | 'lightbulb'
  | 'map-pin';

export interface CategoryRecord {
  id?: string;
  name?: string | null;
  name_en?: string | null;
  slug: string;
  description?: string | null;
  description_en?: string | null;
  partner_name?: string | null;
  partner_name_en?: string | null;
  color?: string | null;
  icon?: string | null;
  challenge_description?: string | null;
  challenge_description_en?: string | null;
  show_challenge_description?: boolean | null;
}

export const categoryIconMap: Record<CategoryIconName, LucideIcon> = {
  sparkles: Sparkles,
  brain: Brain,
  'graduation-cap': GraduationCap,
  mountain: Mountain,
  bot: Bot,
  cpu: Cpu,
  briefcase: Briefcase,
  lightbulb: Lightbulb,
  'map-pin': MapPin,
};

export const categoryIconOptions: Array<{ value: CategoryIconName; label: string }> = [
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'brain', label: 'Brain' },
  { value: 'graduation-cap', label: 'Graduation Cap' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'bot', label: 'Bot' },
  { value: 'cpu', label: 'CPU' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'lightbulb', label: 'Lightbulb' },
  { value: 'map-pin', label: 'Map Pin' },
];

export const categoryDisplayOrder = [
  'young-talents',
  'ai-agentic',
  'campus-challenge',
  'regional-impact',
] as const;

const categoryDefaults: Record<
  string,
  {
    name: string;
    description: string;
    partnerName: string;
    color: string;
    icon: CategoryIconName;
  }
> = {
  'young-talents': {
    name: 'Young Talents',
    description:
      'Für den Nachwuchs der ICT-Branche. Zeige dein Können und sammle erste echte Hackathon-Erfahrung.',
    partnerName: 'ICT Berufsbildung Zentralschweiz & UMB AG',
    color: '#E6FF17',
    icon: 'sparkles',
  },
  'ai-agentic': {
    name: 'AI Agentic',
    description:
      'Entwickle agentische KI-Lösungen, intelligente Automationen und neue Formen der Zusammenarbeit mit AI.',
    partnerName: 'ICT Berufsbildung Zentralschweiz, Digital & AI Community & getAbstract',
    color: '#530A5D',
    icon: 'brain',
  },
  'campus-challenge': {
    name: 'Campus Challenge',
    description:
      'Eine Challenge für Studierende, in der akademische Perspektiven auf praktische Probleme treffen.',
    partnerName: 'STAIR',
    color: '#D6C6FF',
    icon: 'graduation-cap',
  },
  'regional-impact': {
    name: 'Regional Impact',
    description:
      'Arbeite an Lösungen mit direktem Nutzen für die Zentralschweiz und ihre Unternehmen, Institutionen und Menschen.',
    partnerName: 'SchwyzNext',
    color: '#7A1F83',
    icon: 'mountain',
  },
};

const iconAliases: Record<string, CategoryIconName> = {
  'map-pin': 'mountain',
  bot: 'brain',
};

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function normalizeHexColor(value?: string | null, fallback = '#530A5D'): string {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (isHexColor(trimmed)) {
    return trimmed.toUpperCase();
  }

  return fallback;
}

export function getReadableTextColor(backgroundHex: string): '#111111' | '#FFFFFF' {
  const normalized = normalizeHexColor(backgroundHex, '#530A5D');
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 155 ? '#111111' : '#FFFFFF';
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex, '#530A5D');
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getCategoryFallback(slug: string) {
  return (
    categoryDefaults[slug] || {
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      description: 'Neue Kategorie ohne hinterlegte Standardbeschreibung.',
      partnerName: 'Partner folgt',
      color: '#530A5D',
      icon: 'sparkles' as CategoryIconName,
    }
  );
}

export function resolveCategoryIconName(icon?: string | null, slug?: string): CategoryIconName {
  if (icon && icon in categoryIconMap) {
    return icon as CategoryIconName;
  }

  if (icon && icon in iconAliases) {
    return iconAliases[icon];
  }

  return getCategoryFallback(slug || 'default').icon;
}

export function getCategoryPresentation(category: CategoryRecord) {
  return getCategoryPresentationByLanguage(category, 'de');
}

export function getCategoryPresentationByLanguage(category: CategoryRecord, language: 'de' | 'en') {
  const fallback = getCategoryFallback(category.slug);
  const color = normalizeHexColor(category.color, fallback.color);
  const iconName = resolveCategoryIconName(category.icon, category.slug);

  const localizedTitle =
    language === 'en'
      ? (category.name_en || category.name || fallback.name).trim()
      : (category.name || fallback.name).trim();

  const localizedDescription =
    language === 'en'
      ? (category.description_en || category.description || fallback.description).trim()
      : (category.description || fallback.description).trim();

  const localizedPartnerName =
    language === 'en'
      ? (category.partner_name_en || category.partner_name || fallback.partnerName).trim()
      : (category.partner_name || fallback.partnerName).trim();

  const localizedChallengeDescription =
    language === 'en'
      ? (category.challenge_description_en || category.challenge_description || '').trim()
      : (category.challenge_description || '').trim();

  return {
    id: category.id,
    slug: category.slug,
    title: localizedTitle,
    description: localizedDescription,
    partnerName: localizedPartnerName,
    color,
    textColor: getReadableTextColor(color),
    icon: categoryIconMap[iconName],
    iconName,
    challengeDescription: localizedChallengeDescription,
    showChallengeDescription: Boolean(category.show_challenge_description),
  };
}