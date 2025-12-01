# ScTable 组件

ScTable 是一个功能强大的数据表格组件，支持多种视图模式、数据缓存、虚拟滚动等高级功能，适用于各种数据展示场景。

## 功能特性

- 📊 **多种视图模式**：支持 table、card、list、virtual、canvas、waterfall 六种布局
- 🚀 **虚拟滚动**：支持大数据量的高性能渲染
- 🌊 **瀑布流布局**：支持虚拟滚动的瀑布流卡片布局，只渲染可见区域提高性能
- 💾 **数据缓存**：智能缓存机制，提升用户体验
- 🔍 **搜索过滤**：内置搜索和过滤功能
- 📱 **响应式设计**：自适应不同屏幕尺寸
- ⚙️ **列设置**：支持列的显示/隐藏、排序、宽度调整
- 📄 **分页支持**：支持传统分页和滚动分页
- 🎨 **主题定制**：支持多种主题和自定义样式
- 📊 **统计汇总**：支持数据统计和汇总显示
- 🖱️ **右键菜单**：支持自定义右键菜单

## 安装

```bash
npm install @repo/components
```

## 基础用法

### 基本表格

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    table-name="user-table"
  />
</template>

<script setup>
import { ref } from 'vue'
import ScTable from '@repo/components/ScTable'

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'email', label: '邮箱', width: 200 },
  { prop: 'status', label: '状态', width: 100 }
]

const fetchData = async (params) => {
  // 返回数据格式：{ data: [], total: 0 }
  const response = await api.getUsers(params)
  return response
}
</script>
```

### 静态数据表格

```vue
<template>
  <ScTable
    :data="tableData"
    :columns="columns"
    table-name="static-table"
  />
</template>

<script setup>
const tableData = {
  data: [
    { id: 1, name: '张三', email: 'zhang@example.com', status: '启用' },
    { id: 2, name: '李四', email: 'li@example.com', status: '禁用' }
  ],
  total: 2
}
</script>
```

## 视图模式

### 1. 表格视图 (table)

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    layout="table"
    border
    stripe
    :height="400"
  />
</template>
```

### 2. 卡片视图 (card)

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    layout="card"
    card-layout="default"
    :col-size="3"
    :row-size="4"
  />
</template>
```

### 3. 列表视图 (list)

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    layout="list"
  />
</template>
```

### 4. 虚拟滚动 (virtual)

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    layout="virtual"
    :height="500"
  />
</template>
```

### 5. 画布视图 (canvas)

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    layout="canvas"
  />
</template>
```

### 6. 瀑布流视图 (waterfall)

瀑布流布局支持虚拟滚动，只渲染可见区域的项目，适合展示大量卡片数据。

```vue
<template>
  <ScTable
    :url="fetchData"
    layout="waterfall"
    :col-size="4"
    :height="600"
    :waterfall-gap="16"
    :estimated-item-height="200"
    :buffer-size="5"
    row-key="id"
  >
    <template #default="{ row }">
      <div class="waterfall-card">
        <img :src="row.image" :alt="row.title" />
        <h3>{{ row.title }}</h3>
        <p>{{ row.description }}</p>
      </div>
    </template>
  </ScTable>
</template>
```

#### 瀑布流属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| waterfallGap | Number | 16 | 卡片之间的间距(px) |
| estimatedItemHeight | Number | 200 | 预估卡片高度，用于初始计算位置 |
| bufferSize | Number | 5 | 缓冲区大小，可视区域外额外渲染的项目数 |

#### 瀑布流性能优化原理

1. **虚拟滚动**：只渲染可见区域内的项目，大幅减少 DOM 节点数量
2. **位置缓存**：计算并缓存每个项目的位置信息，避免重复计算
3. **缓冲区机制**：在可视区域外预渲染一定数量的项目，保证滚动流畅
4. **GPU 加速**：使用 `transform: translateZ(0)` 启用硬件加速
5. **节流处理**：滚动事件使用节流函数，减少计算频率

