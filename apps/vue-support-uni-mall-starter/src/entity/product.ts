/** 商品规格实体 */
export interface ProductSpecEntity {
  name: string;
  value: string;
}

/** SKU 实体 */
export interface SkuEntity {
  id: string;
  productId: string;
  specs: ProductSpecEntity[];
  price: number;
  marketPrice: number;
  stock: number;
  skuCode?: string;
}

/** 商品实体（后端响应原始结构） */
export interface ProductEntity {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  categoryId: string;
  /** 主图 URL */
  coverImage?: string;
  /** 轮播图 URL 列表 */
  images?: string[];
  price: number;
  marketPrice: number;
  stock: number;
  sales?: number;
  rating?: number;
  tags: string[];
  /** 商品亮点描述列表 */
  highlights: string[];
  /** 调色板（渐变用，两色） */
  palette?: [string, string];
  featured?: boolean;
  status: "on_sale" | "off_sale" | "draft";
  skus?: SkuEntity[];
  specs?: ProductSpecEntity[];
  createdAt: string;
  updatedAt: string;
}

/** 商品列表分页响应 */
export interface ProductPageEntity {
  list: ProductEntity[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
