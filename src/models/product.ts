export type BrandId = string;
export type CategoryId = string;
export type ProductId = string;
export type ProductVariantId = string;

class Brand {
  constructor(
    private readonly id: BrandId,
    private name: string,
  ) {
    if (!name.trim()) throw new Error('Brand name is required');
  }

  getId(): BrandId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  rename(name: string): void {
    if (!name.trim()) throw new Error('Brand name is required');
    this.name = name;
  }
}

class Category {
  private parentCategoryId?: CategoryId;

  constructor(
    private readonly id: CategoryId,
    private name: string,
  ) {
    if (!name.trim()) throw new Error('Category name is required');
  }

  getId(): CategoryId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getParentCategoryId(): CategoryId | undefined {
    return this.parentCategoryId;
  }

  rename(name: string): void {
    if (!name.trim()) throw new Error('Category name is required');
    this.name = name;
  }

  assignParent(parentCategoryId: CategoryId): void {
    if (parentCategoryId === this.id) {
      throw new Error('Category cannot be parent of itself');
    }
    this.parentCategoryId = parentCategoryId;
  }

  removeParent(): void {
    this.parentCategoryId = undefined;
  }
}

class Product {
  private brandId?: BrandId;

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
  private description?: string;
  private info: Record<string, string> = {};

  constructor(
    private readonly id: ProductVariantId,
    private readonly productId: ProductId,
    private readonly sku: string,
    private price: number,
    private quantity: number,
  ) {
    if (!sku.trim()) throw new Error('SKU is required');
    if (price < 0) throw new Error('Price cannot be negative');
    if (quantity < 0) throw new Error('Quantity cannot be negative');
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

  changePrice(price: number): void {
    if (price < 0) throw new Error('Price cannot be negative');
    this.price = price;
  }

  increaseStock(quantity: number): void {
    if (quantity < 1) throw new Error('Quantity must be positive');
    this.quantity += quantity;
  }

  decreaseStock(quantity: number): void {
    if (quantity < 1) throw new Error('Quantity must be positive');
    if (this.quantity - quantity < 0) {
      throw new Error('Insufficient stock');
    }
    this.quantity -= quantity;
  }

  setDescription(description: string): void {
    if (!description.trim()) throw new Error('Description cannot be empty');
    this.description = description;
  }

  clearDescription(): void {
    this.description = undefined;
  }

  setInfo(key: string, value: string): void {
    if (!key.trim()) throw new Error('Info key is required');
    if (!value.trim()) throw new Error('Info value is required');
    this.info[key] = value;
  }

  removeInfo(key: string): void {
    delete this.info[key];
  }
}
