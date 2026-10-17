import { v7 } from 'uuid';
import { it } from '../support/fixtures/authenticated-e2e.fixture';
import { CategoryResponseDto } from 'src/modules/categories/dto/category-response.dto';
import { createRandomCategoryTree } from 'test/support/utils/create-category-tree.util';

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
  describe('GET /api/v1/categories findAll', () => {
    it('should success return all categories', async ({ categoryController }) => {
      const categories: CategoryResponseDto[] = [];
      for (let i = 0; i < 5; i++) categories.push((await categoryController.create()).body!);

      categories.sort((a, b) => a.id.localeCompare(b.id));
      const allCategories = (await categoryController.findAll()).body!;
      allCategories.sort((a, b) => a.id.localeCompare(b.id));
      expect(allCategories).toEqual(categories);
      expect(allCategories.length).toBe(5);
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
      expect(updatedCat.updatedAt).not.toBe(cat.updatedAt);
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
  describe('POST /api/v1/categories/:id move', () => {
    it('should success set category parent.', async ({ categoryController }) => {
      const parentCat = (await categoryController.create()).body!;
      const childCat = (await categoryController.create()).body!;
      const updatedCat = (await categoryController.move(childCat.id, { parentId: parentCat.id })).body!;
      expect(updatedCat.id).toBe(childCat.id);
      expect(updatedCat.parentId).toBe(parentCat.id);
      expect(updatedCat.parentId).not.toBeNull();
      expect(updatedCat.path).toEqual([parentCat.id, childCat.id]);
    });
    it('should success move category to new parent of the same tree level.', async ({ categoryController }) => {
      const { lvl0, lvl0Child2, lvl1C1Child1 } = await createRandomCategoryTree(categoryController);
      const newMove = (await categoryController.move(lvl1C1Child1.id, { parentId: lvl0Child2.id })).body!;
      expect(newMove.parentId).toBe(lvl0Child2.id);
      expect(newMove.path).toEqual([lvl0.id, lvl0Child2.id, newMove.id]);
    });
    it('should success move category from level 1 to root and set its parent to null, update all children path recursively.', async ({
      categoryController,
    }) => {
      const { lvl0Child1, lvl1C1Child1 } = await createRandomCategoryTree(categoryController);
      const newMove01 = (await categoryController.move(lvl0Child1.id, { parentId: null })).body!;
      const childOfMoved1 = (await categoryController.findById(lvl1C1Child1.id)).body!;
      expect(newMove01.parentId).toBeNull();
      expect(newMove01.path).toEqual([lvl0Child1.id]);
      expect(childOfMoved1.path).toEqual([lvl0Child1.id, childOfMoved1.id]);
    });
    it('should success move category from level 2 up to level 0 and set its parent to the lvl0.', async ({
      categoryController,
    }) => {
      const { lvl0, lvl1C1Child1 } = await createRandomCategoryTree(categoryController);
      const moved = (await categoryController.move(lvl1C1Child1.id, { parentId: lvl0.id })).body!;
      expect(moved.id).toBe(lvl1C1Child1.id);
      expect(moved.parentId).toBe(lvl0.id);
      expect(moved.path).toEqual([lvl0.id, lvl1C1Child1.id]);
    });
    it('should success move category from level 1 down to level 3 and set its parent to lvl1C1Child1.', async ({
      categoryController,
    }) => {
      const { lvl0, lvl0Child1, lvl0Child2, lvl1C1Child1 } = await createRandomCategoryTree(categoryController);
      const moved = (await categoryController.move(lvl0Child2.id, { parentId: lvl1C1Child1.id })).body!;
      expect(moved.id).toBe(lvl0Child2.id);
      expect(moved.parentId).toBe(lvl1C1Child1.id);
      expect(moved.path).toEqual([lvl0.id, lvl0Child1.id, lvl1C1Child1.id, lvl0Child2.id]);
    });
    it('should fail move category to be parent of itself.', async ({ categoryController }) => {
      const category = (await categoryController.create()).body!;
      await categoryController.move(category.id, { parentId: category.id }, { code: 409 });
    });
    it('should fail move category under its own descendant.', async ({ categoryController }) => {
      const { lvl0, lvl1C1Child1 } = await createRandomCategoryTree(categoryController);
      await categoryController.move(lvl0.id, { parentId: lvl1C1Child1.id }, { code: 409 });
    });
  });
});
