# @repo/pages-pay

支付管理模块 - 可复用的页面、API 和组件

## 功能特性

- ✅ 商户管理（增删查改、启用/禁用）
- ✅ 订单管理
- ✅ 微信支付集成
- ✅ 模块化设计，可被其他应用集成

## 模块结构

```
packages/pages/pay/
├── src/
│   ├── index.ts              # 主入口
│   ├── index.vue             # 支付管理主页
│   ├── api/                  # API 接口层
│   │   ├── merchant.ts       # 商户 API
│   │   ├── order.ts          # 订单 API
│   │   └── wechat.ts         # 微信支付 API
│   ├── merchant/             # 商户管理页面
│   │   ├── index.vue         # 商户列表
│   │   ├── save.vue          # 新增/编辑弹窗
│   │   └── setting.vue       # 商户设置
│   └── order/                # 订单管理页面
│       └── index.vue         # 订单列表
├── package.json
└── README.md
```

## 使用方式

### 1. 在应用中导入组件

```typescript
// 导入页面组件
import { PayMerchantPage, PayOrderPage } from '@repo/pages-pay';

// 在路由中使用
const routes = [
  {
    path: '/pay/merchant',
    component: PayMerchantPage
  },
  {
    path: '/pay/order',
    component: PayOrderPage
  }
];
```

### 2. 使用 API

```typescript
// 导入 API
import {
  getMerchantPage,
  saveMerchant,
  updateMerchant
} from '@repo/pages-pay';

// 在组件中使用
const merchants = await getMerchantPage({ page: 1, size: 10 });
```

## 集成示例

### vue-support-monitor-starter

监控平台集成支付管理功能：

```typescript
// 在 monitor 的路由中集成
import { PayMerchantPage, PayOrderPage } from '@repo/pages-pay';

const routes = [
  {
    path: '/pay',
    children: [
      {
        path: 'merchant',
        component: PayMerchantPage,
        meta: { title: '商户管理' }
      },
      {
        path: 'order',
        component: PayOrderPage,
        meta: { title: '订单管理' }
      }
    ]
  }
];
```

## API 接口

### 商户管理

- `getMerchantPage(query)` - 获取商户分页列表
- `saveMerchant(merchant)` - 新增商户
- `updateMerchant(merchant)` - 更新商户
- `deleteMerchant(merchantId)` - 删除商户（软删除）

### 订单管理

- `getOrderPage(query)` - 获取订单分页列表
- `getOrderDetail(orderId)` - 获取订单详情

### 微信支付

- `getWechatConfig()` - 获取微信支付配置
- `updateWechatConfig(config)` - 更新微信支付配置

## 后端接口

模块需要后端提供以下接口（默认基础路径：`/v2/pay`）：

- `GET /merchant/page` - 商户分页列表
- `POST /merchant/save` - 新增商户
- `PUT /merchant/update` - 更新商户
- `DELETE /merchant/delete/:id` - 删除商户
- `GET /order/page` - 订单分页列表
- `GET /order/detail/:id` - 订单详情

## 依赖

- `@repo/components` - 共享组件库
- `element-plus` - UI 组件库
- `vue` - Vue 3
- `vue-router` - 路由管理

## 版本历史

### v1.0.0 (2026-03-20)

- ✅ 初始版本发布
- ✅ 商户管理功能
- ✅ 订单管理功能
- ✅ 微信支付集成

## 许可证

ISC
