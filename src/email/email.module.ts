import { Module } from '@nestjs/common';
import { ResendAuthEmailService } from './auth-email.resend.service';
import { IAuthEmailService } from './auth-email.service';

@Module({
  providers: [{ provide: IAuthEmailService, useClass: ResendAuthEmailService }],
  exports: [IAuthEmailService],
})
export class EmailModule {}
