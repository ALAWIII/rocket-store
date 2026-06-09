import { UserId } from './ids';

export type AuditFields = {
  createdAt: Date;
  createdBy: UserId;
  updatedAt: Date;
  updatedBy: UserId;
  deletedAt?: Date;
  deletedBy?: UserId;
};

export abstract class AuditableEntity<T extends AuditFields> {
  constructor(protected data: T) {}

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get createdBy(): UserId {
    return this.data.createdBy;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get updatedBy(): UserId {
    return this.data.updatedBy;
  }

  get deletedAt(): Date | undefined {
    return this.data.deletedAt;
  }

  get deletedBy(): UserId | undefined {
    return this.data.deletedBy;
  }
  //-----

  protected touch(updatedBy: UserId): void {
    this.data.updatedAt = new Date();
    this.data.updatedBy = updatedBy;
  }

  protected markDeleted(deletedBy: UserId): void {
    this.data.deletedAt = new Date();
    this.data.deletedBy = deletedBy;
    this.data.updatedAt = this.data.deletedAt;
    this.data.updatedBy = deletedBy;
  }
}
