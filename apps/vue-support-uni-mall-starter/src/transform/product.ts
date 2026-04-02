import type { ProductEntity } from "../entity/product";
import type { MallProduct } from "../data/catalog";

const DEFAULT_PALETTE: [string, string] = ["#c96c2d", "#d18d57"];

/** 后端 ProductEntity → 前端 MallProduct */
export const toMallProduct = (entity: ProductEntity): MallProduct => ({
  id: entity.id,
  title: entity.title,
  subtitle: entity.subtitle,
  description: entity.description,
  price: entity.price,
  marketPrice: entity.marketPrice,
  categoryId: entity.categoryId,
  tags: entity.tags,
  stock: entity.stock,
  featured: entity.featured ?? false,
  palette: entity.palette ?? DEFAULT_PALETTE,
  specs: entity.specs ?? [],
  highlights: entity.highlights,
});

export const toMallProductList = (entities: ProductEntity[]): MallProduct[] =>
  entities.map(toMallProduct);

/** 格式化价格（分 → 元，或直接元） */
export const formatPriceFromEntity = (
  value: number,
  unit: "fen" | "yuan" = "yuan",
): string => {
  const yuan = unit === "fen" ? value / 100 : value;
  return `¥${yuan.toFixed(2)}`;
};

/** 商品状态中文映射 */
export const productStatusLabel: Record<ProductEntity["status"], string> = {
  on_sale: "在售",
  off_sale: "下架",
  draft: "草稿",
};
