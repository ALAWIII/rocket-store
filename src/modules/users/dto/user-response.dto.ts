export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  givenName?: string | null;
  familyName?: string | null;
  roleId!: string;
  image?: string;
  phone?: string;
  updatedAt!: Date;
  createdAt!: Date;
}
