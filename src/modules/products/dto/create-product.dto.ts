import { IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(1, 200)
  title!: string;
  @IsString()
  @MaxLength(10000)
  description!: string;
  @IsOptional()
  @IsUUID()
  brandId: string | null = null;
  @IsOptional()
  @IsUUID()
  pageId: string | null = null;
}
