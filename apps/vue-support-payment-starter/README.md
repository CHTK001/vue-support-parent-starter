# 支付管理系统前端

## 功能特性

- 订单管理：创建订单、查询订单、取消订单、退款、转账
- 商户管理：添加商户、编辑商户、删除商户、测试连接
- 统计分析：订单数量统计、订单金额统计
- 支付方式：支持微信支付、支付宝支付、聚合支付
- 扫码支付：自动生成支付二维码

## 技术栈

- Vue 3
- TypeScript
- Element Plus
- Vue Router
- Axios
- QRCode.js

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问地址
http://localhost:5174
```

## 构建

```bash
# 构建生产版本
pnpm build

# 构建输出目录
dist/
```

## 打包到Spring Boot

构建完成后，将`dist`目录下的所有文件复制到Spring Boot项目的`src/main/resources/payment-web/`目录下。

```bash
# Windows
xcopy /E /I /Y dist\* ..\..\..\..\utils-support-parent-starter\utils-support-cloud-parent\utils-support-cloud-starter\src\main\resources\payment-web\

# Linux/Mac
cp -r dist/* ../../../../utils-support-parent-starter/utils-support-cloud-parent/utils-support-cloud-starter/src/main/resources/payment-web/
```

## 配置

在Spring Boot的`application.yml`中配置：

```yaml
payment:
  enabled: true
  provider: wechat
  table-name: payment_order
  snowflake:
    worker-id: 1
    datacenter-id: 1
  web:
    enabled: true  # 是否启用Web管理页面
    path: /payment-admin  # Web页面访问路径
    api-enabled: true  # 是否启用API接口
```

## 访问

启动Spring Boot应用后，访问：

```
http://localhost:8080/payment-admin
```

## 页面说明

### 订单管理

- 订单列表：查看所有订单，支持按用户ID、订单状态筛选
- 创建订单：创建新订单并发起支付
- 订单详情：查看订单的详细信息
- 订单操作：支付、取消、退款
- 扫码支付：自动生成支付二维码
- 统计信息：订单总数、已支付订单数、订单总金额

### 商户管理

- 商户列表：查看所有商户配置
- 添加商户：添加新的支付商户
- 编辑商户：修改商户配置
- 删除商户：删除商户配置
- 测试连接：测试商户配置是否正确
- 启用/禁用：快速切换商户状态

## API接口

所有API接口都在`/api/payment`路径下：

### 订单接口

- `POST /api/payment/order/create-and-pay` - 创建订单并支付
- `GET /api/payment/order/list` - 查询订单列表
- `GET /api/payment/order/{orderNo}` - 查询订单详情
- `GET /api/payment/order/{orderNo}/payment-status` - 查询支付状态
- `POST /api/payment/order/{orderNo}/cancel` - 取消订单
- `POST /api/payment/order/{orderNo}/refund` - 申请退款
- `GET /api/payment/order/{orderNo}/refund/{outRefundNo}` - 查询退款状态
- `POST /api/payment/order/{orderNo}/transfer` - 转账
- `GET /api/payment/order/count` - 统计订单数量
- `GET /api/payment/order/sum-amount` - 统计订单金额
- `POST /api/payment/order/notify` - 支付回调通知

### 商户接口

- `GET /api/payment/merchant/list` - 获取商户列表
- `GET /api/payment/merchant/{id}` - 获取商户详情
- `POST /api/payment/merchant` - 创建商户
- `PUT /api/payment/merchant/{id}` - 更新商户
- `DELETE /api/payment/merchant/{id}` - 删除商户
- `POST /api/payment/merchant/{id}/test` - 测试商户连接

## 开关控制

### 关闭Web管理页面

```yaml
payment:
  web:
    enabled: false
```

### 关闭API接口

```yaml
payment:
  web:
    api-enabled: false
```

### 同时关闭

```yaml
payment:
  web:
    enabled: false
    api-enabled: false
```

## 注意事项

1. 前端页面使用Vue Router的history模式，需要配置服务器支持
2. API接口默认需要认证，请配置好认证拦截器
3. 支付回调地址需要配置为公网可访问的地址
4. 生产环境建议关闭沙箱模式
5. 商户配置中的密钥信息请妥善保管
