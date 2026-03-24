# Pay 模块

## 概述
- 位置：`vue-support-parent-starter/pages/pay`
- 功能：商户管理（增删查改、启用/禁用），遵循 ScTable 与 Iconify 全局组件规范。

## 目录结构
```
pages/pay/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ index.vue                 # 入口
   ├─ api/merchant.ts           # 商户 API 封装（/v2/pay/merchant/*）
   └─ merchant/
      ├─ index.vue              # 商户列表页（ScTable:url）
      └─ save.vue               # 新增/编辑弹窗
```

## 接口说明（后端）
- 分页：GET `/v2/pay/merchant/page`
- 新增：POST `/v2/pay/merchant/save`
- 更新：PUT `/v2/pay/merchant/update`
- 删除：PUT `/v2/pay/merchant/update`（设置 `payMerchantDelete=1`）

说明：按约定采用 then 成功、catch 失败的异步回调方式。
