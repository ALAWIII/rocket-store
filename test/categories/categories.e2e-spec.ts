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
  describe('PATCH /api/v1/categories/:id update', () => {
    it('should success update details of existing category.', async ({ categoryController }) => {
      const cat = (await categoryController.create()).body!;
      const updatedCat = (await categoryController.update(cat.id, { name: 'ram', description: 'ram category' })).body!;
      expect(updatedCat.id).toBe(cat.id);
      expect(updatedCat.name).toBe('ram');
      expect(updatedCat.name).not.toBe('clothes');
      expect(updatedCat.description).toBe('ram category');
    });
    it('should fail update details of non existing category.', async ({ categoryController }) => {
      await categoryController.update(v7(), { name: 'ram', description: 'ram category' }, { code: 404 });
    });
    it('should fail update details of existing category because no field were provided.', async ({
      categoryController,
    }) => {
      const cat = (await categoryController.create()).body!;
      await categoryController.update(cat.id, {}, { code: 400 });
    });
  });
});
