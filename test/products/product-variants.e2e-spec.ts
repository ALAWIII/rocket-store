import { CreateProductVariantDto } from 'src/modules/products/dto/request/write/create-product-variant.dto';
import { it } from '../support/fixtures/authenticated-e2e.fixture';
import { v7 } from 'uuid';

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
});
