<template>
  <div class="image-example">
    <el-card class="intro-card">
      <template #header>
        <div class="card-header-content">
          <IconifyIconOnline
            icon="ri:image-line"
            :style="{ fontSize: '24px', color: 'var(--el-color-primary)' }"
          />
          <div>
            <h2>ScImage 图片组件</h2>
            <p class="subtitle">强大的图片上传、编辑、比较和背景去除功能</p>
          </div>
        </div>
      </template>

      <el-alert title="提示" type="info" :closable="false">
        <p>
          本组件基于 Element Plus 的 Image
          组件扩展，支持图片编辑、比较、背景去除等高级功能
        </p>
      </el-alert>
    </el-card>

    <!-- 基础用法 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:upload-2-line" /> 基础用法</h3>
      </template>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">默认上传</p>
          <ScImage
            v-model="basicImage"
            width="200px"
            height="200px"
            @change="handleImageChange"
          />
        </div>
        <div class="demo-item">
          <p class="demo-label">禁用操作</p>
          <ScImage
            v-model="disabledImage"
            width="200px"
            height="200px"
            :disabled="true"
          />
        </div>
        <div class="demo-item">
          <p class="demo-label">不显示操作按钮</p>
          <ScImage
            v-model="noActionImage"
            width="200px"
            height="200px"
            :show-actions="false"
          />
        </div>
      </div>
      <CodePreview
        :tabs="[
          {
            key: 'basic',
            label: '基础用法',
            icon: 'ri:code-s-slash-line',
            language: 'vue',
            code: basicCode,
          },
        ]"
        class="mt-3"
      />
    </el-card>

    <!-- 不同尺寸 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:layout-grid-line" /> 不同尺寸</h3>
      </template>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">小尺寸 (150x150)</p>
          <ScImage v-model="sizeImage1" width="150px" height="150px" />
        </div>
        <div class="demo-item">
          <p class="demo-label">中等尺寸 (200x200)</p>
          <ScImage v-model="sizeImage2" width="200px" height="200px" />
        </div>
        <div class="demo-item">
          <p class="demo-label">大尺寸 (250x250)</p>
          <ScImage v-model="sizeImage3" width="250px" height="250px" />
        </div>
      </div>
      <CodePreview
        :tabs="[
          {
            key: 'size',
            label: '尺寸',
            icon: 'ri:code-s-slash-line',
            language: 'vue',
            code: sizeCode,
          },
        ]"
        class="mt-3"
      />
    </el-card>

    <!-- 不同填充模式 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:aspect-ratio-line" /> 填充模式</h3>
      </template>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">Fill</p>
          <ScImage v-model="fitImage" width="200px" height="200px" fit="fill" />
        </div>
        <div class="demo-item">
          <p class="demo-label">Contain</p>
          <ScImage
            v-model="fitImage"
            width="200px"
            height="200px"
            fit="contain"
          />
        </div>
        <div class="demo-item">
          <p class="demo-label">Cover</p>
          <ScImage
            v-model="fitImage"
            width="200px"
            height="200px"
            fit="cover"
          />
        </div>
        <div class="demo-item">
          <p class="demo-label">Scale Down</p>
          <ScImage
            v-model="fitImage"
            width="200px"
            height="200px"
            fit="scale-down"
          />
        </div>
      </div>
      <CodePreview
        :tabs="[
          {
            key: 'fit',
            label: '填充模式',
            icon: 'ri:code-s-slash-line',
            language: 'vue',
            code: fitCode,
          },
        ]"
        class="mt-3"
      />
    </el-card>

    <!-- 图片编辑 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:edit-line" /> 图片编辑功能</h3>
      </template>
      <div class="feature-demo">
        <div class="demo-item">
          <p class="demo-label">
            上传图片后，点击编辑按钮可以进行裁剪、旋转、缩放等操作
          </p>
          <ScImage
            v-model="editImage"
            width="300px"
            height="300px"
            @change="handleEditChange"
          />
        </div>
        <div class="feature-info">
          <h4>编辑功能：</h4>
          <ul>
            <li>
              <el-icon><IconifyIconOnline icon="ri:scissors-line" /></el-icon>
              裁剪
            </li>
            <li>
              <el-icon
                ><IconifyIconOnline icon="ri:rotate-lock-line"
              /></el-icon>
              旋转
            </li>
            <li>
              <el-icon><IconifyIconOnline icon="ri:zoom-in-line" /></el-icon>
              缩放
            </li>
            <li>
              <el-icon
                ><IconifyIconOnline icon="ri:flip-horizontal-line"
              /></el-icon>
              翻转
            </li>
          </ul>
        </div>
      </div>
      <CodePreview
        :tabs="[
          {
            key: 'edit',
            label: '编辑',
            icon: 'ri:code-s-slash-line',
            language: 'vue',
            code: editCode,
          },
        ]"
        class="mt-3"
      />
    </el-card>

    <!-- 编辑器工具栏自定义 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:tools-line" /> 编辑器工具栏自定义</h3>
      </template>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">只显示裁剪和旋转</p>
          <ScImage
            v-model="customEditorImage1"
            width="200px"
            height="200px"
            :editor-show-flip="false"
            :editor-show-scale="false"
            :editor-show-background-tools="false"
          />
        </div>
        <div class="demo-item">
          <p class="demo-label">禁用所有高级功能</p>
          <ScImage
            v-model="customEditorImage2"
            width="200px"
            height="200px"
            :editor-show-upload="false"
            :editor-show-background-tools="false"
          />
        </div>
        <div class="demo-item">
          <p class="demo-label">带上传按钮</p>
          <ScImage
            v-model="customEditorImage3"
            width="200px"
            height="200px"
            :editor-show-upload="true"
          />
        </div>
      </div>
      <CodePreview
        :tabs="[
          {
            key: 'editorToolbar',
            label: '工具栏配置',
            icon: 'ri:code-s-slash-line',
            language: 'vue',
            code: editorToolbarCode,
          },
        ]"
        class="mt-3"
      />
    </el-card>

    <!-- 图片比较 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:contrast-line" /> 图片比较功能</h3>
      </template>
      <div class="feature-demo">
        <div class="demo-item wide">
          <p class="demo-label">
            上传图片后，点击比较按钮选择对比图片，支持滑动和并排比较
          </p>
          <ScImage
            v-model="compareImage"
            width="100%"
            height="400px"
            :enable-compare="true"
            @compare-start="handleCompareStart"
            @compare-end="handleCompareEnd"
            @compare-change="handleCompareChange"
          />
        </div>
      </div>
      <CodePreview
        :tabs="[
          {
            key: 'compare',
            label: '比较',
            icon: 'ri:code-s-slash-line',
            language: 'vue',
            code: compareCode,
          },
        ]"
        class="mt-3"
      />
    </el-card>

    <!-- 自定义配置 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:settings-3-line" /> 自定义配置</h3>
      </template>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">自定义上传提示</p>
          <ScImage
            v-model="customImage1"
            width="200px"
            height="200px"
            upload-tip="仅支持 jpg/png，不超过 5MB"
            :max-size="5"
            accept="image/jpeg,image/png"
          />
        </div>
        <div class="demo-item">
          <p class="demo-label">禁用拖拽上传</p>
          <ScImage
            v-model="customImage2"
            width="200px"
            height="200px"
            :drag="false"
          />
        </div>
        <div class="demo-item">
          <p class="demo-label">禁用下载</p>
          <ScImage
            v-model="customImage3"
            width="200px"
            height="200px"
            :show-download="false"
          />
        </div>
      </div>
      <CodePreview
        :tabs="[
          {
            key: 'custom',
            label: '自定义',
            icon: 'ri:code-s-slash-line',
            language: 'vue',
            code: customCode,
          },
        ]"
        class="mt-3"
      />
    </el-card>

    <!-- 事件回调 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:code-s-slash-line" /> 事件回调</h3>
      </template>
      <div class="event-demo">
        <div class="demo-item">
          <p class="demo-label">上传图片触发事件</p>
          <ScImage
            v-model="eventImage"
            width="250px"
            height="250px"
            @change="handleChange"
            @load="handleLoad"
            @error="handleError"
            @remove="handleRemove"
          />
        </div>
        <div class="event-log">
          <h4>事件日志：</h4>
          <div class="log-container">
            <div
              v-for="(log, index) in eventLogs"
              :key="index"
              class="log-item"
            >
              <span class="log-time">{{ log.time }}</span>
              <span :class="`log-type log-${log.type}`">{{ log.type }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
      <CodePreview
        :tabs="[
          {
            key: 'event',
            label: '事件',
            icon: 'ri:code-s-slash-line',
            language: 'vue',
            code: eventCode,
          },
        ]"
        class="mt-3"
      />
    </el-card>

    <!-- Props 说明 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:file-list-3-line" /> Props 说明</h3>
      </template>
      <el-table :data="propsData" stripe border>
        <el-table-column prop="prop" label="属性" width="200" />
        <el-table-column prop="type" label="类型" width="150" />
        <el-table-column prop="default" label="默认值" width="150" />
        <el-table-column prop="description" label="说明" />
      </el-table>
    </el-card>

    <!-- Events 说明 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:flashlight-line" /> Events 说明</h3>
      </template>
      <el-table :data="eventsData" stripe border>
        <el-table-column prop="event" label="事件名" width="200" />
        <el-table-column prop="params" label="参数" width="200" />
        <el-table-column prop="description" label="说明" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScImage from "@repo/components/ScImage/index.vue";
