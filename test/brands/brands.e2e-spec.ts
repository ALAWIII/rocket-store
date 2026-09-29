import { v7 } from 'uuid';
import { it } from '../support/fixtures/authenticated-e2e.fixture';
import { BrandResponseDto } from 'src/modules/brands/dto/brand-response.dto';

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
  describe('GET /api/v1/brands?name&page&limit findAll', () => {
    it('should success find all brands.', async ({ brandController }) => {
      const brands: Map<string, BrandResponseDto> = new Map();
      for (let i = 1; i <= 10; i++) {
        const b = (await brandController.create({ name: `brand-${i}` })).body!;
        brands.set(b.id, b);
      }
      const findBrands = (await brandController.findAll({})).body!;
      expect(findBrands.every((b) => brands.has(b.id)));
    });
  });
  describe('PATCH /api/v1/brands/:id rename', () => {
    it('should success rename existed brand', async ({ brandController }) => {
      const brand = (await brandController.create({ name: 'Honor' })).body!;
      const renamed = (
        await brandController.rename(brand.id, { name: 'Huawie' })
      ).body!;
      expect(renamed.name).toBe('Huawie');
      expect(renamed.id).toBe(brand.id);
      expect(renamed.createdAt).toBe(brand.createdAt);
      expect(renamed.name).not.toBe(brand.name);
    });
    it('should fail renaming non existed brand', async ({
      brandController,
    }) => {
      await brandController.rename(v7(), { name: 'Huawie' }, { code: 404 });
    });
    it('should conflict to rename brand with a name already taken by another brand', async ({
      brandController,
    }) => {
      await brandController.create({ name: 'Huawie' });
      const brand = await brandController.create({ name: 'Honor' });
      await brandController.rename(
        brand.body!.id,
        { name: 'Huawie' },
        { code: 409 },
      );
    });
  });
});
