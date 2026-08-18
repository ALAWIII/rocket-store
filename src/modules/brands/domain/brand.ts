import { BrandId } from 'src/modules/shared/value-objects/ids';
import { Name } from 'src/modules/shared/value-objects/name';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { Ok, Result } from 'ts-results-es';
import { BrandImage } from './brand-image';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';

type BrandProps = {
  readonly id: BrandId;
  name: Name;
  images?: BrandImage[];
  createdAt: Date;
};
type BrandPrimitives = {
  readonly id: string;
  name: string;
  images?: BrandImage[];
  createdAt: Date;
};
export class Brand {
  private constructor(private props: BrandProps) {}

  static create(data: {
    name: string;
    images?: BrandImage[];
  }): Result<Brand, ValueObjectError> {
    const resultData = unwrapResultObject({
      name: Name.create(data.name),
      id: BrandId.create(),
    });
    if (resultData.isErr()) {
      return resultData;
    }
    return Ok(
      new Brand({
        ...resultData.unwrap(),
        images: data.images?.sort((a, b) => a.sortOrder - b.sortOrder),
        createdAt: new Date(),
      }),
    );
  }
  static restore(data: BrandPrimitives): Result<Brand, ValueObjectError> {
    const resultData = unwrapResultObject({
      name: Name.create(data.name),
      id: BrandId.create(data.id),
    });
    if (resultData.isErr()) {
      return resultData;
    }
    const brand = {
      ...resultData.unwrap(),
      images: data.images?.sort((a, b) => a.sortOrder - b.sortOrder),
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
  get images() {
    return this.props.images?.map((i) => i.toJSON());
  }
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      images: this.images,
      createdAt: this.createdAt,
    };
  }
}
