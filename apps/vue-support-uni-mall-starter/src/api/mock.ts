/**
 * Mock 数据层 —— VITE_MOCK=true 时替代真实 http 请求
 */
import type { ApiResponse, LoginResultEntity, UserEntity } from "../entity/user";
import type { CategoryEntity, CategoryTreeEntity } from "../entity/category";
import type { ProductEntity, ProductPageEntity } from "../entity/product";
import type { CartSummaryEntity, CartLineEntity, CartItemEntity } from "../entity/cart";
import type { AddressEntity, OrderEntity, OrderPageEntity } from "../entity/order";
import type { SupportCenterEntity } from "../entity/support";
import {
  mallCategories,
  mallProducts,
  getCartLines,
  getCartSummary,
  getProductById,
  addCartItem as catalogAdd,
  removeCartItem as catalogRemove,
  clearCart as catalogClear,
  updateCartItem,
  changeCartQuantity,
  type MallCategory,
  type MallProduct,
} from "../data/catalog";
import { clearToken, setToken } from "./token";

export const IS_MOCK = import.meta.env.VITE_MOCK === "true";
const MOCK_DELAY_MS = 160;
const ORDER_STORAGE_KEY = "vue-support.uni.mall.orders";
const ADDRESS_STORAGE_KEY = "vue-support.uni.mall.addresses";

const mockUser: UserEntity = {
  id: "mock-user",
  nickname: "晚风实验室会员",
  avatar: "",
  phone: "13800138000",
  gender: 1,
  birthday: "1996-03-18",
  level: 3,
  points: 2680,
  createdAt: "2024-01-01T08:00:00Z",
  updatedAt: "2026-03-30T08:00:00Z",
};

const ok = <T>(data: T): ApiResponse<T> => ({
  code: 200,
  message: "ok",
  data,
  success: true,
});

const fail = <T>(code: number, message: string, data: T): ApiResponse<T> => ({
  code,
  message,
  data,
  success: false,
});

const wait = <T>(value: T, delay = MOCK_DELAY_MS): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), delay);
  });

// ─── Category ────────────────────────────────────────────────────────────────

