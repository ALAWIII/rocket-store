import { it } from 'test/support/fixtures/authenticated-e2e.fixture';
import sharp from 'sharp';
import { uploadRandomImage } from 'test/support/utils/upload-random-image.util';
import { calculateChecksum } from 'test/support/utils/calculate-checksum.util';
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
  });
});