## API

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| tableName | String | '' | 表格名称，用于缓存标识 |
| tableId | String | '' | 表格ID，用于配置存储 |
| url | Function | null | 数据获取函数 |
| data | Object | null | 静态数据 |
| columns | Array | [] | 列配置 |
| layout | String | 'table' | 视图模式：table/card/list/virtual/canvas/waterfall |
| waterfallGap | Number | 16 | 瀑布流卡片间距(px) |
| estimatedItemHeight | Number | 200 | 瀑布流预估卡片高度 |
| bufferSize | Number | 5 | 瀑布流虚拟滚动缓冲区大小 |
| cardLayout | String | 'default' | 卡片布局类型 |
| params | Object | {} | 请求参数 |
| filter | Object | {} | 过滤条件 |
| cacheable | Boolean | false | 是否开启缓存 |
| cachePage | Number | 3 | 缓存页数 |
| countDownable | Boolean | false | 是否开启倒计时刷新 |
| countDownTime | Number | 10 | 倒计时时间(秒) |
| countDownText | String | '刷新' | 倒计时文本 |
| height | String/Number | 'auto' | 表格高度 |
| size | String | 'default' | 表格尺寸：large/default/small |
| border | Boolean/String | false | 是否显示边框 |
| stripe | Boolean/String | false | 是否显示斑马纹 |
| pageSize | Number | 20 | 每页显示条数 |
| pageSizes | Array | [10,20,50,100] | 每页显示个数选择器的选项 |
| colSize | Number | 3 | 卡片视图列数 |
| rowSize | Number | 3 | 卡片视图行数 |
| rowKey | String | '' | 行数据的 Key |
| summaryMethod | Function | null | 自定义的合计计算方法 |
| rowClick | Function | () => {} | 行点击事件 |
| dataLoaded | Function | () => {} | 数据加载完成回调 |
| afterLoadedData | Function | () => {} | 数据加载后处理回调 |
| sorted | Function | data => data | 数据排序处理函数 |
| columnInTemplate | Boolean | true | 是否在模板中定义列 |
| remoteSort | Boolean | false | 是否为服务端排序 |
| remoteFilter | Boolean | false | 是否为服务端过滤 |
| remoteSummary | Boolean | false | 是否为服务端合计 |
| search | Boolean | true | 是否显示搜索 |
| hidePagination | Boolean | false | 是否隐藏分页 |
| hideDo | Boolean | false | 是否隐藏操作按钮 |
| hideRefresh | Boolean | false | 是否隐藏刷新按钮 |
| hideSetting | Boolean | false | 是否隐藏设置按钮 |
| paginationLayout | String | 'total, sizes, prev, pager, next, jumper' | 分页组件布局 |
| paginationType | String | 'default' | 分页类型：default/scroll |
| autoLoad | Boolean | true | 是否自动加载更多数据 |
| loadDistance | Number | 50 | 触发加载的距离 |
| contextmenu | Function | () => ({}) | 右键菜单配置 |
| contextmenuClass | String | '' | 右键菜单样式类 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| loaded | data | 数据加载完成 |
| data-loaded | data | 数据加载完成(别名) |
| dataChange | data | 数据变化 |
| finish | - | 操作完成 |
| update:cardLayout | layout | 卡片布局变化 |

### 列配置 (Column)

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| prop | String | - | 对应列内容的字段名 |
| label | String | - | 显示的标题 |
| width | Number/String | - | 对应列的宽度 |
| minWidth | Number/String | - | 对应列的最小宽度 |
| fixed | String/Boolean | - | 列是否固定：true/left/right |
| sortable | Boolean/String | false | 对应列是否可以排序 |
| resizable | Boolean | true | 对应列是否可以通过拖拽改变宽度 |
| formatter | Function | - | 用来格式化内容 |
| showOverflowTooltip | Boolean | false | 当内容过长被隐藏时显示 tooltip |
| align | String | 'left' | 对齐方式：left/center/right |
| headerAlign | String | - | 表头对齐方式 |
| className | String | - | 列的 className |
| labelClassName | String | - | 当前列标题的自定义样式名 |
| selectable | Function | - | 仅对 type=selection 的列有效 |
| reserveSelection | Boolean | false | 仅对 type=selection 的列有效 |
| filters | Array | - | 数据过滤的选项 |
| filterPlacement | String | - | 过滤弹出框的定位 |
| filterMultiple | Boolean | true | 数据过滤的选项是否多选 |
| filterMethod | Function | - | 数据过滤使用的方法 |
| filteredValue | Array | - | 选中的数据过滤项 |

### Slots

| 插槽名 | 参数 | 说明 |
|--------|------|------|
| default | - | 表格列定义 |
| empty | - | 空数据时的内容 |
| append | - | 插入至表格最后一行之后的内容 |
| toolbar | - | 工具栏自定义内容 |

## 高级功能

### 数据缓存

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    cacheable
    :cache-page="5"
    table-name="cached-table"
  />
</template>
```

### 倒计时刷新

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    count-downable
    :count-down-time="30"
    count-down-text="自动刷新"
  />
</template>
```

### 自定义列模板

