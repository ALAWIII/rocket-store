export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  givenName!: string;
  familyName!: string;
  roleId!: string;
  image?: string;
  phone?: string;
  updatedAt!: Date;
  createdAt!: Date;
}
