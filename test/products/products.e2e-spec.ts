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
  describe('GET /api/v1/products (findById)', () => {
    it('should success find existing product by its id.', async ({ productController }) => {
      const p = (await productController.create()).body!;
      const findP = (await productController.findById(p.id)).body!.product;
      expect(findP.id).toEqual(p.id);
      expect(findP).toEqual(p);
    });
    it('should success find existing product with all details by its id.', async ({
      productController,
      brandController,
      //     categoryController,
    }) => {
      const sony = (await brandController.create({ name: 'sony' })).body!;
      //  const entertainment = (await categoryController.create({ name: 'entertainment' })).body!;
      // const console = (await categoryController.create({ name: 'console' })).body!;
      const p = (
        await productController.create({ brandId: sony.id, title: 'playstation', description: '', pageId: null })
      ).body!;
      const findP = (await productController.findById(p.id, { include: ['brand', 'categories'] })).body!;
      expect(findP.product.id).toEqual(p.id);

      // must test attaching categories and variants first.
      // expect(findP).toEqual({ product: p, brand: sony, categories: [entertainment, console], variants: [] });
    });
    it('should success return 404 code for finding not existing product by an id.', async ({ productController }) => {
      await productController.findById(v7(), { include: [] }, { code: 404 });
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
    it('should success return 404 code when attempt to update non existing product.', async ({ productController }) => {
      await productController.update(v7(), { description: 'nothing to update.' }, { code: 404 });
    });
  });
  describe('POST /api/v1/products/:id/images (attachImages)', () => {
    it('should success attach one cover image to the product.', async ({ productController, imageController }) => {
      const img = (await imageController.upload()).body!;
      const p = (await productController.create()).body!;
      const attachedImage = (await productController.attachImages(p.id, { imageIds: [img.id] })).body![0];
      const { coverImage, ...product } = (await productController.findById(p.id)).body!.product;
      expect(product.id).toBe(p.id);
      expect(attachedImage).toEqual(img);
      expect(coverImage).toEqual({ ...img, createdAt: coverImage?.createdAt });
    });
    it('should success return 404 when attempt to attach non-existing image to the product.', async ({
      productController,
    }) => {
      const p = (await productController.create()).body!;
      await productController.attachImages(p.id, { imageIds: [v7()] }, { code: 404 });
    });
    it('should success return 409 code when attempt to attach more than one cover image to product.', async ({
      productController,
      imageController,
    }) => {
      const img = (await imageController.upload()).body!;
      const img2 = (await imageController.upload()).body!;
      const p = (await productController.create()).body!;

      await productController.attachImages(p.id, { imageIds: [img.id, img2.id] }, { code: 409 });
    });
  });
  describe('POST /api/v1/products/:id/images/detach (detachImages)', () => {
    it('should success detach cover image from product.', async ({ productController, imageController }) => {
      const p = (await productController.create()).body!;
      const img = (await imageController.upload()).body!;
      const attachImage = (await productController.attachImages(p.id, { imageIds: [img.id] })).body!;
      const detachImage = (await productController.detachImages(p.id, { imageIds: [img.id] })).body;
      const findProductAfterDetach = (await productController.findById(p.id)).body!.product;
      expect(detachImage).toEqual({ affected: 1 });
      expect(findProductAfterDetach.coverImage).toBeUndefined();
    });
    it('should success detach non-existing image from product and return 0 affected.', async ({
      productController,
    }) => {
      const p = (await productController.create()).body!;
      const detachImage = (await productController.detachImages(p.id, { imageIds: [v7()] })).body;
      const findProductAfterDetach = (await productController.findById(p.id)).body!.product;
      expect(detachImage).toEqual({ affected: 0 });
      expect(findProductAfterDetach.coverImage).toBeUndefined();
    });
  });
  describe('POST /api/v1/products/:id/categories (attachCategories)', () => {
    it('should success attach category to a product.', async ({ productController, categoryController }) => {
      const p = (await productController.create()).body!;
      const entertainment = (await categoryController.create({ name: 'entertainment' })).body!;
      const gaming = (await categoryController.create({ name: 'gaming' })).body!;
      const cats = (
        await productController.attachCategories(p.id, { categoryIds: [entertainment.id, gaming.id] })
      ).body!.categoryIds.toSorted((a, b) => a.localeCompare(b));
      const productCats = (await productController.findById(p.id, { include: ['categories'] }))
        .body!.categories.map((cat) => cat.id)
        .toSorted((a, b) => a.localeCompare(b));
      expect(cats).toContain(entertainment.id);
      expect(cats).toContain(gaming.id);
      expect(productCats).toEqual(cats);
      expect(cats.length).toBe(2);
      expect(productCats.length).toBe(2);
    });
    it('should success return 404 code when attempt attach non existing category to a product.', async ({
      productController,
    }) => {
      const p = (await productController.create()).body!;
      await productController.attachCategories(p.id, { categoryIds: [v7()] }, { code: 404 });
    });
  });
});
