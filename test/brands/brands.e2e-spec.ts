import { it } from '../support/fixtures/authenticated-e2e.fixture';

describe.concurrent('brands (e2e)', () => {
  describe('POST /api/v1/brands', () => {
    it('should success creating new brand', async ({ brandController }) => {
      const brand = await brandController.create({ name: 'Honor' });
      expect(brand.body?.name).toBe('Honor');
    });
  });
  describe('GET /api/v1/brands', () => {
    it('should success find brand by its id.', async ({ brandController }) => {
      const brand = (await brandController.create({ name: 'Honor' })).body!;
      const findBrand = (await brandController.findById(brand.id)).body!;
      expect(brand).toEqual(findBrand);
    });
  });
});
