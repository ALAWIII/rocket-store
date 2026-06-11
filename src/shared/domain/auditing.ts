import { UserId } from './ids';

export type AuditFields = {
  createdAt: Date;
  createdBy: UserId;
  updatedAt: Date;
  updatedBy: UserId;
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
  get updatedBy(): UserId {
    return this.audit.updatedBy;
  }

  protected touch(updatedBy: UserId): void {
    this.audit.updatedAt = new Date();
    this.audit.updatedBy = updatedBy;
  }
}
