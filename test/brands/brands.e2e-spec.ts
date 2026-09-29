import { it } from '../support/fixtures/authenticated-e2e.fixture';

describe.concurrent('brands (e2e)', () => {
  describe('POST /api/v1/brands', () => {
    it('should success creating new brand', async ({ brandController }) => {
      const brand = await brandController.create({ name: 'Honor' });
      console.log(brand.body);
      expect(brand.body?.name).toBe('Honor');
    });
  });
});
