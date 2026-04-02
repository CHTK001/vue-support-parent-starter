/** 订单商品快照 */
export interface OrderItemEntity {
  productId: string;
  skuId?: string;
  productTitle: string;
  specLabel?: string;
  coverImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/** 收货地址 */
export interface AddressEntity {
  id: string;
  userId: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

/** 订单实体 */
export interface OrderEntity {
  id: string;
  orderNo: string;
  userId: string;
  status:
    | "pending_payment"
    | "pending_shipment"
    | "pending_receipt"
    | "completed"
    | "cancelled"
    | "refunding";
  items: OrderItemEntity[];
  address: AddressEntity;
  subtotal: number;
  discount: number;
  freight: number;
  total: number;
  remark?: string;
  paidAt?: string;
  shippedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 订单列表分页响应 */
export interface OrderPageEntity {
  list: OrderEntity[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
