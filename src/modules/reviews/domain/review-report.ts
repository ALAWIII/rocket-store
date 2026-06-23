import { ReviewId, UserId } from 'src/modules/shared/domain/ids';
import { ValueOf } from 'src/modules/shared/types/value-of';

export const ReviewReportReason = {
  SPAM: 'spam',
  ABUSE: 'abuse',
  OFF_TOPIC: 'off_topic',
  FAKE: 'fake',
  OTHER: 'other',
} as const;

export type ReviewReportReason = ValueOf<typeof ReviewReportReason>;

export const ReviewReportStatus = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
} as const;

export type ReviewReportStatus = ValueOf<typeof ReviewReportStatus>;

type ReviewReportProps = {
  reviewId: ReviewId;
  userId: UserId;
  reason: ReviewReportReason;
  details: string | null;
  status: ReviewReportStatus;
  createdAt: Date;
};

type CreateReviewReportProps = Omit<ReviewReportProps, 'status' | 'createdAt'>;

export class ReviewReport {
  private constructor(private props: ReviewReportProps) {}

  static create(props: CreateReviewReportProps): ReviewReport {
    const now = new Date();
    const details = this.normalizeDetails(props.details);

    return new ReviewReport({
      reviewId: props.reviewId,
      userId: props.userId,
      reason: props.reason,
      details,
      status: 'pending',
      createdAt: now,
    });
  }

  static restore(props: ReviewReportProps): ReviewReport {
    return new ReviewReport({
      ...props,
      details: this.normalizeDetails(props.details),
    });
  }

  get reviewId(): ReviewId {
    return this.props.reviewId;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get reason(): ReviewReportReason {
    return this.props.reason;
  }

  get details(): string | null {
    return this.props.details;
  }

  get status(): ReviewReportStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  resolve(): void {
    if (this.props.status === 'resolved') return;

    this.props.status = 'resolved';
  }

  reject(): void {
    if (this.props.status === 'rejected') return;

    this.props.status = 'rejected';
  }

  isPending(): boolean {
    return this.props.status === 'pending';
  }

  isResolved(): boolean {
    return this.props.status === 'resolved';
  }

  isRejected(): boolean {
    return this.props.status === 'rejected';
  }

  private static normalizeDetails(details?: string | null): string | null {
    if (details == null) return null;

    const normalized = details.trim();
    return normalized.length === 0 ? null : normalized;
  }
  toJSON(): ReviewReportProps {
    return { ...this.props };
  }
}