const toCategoryEntity = (c: MallCategory): CategoryEntity => ({
  id: c.id,
  name: c.label,
  description: c.description,
  colorAccent: c.accent,
  enabled: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

export const mockGetCategoryList = (): Promise<ApiResponse<CategoryEntity[]>> =>
  wait(ok(mallCategories.map(toCategoryEntity)));

export const mockGetCategoryTree = (): Promise<ApiResponse<CategoryTreeEntity[]>> =>
  wait(
    ok(
      mallCategories.map((category) => ({
        ...toCategoryEntity(category),
        children: [],
      })),
    ),
  );

export const mockGetCategoryById = (id: string): Promise<ApiResponse<CategoryEntity>> => {
  const found = mallCategories.find((item) => item.id === id);
  return found
    ? wait(ok(toCategoryEntity(found)))
    : wait(fail(404, "category not found", null as never));
};

// ─── Product ─────────────────────────────────────────────────────────────────

const toProductEntity = (p: MallProduct): ProductEntity => ({
  id: p.id,
  title: p.title,
  subtitle: p.subtitle,
  description: p.description,
  categoryId: p.categoryId,
  price: p.price,
  marketPrice: p.marketPrice,
  stock: p.stock,
  tags: p.tags,
  highlights: p.highlights,
  palette: p.palette,
  featured: p.featured,
  specs: p.specs,
  status: "on_sale",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

export const mockGetProductPage = (params: {
  categoryId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  featured?: boolean;
}): Promise<ApiResponse<ProductPageEntity>> => {
  let list = mallProducts.map(toProductEntity);
  if (params.categoryId) list = list.filter((p) => p.categoryId === params.categoryId);
  if (params.featured) list = list.filter((p) => p.featured);
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (p) => p.title.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw),
    );
  }
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const total = list.length;
  const sliced = list.slice((page - 1) * pageSize, page * pageSize);
  return wait(
    ok({ list: sliced, total, page, pageSize, hasMore: page * pageSize < total }),
  );
};

export const mockGetProductById = (id: string): Promise<ApiResponse<ProductEntity>> => {
  const found = mallProducts.find((p) => p.id === id);
  if (!found)
    return wait({ code: 404, message: "not found", data: null as any, success: false });
  return wait(ok(toProductEntity(found)));
};

export const mockGetFeaturedProducts = (): Promise<ApiResponse<ProductEntity[]>> =>
  wait(ok(mallProducts.filter((p) => p.featured).map(toProductEntity)));

export const mockSearchProducts = (
  keyword: string,
  page = 1,
  pageSize = 20,
): Promise<ApiResponse<ProductPageEntity>> =>
  mockGetProductPage({ keyword, page, pageSize });

// ─── Cart ────────────────────────────────────────────────────────────────────

const toCartLineEntity = (line: ReturnType<typeof getCartLines>[number]): CartLineEntity => ({
  item: {
    id: line.product.id,
    userId: "mock-user",
    productId: line.product.id,
    quantity: line.quantity,
    snapshotPrice: line.product.price,
    selected: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  } as CartItemEntity,
  productTitle: line.product.title,
  productSubtitle: line.product.subtitle,
  currentPrice: line.product.price,
  marketPrice: line.product.marketPrice,
  stock: line.product.stock,
  subtotal: line.subtotal,
});

export const mockGetCart = (): Promise<ApiResponse<CartSummaryEntity>> => {
  const lines = getCartLines();
  const summary = getCartSummary();
  return wait(
    ok({
      lines: lines.map(toCartLineEntity),
      selectedCount: summary.count,
      totalCount: summary.count,
      subtotal: summary.subtotal,
      discount: 0,
      total: summary.total,
    }),
  );
};

export const mockAddToCart = (productId: string, quantity: number): Promise<ApiResponse<null>> => {
  catalogAdd(productId, quantity);
  return wait(ok(null));
};

export const mockUpdateCartQuantity = (
  itemId: string,
  quantity: number,
): Promise<ApiResponse<null>> => {
  updateCartItem(itemId, quantity);
  return wait(ok(null));
};

export const mockRemoveCartItem = (productId: string): Promise<ApiResponse<null>> => {
  catalogRemove(productId);
  return wait(ok(null));
};

export const mockChangeCartQuantity = (
  productId: string,
  delta: number,
): Promise<ApiResponse<null>> => {
  changeCartQuantity(productId, delta);
  return wait(ok(null));
};

export const mockClearCart = (): Promise<ApiResponse<null>> => {
  catalogClear();
  return wait(ok(null));
};

export const mockToggleCartItemSelected = (): Promise<ApiResponse<null>> => wait(ok(null));

// ─── User/Auth ───────────────────────────────────────────────────────────────

const buildLoginResult = (): LoginResultEntity => {
  const token = `mock-token-${Date.now()}`;
  setToken(token);
  return {
    token,
    refreshToken: "mock-refresh-token",
    expiresIn: 3600,
    user: mockUser,
  };
};

export const mockLoginByPhone = (): Promise<ApiResponse<LoginResultEntity>> =>
  wait(ok(buildLoginResult()));

export const mockLoginByWechat = (): Promise<ApiResponse<LoginResultEntity>> =>
  wait(ok(buildLoginResult()));

export const mockGetUserInfo = (): Promise<ApiResponse<UserEntity>> => wait(ok(mockUser));

export const mockUpdateUserInfo = (
  data: Partial<Pick<UserEntity, "nickname" | "avatar" | "gender" | "birthday">>,
): Promise<ApiResponse<UserEntity>> => wait(ok({ ...mockUser, ...data, updatedAt: new Date().toISOString() }));

export const mockLogout = (): Promise<ApiResponse<null>> => {
  clearToken();
  return wait(ok(null));
};

export const mockSendSmsCode = (): Promise<ApiResponse<null>> => wait(ok(null));

const defaultAddress: AddressEntity = {
  id: "addr-default",
  userId: mockUser.id,
  name: "王小晚",
  phone: "13800138000",
  province: "上海市",
  city: "上海市",
  district: "徐汇区",
  detail: "云锦路 188 号 12 楼",
  isDefault: true,
};

const buildSeedAddresses = (): AddressEntity[] => [
  defaultAddress,
  {
    id: "addr-office",
    userId: mockUser.id,
    name: "王小晚",
    phone: "13800138000",
    province: "上海市",
    city: "上海市",
    district: "长宁区",
    detail: "长宁路 889 号 7 层",
    isDefault: false,
  },
];

const readAddresses = (): AddressEntity[] => {
  try {
    const raw = uni.getStorageSync(ADDRESS_STORAGE_KEY);
    const list =
      typeof raw === "string" && raw
        ? (JSON.parse(raw) as AddressEntity[])
        : Array.isArray(raw)
          ? (raw as AddressEntity[])
          : [];
    if (list.length) {
      return list;
    }
  } catch {
    // ignore
  }
  const seed = buildSeedAddresses();
  uni.setStorageSync(ADDRESS_STORAGE_KEY, seed);
  return seed;
};

const writeAddresses = (addresses: AddressEntity[]) => {
  uni.setStorageSync(ADDRESS_STORAGE_KEY, addresses);
  return addresses;
};

export const mockGetAddressList = (): Promise<ApiResponse<AddressEntity[]>> =>
  wait(ok(readAddresses()));

export const mockGetDefaultAddress = (): Promise<ApiResponse<AddressEntity>> => {
  const current = readAddresses().find((item) => item.isDefault) ?? readAddresses()[0];
  return current
    ? wait(ok(current))
    : wait(fail(404, "address not found", null as never));
};

export const mockSetDefaultAddress = (id: string): Promise<ApiResponse<null>> => {
  const current = readAddresses();
  const exists = current.some((item) => item.id === id);
  if (!exists) {
    return wait(fail(404, "address not found", null));
  }
  writeAddresses(
    current.map((item) => ({
      ...item,
      isDefault: item.id === id,
    })),
  );
  return wait(ok(null));
};

// ─── Support ─────────────────────────────────────────────────────────────────

const supportCenter: SupportCenterEntity = {
  serviceHours: "09:00 - 23:00",
  responseSla: "工作时间内 5 分钟内响应",
  notice: "当前为 mock 服务台，文案和结构按正式 API 输出格式组织。",
  contacts: [
    {
      id: "support-phone",
      type: "phone",
      label: "客服热线",
      value: "400-820-2026",
      description: "适合订单催发、退款咨询和发票问题。",
      actionText: "复制电话",
    },
    {
      id: "support-wechat",
      type: "wechat",
      label: "企业微信",
      value: "uni-mall-service",
      description: "适合售后问题和商品使用咨询。",
      actionText: "复制微信号",
    },
    {
      id: "support-email",
      type: "email",
      label: "支持邮箱",
      value: "support@uni-mall.mock",
      description: "适合问题留档和批量工单提交。",
      actionText: "复制邮箱",
    },
  ],
  faqs: [
    {
      id: "faq-1",
      category: "订单",
      question: "mock 订单为什么也有发货和签收状态？",
      answer: "因为页面需要验证完整订单链路，mock 数据按真实接口结构提供多种状态。",
    },
    {
      id: "faq-2",
      category: "配送",
      question: "为什么有些商品需要 12 元运费？",
      answer: "mock 规则与购物车汇总一致，满 399 元免邮，否则统一收取 12 元。",
    },
    {
      id: "faq-3",
      category: "售后",
      question: "如何验证客服链路是否可用？",
      answer: "支持页的电话、微信、邮箱都来自接口返回，点击后会执行复制动作并给出反馈。",
    },
  ],
};

export const mockGetSupportCenter = (): Promise<ApiResponse<SupportCenterEntity>> =>
  wait(ok(supportCenter));

// ─── Orders ──────────────────────────────────────────────────────────────────

const buildSeedOrders = (): OrderEntity[] => {
  const [first, second, third] = mallProducts;
  return [
    {
      id: "order-1001",
      orderNo: "MOCK20260330001",
      userId: mockUser.id,
      status: "pending_shipment",
      items: [
        {
          productId: first.id,
          productTitle: first.title,
          price: first.price,
          quantity: 1,
          subtotal: first.price,
        },
      ],
      address: defaultAddress,
      subtotal: first.price,
      discount: 0,
      freight: 0,
      total: first.price,
      createdAt: "2026-03-29T09:30:00Z",
      updatedAt: "2026-03-29T09:30:00Z",
      paidAt: "2026-03-29T09:35:00Z",
    },
    {
      id: "order-1002",
      orderNo: "MOCK20260328002",
      userId: mockUser.id,
      status: "pending_receipt",
      items: [
        {
          productId: second.id,
          productTitle: second.title,
          price: second.price,
          quantity: 1,
          subtotal: second.price,
        },
        {
          productId: third.id,
          productTitle: third.title,
          price: third.price,
          quantity: 1,
          subtotal: third.price,
        },
      ],
      address: defaultAddress,
      subtotal: second.price + third.price,
      discount: 20,
      freight: 0,
      total: second.price + third.price - 20,
      createdAt: "2026-03-28T10:00:00Z",
      updatedAt: "2026-03-28T10:00:00Z",
      paidAt: "2026-03-28T10:02:00Z",
      shippedAt: "2026-03-28T16:30:00Z",
    },
    {
      id: "order-1003",
      orderNo: "MOCK20260326003",
      userId: mockUser.id,
      status: "completed",
      items: [
        {
          productId: mallProducts[3].id,
          productTitle: mallProducts[3].title,
          price: mallProducts[3].price,
          quantity: 1,
          subtotal: mallProducts[3].price,
        },
      ],
      address: defaultAddress,
      subtotal: mallProducts[3].price,
      discount: 0,
      freight: 12,
      total: mallProducts[3].price + 12,
      createdAt: "2026-03-26T07:20:00Z",
      updatedAt: "2026-03-27T12:20:00Z",
      paidAt: "2026-03-26T07:23:00Z",
      shippedAt: "2026-03-26T15:10:00Z",
      completedAt: "2026-03-27T12:20:00Z",
    },
  ];
};

const readOrders = (): OrderEntity[] => {
  try {
    const raw = uni.getStorageSync(ORDER_STORAGE_KEY);
    const orders =
      typeof raw === "string" && raw
        ? (JSON.parse(raw) as OrderEntity[])
        : Array.isArray(raw)
          ? (raw as OrderEntity[])
          : [];
    if (orders.length) {
      return orders;
    }
  } catch {
    // ignore
  }
  const seed = buildSeedOrders();
  uni.setStorageSync(ORDER_STORAGE_KEY, seed);
  return seed;
};

const writeOrders = (orders: OrderEntity[]) => {
  uni.setStorageSync(ORDER_STORAGE_KEY, orders);
  return orders;
};

export const mockGetOrderPage = (params: {
  status?: OrderEntity["status"] | "all";
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<OrderPageEntity>> => {
  let list = readOrders();
  if (params.status && params.status !== "all") {
    list = list.filter((order) => order.status === params.status);
  }
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const total = list.length;
  const sliced = list.slice((page - 1) * pageSize, page * pageSize);
  return wait(
    ok({
      list: sliced,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    }),
  );
};

export const mockGetOrderById = (id: string): Promise<ApiResponse<OrderEntity>> => {
  const order = readOrders().find((item) => item.id === id);
  return order ? wait(ok(order)) : wait(fail(404, "order not found", null as never));
};

export const mockCreateOrder = (params: {
  cartItemIds?: string[];
  addressId: string;
  remark?: string;
}): Promise<ApiResponse<OrderEntity>> => {
  const lines = getCartLines().filter((line) => {
    if (!params.cartItemIds?.length) {
      return true;
    }
    return params.cartItemIds.includes(line.product.id);
  });
  if (!lines.length) {
    return wait(fail(400, "cart is empty", null as never));
  }
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const freight = subtotal >= 399 ? 0 : 12;
  const order: OrderEntity = {
    id: `order-${Date.now()}`,
    orderNo: `MOCK${Date.now()}`,
    userId: mockUser.id,
    status: "pending_payment",
    items: lines.map((line) => ({
      productId: line.product.id,
      productTitle: line.product.title,
      price: line.product.price,
      quantity: line.quantity,
      subtotal: line.subtotal,
    })),
    address:
      readAddresses().find((item) => item.id === params.addressId)
      ?? readAddresses().find((item) => item.isDefault)
      ?? defaultAddress,
    subtotal,
    discount: 0,
    freight,
    total: subtotal + freight,
    remark: params.remark,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeOrders([order, ...readOrders()]);
  catalogClear();
  return wait(ok(order));
};

const mutateOrderStatus = (
  id: string,
  nextStatus: OrderEntity["status"],
  extra: Partial<OrderEntity> = {},
): Promise<ApiResponse<null>> => {
  const orders = readOrders();
  const index = orders.findIndex((item) => item.id === id);
  if (index < 0) {
    return wait(fail(404, "order not found", null));
  }
  orders[index] = {
    ...orders[index],
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    ...extra,
  };
  writeOrders(orders);
  return wait(ok(null));
};

export const mockCancelOrder = (id: string): Promise<ApiResponse<null>> =>
  mutateOrderStatus(id, "cancelled");

export const mockConfirmReceipt = (id: string): Promise<ApiResponse<null>> =>
  mutateOrderStatus(id, "completed", { completedAt: new Date().toISOString() });

export const mockApplyRefund = (id: string): Promise<ApiResponse<null>> =>
  mutateOrderStatus(id, "refunding");

// ─── Router ──────────────────────────────────────────────────────────────────

export const mockRequest = async <T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data?: Record<string, unknown>,
): Promise<ApiResponse<T>> => {
  const path = url.split("?")[0];

  if (method === "GET" && path === "/api/mall/categories") {
    return (await mockGetCategoryList()) as ApiResponse<T>;
  }
  if (method === "GET" && path === "/api/mall/categories/tree") {
    return (await mockGetCategoryTree()) as ApiResponse<T>;
  }
  if (method === "GET" && path.startsWith("/api/mall/categories/")) {
    return (await mockGetCategoryById(path.replace("/api/mall/categories/", ""))) as ApiResponse<T>;
  }

  if (method === "GET" && path === "/api/mall/products/featured") {
    return (await mockGetFeaturedProducts()) as ApiResponse<T>;
  }
  if (method === "GET" && path === "/api/mall/products/search") {
    return (await mockSearchProducts(
      String(data?.keyword ?? ""),
      Number(data?.page ?? 1),
      Number(data?.pageSize ?? 20),
    )) as ApiResponse<T>;
  }
  if (method === "GET" && path === "/api/mall/products") {
    return (await mockGetProductPage({
      categoryId: data?.categoryId ? String(data.categoryId) : undefined,
      keyword: data?.keyword ? String(data.keyword) : undefined,
      page: Number(data?.page ?? 1),
      pageSize: Number(data?.pageSize ?? 20),
      featured: data?.featured === true,
    })) as ApiResponse<T>;
  }
  if (method === "GET" && path.startsWith("/api/mall/products/")) {
    return (await mockGetProductById(path.replace("/api/mall/products/", ""))) as ApiResponse<T>;
  }

  if (method === "GET" && path === "/api/mall/cart") {
    return (await mockGetCart()) as ApiResponse<T>;
  }
  if (method === "POST" && path === "/api/mall/cart/items") {
    return (await mockAddToCart(String(data?.productId ?? ""), Number(data?.quantity ?? 1))) as ApiResponse<T>;
  }
  if (method === "PUT" && /^\/api\/mall\/cart\/items\/[^/]+\/selected$/.test(path)) {
    return (await mockToggleCartItemSelected()) as ApiResponse<T>;
  }
  if (method === "PUT" && /^\/api\/mall\/cart\/items\/[^/]+$/.test(path)) {
    return (await mockUpdateCartQuantity(
      path.replace("/api/mall/cart/items/", ""),
      Number(data?.quantity ?? 1),
    )) as ApiResponse<T>;
  }
  if (method === "DELETE" && /^\/api\/mall\/cart\/items\/[^/]+$/.test(path)) {
    return (await mockRemoveCartItem(path.replace("/api/mall/cart/items/", ""))) as ApiResponse<T>;
  }
  if (method === "DELETE" && path === "/api/mall/cart") {
    return (await mockClearCart()) as ApiResponse<T>;
  }

  if (method === "POST" && path === "/api/mall/auth/login/phone") {
    return (await mockLoginByPhone()) as ApiResponse<T>;
  }
  if (method === "POST" && path === "/api/mall/auth/login/wechat") {
    return (await mockLoginByWechat()) as ApiResponse<T>;
  }
  if (method === "POST" && path === "/api/mall/auth/logout") {
    return (await mockLogout()) as ApiResponse<T>;
  }
  if (method === "POST" && path === "/api/mall/auth/sms") {
    return (await mockSendSmsCode()) as ApiResponse<T>;
  }
  if (method === "GET" && path === "/api/mall/user/me") {
    return (await mockGetUserInfo()) as ApiResponse<T>;
  }
  if (method === "PUT" && path === "/api/mall/user/me") {
    return (await mockUpdateUserInfo(data as Parameters<typeof mockUpdateUserInfo>[0])) as ApiResponse<T>;
  }

  if (method === "GET" && path === "/api/mall/addresses") {
    return (await mockGetAddressList()) as ApiResponse<T>;
  }
  if (method === "GET" && path === "/api/mall/addresses/default") {
    return (await mockGetDefaultAddress()) as ApiResponse<T>;
  }
  if (method === "PUT" && /^\/api\/mall\/addresses\/[^/]+\/default$/.test(path)) {
    return (await mockSetDefaultAddress(
      path.replace("/default", "").replace("/api/mall/addresses/", ""),
    )) as ApiResponse<T>;
  }

  if (method === "GET" && path === "/api/mall/support") {
    return (await mockGetSupportCenter()) as ApiResponse<T>;
  }

  if (method === "POST" && path === "/api/mall/orders") {
    return (await mockCreateOrder(data as Parameters<typeof mockCreateOrder>[0])) as ApiResponse<T>;
  }
  if (method === "GET" && path === "/api/mall/orders") {
    return (await mockGetOrderPage({
      status: (data?.status as OrderEntity["status"] | "all" | undefined) ?? "all",
      page: Number(data?.page ?? 1),
      pageSize: Number(data?.pageSize ?? 20),
    })) as ApiResponse<T>;
  }
  if (method === "GET" && /^\/api\/mall\/orders\/[^/]+$/.test(path)) {
    return (await mockGetOrderById(path.replace("/api/mall/orders/", ""))) as ApiResponse<T>;
  }
  if (method === "PUT" && /^\/api\/mall\/orders\/[^/]+\/cancel$/.test(path)) {
    return (await mockCancelOrder(path.replace("/cancel", "").replace("/api/mall/orders/", ""))) as ApiResponse<T>;
  }
  if (method === "PUT" && /^\/api\/mall\/orders\/[^/]+\/confirm$/.test(path)) {
    return (await mockConfirmReceipt(path.replace("/confirm", "").replace("/api/mall/orders/", ""))) as ApiResponse<T>;
  }
  if (method === "POST" && /^\/api\/mall\/orders\/[^/]+\/refund$/.test(path)) {
    return (await mockApplyRefund(path.replace("/refund", "").replace("/api/mall/orders/", ""))) as ApiResponse<T>;
  }

  return wait(fail(404, `mock api not found: ${method} ${path}`, null as never) as ApiResponse<T>);
};