import CodePreview from "./CodePreview.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";

// 基础示例
const basicImage = ref("");
const disabledImage = ref("https://picsum.photos/200");
const noActionImage = ref("https://picsum.photos/201");

// 尺寸示例
const sizeImage1 = ref("");
const sizeImage2 = ref("");
const sizeImage3 = ref("");

// 填充模式示例
const fitImage = ref("https://picsum.photos/400/300");

// 编辑示例
const editImage = ref("");

// 比较示例
const compareImage = ref("");

// 自定义配置示例
const customImage1 = ref("");
const customImage2 = ref("");
const customImage3 = ref("");

// 编辑器工具栏自定义示例
const customEditorImage1 = ref("");
const customEditorImage2 = ref("");
const customEditorImage3 = ref("");

// 事件示例
const eventImage = ref("");
const eventLogs = ref<Array<{ time: string; type: string; message: string }>>(
  []
);

// 方法
const handleImageChange = (url: string) => {
  console.log("Image changed:", url);
};

const handleEditChange = (url: string) => {
  console.log("Image edited:", url);
  message("图片已更新", { type: "success" });
};

const handleCompareStart = (img1: string, img2: string) => {
  console.log("Compare started:", img1, img2);
  message("已进入比较模式", { type: "info" });
};

const handleCompareEnd = () => {
  console.log("Compare ended");
  message("已退出比较模式", { type: "info" });
};

