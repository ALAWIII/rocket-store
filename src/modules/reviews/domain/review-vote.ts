import { ReviewId, UserId } from 'src/modules/shared/domain/ids';

type ReviewVoteProps = {
  reviewId: ReviewId;
  userId: UserId;
  helpful: boolean;
};

export class ReviewVote {
  constructor(private props: ReviewVoteProps) {}

  get reviewId(): ReviewId {
    return this.props.reviewId;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  isHelpful(): boolean {
    return this.props.helpful;
  }

  markHelpful(): void {
    this.props.helpful = true;
  }

  markNotHelpful(): void {
    this.props.helpful = false;
  }

  toJSON(): ReviewVoteProps {
    return { ...this.props };
  }
}
