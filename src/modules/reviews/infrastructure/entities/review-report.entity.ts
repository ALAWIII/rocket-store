import { UuidV7PrimaryColumn } from 'src/modules/shared/database/decorators/uuidv7-primary-column.decorator';
import { Column, CreateDateColumn, Entity, ForeignKey, Index } from 'typeorm';
import { ReviewEntity } from './review.entity';
import { UserEntity } from 'src/modules/users/infrastructure/entities/user.entity';
import {
  ReviewReportReason,
  ReviewReportStatus,
} from '../../domain/review-report';

@Entity('review_reports')
@Index(['reviewId', 'userId'], { unique: true })
export class ReviewReportEntity {
  @UuidV7PrimaryColumn()
  id!: string;
  @Column('uuid')
  @ForeignKey(() => ReviewEntity, (r) => r.id)
  reviewId!: string;
  @Column('uuid')
  @ForeignKey(() => UserEntity, (u) => u.id)
  userId!: string;
  @Column('varchar', { length: 15 })
  reason!: ReviewReportReason;
  @Column('varchar', { length: 255, nullable: true })
  details!: string | null;
  @Column('varchar', { length: 15 })
  status!: ReviewReportStatus;
  @CreateDateColumn({ name: 'reported_at' })
  reportedAt!: Date;
}
