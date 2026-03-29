export interface MallCategory {
  id: string;
  label: string;
  description: string;
  accent: string;
}

export interface MallProductSpec {
  name: string;
  value: string;
}

export interface MallProduct {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  marketPrice: number;
  categoryId: string;
  tags: string[];
  stock: number;
  featured?: boolean;
  palette: [string, string];
  specs: MallProductSpec[];
  highlights: string[];
}

interface MallCartRecord {
  productId: string;
  quantity: number;
}

export interface MallCartLine {
  product: MallProduct;
  quantity: number;
  subtotal: number;
}

const CART_STORAGE_KEY = "vue-support.uni.mall.cart";

export const mallCategories: MallCategory[] = [
  {
    id: "kitchen",
    label: "厨房精选",
    description: "提高日常做饭效率的轻量工具。",
    accent: "#c96c2d"
  },
  {
    id: "desk",
    label: "桌面焕新",
    description: "让工作台面更整齐、更有秩序。",
    accent: "#166b5a"
  },
  {
    id: "travel",
    label: "出行收纳",
    description: "通勤与周末短途都能轻松带走。",
    accent: "#295f98"
  },
  {
    id: "wellness",
    label: "日常护理",
    description: "偏功能型的舒适小物件。",
    accent: "#8d5c94"
  }
];

export const mallProducts: MallProduct[] = [
  {
    id: "brew-kettle-01",
    title: "Aurora 手冲壶",
    subtitle: "900ml 细口稳定水流",
    description:
      "面向轻量咖啡和热饮场景的日常水壶，重点优化了握感、重心和水流控制。",
    price: 229,
    marketPrice: 299,
    categoryId: "kitchen",
    tags: ["热销", "稳定控流"],
    stock: 26,
    featured: true,
    palette: ["#f5b36d", "#d46e2e"],
    specs: [
      { name: "容量", value: "900ml" },
      { name: "材质", value: "304 不锈钢" },
      { name: "适配", value: "燃气 / 电陶炉" }
    ],
    highlights: ["弧形壶嘴", "防烫木柄", "轻量机身"]
  },
  {
    id: "storage-tray-02",
    title: "North 桌面收纳托盘",
    subtitle: "模块化分区，适合文具与数码配件",
    description:
      "一组可拆分的小托盘组合，可根据桌面尺寸自由排布，减少零碎小件堆积。",
    price: 159,
    marketPrice: 199,
    categoryId: "desk",
    tags: ["新上", "模块组合"],
    stock: 42,
    featured: true,
    palette: ["#6fc2b3", "#166b5a"],
    specs: [
      { name: "材质", value: "阳极氧化铝 + 胡桃木" },
      { name: "尺寸", value: "28cm x 19cm" },
      { name: "分区", value: "4 组可拆分托盘" }
    ],
    highlights: ["磁吸拼接", "防滑底垫", "适配键盘前区"]
  },
  {
    id: "carry-bag-03",
    title: "Transit 通勤收纳包",
    subtitle: "笔记本与线材分层整理",
    description:
      "面向 13 寸电脑和日常通勤物件打造的轻量收纳包，内部做了多层分区。",
    price: 269,
    marketPrice: 329,
    categoryId: "travel",
    tags: ["通勤", "高频复购"],
    stock: 17,
    palette: ["#8ab7ff", "#295f98"],
    specs: [
      { name: "适配", value: "13 寸电脑 / 平板" },
      { name: "开合", value: "YKK 拉链" },
      { name: "重量", value: "480g" }
    ],
    highlights: ["快捷取物", "雨水泼溅防护", "站立收纳"]
  },
  {
    id: "care-mat-04",
    title: "Soft Pulse 护理热敷垫",
    subtitle: "三段温控，支持 USB-C",
    description:
      "适合肩颈和腰背局部热敷的织物加热垫，主打便携和柔软贴合。",
    price: 189,
    marketPrice: 239,
    categoryId: "wellness",
    tags: ["舒缓", "USB-C 供电"],
    stock: 33,
    palette: ["#d2a6dc", "#8d5c94"],
    specs: [
      { name: "温控", value: "42 / 48 / 55 摄氏度" },
      { name: "接口", value: "USB-C" },
      { name: "面料", value: "亲肤针织布" }
    ],
    highlights: ["定时关闭", "可拆洗外套", "折叠收纳"]
  },
  {
    id: "brew-scale-05",
    title: "Orbit 电子秤",
    subtitle: "0.1g 精度，内置冲煮计时",
    description:
      "适合咖啡、烘焙和轻量料理场景的桌面电子秤，强调响应速度与读数清晰度。",
    price: 199,
    marketPrice: 249,
    categoryId: "kitchen",
    tags: ["精准", "计时模式"],
    stock: 28,
    palette: ["#f2c787", "#ba6a21"],
    specs: [
      { name: "精度", value: "0.1g" },
      { name: "量程", value: "2kg" },
      { name: "充电", value: "USB-C" }
    ],
    highlights: ["防泼水面板", "隐藏式显示", "冲煮计时"]
  },
  {
    id: "desk-light-06",
    title: "Halo 夹持氛围灯",
    subtitle: "柔光双角度，晚间桌面友好",
    description:
      "适合夜间工作和轻阅读的夹持式桌面灯，提供暖白和中性白两种氛围。",
    price: 319,
    marketPrice: 389,
    categoryId: "desk",
    tags: ["桌搭", "双角度"],
    stock: 14,
    featured: true,
    palette: ["#7fd7cb", "#2b7d72"],
    specs: [
      { name: "亮度", value: "5 档可调" },
      { name: "色温", value: "3000K / 4200K" },
      { name: "供电", value: "USB-C / 直插" }
    ],
    highlights: ["夹持安装", "均匀柔光", "占地更小"]
  }
];

