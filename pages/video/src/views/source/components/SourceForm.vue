<template>
  <div class="source-form thin-scroller">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="left"
      class="form-container flex flex-row gap-6 flex-1"
    >
      <div class="form-section flex-1">
        <h4 class="section-title">
          <IconifyIconOnline icon="ep:info-filled" class="section-icon" />
          基础信息
        </h4>

        <el-form-item label="数据源名称" prop="videoSourceName">
          <el-input
            v-model="formData.videoSourceName"
            placeholder="请输入数据源名称，如：观影AC、PanSou等"
            maxlength="50"
            show-word-limit
          >
            <template #prefix>
              <IconifyIconOnline icon="ep:video-camera" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="平台名称" prop="videoSourcePlatform">
          <el-input
            v-model="formData.videoSourcePlatform"
            placeholder="请输入视频源平台名称，如：观影AC、PanSou等"
            maxlength="50"
            show-word-limit
          >
            <template #prefix>
              <IconifyIconOnline icon="ep:video-camera" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="数据源图标" prop="videoSourceIcon">
          <IconSelect v-model="formData.videoSourceIcon"> </IconSelect>
        </el-form-item>

        <el-form-item label="视频源URL" prop="videoSourceUrl">
          <el-input
            v-model="formData.videoSourceUrl"
            placeholder="请输入视频源的API地址或网站URL"
            type="url"
          >
            <template #prefix>
              <IconifyIconOnline icon="ep:link" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="启用状态" prop="videoSourceEnable">
          <ScSwitch
            v-model="formData.videoSourceEnable"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
            layout="modern"
          />
        </el-form-item>
      </div>

      <div class="form-section flex-1">
        <h4 class="section-title">
          <IconifyIconOnline icon="ep:setting" class="section-icon" />
          配置参数
        </h4>

        <el-form-item label="最大查询数" prop="videoSourceMaxResource">
          <el-input-number
            v-model="formData.videoSourceMaxResource"
            :min="0"
            :max="10000"
            :step="10"
            placeholder="0表示无限制"
            controls-position="right"
            class="w-full"
          />
          <div class="form-tip">
            设置单次查询返回的最大资源数量，0表示无限制
          </div>
        </el-form-item>

        <el-form-item label="最大查询时间" prop="videoSourceConnectTimeout">
          <el-input-number
            v-model="formData.videoSourceConnectTimeout"
            type="number"
            placeholder="最大查询时间"
            controls-position="right"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="访问Token" prop="videoSourceToken">
          <el-input
            v-model="formData.videoSourceToken"
            placeholder="如果API需要认证，请输入访问Token"
            type="password"
            show-password
          >
            <template #prefix>
              <IconifyIconOnline icon="ep:key" />
            </template>
          </el-input>
          <div class="form-tip">用于API认证的Token，如果不需要认证可留空</div>
        </el-form-item>

        <el-form-item label="支持类型" prop="videoSourceType">
          <el-select
            v-model="formData.videoSourceType"
            multiple
            placeholder="请输入支持的视频类型，如：movie、tv等"
          >
            <el-option
              v-for="item in allCategories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="支持检索">
          <ScSwitch
            v-model="formData.videoSourceSupportSearch"
            layout="modern"
            active-text="支持"
            inactive-text="不支持"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>

        <el-form-item label="支持同步">
          <ScSwitch
            v-model="formData.videoSourceSupportSync"
            layout="modern"
            active-text="支持"
            inactive-text="不支持"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>

        <el-form-item label="User Agent" prop="videoSourceUserAgent">
          <el-input
            class="w-[80%]"
            v-model="formData.videoSourceUserAgent"
            placeholder="请输入User Agent，或点击生成按钮自动生成"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
          >
          </el-input>
          <div class="form-tip flex flex-row items-center gap-2">
            <span>自定义请求头User Agent，用于模拟不同浏览器访问</span>
            <IconifyIconOnline
              class="cursor-pointer"
              class-name="ml-2"
              @click="generateRandomUserAgent"
              icon="ep:refresh"
            />
          </div>
        </el-form-item>

        <el-form-item label="最小年份" prop="videoSourceMinYear">
          <el-input-number
            v-model="formData.videoSourceMinYear"
            :min="1900"
            :max="2024"
            :step="1"
            placeholder="请输入最小年份"
            controls-position="right"
            class="w-full"
          />
          <div class="form-tip">设置查询的最小年份，0表示无限制</div>
        </el-form-item>
      </div>
    </el-form>
    <div class="form-section flex-1">
      <h4 class="section-title">
        <IconifyIconOnline icon="ep:cpu" class="section-icon" />
        预设模板
      </h4>

      <div class="template-grid">
        <div
          v-for="template in templates"
          :key="template.name"
          class="template-card"
          :class="{ active: selectedTemplate === template.name }"
          @click="applyTemplate(template)"
        >
          <div class="template-icon">
            <IconifyIconOnline :icon="template.icon" />
          </div>
          <div class="template-info">
            <h5 class="template-name">{{ template.name }}</h5>
            <p class="template-desc">{{ template.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="form-actions absolute bottom-2 right-10">
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        {{ isEdit ? "更新" : "添加" }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 视频源表单组件
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */
import { IconSelect } from "@repo/components/ReIcon";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { clearObject } from "@repo/utils";
import type { FormInstance, FormRules } from "element-plus";
import { computed, reactive, ref, watch } from "vue";
import type { VideoSource } from "../../../api/types";
import { allCategories } from "../../../data/categories";

// 组件属性
interface Props {
  source?: VideoSource | null;
}

const props = defineProps<Props>();

// 组件事件
interface Emits {
  submit: [data: VideoSource];
  cancel: [];
}

const emit = defineEmits<Emits>();

// 响应式数据
const formRef = ref<FormInstance>();
const submitting = ref(false);
const selectedTemplate = ref("");

// 表单数据
const formData = reactive<VideoSource>({
  videoSourceId: 0,
  videoSourcePlatform: "",
  // 支持检索
  videoSourceSupportSearch: 0,
  videoSourceConnectTimeout: 100000,
  // 支持同步
  videoSourceSupportSync: 0,
  videoSourceName: "",
  videoSourceIcon: "",
  videoSourceType: "",
  videoSourceUrl: "",
  videoSourceEnable: 1,
  videoSourceMinYear: 1970,
  videoSourceMaxResource: 100,
  videoSourceToken: "",
  videoSourceUserAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
});

// 计算属性
const isEdit = computed(() => !!props.source?.videoSourceId);

// 表单验证规则
const formRules: FormRules = {
  videoSourcePlatform: [
    { required: true, message: "请输入平台名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "平台名称长度在 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  videoSourceName: [
    { required: true, message: "请输入数据源名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "数据源名称长度在 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  videoSourceUserAgent: [
    { required: true, message: "请输入User Agent", trigger: "blur" },
    {
      min: 10,
      max: 500,
      message: "User Agent长度在 10 到 500 个字符",
      trigger: "blur",
    },
  ],
  videoSourceMaxResource: [
    {
      type: "number",
      min: 0,
      max: 10000,
      message: "最大查询数范围为 0-10000",
      trigger: "blur",
    },
  ],
};

// 预设模板
const templates = [
  {
    name: "观影",
    icon: "ep:film",
    description: "观影视频源配置",
    config: {
      videoSourceName: "观影",
      videoSourcePlatform: "GUANYING",
      videoSourceUrl: "https://api.guanyingmv.com",
      videoSourceMaxResource: 50,
      videoSourceUserAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  },
  {
    name: "豆瓣",
    icon: "simple-icons:douban",
    description: "豆瓣视频源配置",
    config: {
      videoSourceName: "豆瓣",
      videoSourcePlatform: "DOUBAN",
      videoSourceUrl: "https://api.douban.com",
      videoSourceMaxResource: 50,
      videoSourceUserAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    },
  },
  {
    name: "PanSou",
    icon: "ep:folder-opened",
    description: "PanSou网盘搜索配置",
    config: {
      videoSourceName: "盘搜",
      videoSourcePlatform: "PanSou",
      videoSourceUrl: "https://api.pansou.com",
      videoSourceMaxResource: 500,
      videoSourceUserAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  },
  {
    name: "TMDB",
    icon: "ep:folder-opened",
    description: "TMDB配置",
    config: {
      videoSourceName: "TMDB",
      videoSourcePlatform: "TMDB",
      videoSourceUrl: "https://api.themoviedb.org/3/discover/movie",
      videoSourceMaxResource: 500,
      videoSourceUserAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    },
  },
];

/**
 * 应用模板配置
 * @param template 模板配置
 */
const applyTemplate = (template: any) => {
  selectedTemplate.value = template.name;
  Object.assign(formData, template.config);
};

/**
 * 随机生成User Agent
 */
const generateRandomUserAgent = () => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0",
    "Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  ];

  const randomIndex = Math.floor(Math.random() * userAgents.length);
  formData.videoSourceUserAgent = userAgents[randomIndex];
};

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    const submitData = { ...formData };
    if (isEdit.value && props.source) {
      submitData.videoSourceId = props.source.videoSourceId;
    }

    emit("submit", submitData);
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    submitting.value = false;
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  selectedTemplate.value = "";
};

// 监听props变化，初始化表单数据
watch(
  () => props.source,
  (newSource) => {
    if (newSource) {
      clearObject(formData);
      Object.assign(formData, newSource);
    } else {
      resetForm();
      // 设置默认值
      Object.assign(formData, {
        videoSourceId: 0,
        videoSourcePlatform: "",
        videoSourceName: "",
        videoSourceIcon: "",
        videoSourceUrl: "",
        videoSourceEnable: 1,
        videoSourceMaxResource: 100,
        videoSourceToken: "",
        videoSourceUserAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
    }
  },
  { immediate: true }
);

// 暴露方法
defineExpose({
  resetForm,
});
</script>

<style scoped lang="scss">
.source-form {
  max-height: 70vh;
  overflow-y: auto;
}

.form-container {
  padding: 0;
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
  border-radius: 8px;
  border-left: 4px solid var(--el-color-primary);
}

.section-icon {
  color: var(--el-color-primary);
  font-size: 20px;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-primary);
  margin-top: 4px;
  line-height: 1.4;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-bg-color-overlay);
}

.template-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.15);
  transform: translateY(-2px);
}

.template-card.active {
  border-color: var(--el-color-primary);
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
  box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.2);
}

.template-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-primary);
  font-size: 18px;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.template-desc {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 24px;
}

.form-actions .el-button {
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
  transition: all 0.3s ease;
}

.form-actions .el-button:hover {
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
  transform: translateY(-2px);
}

/* 表单项样式优化 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__prefix) {
  color: var(--el-text-color-primary);
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-switch) {
  height: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-grid {
    grid-template-columns: 1fr;
  }

  .template-card {
    padding: 12px;
  }

  .template-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>
