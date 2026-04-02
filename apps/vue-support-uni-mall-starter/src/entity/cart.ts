/** 购物车条目实体（后端响应原始结构） */
export interface CartItemEntity {
  id: string;
  userId: string;
  productId: string;
  skuId?: string;
  quantity: number;
  /** 加入时的快照价格 */
  snapshotPrice: number;
  selected: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 购物车明细（带商品信息） */
export interface CartLineEntity {
  item: CartItemEntity;
  productTitle: string;
  productSubtitle: string;
  coverImage?: string;
  currentPrice: number;
  marketPrice: number;
  stock: number;
  specLabel?: string;
  subtotal: number;
}

/** 购物车汇总实体 */
export interface CartSummaryEntity {
  lines: CartLineEntity[];
  selectedCount: number;
  totalCount: number;
  subtotal: number;
  discount: number;
  total: number;
}
