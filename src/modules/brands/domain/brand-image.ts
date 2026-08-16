import { BrandImageId, ImageId } from 'src/modules/shared/domain/ids';
export type BrandImageRole = 'banner' | 'logo';
type BrandImageProps = {
  id: BrandImageId;
  imageId: ImageId;
  imageRole: BrandImageRole;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
type CreateBrandImageProps = {
  imageId: string;
  imageRole: BrandImageRole;
  sortOrder: number;
};
type BrandImagePrimitives = Omit<BrandImageProps, 'id' | 'imageId'> & {
  id: string;
  imageId: string;
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
  static restore(data: BrandImagePrimitives) {
    return new BrandImage({
      ...data,
      id: BrandImageId.create(data.id),
      imageId: ImageId.create(data.imageId),
    });
  }
  toJSON(): BrandImagePrimitives {
    return {
      ...this.props,
      id: this.props.id.toString(),
      imageId: this.props.imageId.toString(),
    };
  }
}
