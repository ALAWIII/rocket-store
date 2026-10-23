import { Result } from '@allawiii/results-ts';
import { Image, ImagePrimitives } from 'src/modules/images/domain/image';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { DomainText } from 'src/modules/shared/value-objects/domain-text';
import { BrandId, CategoryId, PageId, ProductId } from 'src/modules/shared/value-objects/ids';
import { Title } from 'src/modules/shared/value-objects/title';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { ProductStatus } from './product-status';

type ProductProps = {
  readonly id: ProductId;
  title: Title;
  description: DomainText;
  brandId: BrandId | null;
  pageId: PageId | null;
  coverImage?: Image;
  status: ProductStatus;
  categories: CategoryId[];
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
  status: ProductStatus;
  categories: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
};
type CreateProductPrimitives = Pick<ProductPrimitives, 'description' | 'title' | 'brandId' | 'pageId' | 'categories'>;
export class Product {
  private constructor(private props: ProductProps) {}
  static create(data: CreateProductPrimitives): Result<Product, ValueObjectError> {
    const date = new Date();
    return this.build({
      ...data,
      id: ProductId.create().unwrap().toString(),
      createdAt: date,
      updatedAt: date,
      status: 'active',
    });
  }
  static restore(data: ProductPrimitives): Result<Product, ValueObjectError> {
    return this.build(data);
  }
  private static build(data: ProductPrimitives): Result<Product, ValueObjectError> {
    const { id, title, description, brandId, createdAt, updatedAt, pageId, coverImage, status, categories } = data;
    return Result.wrap(() => {
      return new Product({
        id: ProductId.create(id).unwrap(),
        title: Title.create(title).unwrap(),
        description: DomainText.create(description, 500).unwrap(),
        brandId: brandId ? BrandId.create(brandId).unwrap() : null,
        pageId: pageId ? PageId.create(pageId).unwrap() : null,
        coverImage: coverImage ? Image.restore(coverImage).unwrap() : undefined,
        status,
        categories: categories.map((cat) => CategoryId.create(cat).unwrap()),
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      });
    });
  }

  toJSON() {
    return serializeProps(this.props);
  }
}
