import { Result } from '@allawiii/results-ts';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { DomainText } from 'src/modules/shared/value-objects/domain-text';
import { ProductId, ProductVariantId } from 'src/modules/shared/value-objects/ids';
import { Price } from 'src/modules/shared/value-objects/price';
import { Quantity } from 'src/modules/shared/value-objects/quantity';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { ProductStatus } from './product-status';

type ProductVariantProps = {
  readonly id: ProductVariantId;
  readonly productId: ProductId;
  price: Price;
  quantity: Quantity;
  description?: DomainText;
  info: Record<string, unknown>;
  status: ProductStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
type ProductVariantPrimitives = {
  readonly id: string;
  readonly productId: string;
  price: number;
  quantity: number;
  description?: string;
  status: ProductStatus;
  info: Record<string, unknown>;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};
type CreateProductVariantPrimitives = Omit<ProductVariantPrimitives, 'id' | 'createdAt' | 'status' | 'updatedAt'>;
export class ProductVariant {
  private constructor(private props: ProductVariantProps) {}
  static create(data: CreateProductVariantPrimitives): Result<ProductVariant, ValueObjectError> {
    const date = new Date();
    return this.build({
      ...data,
      id: ProductVariantId.create().unwrap().toString(),
      status: 'active',
      createdAt: date,
      updatedAt: date,
    });
  }
  static restore(data: ProductVariantPrimitives): Result<ProductVariant, ValueObjectError> {
    return this.build(data);
  }
  static build(data: ProductVariantPrimitives): Result<ProductVariant, ValueObjectError> {
    const { id, description, price, productId, quantity, info, createdAt, status, updatedAt, sortOrder } = data;
    return Result.wrap(
      () =>
        new ProductVariant({
          id: ProductVariantId.create(id).unwrap(),
          productId: ProductId.create(productId).unwrap(),
          description: DomainText.create(description ?? '').unwrap(),
          quantity: Quantity.create(quantity).unwrap(),
          price: Price.create(price).unwrap(),
          info,
          sortOrder,
          status,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        }),
    );
  }
  toJSON() {
    return serializeProps(this.props);
  }
}
