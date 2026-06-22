import { ProductId, ProductVariantId } from 'src/modules/shared/domain/ids';

type ProductVariantProps = {
  readonly id: ProductVariantId;
  readonly productId: ProductId;
  price: number;
  quantity: number;
  info: Record<string, string>;
  description?: string;
};
type UpdateProductVariantProps = Omit<ProductVariantProps, 'productId' | 'id'>;

export class ProductVaraintList {
  constructor(
    private _variants = new Map<ProductVariantId, ProductVariant>(),
  ) {}
  static restore(variants: ProductVariantProps[]): ProductVaraintList {
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
  toJSON(): ProductVariantProps[] {
    return this.variants.map((v) => v.toJSON());
  }
}
class ProductVariant {
  private constructor(private data: ProductVariantProps) {
    if (data.price < 0) throw new Error('Price cannot be negative');
    if (data.quantity < 0) throw new Error('Quantity cannot be negative');
  }
  static create(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }
  static restore(props: ProductVariantProps): ProductVariant {
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
  toJSON(): ProductVariantProps {
    return { ...this.data };
  }
}
