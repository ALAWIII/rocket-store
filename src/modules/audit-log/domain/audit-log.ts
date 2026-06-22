import { AuditLogId, UserId, UuidV7Id } from 'src/modules/shared/domain/ids';
import { ValueOf } from 'src/modules/shared/types/value-of';
export const AuditAction = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
} as const;
export type AuditAction = ValueOf<typeof AuditAction>;
type AuditLogProps = {
  readonly id: AuditLogId;
  readonly occurredAt: Date;
  readonly actorId?: UserId | null;
  readonly action: AuditAction;
  readonly entity: string;
  readonly entityId: UuidV7Id;
};
export class AuditLog {
  constructor(private readonly props: AuditLogProps) {}
  toJSON() {
    return { ...this.props };
  }
}
