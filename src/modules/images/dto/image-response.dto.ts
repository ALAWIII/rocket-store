export class ImageResponseDto {
  id!: string;
  name!: string;
  mimeType!: string;
  sizeBytes!: number;
  checksum!: string;
  width!: number;
  height!: number;
  altText?: string | null;
  uploadedBy?: string | null;
  createdAt!: string;
}
