import { Result } from '@allawiii/results-ts';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { ProductId, ImageId, ProductImageId } from 'src/modules/shared/value-objects/ids';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

export type ProductImageRole = 'cover';

type ProductImageProps = {
  id: ProductImageId;
  imageId: ImageId;
  productId: ProductId;
  imageRole: ProductImageRole;
  createdAt: Date;
};

type ProductImagePrimitives = {
  id: string;
  imageId: string;
  productId: string;
  imageRole: ProductImageRole;
  createdAt: string | Date;
};
type CreateProductImageProps = Omit<ProductImagePrimitives, 'id' | 'createdAt'>;
export class ProductImage {
  private constructor(private readonly props: ProductImageProps) {}
  static create(data: CreateProductImageProps): Result<ProductImage, ValueObjectError> {
    return this.build({ ...data, id: ProductId.create().unwrap().toString(), createdAt: new Date() });
  }
  static restore(data: ProductImagePrimitives): Result<ProductImage, ValueObjectError> {
    return this.build(data);
  }
  private static build(data: ProductImagePrimitives): Result<ProductImage, ValueObjectError> {
    return Result.wrap(
      () =>
        new ProductImage({
          id: ProductImageId.create(data.id).unwrap(),
          productId: ProductId.create(data.productId).unwrap(),
          imageId: ImageId.create(data.imageId).unwrap(),
          createdAt: new Date(data.createdAt),
          imageRole: data.imageRole,
        }),
    );
  }
  toJSON() {
    return serializeProps(this.props);
  }
}
