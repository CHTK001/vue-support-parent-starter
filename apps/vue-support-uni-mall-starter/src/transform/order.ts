import type { OrderEntity, OrderItemEntity } from "../entity/order";

export interface OrderViewItem {
  productId: string;
  title: string;
  specLabel: string;
  coverImage: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderView {
  id: string;
  orderNo: string;
  statusLabel: string;
  statusColor: string;
  items: OrderViewItem[];
  address: string;
  total: number;
  createdAt: string;
}

export const orderStatusMap: Record<
  OrderEntity["status"],
  { label: string; color: string }
> = {
  pending_payment: { label: "待付款", color: "#c96c2d" },
  pending_shipment: { label: "待发货", color: "#295f98" },
  pending_receipt: { label: "待收货", color: "#166b5a" },
  completed: { label: "已完成", color: "#76685b" },
  cancelled: { label: "已取消", color: "#9e9e9e" },
  refunding: { label: "退款中", color: "#c0392b" },
};

const toOrderViewItem = (item: OrderItemEntity): OrderViewItem => ({
  productId: item.productId,
  title: item.productTitle,
  specLabel: item.specLabel ?? "",
  coverImage: item.coverImage ?? "",
  price: item.price,
  quantity: item.quantity,
  subtotal: item.subtotal,
});

/** 后端 OrderEntity → 前端视图数据 */
export const toOrderView = (entity: OrderEntity): OrderView => {
  const status = orderStatusMap[entity.status];
  const addr = entity.address;
  return {
    id: entity.id,
    orderNo: entity.orderNo,
    statusLabel: status.label,
    statusColor: status.color,
    items: entity.items.map(toOrderViewItem),
    address: `${addr.province}${addr.city}${addr.district}${addr.detail}`,
    total: entity.total,
    createdAt: entity.createdAt,
  };
};

export const toOrderViewList = (entities: OrderEntity[]): OrderView[] =>
  entities.map(toOrderView);
