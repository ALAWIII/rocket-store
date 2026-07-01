import { ValueOf } from 'src/modules/shared/types/value-of';

export const Entity = {
  PRODUCT: 'prdouct',
  CART: 'cart',
  ORDER: 'order',
  USER: 'user',
} as const;
export type Entity = ValueOf<typeof Entity>;

export const Action = {
  CREATE: 'create',
  VIEW: 'view',
  LISTALL: 'listall',
} as const;
export type Action = ValueOf<typeof Action>;

export const Scope = {
  OWN: 'own',
  OTHERS: 'others',
  ALL: 'all',
} as const;
export type Scope = ValueOf<typeof Scope>;

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
    return Object.values(Entity).includes(entity as Entity);
  }

  private static validateAction(action: string): action is Action {
    return Object.values(Action).includes(action as Action);
  }

  private static validateScope(scope: string): scope is Scope {
    return Object.values(Scope).includes(scope as Scope);
  }
  equals(other: Permission): boolean {
    return (
      this.props.entity === other.props.entity &&
      this.props.action === other.props.action &&
      this.props.scope === other.props.scope
    );
  }
  toString(): string {
    return `${this.props.entity}.${this.props.action}.${this.props.scope}`;
  }
  toJSON(): PermissionProps {
    return this.props;
  }
}
