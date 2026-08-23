import { contentService } from '../services/content/contentService';

describe('Content and Articles Service Tests', () => {
  it('should retrieve 4 complete demonstration articles', async () => {
    const articles = await contentService.getArticles();
    expect(articles.length).toBeGreaterThanOrEqual(4);
    expect(articles.some((a) => a.slug === 'entendendo-a-ansiedade')).toBe(true);
    expect(articles.some((a) => a.slug === 'desacelerar-antes-de-dormir')).toBe(true);
    expect(articles.some((a) => a.slug === 'tecnica-5-4-3-2-1')).toBe(true);
    expect(articles.some((a) => a.slug === 'mitos-sobre-ansiedade')).toBe(true);
  });

  it('should retrieve article by slug', async () => {
    const article = await contentService.getArticleBySlug('entendendo-a-ansiedade');
    expect(article).not.toBeNull();
    expect(article?.title).toBe('Entendendo a ansiedade no dia a dia');
    expect(article?.sections && article.sections.length > 0).toBe(true);
  });

  it('should toggle favorite status on articles', async () => {
    const targetId = 'article-understanding-anxiety';
    const isFavorite = await contentService.toggleFavorite(targetId);
    expect(typeof isFavorite).toBe('boolean');

    const list = await contentService.getArticles();
    const updated = list.find((a) => a.id === targetId);
    expect(updated?.isFavorite).toBe(isFavorite);
  });

  it('should persist reading progress', async () => {
    const targetId = 'article-understanding-anxiety';
    await contentService.updateReadProgress(targetId, 95);

    const list = await contentService.getArticles();
    const updated = list.find((a) => a.id === targetId);
    expect(updated?.readProgress).toBe(95);
  });
});
