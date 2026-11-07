import { it } from '../support/fixtures/authenticated-e2e.fixture';

describe.concurrent('products (e2e)', () => {
  describe('POST /api/v1/products (create)', () => {
    it('should success create product.', async ({ productController, brandController }) => {
      const sony = (await brandController.create({ name: 'sony' })).body!;
      const title = 'playstation';
      const description = 'a console to play bloodborne';
      const brandId = sony.id;
      const pageId = null;
      const playstation = (
        await productController.create({
          title,
          description,
          brandId,
          pageId,
        })
      ).body!;
      expect(playstation.id).toBeDefined();
      expect(playstation.title).toBe(title);
      expect(playstation.description).toBe(description);
      expect(playstation.brandId).toBe(brandId);
      expect(playstation.pageId).toBe(pageId);
    });
  });
});
