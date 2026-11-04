import { Brand } from 'src/modules/brands/domain/brand';
import { Product } from './product';
import { ProductVariant } from './product-variant';
import { Category } from 'src/modules/categories/domain/category';

type ProductDetailsProps = {
  product: Product;
  brand: Brand | null;
  variants: ProductVariant[];
  categories: Category[];
};

export class ProductDetails {
  constructor(private readonly props: ProductDetailsProps) {}
  toJSON() {
    const { product, brand, categories, variants } = this.props;

    return {
      product: product.toJSON(),
      brand: brand ? brand.toJSON() : null,
      variants: variants.map((pv) => pv.toJSON()),
      categories: categories.map((cat) => cat.toJSON()),
    };
  }
}
