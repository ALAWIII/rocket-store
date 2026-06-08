import { v7 } from 'uuid';
import { BrandId } from './brand';
import { CategoryId } from './category';
import { ProductId, ProductVariantId } from 'src/shared/domain/ids';

// temporary will be replaced by layer specific DTO.
type VariantInput = {
  sku: string;
  price: number;
  quantity: number;
  info: Record<string, string>;
  description?: string;
};

class ProductVaraintList {
  private variants = new Map<ProductVariantId, ProductVariant>();
  add(variant: ProductVariant): void {
    this.variants.set(variant.getId(), variant);
  }
  remove(variantId: ProductVariantId): ProductVariant | undefined {
    const v = this.getById(variantId);
    this.variants.delete(variantId);
    return v;
  }
  getById(variantId: ProductVariantId): ProductVariant | undefined {
    return this.variants.get(variantId);
  }
  getVariants(): ProductVariant[] {
    return [...this.variants.values()];
  }
}
export class Product {
  brandId?: BrandId;
  private variants = new ProductVaraintList();
  constructor(
    private readonly id: ProductId,
    private name: string,
    private categoryId: CategoryId,
    private detailsPage: string,
  ) {
    if (!name.trim()) throw new Error('Product name is required');
    if (!detailsPage.trim()) throw new Error('Details page is required');
  }
  getId(): ProductId {
    return this.id;
  }
  createVariant(vr: VariantInput) {
    const v = ProductVariant.create(vr, this.id);
    this.variants.add(v);
  }
  updateVariant(variantId: ProductVariantId, vi: VariantInput) {
    const v = this.variants.getById(variantId);
    v?.update(vi);
  }
  removeVariant(id: ProductVariantId) {
    this.variants.remove(id);
  }
  getName(): string {
    return this.name;
  }

  getCategoryId(): CategoryId {
    return this.categoryId;
  }

  getBrandId(): BrandId | undefined {
    return this.brandId;
  }

  getDetailsPage(): string {
    return this.detailsPage;
  }

  rename(name: string): void {
    if (!name.trim()) throw new Error('Product name is required');
    this.name = name;
  }

  assignBrand(brandId: BrandId): void {
    this.brandId = brandId;
  }

  removeBrand(): void {
    this.brandId = undefined;
  }

  moveToCategory(categoryId: CategoryId): void {
    this.categoryId = categoryId;
  }

  changeDetailsPage(detailsPage: string): void {
    if (!detailsPage.trim()) throw new Error('Details page is required');
    this.detailsPage = detailsPage;
  }
}

class ProductVariant {
  constructor(
    private readonly id: ProductVariantId,
    private readonly productId: ProductId,
    private sku: string,
    private price: number,
    private quantity: number,
    private description?: string,
    private info: Record<string, string> = {},
  ) {
    if (!sku.trim()) throw new Error('SKU is required');
    if (price < 0) throw new Error('Price cannot be negative');
    if (quantity < 0) throw new Error('Quantity cannot be negative');
  }
  static create(v: VariantInput, productId: ProductId): ProductVariant {
    return new ProductVariant(
      v7(),
      productId,
      v.sku,
      v.price,
      v.quantity,
      v.description,
      v.info,
    );
  }
  update(input: VariantInput) {
    this.description = input.description;
    this.info = input.info;
    this.price = input.price;
    this.quantity = input.quantity;
    this.sku = input.sku;
  }
  getId(): ProductVariantId {
    return this.id;
  }

  getProductId(): ProductId {
    return this.productId;
  }

  getSku(): string {
    return this.sku;
  }

  getPrice(): number {
    return this.price;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getInfo(): Record<string, string> {
    return { ...this.info };
  }
}
