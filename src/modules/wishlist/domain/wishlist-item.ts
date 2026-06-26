import {
  ProductId,
  ProductVariantId,
  WishlistId,
  WishlistItemId,
} from 'src/modules/shared/domain/ids';

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
