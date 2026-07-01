type CapitalizeWord<T extends string> = Capitalize<T>;

const Entities = ['product', 'cart', 'order', 'user'] as const;
type Entity = (typeof Entities)[number];
type EntityKeys = CapitalizeWord<Entity>;
//===========================================
const Actions = ['create', 'view', 'list'] as const;
type Action = (typeof Actions)[number];
type ActionKeys = CapitalizeWord<Action>;

//========================================
const Scopes = ['own', 'others', 'all'] as const;
type Scope = (typeof Scopes)[number];
type ScopeKeys = CapitalizeWord<Scope>;

//===========================================
type PermissionProps = {
  entity: Entity;
  action: Action;
  scope: Scope;
};

export class Permission {
  constructor(private readonly props: PermissionProps) {}
  static fromString(perm: string) {
    const parts = perm.toLowerCase().split('.');
    if (parts.length !== 3) {
      throw new Error(`Inconsistent permission, length: ${parts.length}.`);
    }
    const [entity, action, scope] = parts;

    if (!this.validateEntity(entity)) {
      throw new Error(`Unknown entity: ${entity}`);
    }

    if (!this.validateAction(action)) {
      throw new Error(`Unknown action: ${action}`);
    }

    if (!this.validateScope(scope)) {
      throw new Error(`Unknown scope: ${scope}`);
    }

    return new Permission({ entity, action, scope });
  }
  private static validateEntity(entity: string): entity is Entity {
    return Entities.includes(entity as Entity);
  }

  private static validateAction(action: string): action is Action {
    return Actions.includes(action as Action);
  }

  private static validateScope(scope: string): scope is Scope {
    return Scopes.includes(scope as Scope);
  }
  equals(other: Permission): boolean {
    return (
      this.props.entity === other.props.entity &&
      this.props.action === other.props.action &&
      this.props.scope === other.props.scope
    );
  }
  key(): string {
    return this.toString();
  }
  toString(): string {
    return `${this.props.entity}.${this.props.action}.${this.props.scope}`;
  }
  toJSON(): PermissionProps {
    return { ...this.props };
  }
}

type PermissionKey = `${EntityKeys}${ActionKeys}${ScopeKeys}`;

type AllPermissionsMap = {
  [K in PermissionKey]: Permission;
};

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>;
}

export const AllPermissions = Object.fromEntries(
  Entities.flatMap((entity) =>
    Actions.flatMap((action) =>
      Scopes.map((scope) => {
        const key: PermissionKey = `${capitalize(entity)}${capitalize(action)}${capitalize(scope)}`;
        return [key, new Permission({ entity, action, scope })];
      }),
    ),
  ),
) as AllPermissionsMap;
