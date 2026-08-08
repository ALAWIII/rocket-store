import { Expose } from 'class-transformer';

export class UserDatabaseDto {
  id!: string;
  name!: string;
  email!: string;
  @Expose({ name: 'role_id' })
  roleId!: string;
  emailVerified!: boolean;
  image!: string | null;
  phone!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  @Expose({ name: 'given_name' })
  givenName!: null | string;
  @Expose({ name: 'family_name' })
  familyName!: null | string;
}
