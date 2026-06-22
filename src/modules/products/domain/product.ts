import { BrandId, ProductId } from 'src/modules/shared/domain/ids';
import { Title } from 'src/modules/shared/value-objects/title';

type ProductProps = {
  readonly id: ProductId;
  title: Title;
  description: string;
  brandId?: BrandId | null;
  createdAt: Date;
};
type UpdateProductProps = Partial<Omit<ProductProps, 'id' | 'createdAt'>>;

export class Product {
  constructor(private productProps: ProductProps) {}

  get id(): ProductId {
    return this.productProps.id;
  }
  get title(): string {
    return this.productProps.title.title;
  }
  get brandId(): BrandId | undefined | null {
    return this.productProps.brandId;
  }
  get description(): string {
    return this.productProps.description;
  }
  update(updateProps: UpdateProductProps) {
    if (updateProps.title !== undefined) {
      this.productProps.title = updateProps.title;
    }

    if (updateProps.description !== undefined) {
      this.productProps.description = updateProps.description;
    }

    if (updateProps.brandId !== undefined) {
      this.productProps.brandId = updateProps.brandId; // can be null
    }
  }
  toJSON() {
    return { ...this.productProps };
  }
}
