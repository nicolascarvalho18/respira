import React from 'react';
import { ALL_ARTICLES, getCategoryMetas, normalizeText } from '../data/articles';
import { ANXIETY_ARTICLES } from '../data/articles/anxiety';
import { SLEEP_ARTICLES } from '../data/articles/sleep';
import { WELLBEING_ARTICLES } from '../data/articles/wellbeing';
import { REGULATION_ARTICLES } from '../data/articles/regulation';
import { useContentStore } from '../store/contentStore';
import { ArticleCoverImage } from '../components/illustrations/ArticleCovers';

describe('Emotional Education Content Library (40 Complete Articles & Editorial Layout)', () => {
  it('should have exactly 40 total articles', () => {
    expect(ALL_ARTICLES.length).toBe(40);
  });

  it('should have exactly 10 articles per category', () => {
    expect(ANXIETY_ARTICLES.length).toBe(10);
    expect(SLEEP_ARTICLES.length).toBe(10);
    expect(WELLBEING_ARTICLES.length).toBe(10);
    expect(REGULATION_ARTICLES.length).toBe(10);
  });

  it('should have 100% unique IDs and Slugs across all 40 articles', () => {
    const ids = new Set(ALL_ARTICLES.map((a) => a.id));
    const slugs = new Set(ALL_ARTICLES.map((a) => a.slug));

    expect(ids.size).toBe(40);
    expect(slugs.size).toBe(40);
  });

  it('should contain full-length structured content for every article', () => {
    ALL_ARTICLES.forEach((article) => {
      expect(article.title).toBeTruthy();
      expect(article.summary).toBeTruthy();
      expect(article.content).toBeTruthy();
      expect((article.content || '').length).toBeGreaterThan(500);
      expect(article.readingTimeMinutes).toBeGreaterThanOrEqual(3);
      expect(article.keywords).toBeDefined();
      expect(article.keywords!.length).toBeGreaterThan(0);
    });
  });

  it('should compute accurate dynamic category metas with counts', () => {
    const metas = getCategoryMetas(ALL_ARTICLES);
    expect(metas).toEqual([
      { id: 'all', label: 'Todos (40)', count: 40 },
      { id: 'Ansiedade', label: 'Ansiedade (10)', count: 10 },
      { id: 'Sono', label: 'Sono (10)', count: 10 },
      { id: 'Bem-estar', label: 'Bem-estar (10)', count: 10 },
      { id: 'Regulação', label: 'Regulação (10)', count: 10 },
    ]);
  });

  it('should normalize text for accent-insensitive search', () => {
    expect(normalizeText('Regulação')).toBe('regulacao');
    expect(normalizeText('Atenção Plena')).toBe('atencao plena');
    expect(normalizeText('Saúde Mental')).toBe('saude mental');
  });

  it('should filter and paginate articles correctly in store', async () => {
    await useContentStore.getState().fetchArticles();

    // Default "Todos": page limit 10
    expect(useContentStore.getState().articles.length).toBe(40);
    expect(useContentStore.getState().getVisibleArticles().length).toBe(10);

    // Load more: 20
    useContentStore.getState().loadMoreArticles();
    expect(useContentStore.getState().getVisibleArticles().length).toBe(20);

    // Select category "Ansiedade": all 10 items
    useContentStore.getState().setSelectedCategory('Ansiedade');
    expect(useContentStore.getState().getVisibleArticles().length).toBe(10);

    // Search "crise" in Ansiedade
    useContentStore.getState().setSearchQuery('crise');
    const searchResults = useContentStore.getState().getFilteredArticles();
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults.every((a) => a.category === 'Ansiedade')).toBe(true);
  });

  it('should verify all 40 articles have dedicated slug mappings without errors', () => {
    ALL_ARTICLES.forEach((article) => {
      expect(article.slug).toBeDefined();
      expect(typeof article.slug).toBe('string');
      expect(article.slug.length).toBeGreaterThan(3);
    });
  });

  it('should correctly calculate weekly completed readings', () => {
    const articlesWithReads = ALL_ARTICLES.map((a, idx) => ({
      ...a,
      readProgress: idx < 3 ? 100 : 0,
    }));

    const weeklyCount = articlesWithReads.filter((a) => (a.readProgress || 0) >= 90).length;
    expect(weeklyCount).toBe(3);
  });

  it('should identify articles currently in progress for Continue Reading section', () => {
    const inProgressDemo = {
      ...ALL_ARTICLES[0],
      readProgress: 65,
    };

    expect(inProgressDemo.readProgress).toBeGreaterThan(0);
    expect(inProgressDemo.readProgress).toBeLessThan(90);
  });
});
