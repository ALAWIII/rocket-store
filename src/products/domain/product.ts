import { v7 } from 'uuid';
import { BrandId } from './brand';
import { CategoryId } from './category';
import { ProductId, ProductVariantId } from 'src/shared/domain/ids';

// temporary will be replaced by layer specific DTO.
type ProductVariantData = {
  sku: string;
  price: number;
  quantity: number;
  info: Record<string, string>;
  description?: string;
};
type ProductData = {
  id: string;
  name: ProductName;
  detailsPage?: ProductDetails;
  categoryId: CategoryId;
  brandId?: BrandId;
};
export class ProductName {
  private constructor(private _name: string) {}
  static create(name: string): ProductName {
    const normalized = name.trim();
    if (normalized.length < 2 || normalized.length > 100)
      throw new Error(
        'Invalid product name length must be between 2 and 100 characters.',
      );
    return new ProductName(normalized);
  }
  get name(): string {
    return this._name;
  }
}
export class ProductDetails {
  private constructor(private _page: string) {}
  static create(page: string): ProductDetails {
    const normalized = page.trim();
    if (normalized.length < 2)
      throw new Error(
        'Invalid product name length must be between 2 and 100 characters.',
      );
    return new ProductDetails(normalized);
  }
  get page(): string {
    return this._page;
  }
}
export class Product {
  private variants = new ProductVaraintList();
  constructor(private productData: ProductData) {}

  get id(): ProductId {
    return this.productData.id;
  }
  createVariant(pvd: ProductVariantData) {
    const v = ProductVariant.create(pvd, this.productData.id);
    this.variants.add(v);
  }
  updateVariant(variantId: ProductVariantId, vi: ProductVariantData) {
    const v = this.variants.getById(variantId);
    v?.update(vi);
  }
  removeVariant(id: ProductVariantId) {
    this.variants.remove(id);
  }
  get name(): string {
    return this.productData.name.name;
  }

  get categoryId(): CategoryId {
    return this.productData.categoryId;
  }

  get brandId(): BrandId | undefined {
    return this.productData.brandId;
  }

  get detailsPage(): string | undefined {
    return this.productData.detailsPage?.page;
  }

  rename(name: ProductName): void {
    this.productData.name = name;
  }

  assignBrand(brandId: BrandId): void {
    this.productData.brandId = brandId;
  }

  removeBrand(): void {
    this.productData.brandId = undefined;
  }

  moveToCategory(categoryId: CategoryId): void {
    this.productData.categoryId = categoryId;
  }

  changeDetailsPage(detailsPage: ProductDetails): void {
    this.productData.detailsPage = detailsPage;
  }
}
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
  static create(v: ProductVariantData, productId: ProductId): ProductVariant {
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
  update(input: ProductVariantData) {
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
