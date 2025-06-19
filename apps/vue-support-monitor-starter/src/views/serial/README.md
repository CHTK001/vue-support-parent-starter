# 串口管理系统

## 功能概述

这是一个完整的串口管理系统，集成了 `fetchSerialAvailablePorts` 接口，支持串口端口的下拉选择，并使用 IndexedDB 进行本地数据持久化存储。

## 🚀 新增功能

### 1. 智能端口选择
- **下拉选择**: 串口端口改为下拉选择框，提供更好的用户体验
- **实时获取**: 集成 `fetchSerialAvailablePorts` 接口，获取服务器当前可用串口
- **自定义输入**: 支持手动输入自定义端口，满足特殊需求
- **刷新功能**: 一键刷新可用端口列表

### 2. IndexedDB 存储
- **API兼容**: 完全兼容原有API接口格式
- **本地持久化**: 数据存储在浏览器本地，离线可用
- **智能缓存**: 端口列表智能缓存，减少不必要的网络请求
- **数据同步**: 支持与服务器数据同步

### 3. 增强的用户体验
- **平台适配**: 根据操作系统提供默认端口选项
- **错误处理**: 完善的错误处理和用户提示
- **加载状态**: 清晰的加载状态指示
- **响应式设计**: 适配不同屏幕尺寸

## 📁 文件结构

```
src/views/serial/
├── manage.vue              # 主管理页面
├── components/
│   ├── SerialList.vue      # 串口列表组件
│   ├── SerialMonitor.vue   # 串口监控组件
│   └── SerialSettings.vue  # 串口设置组件
└── README.md              # 使用说明

src/utils/
└── serialDB.ts            # IndexedDB操作工具类

src/api/serial/
├── index.ts               # API接口定义
└── types.ts               # 类型定义
```

## 🔧 技术实现

### SerialDB 工具类

提供完整的 CRUD 操作，完全兼容原有 API 接口：

```typescript
// 分页查询
SerialDB.fetchSerialPage({ page: 1, pageSize: 10 })

// 保存数据
SerialDB.fetchSerialSave(serialData)

// 更新数据
SerialDB.fetchSerialUpdate(serialData)

// 删除数据
SerialDB.fetchSerialDelete(serialId)

// 启动连接
SerialDB.fetchSerialStart(serialId)

// 停止连接
SerialDB.fetchSerialStop(serialId)

// 获取可用端口
SerialDB.fetchSerialAvailablePorts()
```

### 端口选择组件

```vue
<el-form-item label="串口端口" prop="monitorSerialPort">
  <div class="flex gap-2 w-full">
    <el-select 
      v-model="form.monitorSerialPort" 
      placeholder="选择串口端口" 
      class="flex-1"
      filterable
      allow-create
      :loading="loadingPorts"
      @focus="loadAvailablePorts"
    >
      <el-option 
        v-for="port in availablePorts" 
        :key="port" 
        :label="port" 
        :value="port" 
      />
    </el-select>
    <el-button 
      size="default" 
      @click="loadAvailablePorts" 
      :loading="loadingPorts"
      title="刷新可用串口"
    >
      <IconifyIconOnline icon="ep:refresh" />
    </el-button>
  </div>
</el-form-item>
```

## 🎯 使用方法

### 1. 添加串口设备

1. 点击串口列表右上角的"+"按钮
2. 填写设备名称
3. 从下拉列表选择串口端口（或手动输入）
4. 配置波特率、数据位等参数
5. 点击确定保存

### 2. 端口选择

- **下拉选择**: 点击端口下拉框，选择可用端口
- **手动输入**: 直接输入自定义端口名称
- **刷新端口**: 点击刷新按钮获取最新可用端口

### 3. 数据管理

- **本地存储**: 所有数据自动保存到 IndexedDB
- **离线使用**: 无网络时仍可查看和管理已保存的设备
- **数据同步**: 有网络时自动同步最新端口信息

## 🔄 数据流程

### 端口获取流程

1. **优先级**: 服务器接口 > 本地缓存 > 默认端口
2. **缓存策略**: 端口数据缓存5分钟，减少频繁请求
3. **降级处理**: 接口失败时自动使用本地缓存或默认端口

### 数据存储流程

1. **写入**: 数据操作 → SerialDB → IndexedDB
2. **读取**: 组件 → SerialDB → IndexedDB → 数据返回
3. **同步**: 定期检查数据一致性

## 🛠️ 配置选项

### 默认端口配置

系统根据操作系统自动提供默认端口：

- **Windows**: COM1-COM8
- **macOS**: /dev/tty.usbserial, /dev/tty.usbmodem 等
- **Linux**: /dev/ttyUSB0, /dev/ttyACM0 等

### 缓存配置

```typescript
// 端口缓存时间（毫秒）
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

// 数据库配置
const DB_CONFIG = {
  name: 'SerialMonitorDB',
  version: 1,
  stores: {
    serials: 'serialList',
    ports: 'availablePorts',
    logs: 'serialLogs',
    settings: 'serialSettings'
  }
};
```

## 🔍 调试和故障排除

### 常见问题

1. **端口列表为空**
   - 检查网络连接
   - 确认服务器接口正常
   - 查看浏览器控制台错误信息

2. **数据保存失败**
   - 检查浏览器是否支持 IndexedDB
   - 确认存储空间是否充足
   - 查看控制台错误日志

3. **端口选择无效**
   - 确认端口名称格式正确
   - 检查端口是否被其他程序占用
   - 验证串口设备连接状态

### 调试方法

```javascript
// 查看存储的数据
console.log(await SerialDB.fetchSerialPage({ page: 1, pageSize: 100 }));

// 查看可用端口
console.log(await SerialDB.fetchSerialAvailablePorts());

// 清空所有数据（谨慎使用）
await SerialDB.clearAllData();
```

## 📈 性能优化

### 1. 懒加载
- 组件按需加载，减少初始包大小
- 端口数据延迟获取，提升页面响应速度

### 2. 缓存策略
- 智能缓存端口数据，减少网络请求
- 本地数据优先，提升用户体验

### 3. 错误处理
- 优雅降级，确保功能可用性
- 详细错误信息，便于问题定位

## 🔮 未来规划

1. **数据同步**: 支持多设备数据同步
2. **导入导出**: 支持配置文件导入导出
3. **批量操作**: 支持批量添加和管理设备
4. **高级过滤**: 支持按类型、状态等条件过滤
5. **统计分析**: 提供使用统计和分析功能

## 📝 更新日志

### v1.1.0 (当前版本)
- ✅ 集成 fetchSerialAvailablePorts 接口
- ✅ 串口端口改为下拉选择
- ✅ 完整的 IndexedDB 存储方案
- ✅ API 接口兼容性
- ✅ 智能缓存机制
- ✅ 平台适配支持

### v1.0.0
- ✅ 基础串口管理功能
- ✅ 串口监控界面
- ✅ 基本的增删改查操作
