import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { IImageRepository } from './infrastructure/repositories/image.repository';
import { ImagesStorageService } from './images.storage.service';
import probe, { ProbeResult } from 'probe-image-size';
import { ImageId } from '../shared/value-objects/ids';
import { Dimension } from '../shared/value-objects/image-dimension';
import { ImageMimeType } from '../shared/value-objects/image-mime-type';
import { Image } from './domain/image';
import { Name } from '../shared/value-objects/name';
import { DomainText } from '../shared/value-objects/domain-text';
import { Readable } from 'node:stream';
import { Err, Ok, Result } from '@allawiii/results-ts';
import { ImagesServiceError } from './images.service.error';
const mapToImagesServiceError = (e: Error) =>
  new ImagesServiceError(e.message, e);
@Injectable()
export class ImagesService {
  constructor(
    private readonly imgRepo: IImageRepository,
    private readonly storageService: ImagesStorageService,
  ) {}
  async upload(
    file: Express.Multer.File,
    uploadedBy: string,
    metadata: { name: string; altText?: string },
  ) {
    const sourceStream = file.stream;
    const [probeWeb, uploadWeb] = Readable.toWeb(sourceStream).tee();
    const probeStream = Readable.fromWeb(probeWeb);
    const uploadStream = Readable.fromWeb(uploadWeb);

    //===
    const destroyStreams = (v?: any) => {
      sourceStream.destroy();
      probeStream.destroy();
      uploadStream.destroy();
    };
    const meta = (await this.extractMetadataFromBytes(probeStream))
      .flatten()
      .inspectErr(destroyStreams)
      .unwrap();
    //===
    const imgId = ImageId.create().unwrap().toJSON();
    const width = Dimension.create(meta.width).unwrap().toJSON();
    const height = Dimension.create(meta.height).unwrap().toJSON();
    const imgMime = ImageMimeType.create(meta.mime).unwrap().toJSON();
    const name = Name.create(metadata.name).unwrap().toJSON();
    const altText = DomainText.create(metadata.altText, 125).unwrap()?.toJSON();
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
    }).unwrap();
    const imgDb = await this.imgRepo.save(image);
    if (imgDb.isErr()) {
      (await this.storageService.sendDeleteImgs([imgId])).unwrap();
    }
    return imgDb.unwrap().toJSON();
  }
  async removeImages(imgIds: string[]) {
    const storageRes = await this.storageService
      .sendDeleteImgs(imgIds)
      .map((v) => v.unwrapOr([]).length)
      .mapErr((e) => new ImagesServiceError(e.message, e));
    if (storageRes.isErr() || storageRes.isOkAnd((v) => v === 0))
      return storageRes;

    return (await this.imgRepo.deleteMany(imgIds)).mapErr(
      (e) => new ImagesServiceError(e.message, e),
    );
  }

  async removeUnUsedImages(): Promise<Result<number, ImagesServiceError>> {
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
  private extractMetadataFromBytes(stream: Readable) {
    return Result.wrapAsync(
      async (): Promise<Result<ProbeResult, UnprocessableEntityException>> => {
        try {
          const metaRes = await probe(stream, true); // dont allow implicit destroying because it may emit error which will crash the entire sibling stream
          if (!metaRes)
            return Err(new UnprocessableEntityException('Invalid image'));
          return Ok(metaRes);
        } finally {
          stream.destroy();
        }
      },
    ).mapErr(
      (e) =>
        new UnprocessableEntityException('Corrupted image magic bytes.', {
          cause: e,
        }),
    );
  }
}
