import {
  OrderId,
  ProductId,
  ReviewId,
  UserId,
} from 'src/modules/shared/domain/ids';

export type ReviewStatus = 'published' | 'hidden';

type ReviewProps = {
  id: ReviewId;
  userId: UserId;
  productId: ProductId;
  orderId: OrderId;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  editedAt: Date | null;
  createdAt: Date;
};

type CreateReviewProps = Omit<ReviewProps, 'status' | 'editedAt' | 'createdAt'>;
type EditReviewProps = {
  title?: string | null;
  body?: string;
  rating?: number;
};
export class Review {
  private constructor(private props: ReviewProps) {}

  static create(props: CreateReviewProps): Review {
    const now = new Date();

    const normalizedTitle = this.normalizeTitle(props.title);
    const normalizedBody = this.normalizeBody(props.body);

    this.validateRating(props.rating);

    this.validateBody(normalizedBody);

    return new Review({
      id: props.id,
      userId: props.userId,
      productId: props.productId,
      orderId: props.orderId,
      rating: props.rating,
      title: normalizedTitle,
      body: normalizedBody,
      status: 'published',
      editedAt: null,
      createdAt: now,
    });
  }

  static restore(props: ReviewProps): Review {
    const normalizedTitle = this.normalizeTitle(props.title);
    const normalizedBody = this.normalizeBody(props.body);

    this.validateRating(props.rating);
    this.validateBody(normalizedBody);

    return new Review({
      ...props,
      title: normalizedTitle,
      body: normalizedBody,
    });
  }
  get id(): ReviewId {
    return this.props.id;
  }
  get userId(): UserId {
    return this.props.userId;
  }
  get productId(): ProductId {
    return this.props.productId;
  }
  get orderId(): OrderId | null {
    return this.props.orderId;
  }
  get rating(): number {
    return this.props.rating;
  }
  get title(): string | null {
    return this.props.title;
  }
  get body(): string {
    return this.props.body;
  }
  get status(): ReviewStatus {
    return this.props.status;
  }
  get editedAt(): Date | null {
    return this.props.editedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Behavior
  edit(data: EditReviewProps): void {
    if (
      data.title === undefined &&
      data.body === undefined &&
      data.rating === undefined
    ) {
      return;
    }

    let changed = false;

    if (data.title !== undefined) {
      const normalizedTitle = Review.normalizeTitle(data.title);

      if (this.props.title !== normalizedTitle) {
        this.props.title = normalizedTitle;
        changed = true;
      }
    }

    if (data.body !== undefined) {
      const normalizedBody = Review.normalizeBody(data.body);
      Review.validateBody(normalizedBody);

      if (this.props.body !== normalizedBody) {
        this.props.body = normalizedBody;
        changed = true;
      }
    }

    if (data.rating !== undefined) {
      Review.validateRating(data.rating);

      if (this.props.rating !== data.rating) {
        this.props.rating = data.rating;
        changed = true;
      }
    }

    if (!changed) {
      return;
    }

    const now = new Date();
    this.props.editedAt = now;
  }

  hide(): void {
    if (this.props.status === 'hidden') return;
    this.props.status = 'hidden';
  }

  publish(): void {
    if (this.props.status === 'published') return;
    this.props.status = 'published';
  }

  isHidden(): boolean {
    return this.props.status === 'hidden';
  }
  isPublished(): boolean {
    return this.props.status === 'published';
  }
  isEdited(): boolean {
    return this.props.editedAt !== null;
  }
  private static validateRating(rating: number): void {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5.');
    }
  }

  private static validateBody(body: string): void {
    if (body.length < 20 || body.length > 1500) {
      throw new Error('Body must be between 20 and 1500 characters.');
    }
  }

  private static normalizeTitle(title: string | null): string | null {
    if (title === null) return null;

    const normalized = title.trim();
    return normalized.length === 0 ? null : normalized;
  }

  private static normalizeBody(body: string): string {
    const normalized = body.trim();

    if (normalized.length === 0) {
      throw new Error('Body cannot be empty.');
    }

    return normalized;
  }
  toJSON(): ReviewProps {
    return { ...this.props };
  }
}
