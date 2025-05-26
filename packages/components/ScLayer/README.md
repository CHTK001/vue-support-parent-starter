# ScLayer 组件

ScLayer 是一个功能强大的地图组件，支持多种地图服务提供商，包括高德地图、百度地图和腾讯地图。它提供了丰富的功能，如搜索、标记点管理、行政区划选择等。

## 功能特性

- 支持多种地图服务提供商（高德地图、百度地图、腾讯地图）
- 搜索功能，支持关键词搜索、附近搜索、行政区划搜索等多种搜索类型
- 标记点管理，支持自定义图标、聚合等
- 行政区划选择和展示
- 统一的 API 接口，简化开发

## 安装

```bash
npm install @your-org/sc-layer
```

## 基本使用

```vue
<template>
  <ScLayer
    :map-key="mapKey"
    :map-type="mapType"
    @ready="handleMapReady"
  />
</template>

<script setup>
import { ScLayer } from '@your-org/sc-layer';
import { MapType } from '@your-org/sc-layer/types';
import { ref } from 'vue';

const mapType = ref(MapType.GAODE);
const mapKey = {
  [MapType.GAODE]: 'your-amap-key',
  [MapType.BAIDU]: 'your-baidu-key',
  [MapType.TENCENT]: 'your-tencent-key'
};

const handleMapReady = () => {
  console.log('地图已就绪');
};
</script>
```

## 搜索功能

ScLayer 组件提供了强大的搜索功能，支持多种搜索类型：

### 搜索类型

- `KEYWORD`: 关键词搜索
- `POI`: 兴趣点搜索
- `ADDRESS`: 地址搜索
- `COORDINATE`: 坐标搜索
- `NEARBY`: 附近搜索
- `DISTRICT`: 行政区划搜索
- `CUSTOM`: 自定义搜索

### 配置搜索类型

可以通过 `searchBoxConfig` 属性配置搜索框的行为：

```vue
<template>
  <ScLayer
    :map-key="mapKey"
    :map-type="mapType"
    :search-box-config="searchBoxConfig"
    @ready="handleMapReady"
  />
</template>

<script setup>
import { ScLayer } from '@your-org/sc-layer';
import { MapType } from '@your-org/sc-layer/types';
import { SearchType } from '@your-org/sc-layer/types/search';
import { ref, reactive } from 'vue';

const mapType = ref(MapType.GAODE);
const mapKey = {
  [MapType.GAODE]: 'your-amap-key'
};

const searchBoxConfig = reactive({
  showTypeSelector: true, // 显示搜索类型选择器
  defaultSearchType: SearchType.KEYWORD, // 默认搜索类型
  searchTypes: [
    {
      type: SearchType.KEYWORD,
      label: '关键词',
      placeholder: '请输入搜索关键词'
    },
    {
      type: SearchType.NEARBY,
      label: '附近',
      placeholder: '请输入附近搜索关键词'
    },
    {
      type: SearchType.DISTRICT,
      label: '行政区',
      placeholder: '请输入行政区名称'
    }
  ],
  // 自定义搜索处理函数
  customSearchHandler: async (type, keyword, options) => {
    if (type === SearchType.CUSTOM) {
      // 处理自定义搜索
      return customResults;
    }
    return null; // 返回 null 让默认处理器处理
  }
});

const handleMapReady = () => {
  const scLayer = scLayerRef.value;
  const searchBox = scLayer.getSearchBox();
  
  // 监听搜索结果
  searchBox.onSearch((results) => {
    console.log('搜索结果:', results);
  });
  
  // 监听搜索类型变化
  searchBox.on('type-change', (type) => {
    console.log('搜索类型变化:', type);
  });
  
  // 手动设置搜索类型
  searchBox.setSearchType(SearchType.NEARBY);
};
</script>
```

### API URLs 配置

ScLayer 组件使用统一的 `apiUrls` 对象来管理所有 API 地址：

```javascript
const apiUrls = {
  search: 'https://restapi.amap.com/v3/place/text',
  detail: 'https://restapi.amap.com/v3/place/detail',
  navigation: 'https://restapi.amap.com/v3/direction/driving',
  boundary: 'https://restapi.amap.com/v3/config/district',
  district: 'https://restapi.amap.com/v3/config/district'
};

// 使用 apiUrls
<ScLayer :api-urls="apiUrls" />
```

## 行政区划选择

ScLayer 组件提供了行政区划选择功能，可以通过 `boundaryOptions` 属性进行配置：

```vue
<template>
  <ScLayer
    :map-key="mapKey"
    :map-type="mapType"
    :boundary-options="boundaryOptions"
    @ready="handleMapReady"
  />
</template>

<script setup>
import { ScLayer } from '@your-org/sc-layer';
import { MapType } from '@your-org/sc-layer/types';
import { ref, reactive } from 'vue';

const mapType = ref(MapType.GAODE);
const mapKey = {
  [MapType.GAODE]: 'your-amap-key'
};

const apiUrls = {
  boundary: 'https://restapi.amap.com/v3/config/district',
  district: 'https://restapi.amap.com/v3/config/district'
};

const boundaryOptions = reactive({
  position: 'top-left',
  apiUrls: apiUrls
});

const handleMapReady = () => {
  const scLayer = scLayerRef.value;
  const boundarySelector = scLayer.getBoundarySelector();
  
  // 监听边界选择
  boundarySelector.onSelect((boundaries) => {
    console.log('选中的边界:', boundaries);
  });
};
</script>
```

## 示例

查看 `examples` 目录中的示例，了解更多使用方法：

- `SearchTypeExample.vue`: 展示如何使用多种搜索类型
- `BoundaryExample.vue`: 展示如何使用行政区划选择功能
- `MarkerExample.vue`: 展示如何管理标记点

## API 参考

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| mapType | MapType | MapType.GAODE | 地图类型 |
| mapKey | Object | {} | 地图 API 密钥 |
| apiUrls | ApiUrls | DEFAULT_API_URLS | API 地址配置 |
| searchBoxConfig | SearchBoxConfig | DEFAULT_SEARCH_BOX_CONFIG | 搜索框配置 |
| boundaryOptions | BoundaryOptions | DEFAULT_BOUNDARY_OPTIONS | 行政区划选择器配置 |

### Events

| 事件名 | 参数 | 说明 |
|-------|------|------|
| ready | - | 地图初始化完成 |
| search | results | 搜索完成 |
| select | result | 选中搜索结果 |
| boundary-select | boundaries | 选中行政区划 |

### Methods

| 方法名 | 参数 | 返回值 | 说明 |
|-------|------|-------|------|
| getMap | - | MapObject | 获取地图对象 |
| getSearchBox | - | SearchBox | 获取搜索框组件 |
| getBoundarySelector | - | BoundarySelector | 获取行政区划选择器组件 |
| getMarkerManager | - | MarkerObject | 获取标记点管理器 |

## 更新日志

### 1.1.0

- 添加多种搜索类型支持
- 统一 API URLs 管理
- 改进行政区划选择器功能

### 1.0.0

- 初始版本发布 