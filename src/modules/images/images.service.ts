import { Injectable, Logger } from '@nestjs/common';
import {
  FindUnUsedDbResponse,
  IImageRepository,
  ImageSortByOptions,
} from './infrastructure/repositories/image.repository';
import { ImagesStorageService } from './images.storage.service';
import probe, { ProbeResult } from 'probe-image-size';
import { ImageId } from '../shared/value-objects/ids';
import { Dimension } from '../shared/value-objects/image-dimension';
import { ImageMimeType } from '../shared/value-objects/image-mime-type';
import { Image } from './domain/image';
import { Name } from '../shared/value-objects/name';
import { DomainText } from '../shared/value-objects/domain-text';
import { Readable } from 'node:stream';
import { AsyncResult, Ok, Result } from '@allawiii/results-ts';
import {
  CorruptedUploadedImageError,
  ImageNotFoundError,
  ImagePersistenceDatabaseError,
  ImageServiceError,
} from './images.service.error';
import { RecordNotFoundError } from '../shared/errors/database.error';

const mapToImagesServiceError = (e: Error) =>
  new ImageServiceError(e.message, e);

type FindUnUsedOptions = {
  limit?: number;
  page?: number;
  sortBy?: 'date' | 'size' | 'name';
};
const sortByMap = new Map<string, ImageSortByOptions>([
  ['date', 'createdAt'],
  ['size', 'sizeBytes'],
  ['name', 'name'],
]);
@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  constructor(
    private readonly imgRepo: IImageRepository,
    private readonly storageService: ImagesStorageService,
  ) {}
  async upload(
    file: Express.Multer.File,
    uploadedBy: string,
    metadata: { name: string; altText?: string },
  ): Promise<Result<Image, ImageServiceError>> {
    const sourceStream = file.stream;
    const [probeWeb, uploadWeb] = Readable.toWeb(sourceStream).tee();
    const probeStream = Readable.fromWeb(probeWeb);
    const uploadStream = Readable.fromWeb(uploadWeb);
    const imgId = ImageId.create().unwrap().toJSON();
    //===
    const upRes = await Result.wrapAsync<Image, ImageServiceError>(async () => {
      const imgInfo = (
        await this.extractMetadataFromBytes(probeStream)
      ).unwrap();
      //===
      const width = Dimension.create(imgInfo.width).unwrap().toJSON();
      const height = Dimension.create(imgInfo.height).unwrap().toJSON();
      const imgMime = ImageMimeType.create(imgInfo.mime).unwrap().toJSON();
      const name = Name.create(metadata.name).unwrap().toJSON();
      const altText = DomainText.create(metadata.altText, 125)
        .unwrap()
        ?.toJSON();
      //===

      const upResult = (
        await this.storageService.uploadToStorage({
          stream: uploadStream,
          imageKey: imgId,
          contentType: imgMime,
        })
      ).unwrap();
      //===
      const image = Image.restore({
        id: imgId,
        name,
        height,
        width,
        altText,
        mimeType: imgMime,
        checksum: upResult.checksum,
        sizeBytes: upResult.size,
        uploadedBy,
        createdAt: new Date(),
      })
        .mapErr((e) => new CorruptedUploadedImageError(e.message, e))
        .unwrap();
      const imgDb = (await this.imgRepo.save(image)).mapErr(
        (e) => new ImagePersistenceDatabaseError(e.message, e),
      );
      return imgDb.unwrap();
    }).inspectErr(async () => {
      await this.storageService
        .sendDeleteImgs([imgId])
        .inspectErr((e) => this.logger.error(e.message, e));
      sourceStream.destroy();
      probeStream.destroy();
      uploadStream.destroy();
    });
    return upRes;
  }
  async findImageById(
    imgId: string,
  ): Promise<Result<Image, ImageServiceError>> {
    return (await this.imgRepo.findById(imgId)).mapErr((e) =>
      e instanceof RecordNotFoundError
        ? new ImageNotFoundError(e.message, e)
        : new ImageServiceError(e.message, e),
    );
  }
  async findUnusedImages(
    options: FindUnUsedOptions,
  ): Promise<Result<FindUnUsedDbResponse, ImageServiceError>> {
    const imagesRes = await this.imgRepo.findUnUsed({
      ...options,
      sortBy: sortByMap.get(options.sortBy ?? 'date')!,
    });
    return imagesRes.mapErr(mapToImagesServiceError);
  }
  async removeImages(
    imgIds: string[],
  ): Promise<Result<number, ImageServiceError>> {
    const storageRes = await this.storageService
      .sendDeleteImgs(imgIds)
      .map((v) => v.unwrapOr([]).length)
      .mapErr((e) => new ImageServiceError(e.message, e));
    if (storageRes.isErr() || storageRes.isOkAnd((v) => v === 0))
      return storageRes;

    return (await this.imgRepo.deleteMany(imgIds)).mapErr(
      mapToImagesServiceError,
    );
  }

  async removeUnusedImages(): Promise<Result<number, ImageServiceError>> {
    let count = 0;

    while (true) {
      // fetch and delete by patches rather than infinite fetching.
      const imgsRes = (await this.imgRepo.findUnUsed({ limit: 100 })).mapErr(
        mapToImagesServiceError,
      );
      if (imgsRes.isErr()) return imgsRes.map();

      const imgIds = imgsRes.value.images.map((img) => img.key);
      if (!imgIds.length) return Ok(count);

      const s3Res = await this.storageService
        .sendDeleteImgs(imgIds)
        .map((v) => v.unwrapOr([]).length)
        .mapErr(mapToImagesServiceError);

      if (s3Res.isErr() || s3Res.value === 0) {
        return s3Res;
      }

      const deleted = (await this.imgRepo.deleteMany(imgIds)).mapErr(
        mapToImagesServiceError,
      );

      if (deleted.isErr()) return deleted;
      count += deleted.value;
    }
  }
  /**
   * it will destroy the stream automatically on success or failure.
   *
   * but as safety net, remember to handle destroing the stream on the caller.
   * @param stream
   * @returns `AsyncResult<ProbeResult, CorruptedUploadedImageError>`
   */
  private extractMetadataFromBytes(
    stream: Readable,
  ): AsyncResult<ProbeResult, CorruptedUploadedImageError> {
    return Result.wrapAsync((): Promise<ProbeResult> => probe(stream)).mapErr(
      (e) =>
        new CorruptedUploadedImageError('Corrupted image magic bytes.', {
          cause: e,
        }),
    );
  }
}