```vue
<template>
  <ScTable :url="fetchData" table-name="custom-table">
    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column prop="name" label="姓名" width="120" />
    <el-table-column label="操作" width="200">
      <template #default="{ row }">
        <el-button size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </el-table-column>
  </ScTable>
</template>
```

### 右键菜单

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    :contextmenu="contextMenuConfig"
  />
</template>

<script setup>
const contextMenuConfig = (row, column, event) => {
  return {
    items: [
      {
        label: '查看详情',
        icon: 'ep:view',
        action: () => handleView(row)
      },
      {
        label: '编辑',
        icon: 'ep:edit',
        action: () => handleEdit(row)
      },
      {
        label: '删除',
        icon: 'ep:delete',
        action: () => handleDelete(row),
        danger: true
      }
    ]
  }
}
</script>
```

### 自定义汇总

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    :summary-method="getSummaries"
    show-summary
  />
</template>

<script setup>
const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '总计'
      return
    }
    const values = data.map(item => Number(item[column.property]))
    if (!values.every(value => isNaN(value))) {
      sums[index] = values.reduce((prev, curr) => {
        const value = Number(curr)
        if (!isNaN(value)) {
          return prev + curr
        } else {
          return prev
        }
      }, 0)
    } else {
      sums[index] = 'N/A'
    }
  })
  return sums
}
</script>
```

### 滚动分页

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    pagination-type="scroll"
    :auto-load="true"
    :load-distance="100"
  />
</template>
```

#### 属性说明
- pagination-type：分页模式
  - default（默认）：标准分页，显示分页器，切换页码重新请求数据
  - scroll：滚动分页，隐藏分页器，使用触底 sentinel 自动加载下一页
- auto-load：是否在接近底部时自动加载下一页（仅在 pagination-type=scroll 时生效）
- load-distance：距离容器底部多少像素触发加载（仅在 pagination-type=scroll 时生效）

#### 默认分页 vs 滚动分页 示例
```vue
<template>
  <div>
    <!-- 默认分页 -->
    <ScTable :url="fetchData" :columns="columns" page-size="10" />

    <!-- 滚动分页（卡片布局示例） -->
    <ScTable
      layout="card"
      :url="fetchData"
      :columns="columns"
      pagination-type="scroll"
      :auto-load="true"
      :load-distance="120"
      :col-size="3"
      :row-size="4"
    />
  </div>
</template>
```

## 样式定制

### CSS 变量

```css
:root {
  --sc-table-border-color: var(--el-border-color-lighter);
  --sc-table-header-bg: var(--el-fill-color-light);
  --sc-table-row-hover-bg: var(--el-fill-color-lighter);
  --sc-table-stripe-bg: var(--el-fill-color-blank);
}
```

### 自定义主题

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    class="custom-table"
    size="large"
    border
    stripe
  />
</template>

<style>
.custom-table {
  --el-table-border-color: #e4e7ed;
  --el-table-header-bg-color: #f5f7fa;
  --el-table-row-hover-bg-color: #f0f9ff;
}

.custom-table .el-table__header th {
  background-color: #409eff;
  color: var(--el-text-color-primary);
}

.custom-table .el-table__row:nth-child(even) {
  background-color: #fafafa;
}
</style>
```

## 性能优化

### 虚拟滚动

对于大数据量场景，建议使用虚拟滚动模式：

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    layout="virtual"
    :height="600"
    :page-size="100"
  />
</template>
```

### 数据缓存策略

```vue
<template>
  <ScTable
    :url="fetchData"
    :columns="columns"
    cacheable
    :cache-page="10"
    table-name="performance-table"
  />
</template>
```

## 注意事项

1. **数据格式**：`url` 函数应返回 `{ data: [], total: number }` 格式的数据
2. **缓存机制**：开启缓存时，`tableName` 是必需的，用于区分不同表格的缓存
3. **虚拟滚动**：使用虚拟滚动时必须设置固定高度
4. **列配置**：可以通过 `columns` 属性或插槽方式定义列
5. **性能考虑**：大数据量时建议使用虚拟滚动或分页加载
6. **响应式**：表格会自动适应容器宽度，建议设置合适的列宽

## 更新日志

### v3.0.0
- 新增画布视图模式
- 新增滚动分页功能
- 优化虚拟滚动性能
- 新增倒计时刷新功能

### v2.5.0
- 新增数据缓存功能
- 新增右键菜单支持
- 优化列设置功能
- 新增多种视图模式

### v2.0.0
- 重构组件架构
- 新增虚拟滚动支持
- 新增卡片和列表视图
- 优化性能和用户体验

### v1.x.x
- 基础表格功能
- 分页和排序支持
- 基本样式定制

## 许可证

MIT License