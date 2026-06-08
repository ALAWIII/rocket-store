import { v7 } from 'uuid';
import { BrandId } from './brand';
import { CategoryId } from './category';
import { ProductId, ProductVariantId } from 'src/shared/domain/ids';

// temporary will be replaced by layer specific DTO.
interface ProductVariantData {
  sku: string;
  price: number;
  quantity: number;
  info: Record<string, string>;
  description?: string;
}
interface ProductData {
  id: ProductId;
  name: string;
  categoryId: CategoryId;
  detailsPage: string;
  brandId?: BrandId;
}

export class Product {
  private variants = new ProductVaraintList();
  constructor(private productData: ProductData) {
    if (!productData.name.trim()) throw new Error('Product name is required');
    if (!productData.detailsPage.trim())
      throw new Error('Details page is required');
  }

  getId(): ProductId {
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
  getName(): string {
    return this.productData.name;
  }

  getCategoryId(): CategoryId {
    return this.productData.categoryId;
  }

  getBrandId(): BrandId | undefined {
    return this.productData.brandId;
  }

  getDetailsPage(): string {
    return this.productData.detailsPage;
  }

  rename(name: string): void {
    if (!name.trim()) throw new Error('Product name is required');
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

  changeDetailsPage(detailsPage: string): void {
    if (!detailsPage.trim()) throw new Error('Details page is required');
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
