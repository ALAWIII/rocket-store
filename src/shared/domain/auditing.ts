import { UserId } from './ids';

export type AuditFields = {
  createdAt: Date;
  createdBy: UserId;
  updatedAt: Date;
  updatedBy: UserId;
  deletedAt?: Date;
  deletedBy?: UserId;
};

export abstract class AuditableEntity {
  constructor(protected audit: AuditFields) {}

  get createdAt(): Date {
    return this.audit.createdAt;
  }
  get createdBy(): UserId {
    return this.audit.createdBy;
  }
  get updatedAt(): Date {
    return this.audit.updatedAt;
  }
  get updatedBy(): UserId | undefined {
    return this.audit.updatedBy;
  }
  get deletedAt(): Date | undefined {
    return this.audit.deletedAt;
  }
  get deletedBy(): UserId | undefined {
    return this.audit.deletedBy;
  }

  protected touch(updatedBy: UserId): void {
    this.audit.updatedAt = new Date();
    this.audit.updatedBy = updatedBy;
  }

  protected markDeleted(deletedBy: UserId): void {
    const now = new Date();
    this.audit.deletedAt = now;
    this.audit.deletedBy = deletedBy;
    this.audit.updatedAt = now;
    this.audit.updatedBy = deletedBy;
  }
}
