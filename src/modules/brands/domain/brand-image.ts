import {
  BrandId,
  BrandImageId,
  ImageId,
} from 'src/modules/shared/value-objects/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { Ok, Result } from '@allawiii/results-ts';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
export type BrandImageRole = 'banner' | 'logo';
type BrandImageProps = {
  id: BrandImageId;
  brandId: BrandId;
  imageId: ImageId;
  imageRole: BrandImageRole;
  createdAt: Date;
};
type CreateBrandImageProps = {
  imageId: string;
  brandId: string;
  imageRole: BrandImageRole;
};
type BrandImagePrimitives = Omit<
  BrandImageProps,
  'id' | 'imageId' | 'brandId'
> & {
  id: string;
  imageId: string;
  brandId: string;
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
      brandId: BrandId.create(data.brandId),
    });
    if (resultData.isErr()) {
      return resultData.map();
    }
    return Ok(
      new BrandImage({
        ...resultData.unwrap(),
        imageRole: data.imageRole,
        createdAt: newDate,
      }),
    );
  }
  static restore(
    data: BrandImagePrimitives,
  ): Result<BrandImage, ValueObjectError> {
    const resultData = unwrapResultObject({
      id: BrandImageId.create(data.id),
      imageId: ImageId.create(data.imageId),
      brandId: BrandId.create(data.brandId),
    });
    if (resultData.isErr()) {
      return resultData.map();
    }
    return Ok(
      new BrandImage({
        ...data,
        ...resultData.unwrap(),
      }),
    );
  }

  toJSON(): BrandImagePrimitives {
    return {
      ...this.props,
      id: this.props.id.toString(),
      imageId: this.props.imageId.toString(),
      brandId: this.props.brandId.toString(),
    };
  }
}
