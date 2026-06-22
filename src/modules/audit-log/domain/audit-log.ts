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
  occurredAt: Date;
  actorId?: UserId | null;
  action: AuditAction;
  entity: string;
  entityId: UuidV7Id;
};
export class AuditLog {
  constructor(private props: AuditLogProps) {}
  toJSON() {
    return { ...this.props };
  }
}
