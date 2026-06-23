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
  constructor(private props: ProductProps) {}

  get id(): ProductId {
    return this.props.id;
  }
  get title(): string {
    return this.props.title.title;
  }
  get brandId(): BrandId | undefined | null {
    return this.props.brandId;
  }
  get description(): string {
    return this.props.description;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  update(updateProps: UpdateProductProps) {
    if (updateProps.title !== undefined) {
      this.props.title = updateProps.title;
    }

    if (updateProps.description !== undefined) {
      this.props.description = updateProps.description;
    }

    if (updateProps.brandId !== undefined) {
      this.props.brandId = updateProps.brandId; // can be null
    }
  }
  toJSON() {
    return { ...this.props };
  }
}
