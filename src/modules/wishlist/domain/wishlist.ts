import {
  ProductId,
  ProductVariantId,
  UserId,
  WishlistId,
  WishlistItemId,
} from 'src/modules/shared/domain/ids';
import { Name } from 'src/modules/shared/value-objects/name';

type WishlistProps = {
  id: WishlistId;
  userId: UserId;
  name: Name;
  createdAt: Date;
  updatedAt: Date;
};

export class Wishlist {
  private constructor(private props: WishlistProps) {}

  static create(params: {
    id: WishlistId;
    userId: UserId;
    name: Name;
  }): Wishlist {
    const now = new Date();

    return new Wishlist({
      id: params.id,
      userId: params.userId,
      name: params.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: WishlistProps): Wishlist {
    return new Wishlist(props);
  }

  get id(): WishlistId {
    return this.props.id;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name.value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(name: Name): void {
    this.props.name = name;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
  toJSON(): WishlistProps {
    return { ...this.props };
  }
}

type WishlistItemProps = {
  id: WishlistItemId;
  wishlistId: WishlistId;
  productId: ProductId;
  variantId?: ProductVariantId | null;
  addedAt: Date;
  note?: string | null;
};

export class WishlistItem {
  private constructor(private props: WishlistItemProps) {}

  static create(params: {
    id: WishlistItemId;
    wishlistId: WishlistId;
    productId: ProductId;
    variantId?: ProductVariantId | null;
    note?: string | null;
  }): WishlistItem {
    const note = params.note?.trim() ?? null;

    if (note && note.length > 500) {
      throw new Error('Wishlist item note is too long');
    }

    return new WishlistItem({
      id: params.id,
      wishlistId: params.wishlistId,
      productId: params.productId,
      variantId: params.variantId ?? null,
      addedAt: new Date(),
      note,
    });
  }

  static restore(props: WishlistItemProps): WishlistItem {
    return new WishlistItem(props);
  }

  get id(): WishlistItemId {
    return this.props.id;
  }

  get wishlistId(): WishlistId {
    return this.props.wishlistId;
  }

  get productId(): ProductId {
    return this.props.productId;
  }

  get variantId(): ProductVariantId | null | undefined {
    return this.props.variantId;
  }

  get addedAt(): Date {
    return this.props.addedAt;
  }

  get note(): string | null | undefined {
    return this.props.note;
  }

  changeNote(note?: string | null): void {
    const normalizedNote = note?.trim() ?? null;

    if (normalizedNote && normalizedNote.length > 500) {
      throw new Error('Wishlist item note is too long');
    }

    this.props.note = normalizedNote;
  }
  toJSON(): WishlistItemProps {
    return { ...this.props };
  }
}
