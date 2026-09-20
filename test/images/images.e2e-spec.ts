import { it } from 'test/support/fixtures/authenticated-e2e.fixture';
import sharp from 'sharp';
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
      }
    });
  });
});
