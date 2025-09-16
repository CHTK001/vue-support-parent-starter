<template>
  <div class="add-download-link-container">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="下载名称" prop="videoDownloadName">
        <el-input v-model="form.videoDownloadName" placeholder="请输入下载名称" />
      </el-form-item>
      <el-form-item label="下载链接" prop="videoDownloadUrl">
        <el-input v-model="form.videoDownloadUrl" placeholder="请输入下载链接" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="链接类型" prop="videoDownloadType">
        <CardSelector v-model="form.videoDownloadType" :options="resourceTypes" />
      </el-form-item>
      <el-form-item label="视频质量" prop="videoDownloadQuality">
        <el-select v-model="form.videoDownloadQuality" placeholder="请选择视频质量" class="w-full">
          <el-option label="标清" value="标清" />
          <el-option label="高清" value="高清" />
          <el-option label="超清" value="超清" />
          <el-option label="蓝光" value="蓝光" />
          <el-option label="4K" value="4K" />
          <el-option label="8K" value="8K" />
        </el-select>
      </el-form-item>
      <el-form-item label="文件大小" prop="videoDownloadSize">
        <el-input-number v-model="form.videoDownloadSize" placeholder="请输入文件大小(KB)" />
      </el-form-item>
      <el-form-item label="磁力链接" prop="videoDownloadMagnetic">
        <el-input v-model="form.videoDownloadMagnetic" placeholder="请输入磁力链接" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="状态" prop="videoDownloadStatus">
        <el-radio-group v-model="form.videoDownloadStatus">
          <el-radio :label="0">可用</el-radio>
          <el-radio :label="1">不可用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="showVideoIdSelect" label="关联视频" prop="videoDownloadVideoId">
        <el-select v-model="form.videoDownloadVideoId" placeholder="请选择关联视频" class="w-full" filterable remote :remote-method="searchVideos" :loading="videoLoading">
          <el-option v-for="item in videoOptions" :key="item.videoId" :label="item.videoName" :value="item.videoId" />
        </el-select>
      </el-form-item>
      <el-form-item class="flex justify-end gap-2 submit-btn">
        <el-button type="primary" @click="submitForm" :loading="submitLoading">保存</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import type { DownloadItem } from "../../../types/upload";
import type { VideoItem } from "../../../types/video";
import { message } from "@repo/utils";
import type { FormInstance, FormRules } from "element-plus";
import { defineAsyncComponent, reactive, ref } from "vue";
import { createDownload, updateDownload } from "../../../api/download";
import { getVideoList } from "../../../api/video";
const CardSelector = defineAsyncComponent(() => import("@repo/components/ScSelect/index.vue"));

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
    type: [Number],
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
  videoDownloadName: "",
  videoDownloadUrl: "",
  videoDownloadType: "网盘资源",
  videoDownloadQuality: "高清",
  videoDownloadSize: 0,
  videoId: props.videoId, // 视频ID，从父组件传递过来，用于新增时关联视频，编辑时不显示该输入框
  videoDownloadMagnetic: "",
  videoDownloadStatus: 0,
  videoDownloadVideoId: props.videoId || "",
};

// 当前表单数据
const form = reactive<DownloadItem>({
  ...defaultForm,
  ...props.initialData,
});

// 表单验证规则
const rules = reactive<FormRules>({
  videoDownloadName: [
    { required: true, message: "请输入下载名称", trigger: "blur" },
    { min: 2, max: 100, message: "长度在2到100个字符之间", trigger: "blur" },
  ],
  videoDownloadUrl: [{ required: true, message: "请输入下载链接", trigger: "blur" }],
  videoDownloadType: [{ required: true, message: "请选择链接类型", trigger: "change" }],
  videoDownloadStatus: [{ required: true, message: "请选择状态", trigger: "change" }],
  videoDownloadVideoId: [{ required: props.showVideoIdSelect, message: "请选择关联视频", trigger: "change" }],
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
    const api = props.mode === "add" ? createDownload : updateDownload;
    api(form)
      .then((res) => {
        message(props.mode === "add" ? "新增成功" : "更新成功", { type: "success" });
        emit("success", form);
        if (props.mode === "add") {
          resetForm();
        }
      })
      .finally(() => {
        submitLoading.value = false;
      });
  });
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(form, {
    ...defaultForm,
    videoDownloadVideoId: props.videoId || "",
  });
};

// 初始化时，如果有视频ID，加载视频信息
if (props.videoId && props.showVideoIdSelect) {
  searchVideos("");
}
</script>

<style lang="scss" scoped>
:deep(.submit-btn .el-form-item__content) {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.add-download-link-container {
  padding: 20px;
  background-color: var(--el-bg-color);
  border-radius: 8px;

  .el-form {
    max-width: 800px;
    margin: 0 auto;
  }

  /* 资源类型卡片样式已移至CardSelector组件 */

  /* 响应式布局 */
  @media screen and (max-width: 768px) {
    padding: 16px;

    .resource-type-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
