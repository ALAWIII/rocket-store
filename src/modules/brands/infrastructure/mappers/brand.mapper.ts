import { CorruptedPersistenceDataError } from 'src/modules/shared/errors/database.error';
import { Brand } from '../../domain/brand';
import { DBResult } from 'src/modules/shared/errors/error.types';
import { ImageEntity } from 'src/modules/images/infrastructure/entities/image.entity';
import { ImageMapper } from 'src/modules/images/infrastructure/mappers/images.mapper';
import { Image } from 'src/modules/images/domain/image';
import { BrandEntity } from '../entities/brand.entity';
import { Ok } from '@allawiii/results-ts';
export type BrandWithLogo = BrandEntity & {
  logo?: ImageEntity;
};
export class BrandMapper {
  static toDomain(brandDb: BrandWithLogo): DBResult<Brand> {
    const img = brandDb.logo ? ImageMapper.toDomain(brandDb.logo) : undefined;
    if (img?.isErr()) return img.map();
    return Brand.restore({ ...brandDb, logo: img?.unwrap() }).mapErr(
      (e) =>
        new CorruptedPersistenceDataError(
          `Failed to construct brand from BrandEntity: ${e.message}`,
          e,
        ),
    );
  }
  static toDomainList(brands: BrandEntity[]): DBResult<Brand[]> {
    const domainBrands: Brand[] = [];
    for (const b of brands) {
      const result = BrandMapper.toDomain(b);
      if (result.isErr()) return result.map();
      domainBrands.push(result.unwrap());
    }
    return Ok(domainBrands);
  }
  static toDomainBanners(imgs: ImageEntity[]): DBResult<Image[]> {
    return ImageMapper.toDomainList(imgs);
  }
}
