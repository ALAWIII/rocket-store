import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { fileNameRegex } from 'src/modules/shared/value-objects/file-name';

export class UploadFileInfoDto {
  @IsString()
  @Length(1, 50)
  @Matches(fileNameRegex, {
    message: 'only letters and numbers allowed in file name.',
  })
  name!: string;
  @IsOptional()
  @IsString()
  @Length(0, 125)
  altText?: string;
}
