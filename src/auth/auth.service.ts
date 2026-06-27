import { Inject, Injectable } from '@nestjs/common';
import { AUTH, type AuthInstance } from './auth.provider';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import type { Request, Response } from 'express';
@Injectable()
export class AuthService {
  constructor(@Inject(AUTH) private readonly auth: AuthInstance) {}

  handler(req: Request, res: Response): Promise<void> {
    return toNodeHandler(this.auth)(req, res);
  }
  // for reading the currently signed-in user’s session. It tells you whether the request is authenticated and gives you the user/session data you need for protected routes.
  getSession(req: Request) {
    return this.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
  }
}
