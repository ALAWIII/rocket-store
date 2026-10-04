import { Ok, Result } from '@allawiii/results-ts';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { ImageId, UserId, UserImageId } from 'src/modules/shared/value-objects/ids';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

type UserImageProps = {
  id: UserImageId;
  userId: UserId;
  imageId: ImageId;
  createdAt: Date;
};
type UserImagePrimitives = {
  id: string;
  userId: string;
  imageId: string;
  createdAt: Date;
};
type CreateUserImageProps = Omit<UserImagePrimitives, 'id' | 'createdAt'>;
export class UserImage {
  private constructor(private readonly props: UserImageProps) {}
  static create(props: CreateUserImageProps): Result<UserImage, ValueObjectError> {
    return this.build({
      ...props,
      id: UserImageId.create().unwrap().toString(),
      createdAt: new Date(),
    });
  }
  static restore(props: UserImagePrimitives): Result<UserImage, ValueObjectError> {
    return this.build(props);
  }
  private static build(props: UserImagePrimitives): Result<UserImage, ValueObjectError> {
    const parsed = unwrapResultObject({
      id: UserImageId.create(props.id),
      userId: UserId.create(props.userId),
      imageId: ImageId.create(props.imageId),
      createdAt: Ok(props.createdAt),
    });
    if (parsed.isErr()) return parsed.map();

    return Ok(new UserImage(parsed.unwrap()));
  }
  toJSON() {
    return serializeProps(this.props);
  }
}
