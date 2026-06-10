export type CategoryId = string;
type CreateCategoryProps = {
  id: CategoryId;
  name: string;
  parentCategoryId?: CategoryId;
};

type RestoreCategoryData = {
  id: CategoryId;
  name: string;
  parentCategoryId?: CategoryId;
  createdAt: Date;
  updatedAt: Date;
};
class Category {
  private constructor(
    private data: {
      id: CategoryId;
      name: string;
      parentCategoryId?: CategoryId;
    },
    readonly _createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(data: CreateCategoryProps): Category {
    const now = new Date();

    return new Category(
      {
        id: data.id,
        name: Category.validateName(data.name),
        parentCategoryId: data.parentCategoryId,
      },
      now,
      now,
    );
  }

  static restore(data: RestoreCategoryData): Category {
    return new Category(
      {
        id: data.id,
        name: Category.validateName(data.name),
        parentCategoryId: data.parentCategoryId,
      },
      data.createdAt,
      data.updatedAt,
    );
  }
  private static validateName(name: string): string {
    const normalized = name.trim();
    if (normalized.length < 2) {
      throw new Error('Category name must be at least 2 characters.');
    }
    if (normalized.length > 20) {
      throw new Error('Category name must not exceed 20 characters.');
    }
    return normalized;
  }
  get id(): CategoryId {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get parentCategoryId(): CategoryId | undefined {
    return this.data.parentCategoryId;
  }

  rename(name: string): void {
    this.data.name = Category.validateName(name);
    this.updateDate();
  }

  assignParent(parentCategoryId: CategoryId): void {
    if (parentCategoryId === this.id) {
      throw new Error('Category cannot be parent of itself');
    }
    this.data.parentCategoryId = parentCategoryId;
    this.updateDate();
  }

  removeParent(): void {
    this.data.parentCategoryId = undefined;
    this.updateDate();
  }
  private updateDate() {
    this.updatedAt = new Date();
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get lastUpdated(): Date {
    return new Date(this.updatedAt);
  }

  toJSON() {
    return {
      ...this.data,
      createdAt: this.createdAt,
      lastUpdated: this.lastUpdated,
    };
  }
}
