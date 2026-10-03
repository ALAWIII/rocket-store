import { ImageResponseDto } from 'src/modules/shared/dto/image-response.dto';

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  givenName?: string | null;
  familyName?: string | null;
  roleId!: string;
  image?: ImageResponseDto;
  phone?: string;
  updatedAt!: string;
  createdAt!: string;
}
