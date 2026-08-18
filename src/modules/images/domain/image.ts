import { ImageId, UserId } from 'src/modules/shared/domain/ids';
import { FileName } from 'src/modules/shared/value-objects/file-name';
import { ValueObjectError } from 'src/modules/shared/value-objects/value-object.error';
import { Ok, Result } from 'ts-results-es';

type ImageProps = {
  id: ImageId;
  name: FileName;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  width?: number;
  height?: number;
  altText?: string;
  uploadedBy: UserId;
  createdAt: Date;
};
type ImagePrimitives = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  width?: number;
  height?: number;
  altText?: string;
  uploadedBy: string;
  createdAt: Date;
};
type CreateImageProps = Omit<ImagePrimitives, 'createdAt' | 'id'>;
export class Image {
  private constructor(private readonly props: ImageProps) {}

  static create(data: CreateImageProps): Result<Image, ValueObjectError> {
    const fname = FileName.create(data.name);
    if (fname.isErr()) {
      return fname;
    }
    return Ok(
      new Image({
        ...data,
        id: ImageId.create(),
        name: fname.unwrap(),
        uploadedBy: UserId.create(data.uploadedBy),
        createdAt: new Date(),
      }),
    );
  }

  static restore(props: ImageProps): Image {
    return new Image(props);
  }

  toJSON(): ImageProps {
    return { ...this.props };
  }
}
