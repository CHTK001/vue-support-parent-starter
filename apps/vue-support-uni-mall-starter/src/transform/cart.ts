import type { CartLineEntity, CartSummaryEntity } from "../entity/cart";
import type { MallProduct } from "../data/catalog";

export interface CartViewLine {
  itemId: string;
  productId: string;
  product: MallProduct;
  quantity: number;
  subtotal: number;
}

/** 后端 CartLineEntity → 前端 CartViewLine（需要 product 映射） */
export const toCartViewLine = (
  entity: CartLineEntity,
  product: MallProduct,
): CartViewLine => ({
  itemId: entity.item.id,
  productId: entity.item.productId,
  product,
  quantity: entity.item.quantity,
  subtotal: entity.subtotal,
});

export interface CartViewSummary {
  lines: CartViewLine[];
  count: number;
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
}

/** 后端 CartSummaryEntity → 前端购物车视图数据 */
export const toCartViewSummary = (
  entity: CartSummaryEntity,
  products: MallProduct[],
): CartViewSummary => {
  const productMap = new Map(products.map((p) => [p.id, p]));
  return {
    lines: entity.lines
      .map((line) => {
        const product = productMap.get(line.item.productId);
        return product ? toCartViewLine(line, product) : null;
      })
      .filter((l): l is CartViewLine => l !== null),
    count: entity.selectedCount,
    subtotal: entity.subtotal,
    discount: entity.discount,
    delivery: Math.max(0, entity.total - entity.subtotal + entity.discount),
    total: entity.total,
  };
};
