import { v7 } from 'uuid';
import { it } from '../support/fixtures/authenticated-e2e.fixture';

describe.concurrent('categories (e2e)', () => {
  describe('POST /api/v1/categories create', () => {
    it('should success create new category', async ({ categoryController }) => {
      const cat = await categoryController.create(
        { name: 'clothes', description: 'clothes products' },
        { code: 201, parseBody: true },
      );
      expect(cat.body?.name).toBe('clothes');
      expect(cat.body?.description).toBe('clothes products');
    });
  });
  describe('GET /api/v1/categories/:id findById', () => {
    it('should success find and return existing category by id.', async ({ categoryController }) => {
      const cat = await categoryController.create();
      const findCat = await categoryController.findById(cat.body!.id);
      expect(findCat.body).toEqual(cat.body);
      expect(findCat.body?.id).toEqual(cat.body?.id);
    });
    it('should fail finding non-existing category by id.', async ({ categoryController }) => {
      await categoryController.findById(v7(), { code: 404 });
    });
  });
});
