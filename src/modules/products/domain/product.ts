import { Result } from '@allawiii/results-ts';
import { Image, ImagePrimitives } from 'src/modules/images/domain/image';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { DomainText } from 'src/modules/shared/value-objects/domain-text';
import { BrandId, PageId, ProductId } from 'src/modules/shared/value-objects/ids';
import { Title } from 'src/modules/shared/value-objects/title';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

type ProductProps = {
  readonly id: ProductId;
  title: Title;
  description: DomainText;
  brandId: BrandId | null;
  pageId: PageId | null;
  coverImage?: Image;
  createdAt: Date;
  updatedAt: Date;
};
type ProductPrimitives = {
  readonly id: string;
  title: string;
  description: string;
  brandId: string | null;
  pageId: string | null;
  coverImage?: ImagePrimitives;
  createdAt: Date | string;
  updatedAt: Date | string;
};
type CreateProductPrimitives = Pick<ProductPrimitives, 'description' | 'title' | 'brandId' | 'pageId'>;
export class Product {
  private constructor(private props: ProductProps) {}
  static create(data: CreateProductPrimitives): Result<Product, ValueObjectError> {
    const date = new Date();
    return this.build({ ...data, id: ProductId.create().unwrap().toString(), createdAt: date, updatedAt: date });
  }
  static restore(data: ProductPrimitives): Result<Product, ValueObjectError> {
    return this.build(data);
  }
  private static build(data: ProductPrimitives): Result<Product, ValueObjectError> {
    const { id, title, description, brandId, createdAt, updatedAt, pageId, coverImage } = data;
    return Result.wrap(() => {
      return new Product({
        id: ProductId.create(id).unwrap(),
        title: Title.create(title).unwrap(),
        description: DomainText.create(description, 500).unwrap(),
        brandId: brandId ? BrandId.create(brandId).unwrap() : null,
        pageId: pageId ? PageId.create(pageId).unwrap() : null,
        coverImage: coverImage ? Image.restore(coverImage).unwrap() : undefined,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      });
    });
  }

  toJSON() {
    return serializeProps(this.props);
  }
}
