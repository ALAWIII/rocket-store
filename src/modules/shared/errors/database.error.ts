export abstract class DatabaseError extends Error {
  abstract readonly code: string;
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
  }
}

export class UniqueViolationError extends DatabaseError {
  readonly code = 'UNIQUE_VIOLATION' as const;
}
export class ForeignKeyViolationError extends DatabaseError {
  readonly code = 'FK_VIOLATION' as const;
}
export class RecordNotFoundError extends DatabaseError {
  readonly code = 'NOT_FOUND' as const;
}
export class UnknownDatabaseError extends DatabaseError {
  readonly code = 'UNKNOWN' as const;
}
export class CorruptedPersistenceDataError extends DatabaseError {
  readonly code = 'CORRUPTED_DATA_ERROR' as const;
}
