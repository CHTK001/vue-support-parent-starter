<template>
  <div class="add-download-link-container">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="下载名称" prop="uploadName">
        <el-input v-model="form.uploadName" placeholder="请输入下载名称" />
      </el-form-item>
      <el-form-item label="下载链接" prop="uploadUrl">
        <el-input v-model="form.uploadUrl" placeholder="请输入下载链接" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="链接类型" prop="uploadType">
        <div class="resource-type-cards">
          <div v-for="type in resourceTypes" :key="type.value" class="resource-type-card" :class="{ active: form.uploadType === type.value }" @click="form.uploadType = type.value">
            <div class="card-icon">
              <IconifyIconOnline :icon="type.icon" />
            </div>
            <div class="card-label">{{ type.label }}</div>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="视频质量" prop="uploadQuality">
        <el-select v-model="form.uploadQuality" placeholder="请选择视频质量" class="w-full">
          <el-option label="标清" value="标清" />
          <el-option label="高清" value="高清" />
          <el-option label="超清" value="超清" />
          <el-option label="蓝光" value="蓝光" />
          <el-option label="4K" value="4K" />
          <el-option label="8K" value="8K" />
        </el-select>
      </el-form-item>
      <el-form-item label="文件大小" prop="uploadSize">
        <el-input-number v-model="form.uploadSize" placeholder="请输入文件大小(KB)" />
      </el-form-item>
      <el-form-item label="磁力链接" prop="uploadMagnetic">
        <el-input v-model="form.uploadMagnetic" placeholder="请输入磁力链接" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="状态" prop="uploadStatus">
        <el-radio-group v-model="form.uploadStatus">
          <el-radio :label="0">可用</el-radio>
          <el-radio :label="1">不可用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="showVideoIdSelect" label="关联视频" prop="uploadVideoId">
        <el-select v-model="form.uploadVideoId" placeholder="请选择关联视频" class="w-full" filterable remote :remote-method="searchVideos" :loading="videoLoading">
          <el-option v-for="item in videoOptions" :key="item.videoId" :label="item.videoName" :value="item.videoId" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">保存</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits } from "vue";
import { ElMessage } from "element-plus";
import { createDownload, updateDownload } from "@/api/download";
import { getVideoList } from "@/api/video";
import { message } from "@repo/utils";
import type { DownloadItem } from "@/types/upload";
import type { VideoItem } from "@/types/video";
import type { FormRules, FormInstance } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 资源类型定义
const resourceTypes = [
  { label: "网盘资源", value: "网盘资源", icon: "ep:folder" },
  { label: "磁力资源", value: "磁力资源", icon: "ep:connection" },
  { label: "在线资源", value: "在线资源", icon: "ep:video-play" },
  { label: "百度网盘", value: "百度网盘", icon: "ep:cloudy" },
  { label: "阿里云盘", value: "阿里云盘", icon: "ep:cloud" },
  { label: "天翼网盘", value: "天翼网盘", icon: "ep:lightning" },
];

const props = defineProps({
  initialData: {
    type: Object as () => Partial<DownloadItem>,
    default: () => ({}),
  },
  showVideoIdSelect: {
    type: Boolean,
    default: true,
  },
  videoId: {
    type: [Number, String],
    default: "",
  },
  mode: {
    type: String as () => "add" | "edit",
    default: "add",
  },
});

const emit = defineEmits(["success", "cancel"]);

// 表单相关
const formRef = ref<FormInstance>();
const submitLoading = ref(false);
const videoLoading = ref(false);
const videoOptions = ref<VideoItem[]>([]);

// 默认表单数据
const defaultForm: DownloadItem = {
  uploadId: "",
  uploadName: "",
  uploadUrl: "",
  uploadType: "网盘资源",
  uploadQuality: "高清",
  uploadSize: 0,
  uploadMagnetic: "",
  uploadStatus: 0,
  uploadVideoId: props.videoId || "",
};

// 当前表单数据
const form = reactive<DownloadItem>({
  ...defaultForm,
  ...props.initialData,
});

// 表单验证规则
const rules = reactive<FormRules>({
  uploadName: [
    { required: true, message: "请输入下载名称", trigger: "blur" },
    { min: 2, max: 100, message: "长度在2到100个字符之间", trigger: "blur" },
  ],
  uploadUrl: [{ required: true, message: "请输入下载链接", trigger: "blur" }],
  uploadType: [{ required: true, message: "请选择链接类型", trigger: "change" }],
  uploadStatus: [{ required: true, message: "请选择状态", trigger: "change" }],
  uploadVideoId: [{ required: props.showVideoIdSelect, message: "请选择关联视频", trigger: "change" }],
});

// 搜索视频
const searchVideos = async (query: string) => {
  if (query.length < 2) return;

  videoLoading.value = true;
  try {
    const res = await getVideoList({
      videoName: query,
      pageNum: 1,
      pageSize: 10,
    });

    if (res.code === "00000" && res.data) {
      videoOptions.value = res.data;
    } else {
      videoOptions.value = [];
    }
  } catch (error) {
    console.error("搜索视频出错:", error);
    videoOptions.value = [];
  } finally {
    videoLoading.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitLoading.value = true;
    try {
      const api = props.mode === "add" ? createDownload : updateDownload;
      const res = await api(form);

      if (res.code === "00000") {
        message(props.mode === "add" ? "新增成功" : "更新成功", { type: "success" });
        emit("success", form);
        if (props.mode === "add") {
          resetForm();
        }
      } else {
        message(res.msg || (props.mode === "add" ? "新增失败" : "更新失败"), { type: "error" });
      }
    } catch (error) {
      console.error(props.mode === "add" ? "新增下载链接出错:" : "更新下载链接出错:", error);
      message(props.mode === "add" ? "新增失败" : "更新失败", { type: "error" });
    } finally {
      submitLoading.value = false;
    }
  });
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(form, {
    ...defaultForm,
    uploadVideoId: props.videoId || "",
  });
};

// 初始化时，如果有视频ID，加载视频信息
if (props.videoId && props.showVideoIdSelect) {
  searchVideos("");
}
</script>

<style lang="scss" scoped>
.add-download-link-container {
  padding: 20px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  .el-form {
    max-width: 800px;
    margin: 0 auto;
  }

  .resource-type-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;

    .resource-type-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px 8px;
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: var(--el-fill-color-blank);
      height: 90px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: var(--el-color-primary-light-5);
      }

      &.active {
        background-color: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        font-weight: 500;

        .card-icon {
          transform: scale(1.1);
        }
      }

      .card-icon {
        font-size: 28px;
        margin-bottom: 12px;
        color: var(--el-color-primary);
        transition: transform 0.2s ease;
      }

      .card-label {
        font-size: 14px;
        text-align: center;
      }
    }
  }

  /* 响应式布局 */
  @media screen and (max-width: 768px) {
    padding: 16px;

    .resource-type-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
