import { ImageId, UserId } from 'src/modules/shared/domain/ids';
import { unwrapResultObject } from 'src/modules/shared/errors/result/unwrap-result-object';
import { DomainText } from 'src/modules/shared/value-objects/domain-text';
import { FileName } from 'src/modules/shared/value-objects/file-name';
import { FileSize } from 'src/modules/shared/value-objects/file-size';
import { Dimension } from 'src/modules/shared/value-objects/image-dimension';
import { ImageMimeType } from 'src/modules/shared/value-objects/image-mime-type';
import { Sha256Checksum } from 'src/modules/shared/value-objects/sha256-checksum';
import { Err, Ok, Result } from 'ts-results-es';
import { ImageError } from './image.error';
import { serializeProps } from 'src/modules/shared/utils/serialize-props.util';

type ImageProps = {
  id: ImageId;
  name: FileName;
  mimeType: ImageMimeType;
  sizeBytes: FileSize;
  checksum: Sha256Checksum;
  width: Dimension;
  height: Dimension;
  altText?: DomainText;
  uploadedBy: UserId;
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
  altText?: string;
  uploadedBy: string;
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
      name: FileName.create(data.name),
      mimeType: ImageMimeType.create(data.mimeType),
      sizeBytes: FileSize.create(data.sizeBytes),
      checksum: Sha256Checksum.create(data.checksum),
      width: Dimension.create(data.width),
      height: Dimension.create(data.height),
      altText: data.altText ? DomainText.create(data.altText) : Ok(undefined),
    });
    if (imageData.isErr()) {
      return Err(
        new ImageError(
          `Failed to construct image: ${imageData.error.message}`,
          imageData.error,
        ),
      );
    }
    return Ok(
      new Image({
        id: ImageId.create(data.id),
        uploadedBy: UserId.create(data.uploadedBy),
        createdAt: data.createdAt,
        ...imageData.unwrap(),
      }),
    );
  }
  toJSON() {
    return serializeProps(this.props);
  }
}
