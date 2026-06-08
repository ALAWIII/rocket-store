export type CategoryId = string;
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
