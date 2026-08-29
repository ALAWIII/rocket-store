import { Injectable } from '@nestjs/common';
import { IImageRepository } from './infrastructure/repositories/image.repository';

@Injectable()
export class ImagesService {
  constructor(private readonly imgRepo: IImageRepository) {}
}
