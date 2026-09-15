import { BadRequestException } from '@nestjs/common';
import { ImageMimeType } from 'src/modules/shared/value-objects/image-mime-type';

export function fileFilter(
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const v = ImageMimeType.create(file.mimetype);
  if (v.isOk()) {
    callback(null, true);
  } else {
    callback(new BadRequestException('Only image files are allowed'), false);
  }
}