export const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

export const getProductById = (productId?: string | null) =>
  mallProducts.find((item) => item.id === productId) ?? null;

export const getProductsByCategory = (categoryId?: string | null) => {
  if (!categoryId) {
    return mallProducts;
  }
  return mallProducts.filter((item) => item.categoryId === categoryId);
};

export const getFeaturedProducts = () =>
  mallProducts.filter((item) => item.featured).slice(0, 4);

const normalizeCartRecord = (record: Partial<MallCartRecord>) => {
  if (!record.productId) {
    return null;
  }

  const quantity = Math.max(1, Number(record.quantity || 1));
  return {
    productId: String(record.productId),
    quantity
  };
};

const readCartRecords = (): MallCartRecord[] => {
  const raw = uni.getStorageSync(CART_STORAGE_KEY);
  const records =
    typeof raw === "string" && raw
      ? JSON.parse(raw)
      : Array.isArray(raw)
        ? raw
        : [];

  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .map((item) => normalizeCartRecord(item))
    .filter(Boolean) as MallCartRecord[];
};

const writeCartRecords = (records: MallCartRecord[]) => {
  uni.setStorageSync(CART_STORAGE_KEY, records);
  return records;
};

export const getCartCount = () =>
  readCartRecords().reduce((sum, item) => sum + item.quantity, 0);

export const getCartLines = (): MallCartLine[] =>
  readCartRecords()
    .map((record) => {
      const product = getProductById(record.productId);
      if (!product) {
        return null;
      }
      return {
        product,
        quantity: record.quantity,
        subtotal: record.quantity * product.price
      };
    })
    .filter(Boolean) as MallCartLine[];

export const addCartItem = (productId: string, quantity = 1) => {
  const records = readCartRecords();
  const hit = records.find((item) => item.productId === productId);

  if (hit) {
    hit.quantity += Math.max(1, quantity);
  } else {
    records.push({
      productId,
      quantity: Math.max(1, quantity)
    });
  }

  return writeCartRecords(records);
};

export const updateCartItem = (productId: string, quantity: number) => {
  const records = readCartRecords();
  const nextQuantity = Math.max(0, quantity);
  const nextRecords = records.reduce<MallCartRecord[]>((acc, item) => {
    if (item.productId !== productId) {
      acc.push(item);
      return acc;
    }

    if (nextQuantity > 0) {
      acc.push({
        productId,
        quantity: nextQuantity
      });
    }
    return acc;
  }, []);

  return writeCartRecords(nextRecords);
};

export const changeCartQuantity = (productId: string, delta: number) => {
  const current = readCartRecords().find((item) => item.productId === productId);
  if (!current) {
    return addCartItem(productId, Math.max(1, delta));
  }
  return updateCartItem(productId, current.quantity + delta);
};

export const removeCartItem = (productId: string) =>
  writeCartRecords(
    readCartRecords().filter((item) => item.productId !== productId)
  );

export const clearCart = () => writeCartRecords([]);

export const getCartSummary = () => {
  const lines = getCartLines();
  const subtotal = lines.reduce((sum, item) => sum + item.subtotal, 0);
  const delivery = subtotal >= 399 || subtotal === 0 ? 0 : 12;
  return {
    count: lines.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    delivery,
    total: subtotal + delivery
  };
};