const handleCompareChange = (value: number) => {
  console.log("Compare value:", value);
};

const addEventLog = (type: string, message: string) => {
  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  eventLogs.value.unshift({ time, type, message });
  if (eventLogs.value.length > 10) {
    eventLogs.value.pop();
  }
};

const handleChange = (url: string) => {
  addEventLog("change", `图片已更新: ${url.substring(0, 30)}...`);
};

const handleLoad = () => {
  addEventLog("load", "图片加载成功");
};

const handleError = () => {
  addEventLog("error", "图片加载失败");
};

const handleRemove = () => {
  addEventLog("remove", "图片已删除");
};

// 代码示例
const basicCode = `<ScImage
  v-model="basicImage"
  width="200px"
  height="200px"
  @change="handleImageChange"
/>`;

const sizeCode = `<ScImage v-model="image1" width="150px" height="150px" />
<ScImage v-model="image2" width="200px" height="200px" />
<ScImage v-model="image3" width="250px" height="250px" />`;

const fitCode = `<ScImage v-model="image" width="200px" height="200px" fit="fill" />
<ScImage v-model="image" width="200px" height="200px" fit="contain" />
<ScImage v-model="image" width="200px" height="200px" fit="cover" />`;

const editCode = `<ScImage
  v-model="editImage"
  width="300px"
  height="300px"
  @change="handleEditChange"
/>`;

const editorToolbarCode = `<!-- 只显示裁剪和旋转 -->
<ScImage
  v-model="image"
  :editor-show-flip="false"
  :editor-show-scale="false"
  :editor-show-background-tools="false"
/>

<!-- 禁用所有高级功能 -->
<ScImage
  v-model="image"
  :editor-show-upload="false"
  :editor-show-background-tools="false"
/>

<!-- 编辑器工具栏配置属性 -->
editorShowUpload: 显示上传按钮
editorShowCrop: 显示裁剪按钮
editorShowRotate: 显示旋转按钮
editorShowFlip: 显示翻转按钮
editorShowScale: 显示缩放滑块
editorShowBackgroundTools: 显示背景工具`;

const compareCode = `<ScImage
  v-model="compareImage"
  width="100%"
  height="400px"
  :enable-compare="true"
  @compare-start="handleCompareStart"
  @compare-end="handleCompareEnd"
  @compare-change="handleCompareChange"
/>`;

const customCode = `<ScImage
  v-model="image"
  width="200px"
  height="200px"
  upload-tip="仅支持 jpg/png，不超过 5MB"
  :max-size="5"
  accept="image/jpeg,image/png"
/>

<ScImage v-model="image" :drag="false" />
<ScImage v-model="image" :show-download="false" />`;

