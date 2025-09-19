<template>
  <div class="source-form thin-scroller">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left" class="form-container flex flex-row gap-6 flex-1">
      <div class="form-section flex-1">
        <h4 class="section-title">
          <IconifyIconOnline icon="ep:info-filled" class="section-icon" />
          基础信息
        </h4>

        <el-form-item label="数据源名称" prop="videoSourceName">
          <el-input v-model="formData.videoSourceName" placeholder="请输入数据源名称，如：观影AC、PanSou等" maxlength="50" show-word-limit>
            <template #prefix>
              <IconifyIconOnline icon="ep:video-camera" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="平台名称" prop="videoSourcePlatform">
          <el-input v-model="formData.videoSourcePlatform" placeholder="请输入视频源平台名称，如：观影AC、PanSou等" maxlength="50" show-word-limit>
            <template #prefix>
              <IconifyIconOnline icon="ep:video-camera" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="数据源图标" prop="videoSourceIcon">
          <IconSelect v-model="formData.videoSourceIcon"> </IconSelect>
        </el-form-item>

        <el-form-item label="视频源URL" prop="videoSourceUrl">
          <el-input v-model="formData.videoSourceUrl" placeholder="请输入视频源的API地址或网站URL" type="url">
            <template #prefix>
              <IconifyIconOnline icon="ep:link" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="启用状态" prop="videoSourceEnable">
          <el-switch v-model="formData.videoSourceEnable" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" active-color="#67c23a" inactive-color="#f56c6c" />
        </el-form-item>
      </div>

      <div class="form-section flex-1">
        <h4 class="section-title">
          <IconifyIconOnline icon="ep:setting" class="section-icon" />
          配置参数
        </h4>

        <el-form-item label="最大查询数" prop="videoSourceMaxResource">
          <el-input-number v-model="formData.videoSourceMaxResource" :min="0" :max="10000" :step="10" placeholder="0表示无限制" controls-position="right" class="w-full" />
          <div class="form-tip">设置单次查询返回的最大资源数量，0表示无限制</div>
        </el-form-item>

        <el-form-item label="访问Token" prop="videoSourceToken">
          <el-input v-model="formData.videoSourceToken" placeholder="如果API需要认证，请输入访问Token" type="password" show-password>
            <template #prefix>
              <IconifyIconOnline icon="ep:key" />
            </template>
          </el-input>
          <div class="form-tip">用于API认证的Token，如果不需要认证可留空</div>
        </el-form-item>

        <el-form-item label="支持类型" prop="videoSourceType">
          <el-select v-model="formData.videoSourceType" multiple placeholder="请输入支持的视频类型，如：movie、tv等">
            <el-option v-for="item in allCategories" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="User Agent" prop="videoSourceUserAgent">
          <el-input v-model="formData.videoSourceUserAgent" placeholder="自定义User Agent，留空使用默认值" type="textarea" :rows="2" maxlength="500" show-word-limit> </el-input>
          <div class="form-tip">自定义请求头User Agent，用于模拟不同浏览器访问</div>
        </el-form-item>

        <el-form-item label="最小年份" prop="videoSourceMinYear">
          <el-input-number v-model="formData.videoSourceMinYear" :min="1900" :max="2024" :step="1" placeholder="请输入最小年份" controls-position="right" class="w-full" />
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
        <div v-for="template in templates" :key="template.name" class="template-card" :class="{ active: selectedTemplate === template.name }" @click="applyTemplate(template)">
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
  videoSourceName: "",
  videoSourceIcon: "",
  videoSourceType: "",
  videoSourceUrl: "",
  videoSourceEnable: 1,
  videoSourceMinYear: 1970,
  videoSourceMaxResource: 100,
  videoSourceToken: "",
  videoSourceUserAgent: "",
});

// 计算属性
const isEdit = computed(() => !!props.source?.videoSourceId);

// 表单验证规则
const formRules: FormRules = {
  videoSourcePlatform: [
    { required: true, message: "请输入平台名称", trigger: "blur" },
    { min: 2, max: 50, message: "平台名称长度在 2 到 50 个字符", trigger: "blur" },
  ],
  videoSourceName: [
    { required: true, message: "请输入数据源名称", trigger: "blur" },
    { min: 2, max: 50, message: "数据源名称长度在 2 到 50 个字符", trigger: "blur" },
  ],
  videoSourceUrl: [
    { required: true, message: "请输入视频源URL", trigger: "blur" },
    { type: "url", message: "请输入有效的URL地址", trigger: "blur" },
  ],
  videoSourceMaxResource: [{ type: "number", min: 0, max: 10000, message: "最大查询数范围为 0-10000", trigger: "blur" }],
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
      videoSourceUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
      videoSourceUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
      videoSourceUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
      videoSourceUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
        videoSourceUserAgent: "",
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

<style scoped>
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
  border-bottom: 1px solid #f0f2f5;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.section-icon {
  color: #409eff;
  font-size: 18px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
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
  gap: 12px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.template-card.active {
  border-color: #409eff;
  background: #f0f9ff;
}

.template-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
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
  color: #303133;
}

.template-desc {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #f0f2f5;
  margin-top: 24px;
}

.form-actions .el-button {
  min-width: 80px;
}

/* 表单项样式优化 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__prefix) {
  color: #909399;
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
