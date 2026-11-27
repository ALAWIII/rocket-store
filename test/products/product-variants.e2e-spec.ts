import { CreateProductVariantDto } from 'src/modules/products/dto/request/write/create-product-variant.dto';
import { it } from '../support/fixtures/authenticated-e2e.fixture';
import { v7 } from 'uuid';
import { UpdateProductVariantDto } from 'src/modules/products/dto/request/write/update-product-variant.dto';

describe.concurrent('products (e2e)', () => {
  describe('POST /api/v1/products/:productId/variants (create)', () => {
    it('should success create product variants for existed product', async ({
      productController,
      productVariantsController,
    }) => {
      const playstation = (await productController.create()).body!;
      const slimData: CreateProductVariantDto = {
        title: 'slim', // should be unique
        description: 'white ps4',
        info: {},
        price: 29999,
        sortOrder: 1,
        visibility: 'public',
        salesStatus: 'active',
      };
      const proData = { ...slimData, title: 'pro', price: 39999 };
      const slim = (await productVariantsController.create(playstation.id, slimData)).body!;
      const pro = (await productVariantsController.create(playstation.id, proData)).body!;
      expect(slim).toMatchObject(slimData);
      expect(pro).toMatchObject(proData);
    });
    it('should fail create product variants with duplicate title, returns conflict.', async ({
      productController,
      productVariantsController,
    }) => {
      const playstation = (await productController.create()).body!;
      const slimData: CreateProductVariantDto = {
        title: 'slim', // should be unique
        description: 'white ps4',
        info: {},
        price: 29999,
        sortOrder: 1,
        visibility: 'public',
        salesStatus: 'active',
      };
      const slim = (await productVariantsController.create(playstation.id, slimData)).body!;
      expect(slim).toMatchObject(slimData);
      await productVariantsController.create(playstation.id, slimData, { code: 409 });
    });
    it('should fail create variants for non existed product', async ({ productVariantsController }) => {
      await productVariantsController.create(v7(), undefined, { code: 404 });
    });
  });
  describe('GET /api/v1/products/:productId/variants/admin (findAllAdmin)', () => {
    it('should success fetching all public and private variants of a product.', async ({
      productVariantsController,
      productController,
    }) => {
      const playstation = (await productController.create()).body!;
      const slim = (await productVariantsController.create(playstation.id, { title: 'slim', visibility: 'public' }))
        .body!;
      const pro = (await productVariantsController.create(playstation.id, { title: 'pro', visibility: 'private' }))
        .body!;
      const both = (await productVariantsController.findAllAdmin(playstation.id)).body!.toSorted((a, b) =>
        a.id.localeCompare(b.id),
      );
      const slimPublic = (await productVariantsController.findAllAdmin(playstation.id, { visibility: 'public' })).body!;
      const proPrivate = (await productVariantsController.findAllAdmin(playstation.id, { visibility: 'private' }))
        .body!;
      expect(both).toEqual([slim, pro]);
      expect(slimPublic).toEqual([slim]);
      expect(proPrivate).toEqual([pro]);
      expect(both).toHaveLength(2);
      expect(slimPublic).toHaveLength(1);
      expect(proPrivate).toHaveLength(1);
    });
    it('should success return zero variants because of non existed product.', async ({ productVariantsController }) => {
      const nothing = (await productVariantsController.findAllAdmin(v7())).body!;
      expect(nothing).toHaveLength(0);
    });
  });
  describe('GET /api/v1/products/:productId/variants (findAll)', () => {
    it('should success find all public variants requested by anonymous user.', async ({
      productController,
      productVariantsController,
      app,
    }) => {
      const playstation = (await productController.create()).body!;
      const slim = (await productVariantsController.create(playstation.id, { title: 'slim', visibility: 'public' }))
        .body!;
      const pro = (await productVariantsController.create(playstation.id, { title: 'pro', visibility: 'private' }))
        .body!;
      const anonymous = app.createAgent();
      const publicVariants = (await productVariantsController.withAgent(anonymous).findAll(playstation.id)).body!;
      expect(publicVariants).toHaveLength(1);
      expect(publicVariants).toEqual([slim]);
      expect(publicVariants.includes(pro)).toBe(false);
    });
  });
  describe('GET /api/v1/products/:productId/variants/:id/admin (findByIdAdmin)', () => {
    it('should success fetch existed variant for existed product.', async ({
      productController,
      productVariantsController,
    }) => {
      const playstation = (await productController.create()).body!;
      const slim = (await productVariantsController.create(playstation.id, { title: 'slim', visibility: 'public' }))
        .body!;
      const pro = (await productVariantsController.create(playstation.id, { title: 'pro', visibility: 'private' }))
        .body!;
      const slimPublic = (
        await productVariantsController.findByIdAdmin(playstation.id, slim.id, { visibility: 'public' })
      ).body!;
      const proPrivate = (
        await productVariantsController.findByIdAdmin(playstation.id, pro.id, { visibility: 'private' })
      ).body!;
      const findPrivate = (await productVariantsController.findByIdAdmin(playstation.id, pro.id)).body!; // with no visibility filter.
      expect(slimPublic).toEqual(slim);
      expect(proPrivate).toEqual(pro);
      expect(findPrivate).toEqual(pro);
    });
    it('should fail fetch existed variant for existed product because of bad visibility 404.', async ({
      productController,
      productVariantsController,
    }) => {
      const playstation = (await productController.create()).body!;
      const slim = (await productVariantsController.create(playstation.id, { title: 'slim', visibility: 'public' }))
        .body!;
      const pro = (await productVariantsController.create(playstation.id, { title: 'pro', visibility: 'private' }))
        .body!;
      await productVariantsController.findByIdAdmin(
        playstation.id,
        slim.id,
        {
          visibility: 'private',
        },
        { code: 404 },
      );
      await productVariantsController.findByIdAdmin(
        playstation.id,
        pro.id,
        {
          visibility: 'public',
        },
        { code: 404 },
      );
    });
    it('should fail fetch existed variant for non existed product 404.', async ({
      productController,
      productVariantsController,
    }) => {
      const playstation = (await productController.create()).body!;
      const slim = (await productVariantsController.create(playstation.id, { title: 'slim', visibility: 'public' }))
        .body!;
      await productVariantsController.findByIdAdmin(
        v7(),
        slim.id,
        {
          visibility: 'private',
        },
        { code: 404 },
      );
    });
  });
  describe('GET /api/v1/products/:productId/variants/:id (findById)', () => {
    it('should success find public product variant requested by anonymous user.', async ({
      productController,
      productVariantsController,
      app,
    }) => {
      const playstation = (await productController.create()).body!;
      const slim = (await productVariantsController.create(playstation.id, { title: 'slim', visibility: 'public' }))
        .body!;
      const pro = (await productVariantsController.create(playstation.id, { title: 'pro', visibility: 'private' }))
        .body!;
      const anonymous = app.createAgent();
      const slimPublic = (await productVariantsController.withAgent(anonymous).findById(playstation.id, slim.id)).body!;
      expect(slimPublic).toEqual(slim);
      await productVariantsController.withAgent(anonymous).findById(playstation.id, pro.id, { code: 404 });
    });
  });
  describe('PATCH /api/v1/products/:productId/variants/:id (update)', () => {
    it('should success updating existing product variant.', async ({
      productController,
      productVariantsController,
    }) => {
      const playstation = (await productController.create()).body!;
      const slim = (await productVariantsController.create(playstation.id, { title: 'slim', visibility: 'public' }))
        .body!;
      const updateData: UpdateProductVariantDto = {
        title: 'pro',
        price: 39999,
        info: { weight: 78 },
        salesStatus: 'paused',
        visibility: 'private',
        description: 'very powerful',
      };
      const pro = (await productVariantsController.update(playstation.id, slim.id, updateData)).body!;
      expect(pro).toMatchObject(updateData);
      expect(slim.id).toBe(pro.id);
    });
  });
});
