import { Module } from '@nestjs/common';
import { ResendAuthEmailService } from './resend-auth-email.service';
import { IAuthEmailService } from './auth-email.service';

@Module({
  providers: [{ provide: IAuthEmailService, useClass: ResendAuthEmailService }],
  exports: [IAuthEmailService],
})
export class EmailModule {}
