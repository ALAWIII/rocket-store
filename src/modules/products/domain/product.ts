import { Result } from '@allawiii/results-ts';
import { Image } from 'src/modules/images/domain/image';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { DomainText } from 'src/modules/shared/value-objects/domain-text';
import { BrandId, PageId, ProductId } from 'src/modules/shared/value-objects/ids';
import { Title } from 'src/modules/shared/value-objects/title';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { ProductVisibility } from './product-visibility';
import { ProductSalesStatus } from './product-sales-status';

type ProductProps = {
  readonly id: ProductId;
  title: Title;
  description: DomainText;
  brandId: BrandId | null;
  pageId: PageId | null;
  coverImage?: Image;
  visibility: ProductVisibility;
  salesStatus: ProductSalesStatus;
  createdAt: Date;
  updatedAt: Date;
};
export type ProductPrimitives = {
  readonly id: string;
  title: string;
  description: string;
  brandId: string | null;
  pageId: string | null;
  coverImage?: Image;
  visibility: ProductVisibility;
  salesStatus: ProductSalesStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
};
export const PRODUCT_FIELDS = ['description', 'visibility', 'salesStatus'] as const;
export type ProductFields = (typeof PRODUCT_FIELDS)[number];
type CreateProductPrimitives = Pick<ProductPrimitives, 'description' | 'title' | 'brandId' | 'pageId'>;
export class Product {
  private constructor(private props: ProductProps) {}
  static create(data: CreateProductPrimitives): Result<Product, ValueObjectError> {
    const date = new Date();
    return this.build({
      ...data,
      id: ProductId.create().unwrap().toString(),
      createdAt: date,
      updatedAt: date,
      visibility: 'public',
      salesStatus: 'active',
    });
  }
  static restore(data: ProductPrimitives): Result<Product, ValueObjectError> {
    return this.build(data);
  }
  private static build(data: ProductPrimitives): Result<Product, ValueObjectError> {
    const { id, title, description, brandId, createdAt, updatedAt, pageId, coverImage, visibility, salesStatus } = data;
    return Result.wrap(() => {
      return new Product({
        id: ProductId.create(id).unwrap(),
        title: Title.create(title, 200).unwrap(),
        description: DomainText.create(description, 10000).unwrap(),
        brandId: brandId ? BrandId.create(brandId).unwrap() : null,
        pageId: pageId ? PageId.create(pageId).unwrap() : null,
        coverImage,
        visibility,
        salesStatus,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      });
    });
  }

  toJSON() {
    return serializeProps(this.props);
  }
}
