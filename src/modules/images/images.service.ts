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
import { RemoveImagesResponseDto } from './dto/remove-images-response.dto';

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
  upload(
    file: Express.Multer.File,
    uploadedBy: string,
    metadata: { name: string; altText?: string },
  ): AsyncResult<Image, ImageServiceError> {
    const sourceStream = Readable.from(file.buffer);
    const [probeWeb, uploadWeb] = Readable.toWeb(sourceStream).tee();
    const probeStream = Readable.fromWeb(probeWeb);
    const uploadStream = Readable.fromWeb(uploadWeb);
    const imgId = ImageId.create().unwrap().toJSON();
    let uploaded = false;
    //===
    const upRes = Result.wrapAsync<Image, ImageServiceError>(async () => {
      const imgInfo = await this.extractMetadataFromBytes(probeStream).unwrap();
      //===
      const width = Dimension.create(imgInfo.width).unwrap().toJSON();
      const height = Dimension.create(imgInfo.height).unwrap().toJSON();
      const imgMime = ImageMimeType.create(imgInfo.mime).unwrap().toJSON();
      const name = Name.create(metadata.name).unwrap().toJSON();
      const altText = DomainText.create(metadata.altText, 125)
        .unwrap()
        ?.toJSON();
      //===

      const upResult = await this.storageService
        .uploadToStorage({
          stream: uploadStream,
          imageKey: imgId,
          contentType: imgMime,
        })
        .unwrap();
      uploaded = true;
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
      const imgDb = await this.imgRepo
        .save(image)
        .mapErr((e) => new ImagePersistenceDatabaseError(e.message, e))
        .unwrap();
      return imgDb;
    }).inspectErr(async () => {
      if (uploaded)
        await this.storageService
          .sendDeleteImgs([imgId])
          .inspectErr((e) => this.logger.error(e.message, e));

      sourceStream.destroy();
      probeStream.destroy();
      uploadStream.destroy();
    });
    return upRes;
  }
  findImageById(imgId: string): AsyncResult<Image, ImageServiceError> {
    return this.imgRepo
      .findById(imgId)
      .mapErr((e) =>
        e instanceof RecordNotFoundError
          ? new ImageNotFoundError(e.message, e)
          : new ImageServiceError(e.message, e),
      );
  }
  findUnusedImages(
    options: FindUnUsedOptions,
  ): AsyncResult<FindUnUsedDbResponse, ImageServiceError> {
    return this.imgRepo
      .findUnused({
        ...options,
        sortBy: sortByMap.get(options.sortBy ?? 'date')!,
      })
      .mapErr(mapToImagesServiceError);
  }
  removeImages(
    imgIds: string[],
  ): AsyncResult<RemoveImagesResponseDto, ImageServiceError> {
    return Result.wrapAsync(async () => {
      if (imgIds.length === 0) return { affected: 0 };
      await this.storageService.sendDeleteImgs(imgIds).unwrap();
      return this.imgRepo
        .deleteMany(imgIds)
        .map((v) => {
          return { affected: v };
        })
        .mapErr(mapToImagesServiceError)
        .unwrap();
    });
  }

  async removeUnusedImages(): Promise<
    Result<RemoveImagesResponseDto, ImageServiceError>
  > {
    let count = 0;

    while (true) {
      // fetch and delete by patches rather than infinite fetching.
      const imgsRes = await this.imgRepo
        .findUnused({ limit: 100 })
        .mapErr(mapToImagesServiceError);
      if (imgsRes.isErr()) return imgsRes.map();

      const imgIds = imgsRes.value.images.map((img) => img.key);
      if (!imgIds.length) return Ok({ affected: count });

      const s3Res = await this.storageService
        .sendDeleteImgs(imgIds)
        .mapErr(mapToImagesServiceError);

      if (s3Res.isErr()) {
        return s3Res.map();
      }

      const deleted = await this.imgRepo
        .deleteMany(imgIds)
        .mapErr(mapToImagesServiceError);

      if (deleted.isErr()) return deleted.map();
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
