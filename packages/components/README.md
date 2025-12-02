# 组件库

## 新增/增强组件

### ScVideo - 视频播放器

**版本**: 2.0.0  
**功能**:

- ✅ 集成 Plyr.js 现代化播放器
- ✅ 支持 HLS/DASH/RTSP 流媒体
- ✅ 多语言支持（中文/英文）
- ✅ 清晰度切换
- ✅ 播放速度调节
- ✅ 画中画模式
- ✅ 字幕支持
- ✅ 自定义主题色

**使用示例**:

```vue
<ScVideo
  src="https://example.com/video.m3u8"
  poster="https://example.com/poster.jpg"
  :qualities="[
    { label: '1080P', value: 1080, src: 'url1' },
    { label: '720P', value: 720, src: 'url2' }
  ]"
  language="zh"
  theme="#00b3ff"
  type="hls"
/>
```

### ScTip - 提示组件

**版本**: 1.0.0  
**功能**:

- ✅ 封装 el-tooltip 所有功能
- ✅ 支持 TypeIt 打字机动画效果
- ✅ 支持所有 slot
- ✅ 自定义触发方式

**使用示例**:

```vue
<ScTip content="这是提示内容" placement="top">
  <el-button>悬停查看</el-button>
</ScTip>

<!-- 打字机效果 -->
<ScTip content="这段文字会有打字机效果" typeit :typeit-speed="50">
  <el-button>打字机提示</el-button>
</ScTip>
```

### ScUpload - 上传组件（增强）

**版本**: 2.0.0  
**新增功能**:

- ✅ 支持 Ctrl+V 粘贴上传
- ✅ 图片裁剪和缩放
- ✅ 拖拽上传
- ✅ 自动压缩
- ✅ 简化使用（像 el-input 一样）

**使用示例**:

```vue
<ScUpload v-model="imageUrl" :cropper="true" :enable-paste="true" :aspect-ratio="16 / 9" placeholder="支持粘贴上传" />
```

### ScContainer - 容器布局（新增）

**版本**: 1.0.0  
**功能**:

- ✅ 封装 el-container 系列
- ✅ 支持拖拽调整各区域大小
- ✅ Header/Aside/Footer 可调整
- ✅ 最小尺寸限制
- ✅ 响应式布局

**使用示例**:

```vue
<ScContainer :resizable="true" header-height="60px" aside-width="200px" footer-height="60px" @resize="handleResize">
  <template #header>头部内容</template>
  <template #aside>侧边栏</template>
  <template #default>主内容</template>
  <template #footer>底部</template>
</ScContainer>
```

### ScImage - 图片组件（增强）

**版本**: 2.0.0  
**功能**:

- ✅ 封装 el-image 所有功能
- ✅ 集成 PhotoSwipe 预览
- ✅ 默认占位图片
- ✅ 多种主题（default/poster/card/avatar）
- ✅ 遮罩层和操作按钮
- ✅ 下载功能

**使用示例**:

```vue
<!-- 默认模式 -->
<ScImage src="image.jpg" />

<!-- 海报主题 -->
<ScImage src="poster.jpg" theme="poster" :show-mask="true" :downloadable="true" />

<!-- 卡片主题 -->
<ScImage src="card.jpg" theme="card" fit="cover" />

<!-- 头像模式 -->
<ScImage src="avatar.jpg" theme="avatar" />
```

## 组件替换指南

### 替换 el-image

```vue
<!-- 旧代码 -->
<el-image :src="url" fit="cover" />

<!-- 新代码 -->
<ScImage :src="url" fit="cover" />
```

### 替换 el-tooltip

```vue
<!-- 旧代码 -->
<el-tooltip content="提示">
  <el-button>按钮</el-button>
</el-tooltip>

<!-- 新代码 -->
<ScTip content="提示">
  <el-button>按钮</el-button>
</ScTip>
```

### 替换视频播放器

```vue
<!-- 旧代码 -->
<video :src="url" controls />

<!-- 新代码 -->
<ScVideo :src="url" />
```

### 替换 el-container

```vue
<!-- 旧代码 -->
<el-container>
  <el-header>Header</el-header>
  <el-main>Main</el-main>
</el-container>

<!-- 新代码 -->
<ScContainer :resizable="true">
  <template #header>Header</template>
  <template #default>Main</template>
</ScContainer>
```

## 依赖安装

```bash
pnpm install plyr hls.js typeit photoswipe
```