const eventCode = `<ScImage
  v-model="eventImage"
  @change="handleChange"
  @load="handleLoad"
  @error="handleError"
  @remove="handleRemove"
/>`;

// Props 数据
const propsData = [
  {
    prop: "modelValue",
    type: "string",
    default: "''",
    description: "图片地址，支持 v-model",
  },
  {
    prop: "width",
    type: "string",
    default: "'200px'",
    description: "容器宽度",
  },
  {
    prop: "height",
    type: "string",
    default: "'200px'",
    description: "容器高度",
  },
  {
    prop: "fit",
    type: "string",
    default: "'cover'",
    description: "图片填充模式：fill/contain/cover/none/scale-down",
  },
  {
    prop: "accept",
    type: "string",
    default: "'image/jpeg,image/jpg,image/png,image/webp'",
    description: "接受的文件类型",
  },
  {
    prop: "maxSize",
    type: "number",
    default: "10",
    description: "文件大小限制（MB）",
  },
  {
    prop: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  {
    prop: "showActions",
    type: "boolean",
    default: "true",
    description: "是否显示操作按钮",
  },
  {
    prop: "showDownload",
    type: "boolean",
    default: "true",
    description: "是否显示下载按钮",
  },
  {
    prop: "drag",
    type: "boolean",
    default: "true",
    description: "是否启用拖拽上传",
  },
  {
    prop: "enableCompare",
    type: "boolean",
    default: "true",
    description: "是否启用图片比较功能",
  },
  {
    prop: "compareDirection",
    type: "string",
    default: "'horizontal'",
    description: "比较方向：horizontal/vertical",
  },
  {
    prop: "lazy",
    type: "boolean",
    default: "false",
    description: "是否懒加载",
  },
  {
    prop: "previewSrcList",
    type: "array",
    default: "undefined",
    description: "预览图片列表",
  },
  { prop: "zIndex", type: "number", default: "9999", description: "预览层级" },
  {
    prop: "editorShowUpload",
    type: "boolean",
    default: "true",
    description: "编辑器显示上传按钮",
  },
  {
    prop: "editorShowCrop",
    type: "boolean",
    default: "true",
    description: "编辑器显示裁剪按钮",
  },
  {
    prop: "editorShowRotate",
    type: "boolean",
    default: "true",
    description: "编辑器显示旋转按钮",
  },
  {
    prop: "editorShowFlip",
    type: "boolean",
    default: "true",
    description: "编辑器显示翻转按钮",
  },
  {
    prop: "editorShowScale",
    type: "boolean",
    default: "true",
    description: "编辑器显示缩放滑块",
  },
  {
    prop: "editorShowBackgroundTools",
    type: "boolean",
    default: "true",
    description: "编辑器显示背景工具",
  },
];

// Events 数据
const eventsData = [
  {
    event: "update:modelValue",
    params: "url: string",
    description: "图片地址更新时触发",
  },
  { event: "change", params: "url: string", description: "图片改变时触发" },
  { event: "remove", params: "-", description: "图片删除时触发" },
  { event: "load", params: "event", description: "图片加载成功时触发" },
  { event: "error", params: "event", description: "图片加载失败时触发" },
  {
    event: "compareStart",
    params: "img1: string, img2: string",
    description: "开始比较时触发",
  },
  { event: "compareEnd", params: "-", description: "退出比较时触发" },
  {
    event: "compareChange",
    params: "value: number",
    description: "比较滑块变化时触发",
  },
];
</script>

<style scoped>
.image-example {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.intro-card {
  margin-bottom: 24px;
}

.card-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-header-content h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.section-card {
  margin-bottom: 24px;
}

.section-card h3 {
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.demo-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-item.wide {
  width: 100%;
}

.demo-label {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.feature-demo {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.feature-info {
  flex: 1;
  min-width: 300px;
}

.feature-info h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.feature-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-info ul li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.event-demo {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.event-log {
  flex: 1;
  min-width: 300px;
}

.event-log h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  padding: 12px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  margin-bottom: 4px;
  background: var(--el-bg-color);
  border-radius: 4px;
  font-size: 12px;
  font-family: "Courier New", monospace;
}

.log-time {
  color: var(--el-text-color-secondary);
  min-width: 70px;
}

.log-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.log-change {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.log-load {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.log-error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.log-remove {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.log-message {
  flex: 1;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mt-3 {
  margin-top: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .demo-row {
    flex-direction: column;
  }

  .feature-demo,
  .event-demo {
    flex-direction: column;
  }
}
</style>
