import { BrandId } from 'src/modules/shared/domain/ids';
import { Name } from 'src/modules/shared/value-objects/name';

type BrandProps = {
  readonly id: BrandId;
  name: Name;
  createdAt: Date;
};

export class Brand {
  private constructor(private props: BrandProps) {}

  static create(data: { id: BrandId; name: Name }): Brand {
    return new Brand({
      ...data,
      createdAt: new Date(),
    });
  }
  static restore(data: BrandProps): Brand {
    return new Brand(data);
  }

  get id(): BrandId {
    return this.props.id;
  }

  get name(): Name {
    return this.props.name;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  rename(name: Name): void {
    if (this.name.value === name.value) return;

    this.props.name = name;
  }
  toJSON() {
    return { ...this.props };
  }
}
