import { it } from 'test/support/fixtures/authenticated-e2e.fixture';
import sharp from 'sharp';
import { uploadRandomImage } from 'test/support/utils/upload-random-image.util';
import { calculateChecksum } from 'test/support/utils/calculate-checksum.util';
import { v7 } from 'uuid';
import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';
import { waitJobUntilFinish } from 'test/support/utils/wait-job-until-finish.util';

describe.concurrent('images (e2e)', () => {
  describe('POST /api/v1/images', () => {
    it('should success upload a valid image', async ({ imageController }) => {
      const mimes = ['avif', 'png', 'webp', 'jpeg'] as const;
      for (const mime of mimes) {
        const img = await sharp({
          create: {
            width: 4000,
            height: 4000,
            channels: 3,
            background: { r: 255, g: 0, b: 0 },
          },
        })
          [mime]()
          .toBuffer();
        const { body } = await imageController.upload(
          img,
          { name: `test.${mime}`, altText: 'test image' },
          { code: 201, parseBody: true },
        );

        expect(body).toBeDefined();
        expect(body!.name).toBe('test');
        expect(body!.altText).toBe('test image');
        expect(body!.mimeType).toBe(`image/${mime}`);
        expect(body!.width).toBe(4000);
        expect(body!.height).toBe(4000);
        expect(body!.sizeBytes).toBe(img.length);
      }
    });
    it('should show the image in object storage when success upload.', async ({
      imageController,
      storageClient,
    }) => {
      const img = (await uploadRandomImage(imageController)).body!;
      const imgInfo = await storageClient.fetchInfo(img.id);
      expect(imgInfo.contentLength).toBe(img.sizeBytes);
    });
    it('should fail because of exceeding file size', async ({
      imageController,
    }) => {
      const maxSize = 10 * 1024 * 1024;
      await uploadRandomImage(imageController, {
        exactSizeBytes: maxSize + 1,
        expectedStatus: { code: 413 },
      });
    });
    it('should fail uploading image because of invalid mime type.', async ({
      imageController,
    }) => {
      const customBuffer = Buffer.from('should violate filter mime check.');
      await uploadRandomImage(imageController, {
        customBuffer,
        imgExt: 'txt' as unknown as 'png',
        expectedStatus: { code: 400 },
      });
    });
    it('should fail uploading image because of name regex violation contains `-` .', async ({
      imageController,
    }) => {
      await uploadRandomImage(imageController, {
        name: 'shawarma-zenjer',
        expectedStatus: { code: 400 },
      });
    });
    it('should fail uploading image because of name length exceeds its limits.', async ({
      imageController,
    }) => {
      await uploadRandomImage(imageController, {
        name: 'h'.repeat(60),
        expectedStatus: { code: 400 },
      });
    });
    it('should fail uploading image because of altText length exceeds its limits.', async ({
      imageController,
    }) => {
      await uploadRandomImage(imageController, {
        altText: 'h'.repeat(126),
        expectedStatus: { code: 400 },
      });
    });
    it('fails uploading image because of Dimensions exceeds 4096x4096 dimension limits.', async ({
      imageController,
    }) => {
      await uploadRandomImage(imageController, {
        height: 4097,
        width: 4097,
        expectedStatus: { code: 422 },
      });
    });
    it('should preserve image integrity after upload (checksum matches original)', async ({
      imageController,
    }) => {
      // Arrange: create a known image and compute its checksum
      const originalImage = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

      const expectedChecksum = calculateChecksum(originalImage);

      // Act
      const { body } = await uploadRandomImage(imageController, {
        customBuffer: originalImage,
      });

      // Assert
      expect(body!.checksum).toBe(expectedChecksum);
    });
  });
  describe('GET /api/v1/images/:id', () => {
    it('should success returning image metadata by its id.', async ({
      imageController,
    }) => {
      const img = (
        await uploadRandomImage(imageController, { exactSizeBytes: 1 })
      ).body!;
      const getImg = await imageController.findById(img.id, {
        code: 200,
        parseBody: true,
      });
      expect(getImg.body!.id).toBe(img.id);
    });
    it('should fail to fetch not found image metadata by id.', async ({
      imageController,
    }) => {
      await imageController.findById(v7(), {
        code: 404,
      });
    });
  });
  describe('POST /api/v1/images/batch-delete', () => {
    it('should success remove batch of images', async ({
      imageController,
      db,
      storageClient,
    }) => {
      const images: ImageResponseDto[] = [];
      for (let i = 1; i < 4; i++) {
        const image = (await uploadRandomImage(imageController)).body!;
        const imgInfo = await storageClient.fetchInfo(image.id);
        // assert its stored in object storage before attemp to delete it.
        expect(image.sizeBytes).toBe(imgInfo.contentLength);
        images.push(image);
      }
      const imgIds = images.map((img) => img.id);
      const deleteResult = await imageController.removeImages(
        imgIds,
        {
          code: 200,
          parseBody: true,
        },
        (id: string) => storageClient.exists(id),
      );
      expect(deleteResult.body!).toEqual({ affected: 3 });
      // 2. Give pg-boss a moment to update the job state to 'completed'
      await new Promise((resolve) => setTimeout(resolve, 300));
      const allCompleted = await waitJobUntilFinish(db.dataSource, imgIds);
      expect(allCompleted.length).toBe(3);
      expect(
        allCompleted.every(
          (d) => imgIds.includes(d.data.Key) && d.state === 'completed',
        ),
      ).toBe(true);
    });
    it('should success when attempt to delete not existed images ', async ({
      imageController,
      db,
    }) => {
      const fakeImgs = [v7(), v7()];
      const deleteBody = (
        await imageController.removeImages(fakeImgs, {
          code: 200,
          parseBody: true,
        })
      ).body!;
      expect(deleteBody).toEqual({ affected: 0 });
      const finishedImgs = await waitJobUntilFinish(db.dataSource, fakeImgs);
      expect(
        finishedImgs.every(
          (d) => fakeImgs.includes(d.data.Key) && d.state === 'completed',
        ),
      ).toBe(true);
    });
  });
  describe('GET /api/v1/images/unused findUnused', () => {
    it('should success only return unused images and exclude the used once.', async ({
      brandController,
      imageController,
    }) => {
      const honor = (await brandController.create({ name: 'Honor' })).body!;
      const logo = (await uploadRandomImage(imageController)).body!;
      const banner1 = (await uploadRandomImage(imageController)).body!;
      const img = (await uploadRandomImage(imageController)).body!;
      const attached = (
        await brandController.attachImages(honor.id, [
          { imageId: logo.id, imageRole: 'logo' },
          { imageId: banner1.id, imageRole: 'banner' },
        ])
      ).body!;
      const imgIds = [logo.id, banner1.id, img.id];
      const unusedBefore = (await imageController.findUnused({})).body!;
      expect(unusedBefore.images.length).toBe(1);
      expect(unusedBefore.images[0]).toEqual(img);
      expect(
        unusedBefore.images.every(
          (mg) => mg.id === logo.id || mg.id === banner1.id,
        ),
      ).toBe(false);
      await brandController.detachImages(honor.id, [logo.id, banner1.id]);
      const unusedAfter = (await imageController.findUnused({})).body!;
      expect(unusedAfter.images.length).toBe(3);
      expect(unusedAfter.images.every((img) => imgIds.includes(img.id))).toBe(
        true,
      );
    });
    it('should return unused images sorted by size and paginated.', async ({
      imageController,
    }) => {
      const imgs: ImageResponseDto[] = [];
      for (let i = 1; i <= 5; i++) {
        imgs.push((await uploadRandomImage(imageController)).body!);
      }
      const unused = (
        await imageController.findUnused({
          limit: 3,
          sortBy: 'size',
        })
      ).body!;
      expect(unused.images.length).toBe(3);
      expect(unused.images.map((img) => img.sizeBytes)).toEqual(
        unused.images.map((img) => img.sizeBytes).toSorted(),
      );
    });
    it('should return unused images sorted by name and paginated.', async ({
      imageController,
    }) => {
      const imgs: ImageResponseDto[] = [];
      for (let i = 1; i <= 6; i++) {
        imgs.push((await uploadRandomImage(imageController)).body!);
      }
      const unused = (
        await imageController.findUnused({
          limit: 3,
          page: 2,
          sortBy: 'name',
        })
      ).body!;
      expect(unused.images.length).toBe(3);
      expect(unused.images.map((img) => img.name)).toEqual(
        unused.images
          .map((img) => img.name)
          .toSorted((a, b) => a.localeCompare(b)),
      );
    });
  });
  describe('DELETE /api/v1/images/unused removeUnused', () => {
    it('should delete unused images.', async ({
      imageController,
      brandController,
    }) => {
      const imgs: ImageResponseDto[] = [];
      for (let i = 1; i <= 6; i++) {
        imgs.push((await uploadRandomImage(imageController)).body!);
      }
      const images3 = imgs.slice(0, 3);
      const honor = (await brandController.create({ name: 'Honor' })).body!;
      await brandController.attachImages(
        honor.id,
        images3.map((mg) => {
          return { imageId: mg.id, imageRole: 'banner' };
        }),
      );
      const affected = (await imageController.removeUnused()).body!.affected;
      const honorBanners = (await brandController.findBanners(honor.id)).body!;
      expect(affected).toBe(3);
      expect(honorBanners).toEqual(images3);
    });
    it('should delete more than 100 unused images.', async ({
      imageController,
    }) => {
      const imgs: ImageResponseDto[] = [];
      for (let i = 1; i <= 150; i++) {
        imgs.push((await uploadRandomImage(imageController)).body!);
      }
      const affected = (await imageController.removeUnused()).body!.affected;
      expect(affected).toBe(150);
      const fetchUnused = (await imageController.findUnused({ limit: 100 }))
        .body!;
      expect(fetchUnused.images.length).toBe(0);
    });
  });
});
