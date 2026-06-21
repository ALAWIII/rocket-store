import {
  AuditableEntity,
  AuditFields,
} from 'src/modules/shared/domain/auditing';

import {
  BrandId,
  ProductId,
  ProductVariantId,
  UserId,
} from 'src/modules/shared/domain/ids';

// temporary will be replaced by layer specific DTO.
type UpdateProductVariantProps = {
  price: number;
  quantity: number;
  info: Record<string, string>;
  description?: string;
};
type CreateProductVariantProps = {
  readonly id: ProductVariantId;
  readonly productId: ProductId;
} & UpdateProductVariantProps;
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
export class ProductVaraintList {
  constructor(
    private _variants = new Map<ProductVariantId, ProductVariant>(),
  ) {}
  static restore(variants: CreateProductVariantProps[]): ProductVaraintList {
    const list = new ProductVaraintList();
    for (const props of variants) {
      const pv = ProductVariant.restore(props);
      list.add(pv);
    }
    return list;
  }
  add(variant: ProductVariant): void {
    this._variants.set(variant.id, variant);
  }
  remove(variantId: ProductVariantId): ProductVariant | undefined {
    const v = this.getById(variantId);
    this._variants.delete(variantId);
    return v;
  }
  update(variantId: ProductVariantId, vi: UpdateProductVariantProps) {
    const v = this.getById(variantId);
    v?.update(vi);
  }
  getById(variantId: ProductVariantId): ProductVariant | undefined {
    return this._variants.get(variantId);
  }
  get variants(): ProductVariant[] {
    return [...this._variants.values()];
  }
  toJSON(): CreateProductVariantProps[] {
    return this.variants.map((v) => v.toJSON());
  }
}
class ProductVariant {
  private constructor(private data: CreateProductVariantProps) {
    if (data.price < 0) throw new Error('Price cannot be negative');
    if (data.quantity < 0) throw new Error('Quantity cannot be negative');
  }
  static create(props: CreateProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }
  static restore(props: CreateProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }
  update(input: UpdateProductVariantProps) {
    this.data.description = input.description;
    this.data.info = input.info;
    this.data.price = input.price;
    this.data.quantity = input.quantity;
  }
  get id(): ProductVariantId {
    return this.data.id;
  }

  get productId(): ProductId {
    return this.data.productId;
  }

  get price(): number {
    return this.data.price;
  }

  get quantity(): number {
    return this.data.quantity;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get info(): Record<string, string> {
    return { ...this.data.info };
  }
  toJSON(): CreateProductVariantProps {
    return { ...this.data };
  }
}
