import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { CATEGORY_REGEX } from 'src/modules/shared/regex/category.regex';
import { AtLeastOneDefined } from 'src/modules/shared/validation/decorators/at-least-one-defined.decorator';

export class UpdateDetailsDto {
  @IsOptional()
  @IsString()
  @Length(0, 50)
  @Matches(CATEGORY_REGEX, { message: 'Invalid category name' })
  name?: string;
  @IsOptional()
  @IsString()
  @Length(0, 125)
  description?: string;

  @AtLeastOneDefined(['name', 'description'], {
    message: 'At least one field must be provided either name, description or both.',
  })
  private readonly __atLeastOneDefined?: never;
}
