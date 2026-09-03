# vue-support-geo-starter

GeoDownloader Web 版前端 —— 地理空间数据下载工具的 Vue 3 应用。

对应后端模块：[`spring-api-support-geo-starter`](../../../spring-support-api-starter/spring-api-support-geo-starter/README.md)（Spring Boot，端口 18171）。

## 功能清单

支持六种下载/预览模式，通过工作台左侧菜单切换：

| 模式 | 页面 | 说明 |
|---|---|---|
| 影像 | `Workspace.vue` | 高分影像瓦片下载（图源/缩放级别/输出格式/压缩/并发/金字塔/元数据） |
| 高程 | `Workspace.vue` | DEM 高程数据下载（Terrarium → GeoTIFF） |
| 历史影像 | `Workspace.vue` | Esri Wayback 历史影像（真实版本列表 + 探测最大级别） |
| 3D 模型 | `Workspace.vue` | 3D Tiles 资产下载（Cesium Ion / 自定义 URL / 分析结构） |
| 矢量瓦片 | `Workspace.vue` | MVT 矢量瓦片服务地址预览（{z}/{x}/{y} 模板） |
| OSM 矢量 | `Workspace.vue` | OpenStreetMap 矢量数据（Overpass 查询 + bbox 填入） |

辅助视图：

| 视图 | 路由 | 说明 |
|---|---|---|
| 任务中心 | `/#/tasks` | 任务列表 + 轮询刷新 + 取消/删除 |
| 下载历史 | `/#/history` | 历史分页表格 + 重建金字塔 + 清空 |
| 设置 | `/#/settings` | Token / 代理 / 并发 / 缩放 / 格式 / 证书 / 缓存 |

## 技术栈

- **Vue 3** + **TypeScript** + Vite 8（monorepo 共享构建配置 `turbo/vite/createVite.ts`）
- **Element Plus** — UI 组件
- **Pinia** — 状态（selection 选区 / settings 设置）
- **Vue Router** — Hash 路由（单页）
- **Leaflet** — 地图渲染与选区绘制（GeoMap.vue）
- **Axios** — HTTP 客户端（不拆包，后端直接返回原始 JSON）

## 依赖位置

补充依赖声明在本应用的 `package.json`：

```jsonc
// apps/vue-support-geo-starter/package.json
"dependencies": {
  "@element-plus/icons-vue": "catalog:",  // Element Plus 图标
  "@repo/app": "workspace:*",             // 应用骨架（createVite / 主题）
  "@repo/core": "workspace:*",            // 共享核心逻辑
  "@repo/ui": "workspace:*",              // 共享组件库
  "@repo/utils": "workspace:*",           // 共享工具库
  "axios": "catalog:",                    // HTTP
  "element-plus": "catalog:",             // UI
  "leaflet": "catalog:",                  // 地图
  "pinia": "catalog:",                    // 状态
  "vue": "catalog:",
  "vue-router": "catalog:"                // 路由
},
"devDependencies": {
  "@types/leaflet": "^1.9.12",            // Leaflet 类型
  "vue-tsc": "catalog:",                   // 类型检查
  "vite": "catalog:"
}
```

> 版本统一通过 `pnpm-workspace.yaml` 的 `catalog:` 管理；应用自身仅新增
> `leaflet`、`@types/leaflet`（地图）两个补充依赖，其余复用 monorepo 既有包。

## 开发启动

```bash
# 1. 启动后端（端口 18171）
cd spring-support-api-starter/spring-api-support-geo-starter
mvn spring-boot:run

# 2. 启动前端（端口 8095，/geo/api 代理到 18171）
cd vue-support-parent-starter/apps/vue-support-geo-starter
pnpm dev
```

## 生产部署（本机服务器）

前后端分离部署：前端静态产物由 Vite Preview 托管（端口 **8888**），后端保持 18171，`/geo/api` 反向代理到后端。

```bash
# 1. 构建前端产物（dist/）
cd vue-support-parent-starter/apps/vue-support-geo-starter
node ../../node_modules/vite/bin/vite.js build

# 2. 启动后端（端口 18171）
cd spring-support-api-starter/spring-api-support-geo-starter/target
java -Xmx512m -jar spring-api-support-geo-starter-4.0.0.42.jar

# 3. 托管前端（端口 8888，preview 已配置 /geo/api 反代）
cd vue-support-parent-starter/apps/vue-support-geo-starter
node ../../node_modules/vite/bin/vite.js preview --port 8888 --strictPort
```

访问：`http://localhost:8888`（preview 配置见 `vite.config.ts` 的 `preview` 节点）。

> **运维提示**：若环境会周期清理 Java 后台进程，可用 Windows 计划任务常驻后端，
> 批处理脚本参考 `C:\Users\Administrator\AppData\Local\Temp\opencode\geo-start.bat`，
> 重启命令：`schtasks /run /tn "GeoBackend"`。

浏览器访问：`http://localhost:8095`

## 目录结构

```
src/
├── api/          # 后端接口封装（tile/dem/wayback/tiles3d/mvt/osm/settings/history/sources/assistant/update）
├── components/
│   ├── GeoMap.vue            # Leaflet 地图容器（底图切换 + 选区绘制 + 手动四至）
│   └── panels/               # 六种模式的参数面板
├── constants/
│   └── modes.ts              # 模式定义 + 输出格式/压缩选项
├── store/                    # Pinia（selection 选区、settings 设置）
├── types/index.ts            # 接口类型定义
└── views/                    # Workspace / Tasks / History / Settings
```

## 与后端协作约定

- 前端 axios `baseURL = "/geo/api"`，由 Vite 代理转发到 `http://localhost:18171`。
- 后端返回**原始 JSON**（不拆 `code/data`），前端 `http.ts` 拦截器直接返回 `response.data`。
- 任务状态枚举：`pending / downloading / merging / processing / exporting / building_pyramid / completed / completed_with_gaps / failed / cancelled / paused / pending_decision`。
