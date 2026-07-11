export interface WithErrorContext {
  context: string[];
  withContext(ctx: string): this;
  withContextList(ctxs: string[]): this;
}
export interface LoggableError {
  toLog(): unknown;
}
