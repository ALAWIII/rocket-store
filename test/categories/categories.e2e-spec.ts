import { it } from '../support/fixtures/authenticated-e2e.fixture';

describe.concurrent('categories (e2e)', () => {
  describe('POST /api/v1/categories', () => {
    it('should success create new category', async ({ categoryController }) => {
      const cat = await categoryController.create(
        { name: 'clothes', description: 'clothes products' },
        { code: 201, parseBody: true },
      );
      expect(cat.body?.name).toBe('clothes');
      expect(cat.body?.description).toBe('clothes products');
    });
  });
});
