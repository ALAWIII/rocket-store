import { Module } from '@nestjs/common';
import { IEnforcerHolder } from './infrastructure/casbin/enforcer-holder';
import { EnforcerHolder } from './infrastructure/casbin/enforcer-holder.service';
import { createCasbinEnforcer } from './infrastructure/casbin/casbin.factory';

@Module({
  providers: [
    {
      provide: IEnforcerHolder,
      useFactory: async (): Promise<IEnforcerHolder> => {
        const holder = new EnforcerHolder();
        holder.set(await createCasbinEnforcer());
        return holder;
      },
    },
  ],
  exports: [IEnforcerHolder],
})
export class EnforcerHolderModule {}
