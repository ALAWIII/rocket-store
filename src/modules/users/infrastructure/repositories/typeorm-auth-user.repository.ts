import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as AuthUserEntity } from 'typeorm/entities/User';
import { IAuthUserRepository } from './auth-user.repository';

@Injectable()
export class AuthUserRepository implements IAuthUserRepository {
  constructor(
    @InjectRepository(AuthUserEntity)
    private readonly authUserRepo: Repository<AuthUserEntity>,
  ) {}
  async findById(uid: string): Promise<AuthUserEntity | null> {
    return this.authUserRepo.findOneBy({
      id: uid,
    });
  }
  // false to signal that no fields where updated!
  async updateName(data: { uid: string; name: string }): Promise<boolean> {
    const result = await this.authUserRepo.update(
      { id: data.uid },
      { name: data.name },
    );

    return (result.affected ?? 0) > 0;
  }
}
