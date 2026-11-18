import { Result } from '@allawiii/results-ts';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { DomainText } from 'src/modules/shared/value-objects/domain-text';
import { ProductId, ProductVariantId } from 'src/modules/shared/value-objects/ids';
import { Price } from 'src/modules/shared/value-objects/price';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { ProductVisibility } from './product-visibility';
import { Image } from 'src/modules/images/domain/image';
import { type JsonObject } from 'src/modules/shared/value-objects/json-object';
import { Title } from 'src/modules/shared/value-objects/title';
import { ProductSalesStatus } from './product-sales-status';

type ProductVariantProps = {
  readonly id: ProductVariantId;
  readonly productId: ProductId;
  title: Title;
  price: Price;
  description: DomainText | null;
  info: JsonObject;
  visibility: ProductVisibility;
  salesStatus: ProductSalesStatus;
  images?: Image[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
export type ProductVariantPrimitives = {
  readonly id: string;
  readonly productId: string;
  title: string;
  price: number;
  description: string | null;
  visibility: ProductVisibility;
  salesStatus: ProductSalesStatus;
  info: JsonObject;
  images?: Image[];
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};
export const PRODUCT_VARIANT_FIELDS = [
  'title',
  'price',
  'description',
  'visibility',
  'salesStatus',
  'info',
  'sortOrder',
] as const;
export type ProductVariantFields = (typeof PRODUCT_VARIANT_FIELDS)[number];
type CreateProductVariantPrimitives = Omit<
  ProductVariantPrimitives,
  'id' | 'createdAt' | 'visibility' | 'updatedAt' | 'images' | 'salesStatus'
>;
export class ProductVariant {
  private constructor(private props: ProductVariantProps) {}
  static create(data: CreateProductVariantPrimitives): Result<ProductVariant, ValueObjectError> {
    const date = new Date();
    return this.build({
      ...data,
      id: ProductVariantId.create().unwrap().toString(),
      visibility: 'public',
      salesStatus: 'active',
      createdAt: date,
      updatedAt: date,
    });
  }
  static restore(data: ProductVariantPrimitives): Result<ProductVariant, ValueObjectError> {
    return this.build(data);
  }
  static build(data: ProductVariantPrimitives): Result<ProductVariant, ValueObjectError> {
    const {
      id,
      description,
      title,
      price,
      productId,
      info,
      createdAt,
      visibility,
      updatedAt,
      sortOrder,
      images,
      salesStatus,
    } = data;
    return Result.wrap(
      () =>
        new ProductVariant({
          id: ProductVariantId.create(id).unwrap(),
          productId: ProductId.create(productId).unwrap(),
          title: Title.create(title, 50).unwrap(),
          description: DomainText.create(description ?? '', 2000).unwrap(),
          price: Price.create(price).unwrap(),
          info,
          sortOrder,
          visibility,
          images,
          salesStatus,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        }),
    );
  }
  toJSON() {
    return { ...serializeProps(this.props), images: this.props.images?.map((img) => img.toJSON()) };
  }
}
