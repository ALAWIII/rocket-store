import { v7 } from 'uuid';
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
    it('should fail create product because of invalid brandId.', async ({ productController }) => {
      const title = 'playstation';
      const description = 'a console to play bloodborne';
      const brandId = v7();
      const pageId = null;
      await productController.create(
        {
          title,
          description,
          brandId,
          pageId,
        },
        { code: 404 },
      );
    });
  });
  describe('PATCH /api/v1/products (update)', () => {
    it('should success update details for existing product', async ({ productController }) => {
      const product = (await productController.create()).body!;
      const description = 'a console that you can modify';
      const updatedProduct = (await productController.update(product.id, { description })).body!;
      expect(updatedProduct.id).toBe(product.id);
      expect(updatedProduct.description).toBe(description);
      expect(updatedProduct.updatedAt).not.toBe(product.updatedAt);
    });
  });
});
