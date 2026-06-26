import { UserId, WishlistId } from 'src/modules/shared/domain/ids';
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
