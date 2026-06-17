import { ShippingProviderId } from 'src/shared/domain/ids';

type ShippingProviderProps = {
  id: ShippingProviderId;
  slug: string;
  displayName: string;
  isActive: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

type CreateShippingProviderProps = {
  slug: string;
  displayName: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
};

export class ShippingProvider {
  private constructor(private readonly props: ShippingProviderProps) {}

  static create(data: CreateShippingProviderProps): ShippingProvider {
    const now = new Date();

    const slug = this.normalizeSlug(data.slug);
    const displayName = this.normalizeDisplayName(data.displayName);
    const config = data.config ?? {};

    this.validateSlug(slug);
    this.validateDisplayName(displayName);
    this.validateConfig(config);

    return new ShippingProvider({
      id: ShippingProviderId.create(),
      slug,
      displayName,
      isActive: data.isActive ?? true,
      config: { ...config },
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: ShippingProviderProps): ShippingProvider {
    this.validateSlug(props.slug);
    this.validateDisplayName(props.displayName);
    this.validateConfig(props.config);

    return new ShippingProvider({
      ...props,
      config: { ...props.config },
    });
  }

  activate(): void {
    if (this.props.isActive) return;

    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    if (!this.props.isActive) return;

    this.props.isActive = false;
    this.touch();
  }

  rename(displayName: string): void {
    const normalized = ShippingProvider.normalizeDisplayName(displayName);
    ShippingProvider.validateDisplayName(normalized);

    this.props.displayName = normalized;
    this.touch();
  }

  changeSlug(slug: string): void {
    const normalized = ShippingProvider.normalizeSlug(slug);
    ShippingProvider.validateSlug(normalized);

    this.props.slug = normalized;
    this.touch();
  }

  replaceConfig(config: Record<string, unknown>): void {
    ShippingProvider.validateConfig(config);

    this.props.config = { ...config };
    this.touch();
  }

  mergeConfig(partial: Record<string, unknown>): void {
    ShippingProvider.validateConfig(partial);

    this.props.config = {
      ...this.props.config,
      ...partial,
    };
    this.touch();
  }

  hasSlug(slug: string): boolean {
    return this.props.slug === ShippingProvider.normalizeSlug(slug);
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  toJSON(): ShippingProviderProps {
    return {
      ...this.props,
      config: { ...this.props.config },
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static normalizeSlug(value: string): string {
    return value.trim().toLowerCase();
  }

  private static normalizeDisplayName(value: string): string {
    return value.trim();
  }

  private static validateSlug(value: string): void {
    if (!value) throw new Error('slug is required');

    if (value.length < 2 || value.length > 50) {
      throw new Error('slug length must be between 2 and 50 characters');
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      throw new Error(
        'slug must contain only lowercase letters, numbers, and hyphens',
      );
    }
  }

  private static validateDisplayName(value: string): void {
    if (!value) throw new Error('displayName is required');

    if (value.length < 2 || value.length > 100) {
      throw new Error(
        'displayName length must be between 2 and 100 characters',
      );
    }
  }

  private static validateConfig(value: Record<string, unknown>): void {
    if (value == null || Array.isArray(value) || typeof value !== 'object') {
      throw new Error('config must be a plain object');
    }
  }
}
