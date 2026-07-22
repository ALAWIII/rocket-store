import { Err, Ok } from 'ts-results-es';
import {
  InvalidPermissionActionError,
  InvalidPermissionEntityError,
  InvalidPermissionFormatError,
  InvalidPermissionScopeError,
  PermissionResult,
} from './permission.error';
//======================= consider only update this matrix, and automatically it will generate for you the needed permission instances.
// an action shouldnt be empty or its useless.
// Own = can manage roles/resources that are of my creations.
// Any = can manage roles/resources that are within my effective permission set. (inheritance)
const Matrix = {
  role: {
    create: ['own', 'any'],
    read: ['own', 'any'],
    update: ['own', 'any'],
    delete: ['own', 'any'],
    assign: ['own', 'any'],
  },
  product: {
    create: ['own', 'any'],
    read: ['own', 'any'],
    update: ['own', 'any'],
    delete: ['own', 'any'],
  },
  order: {
    create: ['own', 'any'],
    read: ['own', 'any'],
    update: ['own', 'any'],
    delete: ['own', 'any'],
  },
  cart: {
    create: ['own', 'any'],
    read: ['own', 'any'],
    update: ['own', 'any'],
    delete: ['own', 'any'],
  },
  user: {
    create: ['own', 'any'],
    read: ['own', 'any'],
    update: ['own', 'any'],
    delete: ['own', 'any'],
  },
} as const;
//==================================

type StringKeyOf<T> = Extract<keyof T, string>;
type Matrix = typeof Matrix;

export type Entity = StringKeyOf<Matrix>;
export type Action<E extends Entity = Entity> = StringKeyOf<Matrix[E]>;

export type Visibility<
  E extends Entity = Entity,
  A extends Action<E> = Action<E>,
> = Extract<Matrix[E][A], readonly string[]>[number];

//=================================
type PermissionProps<
  E extends Entity = Entity,
  A extends Action<E> = Action<E>,
> = {
  entity: E;
  action: A;
  visibility: Visibility<E, A>;
};

export class Permission<
  E extends Entity = Entity,
  A extends Action<E> = Action<E>,
> {
  private constructor(private readonly props: PermissionProps<E, A>) {}

  static fromPrimitives(data: {
    entity: string;
    action: string;
    visibility: string;
  }): PermissionResult<Permission> {
    if (!isEntity(data.entity)) {
      return Err(new InvalidPermissionEntityError(data.entity));
    }

    if (!isActionForEntity(data.entity, data.action)) {
      return Err(new InvalidPermissionActionError(data.action, data.entity));
    }

    if (!isVisibilityForEntity(data.entity, data.action, data.visibility)) {
      return Err(new InvalidPermissionScopeError(data.visibility, data.entity));
    }
    return Ok(new Permission(data as PermissionProps));
  }
  static fromString(value: string): PermissionResult<Permission> {
    const parts = value.toLowerCase().split('.');
    if (parts.length !== 3) {
      return Err(
        new InvalidPermissionFormatError(
          `Inconsistent permission, length: ${parts.length}.`,
        ),
      );
    }
    const [entity, action, visibility] = parts;

    return this.fromPrimitives({ entity, action, visibility });
  }

  equals(other: Permission): boolean {
    return this.toString() === other.toString();
  }

  key(): string {
    return this.toString();
  }

  toString(): string {
    const { entity, action, visibility } = this.props;
    return `${entity}.${action}.${visibility}`;
  }

  toJSON(): Readonly<PermissionProps<E>> {
    return { ...this.props };
  }
}
//================== Permission class validators =========
function isEntity(value: string): value is Entity {
  return value in Matrix;
}

function isActionForEntity<E extends Entity>(
  entity: E,
  value: string,
): value is Action<E> {
  return value in Matrix[entity];
}

function isVisibilityForEntity<E extends Entity, A extends Action<E>>(
  entity: E,
  action: A,
  value: string,
): value is Visibility<E, A> {
  return (Matrix[entity][action] as readonly string[]).includes(value);
}
// =================================== summing up ============================
type CapitalizeWord<T extends string> = Capitalize<T>;

type PermissionKey<E extends Entity> = {
  [A in Action<E>]: `${CapitalizeWord<E>}${CapitalizeWord<A>}${CapitalizeWord<Visibility<E, A>>}`;
}[Action<E>];

type EntityPermissionMap<E extends Entity> = {
  [K in PermissionKey<E>]: Permission<E>;
};

type AllPermissionsMap = {
  [E in Entity]: EntityPermissionMap<E>;
};

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>;
}
function buildEntityPermissions<E extends Entity>(
  entity: E,
): EntityPermissionMap<E> {
  const actions = Object.keys(Matrix[entity]) as Action<E>[];

  return Object.fromEntries(
    actions.flatMap((action: Action<E>) => {
      const visibilities = Matrix[entity][action] as readonly Visibility<
        E,
        typeof action
      >[];

      return visibilities.map((visibility: Visibility<E, Action<E>>) => {
        const key =
          `${capitalize(entity)}${capitalize(action)}${capitalize(visibility)}` as const;

        return [
          key,
          Permission.fromPrimitives({
            entity,
            action,
            visibility,
          }).unwrap(),
        ] as const;
      });
    }),
  ) as unknown as EntityPermissionMap<E>;
}

export const AllPermissions: AllPermissionsMap = Object.fromEntries(
  (Object.keys(Matrix) as Entity[]).map((entity) => {
    return [entity, buildEntityPermissions(entity)] as const;
  }),
) as AllPermissionsMap;
