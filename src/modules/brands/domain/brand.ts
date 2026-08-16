import { BrandId } from 'src/modules/shared/domain/ids';
import { Name } from 'src/modules/shared/value-objects/name';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { Ok, Result } from 'ts-results-es';

type BrandProps = {
  readonly id: BrandId;
  name: Name;
  createdAt: Date;
};
type BrandPrimitives = {
  readonly id: string;
  name: string;
  createdAt: Date;
};
export class Brand {
  private constructor(private props: BrandProps) {}

  static create(name: string): Result<Brand, ValueObjectError> {
    const bName = Name.create(name);
    if (bName.isErr()) {
      return bName;
    }
    return Ok(
      new Brand({
        id: BrandId.create(),
        name: bName.unwrap(),
        createdAt: new Date(),
      }),
    );
  }
  static restore(data: BrandPrimitives): Result<Brand, ValueObjectError> {
    const name = Name.create(data.name);
    if (name.isErr()) {
      return name;
    }
    const brand = {
      id: BrandId.create(data.id),
      name: name.unwrap(),
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
  toJSON(): BrandPrimitives {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
    };
  }
}
