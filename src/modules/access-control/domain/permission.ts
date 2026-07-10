//======================= consider only update this matrix, and automatically it will generate for you the needed permission instances.
const PermissionMatrix = {
  product: {
    actions: ['create', 'view', 'list', 'update', 'delete'],
    scopes: ['own', 'others', 'all'],
  },
  order: {
    actions: ['view', 'list', 'cancel', 'refund'],
    scopes: ['own', 'others', 'all'],
  },
  cart: {
    actions: ['view', 'update'],
    scopes: ['own'],
  },
  user: {
    actions: ['create', 'view', 'list', 'update', 'delete'],
    scopes: ['own', 'others', 'all'],
  },
} as const;
//==================================
type StringKeyOf<T> = Extract<keyof T, string>;
type CapitalizeWord<T extends string> = Capitalize<T>;

type PermissionMatrix = typeof PermissionMatrix;

export type Entity = StringKeyOf<PermissionMatrix>;

export type Action<E extends Entity = Entity> =
  PermissionMatrix[E]['actions'][number];

export type Scope<E extends Entity = Entity> =
  PermissionMatrix[E]['scopes'][number];

type PermissionProps<E extends Entity = Entity> = {
  entity: E;
  action: Action<E>;
  scope: Scope<E>;
};

export class Permission<E extends Entity = Entity> {
  private constructor(private readonly props: PermissionProps<E>) {}

  static create<E extends Entity>(
    entity: E,
    action: Action<E>,
    scope: Scope<E>,
  ): Permission<E> {
    return new Permission({ entity, action, scope });
  }
  static fromPrimitives(data: {
    entity: string;
    action: string;
    scope: string;
  }): Permission<Entity> {
    if (!isEntity(data.entity)) {
      throw new Error(`Unknown entity: ${data.entity}`);
    }

    if (!isActionForEntity(data.entity, data.action)) {
      throw new Error(
        `Unknown action "${data.entity}" for entity "${data.entity}"`,
      );
    }

    if (!isScopeForEntity(data.entity, data.scope)) {
      throw new Error(
        `Unknown scope "${data.scope}" for entity "${data.entity as string}"`,
      );
    }
    return Permission.create(data.entity, data.action, data.scope);
  }
  static fromString(value: string): Permission {
    const parts = value.toLowerCase().split('.');
    if (parts.length !== 3) {
      throw new Error(`Inconsistent permission, length: ${parts.length}.`);
    }
    const [entity, action, scope] = parts;

    return this.fromPrimitives({ entity, action, scope });
  }

  equals(other: Permission): boolean {
    return this.toString() === other.toString();
  }

  key(): string {
    return this.toString();
  }

  toString(): `${E}.${Action<E>}.${Scope<E>}` {
    const { entity, action, scope } = this.props;
    return `${entity}.${action}.${scope}`;
  }

  toJSON(): Readonly<PermissionProps<E>> {
    return { ...this.props };
  }
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>;
}

function isEntity(value: string): value is Entity {
  return value in PermissionMatrix;
}

function isActionForEntity<E extends Entity>(
  entity: E,
  value: string,
): value is Action<E> {
  return (PermissionMatrix[entity].actions as readonly string[]).includes(
    value,
  );
}

function isScopeForEntity<E extends Entity>(
  entity: E,
  value: string,
): value is Scope<E> {
  return (PermissionMatrix[entity].scopes as readonly string[]).includes(value);
}

type PermissionKey<E extends Entity> =
  `${CapitalizeWord<E>}${CapitalizeWord<Action<E>>}${CapitalizeWord<Scope<E>>}`;

type EntityPermissionMap<E extends Entity> = {
  [K in PermissionKey<E>]: Permission<E>;
};

type AllPermissionsMap = {
  [E in Entity]: EntityPermissionMap<E>;
};

function buildEntityPermissions<E extends Entity>(
  entity: E,
): EntityPermissionMap<E> {
  const { actions, scopes } = PermissionMatrix[entity];

  return Object.fromEntries(
    actions.flatMap((action: Action<E>) =>
      scopes.map((scope: Scope<E>) => {
        const key = `${capitalize(entity)}${capitalize(action)}${capitalize(scope)}`;

        return [key, Permission.create(entity, action, scope)] as const;
      }),
    ),
  ) as EntityPermissionMap<E>;
}

export const AllPermissions: AllPermissionsMap = Object.fromEntries(
  (Object.keys(PermissionMatrix) as Entity[]).map((entity) => {
    return [entity, buildEntityPermissions(entity)] as const;
  }),
) as AllPermissionsMap;
