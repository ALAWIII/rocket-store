import { ReviewId, UserId } from 'src/shared/domain/ids';

type ReviewVoteType = 'helpful' | 'not_helpful';

type ReviewVoteProps = {
  reviewId: ReviewId;
  userId: UserId;
  type: ReviewVoteType;
};

class ReviewVote {
  private constructor(private props: ReviewVoteProps) {}

  static create(props: ReviewVoteProps): ReviewVote {
    this.validateType(props.type);

    return new ReviewVote(props);
  }

  static restore(props: ReviewVoteProps): ReviewVote {
    this.validateType(props.type);

    return new ReviewVote(props);
  }

  get reviewId(): ReviewId {
    return this.props.reviewId;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get type(): ReviewVoteType {
    return this.props.type;
  }

  isHelpful(): boolean {
    return this.props.type === 'helpful';
  }

  isNotHelpful(): boolean {
    return this.props.type === 'not_helpful';
  }

  changeType(type: ReviewVoteType): void {
    ReviewVote.validateType(type);
    this.props.type = type;
  }

  private static validateType(type: ReviewVoteType): void {
    if (type !== 'helpful' && type !== 'not_helpful') {
      throw new Error('Invalid review vote type.');
    }
  }
  toJSON(): ReviewVoteProps {
    return { ...this.props };
  }
}
