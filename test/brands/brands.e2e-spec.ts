import { v7 } from 'uuid';
import { it } from '../support/fixtures/authenticated-e2e.fixture';
import { BrandResponseDto } from 'src/modules/brands/dto/brand-response.dto';
import { uploadRandomImage } from 'test/support/utils/upload-random-image.util';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { AttachImagesToBrandDto } from 'src/modules/brands/dto/attach-images-to-brand.dto';

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
    it('should success find all brands by paging.', async ({
      brandController,
    }) => {
      const brands: Map<string, BrandResponseDto> = new Map();
      for (let i = 1; i <= 10; i++) {
        const b = (await brandController.create({ name: `brand-${i}` })).body!;
        brands.set(b.id, b);
      }
      const findFirst5Brands = (await brandController.findAll({ limit: 5 }))
        .body!;
      const findSecond5Brands = (
        await brandController.findAll({ limit: 5, page: 2 })
      ).body!;
      expect(findFirst5Brands).not.toEqual(findSecond5Brands);
      expect(findFirst5Brands.length).toBe(5);
      expect(findSecond5Brands.length).toBe(5);
    });
    it('should success find all brands that matches given name.', async ({
      brandController,
    }) => {
      const brands: Map<string, BrandResponseDto> = new Map();
      for (let i = 1; i <= 10; i++) {
        const b = (await brandController.create({ name: `brand-${i}` })).body!;
        brands.set(b.id, b);
      }
      const findBrands = (await brandController.findAll({ name: 'd-2' })).body!;
      expect(findBrands.length).toBe(1);
      expect(findBrands[0].name).toBe('brand-2');
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
  describe('POST /api/v1/brands/batch-delete removeMany', () => {
    it('should success remove many brands.', async ({ brandController }) => {
      const brands: Map<string, BrandResponseDto> = new Map();
      for (let i = 1; i <= 10; i++) {
        const b = (await brandController.create({ name: `brand-${i}` })).body!;
        brands.set(b.id, b);
      }
      const brandIds = [...brands.keys()];
      const deleteBrands = (await brandController.removeMany(brandIds)).body!;
      expect(deleteBrands).toEqual({ affected: 10 });
      const all = (await brandController.findAll({})).body!;
      expect(all.length).toBe(0);
    });
  });
});
describe.concurrent('brands and images (e2e)', () => {
  describe('POST /api/v1/brands/:id/images attachImages', () => {
    it('should success attach multiple images of logo and banners to brand', async ({
      brandController,
      imageController,
    }) => {
      const images: ImageResponseDto[] = [];
      const imgAttach: { imageId: string; imageRole: string }[] = [];
      for (let i = 1; i <= 3; i++) {
        const img = (await uploadRandomImage(imageController)).body!;
        images.push(img);
        imgAttach.push({
          imageId: img.id,
          imageRole: i === 1 ? 'logo' : 'banner',
        });
      }
      const honor = (await brandController.create({ name: 'Honor' })).body!;
      const attachingBody = (
        await brandController.attachImages(honor.id, imgAttach as any)
      ).body!;
      expect(attachingBody).toHaveLength(3);

      const attachedIds = attachingBody.map((img) => img.id).sort();
      const expectedIds = images.map((img) => img.id).sort();

      expect(attachedIds).toEqual(expectedIds);

      expect(
        attachingBody.every((img) =>
          imgAttach.some((attach) => attach.imageId === img.id),
        ),
      ).toBe(true);
      const brandWithLogo = (await brandController.findById(honor.id)).body!;
      expect(images[0].id).toBe(brandWithLogo.logo?.id);
    });
    it('should success when attaching same logo/banner to multiple different brands', async ({
      imageController,
      brandController,
    }) => {
      const logo = (await uploadRandomImage(imageController)).body!;
      const banner = (await uploadRandomImage(imageController)).body!;
      const honor = (await brandController.create({ name: 'Honor' })).body!;
      const huwaie = (await brandController.create({ name: 'Huawie' })).body!;
      const attachHonorSuccess = await brandController.attachImages(honor.id, [
        { imageId: logo.id, imageRole: 'logo' },
        { imageId: banner.id, imageRole: 'banner' },
      ]);
      const attachHuawieSuccess = await brandController.attachImages(
        huwaie.id,
        [
          { imageId: logo.id, imageRole: 'logo' },
          { imageId: banner.id, imageRole: 'banner' },
        ],
      );
      expect(attachHonorSuccess.body).toEqual(attachHuawieSuccess.body);
    });
    it('should fail when attaching same image to the same brand multiple different times', async ({
      imageController,
      brandController,
    }) => {
      const logo = (await uploadRandomImage(imageController)).body!;
      const banner = (await uploadRandomImage(imageController)).body!;

      const honor = (await brandController.create({ name: 'Honor' })).body!;
      const attachFirstTimeSuccess = await brandController.attachImages(
        honor.id,
        [
          { imageId: logo.id, imageRole: 'logo' },
          { imageId: banner.id, imageRole: 'banner' },
        ],
      );
      await brandController.attachImages(
        honor.id,

        [{ imageId: logo.id, imageRole: 'logo' }],

        { code: 409 },
      );
      await brandController.attachImages(
        honor.id,
        [{ imageId: banner.id, imageRole: 'banner' }],
        { code: 409 },
      );
    });
  });
  describe('GET /api/v1/brands/:id/images findBanners', () => {
    it('should success fetch all brand banners excluding the logo by its id.', async ({
      imageController,
      brandController,
    }) => {
      const logo = (await uploadRandomImage(imageController)).body!;
      const banner1 = (await uploadRandomImage(imageController)).body!;
      const banner2 = (await uploadRandomImage(imageController)).body!;
      const honor = (await brandController.create({ name: 'Honor' })).body!;
      await brandController.attachImages(honor.id, [
        { imageId: logo.id, imageRole: 'logo' },
        { imageId: banner1.id, imageRole: 'banner' },
        { imageId: banner2.id, imageRole: 'banner' },
      ]);
      const banners = (await brandController.findBanners(honor.id)).body!;
      expect(
        banners.every((b) => b.id === banner1.id || b.id === banner2.id),
      ).toBe(true);
      expect(banners.some((b) => b.id === logo.id)).toBe(false);
    });
    it('should return empty banners when brand has no banners.', async ({
      imageController,
      brandController,
    }) => {
      const logo = (await uploadRandomImage(imageController)).body!;
      const banner1 = (await uploadRandomImage(imageController)).body!;
      const banner2 = (await uploadRandomImage(imageController)).body!;
      const honor = (await brandController.create({ name: 'Honor' })).body!;
      const huawie = (await brandController.create({ name: 'Huawie' })).body!;
      await brandController.attachImages(honor.id, [
        { imageId: logo.id, imageRole: 'logo' },
        { imageId: banner1.id, imageRole: 'banner' },
        { imageId: banner2.id, imageRole: 'banner' },
      ]);
      const banners = (await brandController.findBanners(huawie.id)).body!;
      expect(banners.length).toBe(0);
    });
  });
  describe('POST /api/v1/brands/:id/images/detach detachImages', () => {
    it('should success detach images from brand', async ({
      brandController,
      imageController,
    }) => {
      const logo = (await uploadRandomImage(imageController)).body!;
      const banner1 = (await uploadRandomImage(imageController)).body!;
      const banner2 = (await uploadRandomImage(imageController)).body!;
      const honor = (await brandController.create({ name: 'Honor' })).body!;
      await brandController.attachImages(honor.id, [
        { imageId: logo.id, imageRole: 'logo' },
        { imageId: banner1.id, imageRole: 'banner' },
        { imageId: banner2.id, imageRole: 'banner' },
      ]);
      const dBody = (
        await brandController.detachImages(honor.id, [
          logo.id,
          banner1.id,
          banner2.id,
        ])
      ).body!;
      const banners = (await brandController.findBanners(honor.id)).body!;
      expect(banners.length).toBe(0);
      expect(dBody).toEqual({ affected: 3 });
    });
  });
});
