import { ImageAttachmentEntityType } from './image-attachment-type';
import { ImageAttachmentRole } from './image-attachment-role';
import {
  ImageAttachmentId,
  ImageId,
  UuidV7Id,
} from 'src/modules/shared/domain/ids';

type ImageAttachmentProps = {
  id: ImageAttachmentId;
  imageId: ImageId;
  entityType: ImageAttachmentEntityType;
  entityId: UuidV7Id;
  role: ImageAttachmentRole;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
};

type CreateImageAttachmentProps = {
  id: ImageAttachmentId;
  imageId: ImageId;
  entityType: ImageAttachmentEntityType;
  entityId: UuidV7Id;
  role: ImageAttachmentRole;
  sortOrder?: number;
  isPrimary?: boolean;
};

type RestoreImageAttachmentProps = ImageAttachmentProps;

export class ImageAttachment {
  private constructor(private readonly props: ImageAttachmentProps) {}

  static create(props: CreateImageAttachmentProps): ImageAttachment {
    if (props.sortOrder !== undefined && props.sortOrder < 0) {
      throw new Error('sortOrder cannot be negative');
    }

    return new ImageAttachment({
      id: props.id,
      imageId: props.imageId,
      entityType: props.entityType,
      entityId: props.entityId,
      role: props.role,
      sortOrder: props.sortOrder ?? 0,
      isPrimary: props.isPrimary ?? false,
      createdAt: new Date(),
    });
  }

  static restore(props: RestoreImageAttachmentProps): ImageAttachment {
    return new ImageAttachment(props);
  }

  makePrimary(): void {
    this.props.isPrimary = true;
  }

  unmarkPrimary(): void {
    this.props.isPrimary = false;
  }

  changeSortOrder(order: number): void {
    if (order < 0) {
      throw new Error('sortOrder cannot be negative');
    }

    this.props.sortOrder = order;
  }

  changeRole(role: ImageAttachmentRole): void {
    this.props.role = role;
  }

  get id(): ImageAttachmentId {
    return this.props.id;
  }

  get imageId(): ImageId {
    return this.props.imageId;
  }

  get entityType(): ImageAttachmentEntityType {
    return this.props.entityType;
  }

  get entityId(): UuidV7Id {
    return this.props.entityId;
  }

  get role(): ImageAttachmentRole {
    return this.props.role;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
  toJSON(): ImageAttachmentProps {
    return { ...this.props };
  }
}
