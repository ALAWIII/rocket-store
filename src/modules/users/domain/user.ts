import { RoleId, UserId } from 'src/modules/shared/value-objects/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { Email } from 'src/modules/shared/value-objects/email';
import { Name } from 'src/modules/shared/value-objects/name';
import { Phone } from 'src/modules/shared/value-objects/phone';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { Err, Ok, Result } from '@allawiii/results-ts';
import { optional } from 'src/modules/shared/utils/optional.util';
import { Image, ImagePrimitives } from 'src/modules/images/domain/image';
import {
  Serialized,
  serializeProps,
} from 'src/modules/shared/utils/serialize-props.util';

type UserProps = {
  readonly id: UserId;
  email: Email;
  name: Name;
  givenName?: Name | null;
  familyName?: Name | null;
  roleId: RoleId;
  image?: Image;
  phone?: Phone;
  updatedAt: Date;
  readonly createdAt: Date;
};
type UserPrimitives = {
  id: string;
  email: string;
  name: string;
  givenName?: string | null;
  familyName?: string | null;
  roleId: string;
  image?: Serialized<ImagePrimitives>;
  phone?: string;
  updatedAt: Date;
  createdAt: Date;
};

export class User {
  private constructor(private data: UserProps) {}
  static restore(props: UserProps) {
    return new User(props);
  }
  static fromPrimitives(data: UserPrimitives): Result<User, ValueObjectError> {
    const dataValidated = unwrapResultObject({
      id: UserId.create(data.id),
      roleId: RoleId.create(data.roleId),
      email: Email.create(data.email),
      name: Name.create(data.name),
      givenName: optional(data.givenName, (value) => Name.create(value)),
      familyName: optional(data.familyName, (value) => Name.create(value)),
      phone: optional(data.phone, (value) => Phone.create(value)),
      image: optional(data.image, (value) =>
        Image.restore({ ...value, createdAt: new Date(value.createdAt) }),
      ),
    });
    if (dataValidated.isErr()) return Err(dataValidated.error);

    return Ok(
      new User({
        ...dataValidated.value,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }),
    );
  }

  toJSON() {
    return serializeProps(this.data);
  }
}
