import { Injectable, Logger } from '@nestjs/common';
import { IUserRepository } from './infrastructure/repositories/user.repository';
import { FindUsersFlatQueryDto } from './dto/find-users-by-filter.dto';
import { ReassignUsersRoleDto } from './dto/reassign-users-role.dto';
import { UpdateMeDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { FindUsersResponseDto } from './dto/find-users-response.dto';
import { ImagesService } from '../images/images.service';
import { UserImage } from './domain/user-image';
import { ImageResponseDto } from '../shared/dto/image-response.dto';
import { RemoveImagesResponseDto } from '../images/dto/remove-images-response.dto';

type Filters = Omit<FindUsersFlatQueryDto, 'limit' | 'page'>;
type FindUsersByQueryDto = Pick<FindUsersFlatQueryDto, 'page' | 'limit'> & {
  filters?: Filters;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly imgService: ImagesService,
  ) {}

  findMe(id: string): Promise<UserResponseDto> {
    return this.userRepo
      .findMe(id)
      .map((v) => v.toJSON())
      .unwrap();
  }
  findBy(requesterRoleId: string, filters: FindUsersByQueryDto): Promise<FindUsersResponseDto> {
    return this.userRepo
      .findBy({
        ...filters,
        requesterRoleId,
      })
      .map(({ users, total }) => {
        return { users: users.map((u) => u.toJSON()), total };
      })
      .unwrap();
  }
  findById(requesterRoleId: string, userId: string): Promise<UserResponseDto> {
    return this.userRepo
      .findById({ requesterRoleId, userId })
      .map((v) => v.toJSON())
      .unwrap();
  }
  assignRoleToUser(requesterRoleId: string, targetUserId: string, targetRoleId: string): Promise<UserResponseDto> {
    return this.userRepo
      .assignUserRole({
        targetRoleId,
        requesterRoleId,
        targetUserId,
      })
      .map((u) => u.toJSON())
      .unwrap();
  }
  assignRoleToUsers(requesterRoleId: string, d: ReassignUsersRoleDto): Promise<number> {
    return this.userRepo
      .assignUsersRole({
        ...d,
        requesterRoleId,
      })
      .unwrap();
  }
  updateUser(id: string, d: UpdateMeDto): Promise<UserResponseDto> {
    return this.userRepo
      .updateById(id, d)
      .map((u) => u.toJSON())
      .unwrap();
  }
  async setProfileImage(
    file: Express.Multer.File,
    userId: string,
    metadata: { name: string; altText?: string },
  ): Promise<ImageResponseDto> {
    const image = await this.imgService
      .upload(file, userId, metadata)
      .map((mg) => mg.toJSON())
      .unwrap();

    const removeImageQuietly = (id: string) =>
      this.imgService.removeImages([id]).inspectErr((e) => this.logger.error(e.message, e));

    const userImg = UserImage.create({
      userId: userId,
      imageId: image.id,
    }).unwrap();

    const oldImageId = await this.userRepo
      .attachImage(userImg)
      .inspectErr(async () => {
        await removeImageQuietly(image.id);
      })
      .unwrap();

    if (oldImageId.isSome()) await removeImageQuietly(oldImageId.unwrap());

    return image;
  }
  removeProfileImage(userId: string): Promise<RemoveImagesResponseDto> {
    return this.userRepo
      .findUserImage(userId)
      .andThen((uimg) => this.imgService.removeImages([uimg.toJSON().imageId]))
      .unwrap();
  }
}
