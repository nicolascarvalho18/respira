import { Article } from '../../types';
import { ANXIETY_ARTICLES } from './anxiety';
import { SLEEP_ARTICLES } from './sleep';
import { WELLBEING_ARTICLES } from './wellbeing';
import { REGULATION_ARTICLES } from './regulation';

// Central collection of all 40 articles
export const ALL_ARTICLES: Article[] = [
  ...ANXIETY_ARTICLES,
  ...SLEEP_ARTICLES,
  ...WELLBEING_ARTICLES,
  ...REGULATION_ARTICLES,
];

// Helper to remove accents / diacritics for clean searches
export function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Category definition with dynamic real-time counts
export interface CategoryMeta {
  id: string;
  label: string;
  count: number;
}

export function getCategoryMetas(articles: Article[]): CategoryMeta[] {
  const anxietyCount = articles.filter((a) =>
    normalizeText(a.category || a.categoryName || '').includes('ansiedade')
  ).length;

  const sleepCount = articles.filter((a) =>
    normalizeText(a.category || a.categoryName || '').includes('sono')
  ).length;

  const wellbeingCount = articles.filter((a) =>
    normalizeText(a.category || a.categoryName || '').includes('bem-estar')
  ).length;

  const regulationCount = articles.filter((a) => {
    const cat = normalizeText(a.category || a.categoryName || '');
    return cat.includes('regulacao') || cat.includes('atencao');
  }).length;

  return [
    { id: 'all', label: `Todos (${articles.length})`, count: articles.length },
    { id: 'Ansiedade', label: `Ansiedade (${anxietyCount})`, count: anxietyCount },
    { id: 'Sono', label: `Sono (${sleepCount})`, count: sleepCount },
    { id: 'Bem-estar', label: `Bem-estar (${wellbeingCount})`, count: wellbeingCount },
    { id: 'Regulação', label: `Regulação (${regulationCount})`, count: regulationCount },
  ];
}

// Smart Recommendations: "Para você"
export function getRecommendedArticles(
  articles: Article[],
  favoriteIds: string[] = [],
  readSlugs: string[] = []
): Article[] {
  if (!articles || articles.length === 0) return [];

  // 1. Pick unread articles matching favorite categories, or introductory topics
  const unread = articles.filter((a) => !readSlugs.includes(a.slug) && (a.readProgress || 0) < 90);
  const candidates = unread.length >= 3 ? unread : articles;

  // Curated blend: 1 from anxiety, 1 from sleep, 1 from regulation, 1 from wellbeing
  const recAnxiety = candidates.find((a) => normalizeText(a.category).includes('ansiedade'));
  const recSleep = candidates.find((a) => normalizeText(a.category).includes('sono'));
  const recWellbeing = candidates.find((a) => normalizeText(a.category).includes('bem-estar'));
  const recRegulation = candidates.find((a) => normalizeText(a.category).includes('regulacao'));

  const list: Article[] = [];
  if (recAnxiety) list.push(recAnxiety);
  if (recSleep) list.push(recSleep);
  if (recRegulation) list.push(recRegulation);
  if (recWellbeing) list.push(recWellbeing);

  return list.slice(0, 4);
}
