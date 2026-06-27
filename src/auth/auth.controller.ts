import { All, Controller, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@AllowAnonymous()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('*')
  handler(@Req() req: Request, @Res() res: Response) {
    return this.authService.handler(req, res);
  }
}
