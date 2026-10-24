/**
 * Re* 组件注册表 —— 主页卡片 + 调试页路由驱动
 *
 * 每条记录包含：
 *   - name: 组件名（PascalCase，与 packages/ui/src/components/<name> 对应）
 *   - title: 中文标题（卡片展示）
 *   - description: 一句话说明（来自组件 index.ts 顶部注释）
 *   - category: 分类（用于首页分组）
 *   - icon: el-icon 组件名（用于卡片角标）
 *
 * 路由 /debug/:name 接收 name，从 templateMap 中查找 schema；
 * 无 schema 的组件进入"通用调试"模式（原始 props 编辑器 + 实时预览）。
 */

export type ComponentCategory =
  | "basic"
  | "feedback"
  | "data"
  | "form"
  | "navigation"
  | "media"
  | "chat"
  | "chart"
  | "utility";

export interface ComponentMeta {
  /** 组件名 PascalCase */
  name: string;
  /** 中文标题 */
  title: string;
  /** 一句话描述 */
  description: string;
  /** 分类 */
  category: ComponentCategory;
  /** el-icon 组件名（卡片左上角图标） */
  icon: string;
}

/** 分类中文映射 */
export const categoryLabel: Record<ComponentCategory, string> = {
  basic: "基础",
  feedback: "反馈",
  data: "数据展示",
  form: "表单",
  navigation: "导航/容器",
  media: "多媒体",
  chat: "聊天/AI",
  chart: "图表",
  utility: "工具",
};

/** 分类顺序（首页分组渲染顺序） */
export const categoryOrder: ComponentCategory[] = [
  "basic",
  "feedback",
  "data",
  "form",
  "navigation",
  "media",
  "chat",
  "chart",
  "utility",
];

