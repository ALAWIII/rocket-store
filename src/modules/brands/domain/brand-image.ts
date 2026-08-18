import { BrandImageId, ImageId } from 'src/modules/shared/value-objects/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { Ok, Result } from 'ts-results-es';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
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

  static create(
    data: CreateBrandImageProps,
  ): Result<BrandImage, ValueObjectError> {
    const newDate = new Date();
    const resultData = unwrapResultObject({
      id: BrandImageId.create(),
      imageId: ImageId.create(data.imageId),
    });
    if (resultData.isErr()) {
      return resultData;
    }
    return Ok(
      new BrandImage({
        ...resultData.unwrap(),
        imageRole: data.imageRole,
        sortOrder: data.sortOrder,
        createdAt: newDate,
        updatedAt: newDate,
      }),
    );
  }
  static restore(
    data: BrandImagePrimitives,
  ): Result<BrandImage, ValueObjectError> {
    const resultData = unwrapResultObject({
      id: BrandImageId.create(data.id),
      imageId: ImageId.create(data.imageId),
    });
    if (resultData.isErr()) {
      return resultData;
    }
    return Ok(
      new BrandImage({
        ...data,
        ...resultData.unwrap(),
      }),
    );
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  toJSON(): BrandImagePrimitives {
    return {
      ...this.props,
      id: this.props.id.toString(),
      imageId: this.props.imageId.toString(),
    };
  }
}
