import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, Entity } from 'typeorm';

@Entity('review_votes')
export class ReviewVoteEntity {
  @UuidV7PrimaryColumn()
  reviewId!: string;
  @UuidV7PrimaryColumn()
  userId!: string;
  @Column('boolean')
  helpful!: boolean;
}
