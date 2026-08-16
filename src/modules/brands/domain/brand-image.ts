import { BrandImageId, ImageId } from 'src/modules/shared/domain/ids';

type BrandImageProps = {
  id: BrandImageId;
  imageId: ImageId;
  imageRole: 'banner' | 'logo';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
type CreateBrandImageProps = {
  imageId: string;
  imageRole: 'banner' | 'logo';
  sortOrder: number;
};
export class BrandImage {
  private constructor(private props: BrandImageProps) {}

  static create(data: CreateBrandImageProps) {
    const newDate = new Date();
    return new BrandImage({
      id: BrandImageId.create(),
      imageId: ImageId.create(data.imageId),
      imageRole: data.imageRole,
      sortOrder: data.sortOrder,
      createdAt: newDate,
      updatedAt: newDate,
    });
  }
}
