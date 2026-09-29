import { v7 } from 'uuid';
import { it } from '../support/fixtures/authenticated-e2e.fixture';

describe.concurrent('brands (e2e)', () => {
  describe('POST /api/v1/brands', () => {
    it('should success creating new brand', async ({ brandController }) => {
      const brand = await brandController.create({ name: 'Honor' });
      expect(brand.body?.name).toBe('Honor');
    });
    it('should fail creating new brand with name that already exists', async ({
      brandController,
    }) => {
      await brandController.create({ name: 'Honor' });
      await brandController.create({ name: 'Honor' }, { code: 409 });
    });
  });
  describe('GET /api/v1/brands/:id', () => {
    it('should success find brand by its id.', async ({ brandController }) => {
      const brand = (await brandController.create({ name: 'Honor' })).body!;
      const findBrand = (await brandController.findById(brand.id)).body!;
      expect(brand).toEqual(findBrand);
    });
    it('should fail finding brand that is not existed.', async ({
      brandController,
    }) => {
      await brandController.findById(v7(), { code: 404 });
    });
  });
});
