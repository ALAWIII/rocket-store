import { Result } from 'ts-results-es';
export type PermissionResult<T> = Result<T, PermissionError>;
export abstract class PermissionError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
  }
}

export class InvalidPermissionEntityError extends PermissionError {
  readonly code = 'INVALID_PERMISSION_ENTITY';

  constructor(entity: string) {
    super(`Unknown entity: ${entity}`);
  }
}
export class InvalidPermissionActionError extends PermissionError {
  readonly code = 'INVALID_PERMISSION_ACTION';

  constructor(action: string, entity: string) {
    super(`Unknown action "${action}" for entity "${entity}"`);
  }
}
export class InvalidPermissionScopeError extends PermissionError {
  readonly code = 'INVALID_PERMISSION_SCOPE';

  constructor(scope: string, entity: string) {
    super(`Unknown scope "${scope}" for entity "${entity}"`);
  }
}
export class InvalidPermissionFormatError extends PermissionError {
  readonly code = 'INVALID_PERMISSION_FORMAT';

  constructor(msg: string) {
    super(msg);
  }
}
