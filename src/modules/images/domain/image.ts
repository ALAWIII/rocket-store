import { ImageId, UserId } from 'src/modules/shared/value-objects/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { DomainText } from 'src/modules/shared/value-objects/domain-text';
import { FileName } from 'src/modules/shared/value-objects/file-name';
import { FileSize } from 'src/modules/shared/value-objects/file-size';
import { Dimension } from 'src/modules/shared/value-objects/image-dimension';
import { ImageMimeType } from 'src/modules/shared/value-objects/image-mime-type';
import { Sha256Checksum } from 'src/modules/shared/value-objects/sha256-checksum';
import { Ok, Result } from '@allawiii/results-ts';
import { ImageError } from './image.error';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';
import { optional } from 'src/modules/shared/utils/optional.util';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';

type ImageProps = {
  id: ImageId;
  name: FileName;
  mimeType: ImageMimeType;
  sizeBytes: FileSize;
  checksum: Sha256Checksum;
  width: Dimension;
  height: Dimension;
  altText?: DomainText;
  uploadedBy?: UserId | null;
  createdAt: Date;
};
type ImagePrimitives = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  width: number;
  height: number;
  altText?: string | null;
  uploadedBy?: string | null;
  createdAt: Date;
};
type CreateImageProps = Omit<ImagePrimitives, 'createdAt' | 'id'>;
export class Image {
  private constructor(private readonly props: ImageProps) {}

  static create(data: CreateImageProps): Result<Image, ImageError> {
    const imageData = {
      id: ImageId.create().toString(),
      createdAt: new Date(),
      ...data,
    };
    return this.build(imageData);
  }

  static restore(data: ImagePrimitives): Result<Image, ImageError> {
    return this.build(data);
  }
  private static build(data: ImagePrimitives): Result<Image, ImageError> {
    const imageData = unwrapResultObject({
      id: ImageId.create(data.id),
      name: FileName.create(data.name),
      mimeType: ImageMimeType.create(data.mimeType),
      sizeBytes: FileSize.create(data.sizeBytes),
      checksum: Sha256Checksum.create(data.checksum),
      width: Dimension.create(data.width),
      height: Dimension.create(data.height),
      uploadedBy: optional(data.uploadedBy, (value) => UserId.create(value)),
      altText: optional(data.altText, (value) => DomainText.create(value, 125)),
    }).mapErr(
      (e: ValueObjectError) =>
        new ImageError(`Failed to construct image: ${e.message}`, e),
    );
    if (imageData.isErr()) {
      return imageData.map();
    }
    return Ok(
      new Image({
        createdAt: data.createdAt,
        ...imageData.unwrap(),
      }),
    );
  }
  get key(): string {
    return this.props.id.toString();
  }
  get uploadedBy(): string | undefined | null {
    return this.props.uploadedBy?.toString();
  }
  toJSON() {
    return serializeProps(this.props);
  }
}
