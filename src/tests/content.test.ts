import { contentService } from '../services/content/contentService';

describe('Content and Articles Service Tests', () => {
  it('should retrieve all 40 complete articles', async () => {
    const articles = await contentService.getArticles();
    expect(articles.length).toBe(40);
    expect(articles.some((a) => a.slug === 'o-que-e-ansiedade-e-como-ela-funciona')).toBe(true);
    expect(articles.some((a) => a.slug === 'como-desacelerar-a-mente-antes-de-dormir')).toBe(true);
    expect(articles.some((a) => a.slug === 'tecnica-5-4-3-2-1-para-voltar-ao-presente')).toBe(true);
    expect(articles.some((a) => a.slug === 'como-praticar-autocuidado-em-uma-rotina-corrida')).toBe(true);
  });

  it('should retrieve article by slug', async () => {
    const article = await contentService.getArticleBySlug('o-que-e-ansiedade-e-como-ela-funciona');
    expect(article).not.toBeNull();
    expect(article?.title).toBe('O que é ansiedade e como ela funciona');
    expect(article?.content).toBeTruthy();
  });

  it('should toggle favorite status on articles', async () => {
    const targetId = 'art-ansiedade-1';
    const res = await contentService.toggleFavorite(targetId);
    expect(typeof res.isFavorite).toBe('boolean');

    const list = await contentService.getArticles();
    const updated = list.find((a) => a.id === targetId);
    expect(updated?.isFavorite).toBe(res.isFavorite);
  });

  it('should persist reading progress', async () => {
    const targetId = 'art-ansiedade-1';
    await contentService.updateReadProgress(targetId, 95);

    const list = await contentService.getArticles();
    const updated = list.find((a) => a.id === targetId);
    expect(updated?.readProgress).toBe(95);
  });
});
