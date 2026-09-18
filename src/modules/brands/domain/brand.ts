import { BrandId } from 'src/modules/shared/value-objects/ids';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { Ok, Result } from '@allawiii/results-ts';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { Image } from 'src/modules/images/domain/image';
import { BrandName } from 'src/modules/shared/value-objects/brand-name';

type BrandProps = {
  readonly id: BrandId;
  name: BrandName;
  logo?: Image;
  createdAt: Date;
};
type BrandPrimitives = {
  readonly id: string;
  name: string;
  logo?: Image;
  createdAt: Date;
};
export class Brand {
  private constructor(private props: BrandProps) {}

  static create(data: {
    name: string;
    logo?: Image;
  }): Result<Brand, ValueObjectError> {
    const resultData = unwrapResultObject({
      name: BrandName.create(data.name),
      id: BrandId.create(),
    });
    if (resultData.isErr()) {
      return resultData.map();
    }
    return Ok(
      new Brand({
        ...resultData.unwrap(),
        logo: data.logo,
        createdAt: new Date(),
      }),
    );
  }
  static restore(data: BrandPrimitives): Result<Brand, ValueObjectError> {
    const resultData = unwrapResultObject({
      name: BrandName.create(data.name),
      id: BrandId.create(data.id),
    });
    if (resultData.isErr()) {
      return resultData.map();
    }
    const brand = {
      ...resultData.unwrap(),
      logo: data.logo,
      createdAt: data.createdAt,
    };
    return Ok(new Brand(brand));
  }

  get id(): string {
    return this.props.id.toString();
  }

  get name(): string {
    return this.props.name.value;
  }
  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      logo: this.props.logo?.toJSON(),
      createdAt: this.createdAt,
    };
  }
}
