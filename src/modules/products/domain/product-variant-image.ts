import { Result } from '@allawiii/results-ts';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { ImageId, ProductImageId, ProductVariantId, ProductVariantImageId } from 'src/modules/shared/value-objects/ids';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

type ProductImageProps = {
  id: ProductVariantImageId;
  imageId: ImageId;
  productVaraintId: ProductVariantId;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type ProductVariantImagePrimitives = {
  id: string;
  imageId: string;
  productVaraintId: string;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};
type CreateProductVariantImageProps = Omit<ProductVariantImagePrimitives, 'id' | 'createdAt' | 'updatedAt'>;
export class ProductVariantImage {
  private constructor(private readonly props: ProductImageProps) {}
  static create(data: CreateProductVariantImageProps): Result<ProductVariantImage, ValueObjectError> {
    const date = new Date();
    return this.build({
      ...data,
      id: ProductVariantImageId.create().unwrap().toString(),
      createdAt: date,
      updatedAt: date,
    });
  }
  static restore(data: ProductVariantImagePrimitives): Result<ProductVariantImage, ValueObjectError> {
    return this.build(data);
  }
  private static build(data: ProductVariantImagePrimitives): Result<ProductVariantImage, ValueObjectError> {
    const { id, imageId, createdAt, updatedAt, productVaraintId, sortOrder } = data;
    return Result.wrap(
      () =>
        new ProductVariantImage({
          id: ProductImageId.create(id).unwrap(),
          productVaraintId: ProductVariantId.create(productVaraintId).unwrap(),
          imageId: ImageId.create(imageId).unwrap(),
          sortOrder,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        }),
    );
  }
  toJSON() {
    return serializeProps(this.props);
  }
}