export const registry: ComponentMeta[] = [
  // ========== 基础 ==========
  { name: "ReButton", title: "按钮", description: "按钮组件（el-button 封装，支持主题加载）", category: "basic", icon: "Pointer" },
  { name: "ReInput", title: "输入框", description: "输入框组件（el-input 封装）", category: "basic", icon: "EditPen" },
  { name: "ReText", title: "文本", description: "文本组件（统一排版与省略号处理）", category: "basic", icon: "Tickets" },
  { name: "ReTag", title: "标签", description: "标签组件（按主题加载，default/koi）", category: "basic", icon: "CollectionTag" },
  { name: "ReBadge", title: "徽标", description: "徽标组件（el-badge 封装，支持呼吸动画）", category: "basic", icon: "Bell" },
  { name: "ReIcon", title: "图标", description: "通用图标组件（按主题加载，支持多源图标）", category: "basic", icon: "PictureFilled" },
  { name: "ReSwitch", title: "开关", description: "卡片式开关组件（支持 tip + 小标题 + 副标题）", category: "basic", icon: "Switch" },
  { name: "ReCard", title: "卡片", description: "卡片容器（按主题加载）", category: "basic", icon: "Postcard" },

  // ========== 反馈 ==========
  { name: "ReEmpty", title: "空状态", description: "空状态组件（el-empty 封装）", category: "feedback", icon: "Box" },
  { name: "ReSkeleton", title: "骨架屏", description: "骨架屏组件（占位加载）", category: "feedback", icon: "Loading" },
  { name: "ReLoading", title: "加载中", description: "加载动画组件（指令 + 容器）", category: "feedback", icon: "Refresh" },
  { name: "ReStatusIndicator", title: "状态指示", description: "状态指示器（在线/离线/繁忙 等）", category: "feedback", icon: "Connection" },
  { name: "ReStationMessage", title: "站内消息", description: "站内消息气泡组件", category: "feedback", icon: "ChatLineSquare" },

  // ========== 数据展示 ==========
  { name: "ReStat", title: "统计数值", description: "统计数值卡片（大数字 + 描述）", category: "data", icon: "DataLine" },
  { name: "ReTrend", title: "趋势", description: "趋势图组件（涨跌走势）", category: "data", icon: "TrendCharts" },
  { name: "ReCountup", title: "数字滚动", description: "数字滚动组件（countup.js 封装）", category: "data", icon: "Odometer" },
  { name: "ReTime", title: "时间", description: "时间格式化组件（相对时间 / 自定义格式）", category: "data", icon: "Clock" },
  { name: "ReTypeIt", title: "打字机", description: "打字机效果组件（typeit.js 封装）", category: "data", icon: "Edit" },
  { name: "ReTimeline", title: "时间线", description: "时间线组件（事件列表）", category: "data", icon: "List" },
  { name: "RePagination", title: "分页", description: "分页组件（el-pagination 封装）", category: "data", icon: "Files" },
  { name: "ReTable", title: "表格", description: "表格组件（基于 el-table）", category: "data", icon: "Grid" },
  { name: "ReTagFilter", title: "标签筛选", description: "标签筛选器（多选标签）", category: "data", icon: "Filter" },

  // ========== 表单 ==========
  { name: "ReForm", title: "表单", description: "表单组件（el-form 封装，支持配置驱动）", category: "form", icon: "Memo" },
  { name: "ReSelect", title: "下拉选择", description: "下拉选择组件（el-select 封装）", category: "form", icon: "CaretBottom" },
  { name: "ReDatePicker", title: "日期选择", description: "日期选择器（el-date-picker 封装）", category: "form", icon: "Calendar" },
  { name: "ReCron", title: "Cron 表达式", description: "Cron 表达式生成器（可视化面板 + 触发时间预览）", category: "form", icon: "AlarmClock" },
  { name: "ReTree", title: "树形控件", description: "树形控件（基于 el-tree）", category: "form", icon: "Share" },
  { name: "ReFilePicker", title: "文件选择", description: "文件/目录选择器（filesystem 远端 loader 或本地 JSON data）", category: "form", icon: "FolderOpened" },
  { name: "ReUpload", title: "上传", description: "上传组件（el-upload 封装）", category: "form", icon: "UploadFilled" },
  { name: "ReUploadChunk", title: "分片上传", description: "分片上传组件（大文件切片）", category: "form", icon: "Upload" },
  { name: "ReSearch", title: "搜索", description: "横向搜索条（徽标+字段+按钮，右上角折叠）", category: "form", icon: "Search" },
  { name: "ReCode", title: "验证码", description: "验证码输入组件（多位自动跳转）", category: "form", icon: "Key" },
  { name: "ReIp", title: "IP 输入", description: "IP 地址输入组件（4 段式）", category: "form", icon: "Position" },
  { name: "ReIconSelect", title: "图标选择", description: "图标选择器（按主题切换图标源）", category: "form", icon: "Star" },

  // ========== 导航/容器 ==========
  { name: "ReDialog", title: "对话框", description: "对话框组件（按主题加载）", category: "navigation", icon: "ChatLineRound" },
  { name: "ReDrawer", title: "抽屉", description: "抽屉组件（按主题加载）", category: "navigation", icon: "Expand" },
  { name: "ReTab", title: "标签页", description: "标签页组件（多 variant）", category: "navigation", icon: "Menu" },
  { name: "ReBreadcrumb", title: "面包屑", description: "面包屑组件（el-breadcrumb 封装）", category: "navigation", icon: "Promotion" },
  { name: "ReScrollbar", title: "滚动条", description: "自定义滚动条（美化原生滚动）", category: "navigation", icon: "Files" },
  { name: "ReScrollNav", title: "滚动导航", description: "横向滚动导航菜单", category: "navigation", icon: "More" },
  { name: "ReSeamlessScroll", title: "无缝滚动", description: "无缝滚动组件（自动轮播列表）", category: "navigation", icon: "Refresh" },

  // ========== 多媒体 ==========
  { name: "ReImage", title: "图片", description: "图片组件（懒加载 + 预览）", category: "media", icon: "Picture" },
  { name: "ReImageGroup", title: "图片组", description: "图片列表（IntersectionObserver 异步懒加载）", category: "media", icon: "PictureFilled" },
  { name: "ReImageCompare", title: "图片对比", description: "图片对比组件（拖拽滑块）", category: "media", icon: "Files" },
  { name: "ReAvatarCrop", title: "头像裁剪", description: "头像裁剪组件（cropperjs）", category: "media", icon: "Crop" },
  { name: "ReImageGen", title: "图像生成", description: "AI 图像生成组件", category: "media", icon: "MagicStick" },
  { name: "ReVideoGen", title: "视频生成", description: "AI 视频生成组件", category: "media", icon: "VideoCamera" },
  { name: "ReAlbum", title: "相册", description: "相册组件（图片预览）", category: "media", icon: "Camera" },
  { name: "ReCarousel", title: "轮播", description: "轮播图组件（el-carousel 封装）", category: "media", icon: "VideoPlay" },
  { name: "ReCropper", title: "图片裁剪", description: "图片裁剪组件（cropperjs）", category: "media", icon: "Crop" },
  { name: "ReClineCharacter", title: "ASCII 角色", description: "支持 ASCII 字符画 / 图片转字符画 / 默认 Cline 机器人的 3D 浮动动画", category: "media", icon: "MagicStick" },
  { name: "ReAvatar3D", title: "3D 角色", description: "3D GLB 模型角色加载器（GLTFLoader + OrbitControls）", category: "media", icon: "VideoCameraFilled" },
  { name: "ReThree", title: "3D 画布", description: "通用 Three.js 渲染画布（支持自定义 render/animate 回调）", category: "chart", icon: "FullScreen" },

  // ========== 聊天/AI ==========
  { name: "ReChat", title: "聊天", description: "聊天组件（vue-advanced-chat 封装）", category: "chat", icon: "ChatDotRound" },
  { name: "ReRagChat", title: "RAG 对话", description: "RAG 知识库对话组件", category: "chat", icon: "ChatLineSquare" },
  { name: "ReRagManager", title: "RAG 管理", description: "RAG 知识库管理组件", category: "chat", icon: "Coin" },

  // ========== 图表 ==========
  { name: "ReEcharts", title: "ECharts", description: "ECharts 图表组件（封装）", category: "chart", icon: "PieChart" },
  { name: "ReGraph", title: "关系图", description: "关系图组件（AntV X6）", category: "chart", icon: "Share" },
  { name: "ReGraphCenter", title: "中心布局", description: "中心布局关系图", category: "chart", icon: "Aim" },
  { name: "ReGraphCircle", title: "环形布局", description: "环形布局关系图", category: "chart", icon: "Refresh" },
  { name: "ReGraphFixed", title: "固定布局", description: "固定坐标关系图", category: "chart", icon: "Lock" },
  { name: "ReGraphForce", title: "力导布局", description: "力导向关系图", category: "chart", icon: "Connection" },
  { name: "ReGraphMind", title: "思维导图", description: "思维导图关系图", category: "chart", icon: "Share" },
  { name: "ReRelationGraph", title: "关系图谱", description: "G6 内核：多布局 / 搜索定位 / 撤销重做 / 图片导出 / 拖边连线 / 节点内容插槽 / 2D-3D 切换", category: "chart", icon: "Connection" },
  { name: "ReRelationGraphV2", title: "关系图谱V2", description: "G6 5.1.1 原生：气泡集 / Hull 双分组轮廓 / 分组布局 / 全部 G6 布局 / 内置工具栏 / 节点边 hover", category: "chart", icon: "Share" },
  { name: "ReGraphTree", title: "树形图", description: "树形布局关系图", category: "chart", icon: "Share" },
  { name: "ReGraph3D", title: "3D 关系图", description: "3D 力导向关系图（three.js + d3-force）", category: "chart", icon: "MagicStick" },
  { name: "ReColorize", title: "色彩化", description: "文本色彩化（关键词高亮）", category: "chart", icon: "Brush" },

  // ========== 工具 ==========
  { name: "ReLazy", title: "懒加载", description: "懒加载容器（IntersectionObserver）", category: "utility", icon: "View" },
];

/** 通过 name 索引 */
export const metaByName = new Map<string, ComponentMeta>(registry.map((m) => [m.name, m]));