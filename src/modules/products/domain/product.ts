import {
  AuditableEntity,
  AuditFields,
} from 'src/modules/shared/domain/auditing';

import { BrandId, ProductId, UserId } from 'src/modules/shared/domain/ids';

type UpdateProductProps = {
  updatedBy: UserId;
  title?: ProductTitle;
  description?: string;
  brandId?: BrandId | null;
};
type ProductProps = {
  readonly id: ProductId;
  title: ProductTitle;
  description: string;
  brandId?: BrandId | null;
  audit: AuditFields;
};

export class ProductTitle {
  private constructor(private _title: string) {}
  static create(title: string): ProductTitle {
    const normalized = title.trim();
    if (normalized.length < 2 || normalized.length > 100)
      throw new Error(
        'Invalid product title length must be between 2 and 100 characters.',
      );
    return new ProductTitle(normalized);
  }
  get title(): string {
    return this._title;
  }
}

export class Product extends AuditableEntity {
  constructor(private productProps: ProductProps) {
    super(productProps.audit);
  }

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
    this.touch(updateProps.updatedBy);
  }
  toJSON() {
    return { ...this.productProps };
  }
}
