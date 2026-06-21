import { ImageId } from 'src/shared/domain/ids';
import { Name } from 'src/shared/value-objects/name';

type StorageKey = ImageId;

type CreateImageProps = {
  id: ImageId;
  storageKey: StorageKey;
  name: Name;
  url?: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  altText?: string;
  metadata?: Record<string, unknown>;
};
type ImageProps = {
  createdAt: Date;
} & CreateImageProps;
export class Image {
  private constructor(private readonly props: ImageProps) {}

  static create(props: CreateImageProps): Image {
    if (props.sizeBytes < 0) {
      throw new Error('sizeBytes cannot be negative');
    }

    if (props.width !== undefined && props.width <= 0) {
      throw new Error('width must be greater than 0');
    }

    if (props.height !== undefined && props.height <= 0) {
      throw new Error('height must be greater than 0');
    }

    return new Image({
      id: props.id,
      storageKey: props.storageKey,
      name: props.name,
      url: props.url,
      mimeType: props.mimeType,
      sizeBytes: props.sizeBytes,
      width: props.width,
      height: props.height,
      altText: props.altText,
      metadata: props.metadata,
      createdAt: new Date(),
    });
  }

  static restore(props: ImageProps): Image {
    return new Image(props);
  }

  get id(): ImageId {
    return this.props.id;
  }

  get storageKey(): StorageKey {
    return this.props.storageKey;
  }

  get name(): Name {
    return this.props.name;
  }

  get url(): string | undefined {
    return this.props.url;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  get width(): number | undefined {
    return this.props.width;
  }

  get height(): number | undefined {
    return this.props.height;
  }

  get altText(): string | undefined {
    return this.props.altText;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  rename(name: Name): void {
    this.props.name = name;
  }

  changeAltText(altText?: string): void {
    this.props.altText = altText;
  }

  changeUrl(url?: string): void {
    this.props.url = url;
  }

  replaceMetadata(metadata?: Record<string, unknown>): void {
    this.props.metadata = metadata;
  }
  toJSON(): ImageProps {
    return { ...this.props };
  }
}
