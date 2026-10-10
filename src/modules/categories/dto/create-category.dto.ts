import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { CATEGORY_REGEX } from 'src/modules/shared/regex/category.regex';

export class CreateCategoryDto {
  @IsString()
  @Length(2, 50)
  @Matches(CATEGORY_REGEX, { message: 'Invalid category name' })
  name!: string;
  @IsOptional()
  @IsString()
  @Length(0, 125)
  description?: string;
}
