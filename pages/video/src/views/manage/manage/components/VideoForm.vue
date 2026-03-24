<template>
  <div class="modern-form video-form-container">
    <ScForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right" :disabled="loading">
      <ScFormItem label="视频名称" prop="videoName">
        <ScInput v-model="formData.videoName" placeholder="请输入视频名称" />
      </ScFormItem>

      <ScFormItem label="视频描述" prop="videoDescription">
        <ScInput v-model="formData.videoDescription" type="textarea" :rows="3" placeholder="请输入视频描述" />
      </ScFormItem>

      <ScFormItem label="视频封面" prop="videoCover">
        <ScInput v-model="formData.videoCover" placeholder="请输入视频封面URL" />
        <div class="preview-container" v-if="formData.videoCover">
          <ScImage :src="formData.videoCover" class="cover-image" fit="cover" />
        </div>
      </ScFormItem>

      <ScFormItem label="视频地址" prop="videoUrl">
        <ScInput v-model="formData.videoUrl" placeholder="请输入视频URL" />
      </ScFormItem>

      <ScFormItem label="视频路径" prop="videoPath">
        <ScInput v-model="formData.videoPath" placeholder="请输入视频路径" />
      </ScFormItem>

      <ScFormItem label="视频标签" prop="videoTags">
        <ScTag v-for="tag in tags" :key="tag" class="mx-1" closable :disable-transitions="false" @close="handleRemoveTag(tag)">
          {{ tag }}
        </ScTag>
        <ScInput v-if="inputTagVisible" ref="tagInputRef" v-model="inputTagValue" class="tag-input" size="small" @keyup.enter="handleAddTag" @blur="handleAddTag" />
        <ScButton v-else class="button-new-tag" size="small" @click="showTagInput">
          <IconifyIconOnline icon="ep:plus" />
          添加标签
        </ScButton>
      </ScFormItem>

      <ScFormItem label="视频类型" prop="videoType">
        <ScSelect v-model="formData.videoType" placeholder="请选择视频类型">
          <ScOption label="MP4" value="mp4" />
          <ScOption label="AVI" value="avi" />
          <ScOption label="MKV" value="mkv" />
          <ScOption label="MOV" value="mov" />
          <ScOption label="WMV" value="wmv" />
        </ScSelect>
      </ScFormItem>

      <ScFormItem label="视频大小" prop="videoSize">
        <ScInputNumber v-model="formData.videoSize" :min="0" :precision="0" :step="1024" placeholder="视频大小（字节）" />
      </ScFormItem>

      <ScFormItem label="视频时长" prop="videoDuration">
        <ScInputNumber v-model="formData.videoDuration" :min="0" :precision="0" :step="1" placeholder="视频时长（秒）" />
      </ScFormItem>

      <ScFormItem label="视频状态" prop="videoStatus">
        <ScRadioGroup v-model="formData.videoStatus">
          <ScRadio :label="1">启用</ScRadio>
          <ScRadio :label="0">禁用</ScRadio>
        </ScRadioGroup>
      </ScFormItem>

      <ScFormItem>
        <ScButton type="primary" @click="submitForm" :loading="loading">
          {{ isEdit ? "更新" : "保存" }}
        </ScButton>
        <ScButton @click="goBack">取消</ScButton>
      </ScFormItem>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { defineExpose, ref, reactive, computed, nextTick, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/utils";
import { getVideoDetail, createVideo, updateVideo } from "../../../../api/video";
import type { VideoItem } from "../../../../types/video";

const route = useRoute();
const router = useRouter();

// 表单引用和数据
const formRef = ref();
const formData = reactive<VideoItem>({
  videoId: "",
  videoName: "",
  videoDescription: "",
  videoCover: "",
  videoPath: "",
  videoUrl: "",
  videoType: "",
  videoStatus: 1,
  videoTags: "",
});

// 标签相关
const tags = ref<string[]>([]);
const inputTagVisible = ref(false);
const inputTagValue = ref("");
const tagInputRef = ref();

// 加载状态
const loading = ref(false);

// 编辑模式判断
const isEdit = computed(() => {
  return route.params.id !== undefined;
});

// 表单校验规则
const rules = reactive({
  videoName: [
    { required: true, message: "请输入视频名称", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 到 100 个字符", trigger: "blur" },
  ],
  videoType: [{ required: true, message: "请选择视频类型", trigger: "change" }],
  videoUrl: [{ required: true, message: "请输入视频URL", trigger: "blur" }],
}) as any;

// 初始化数据
onMounted(async () => {
  if (isEdit.value) {
    const videoId = route.params.id as string;
    loading.value = true;
    getVideoDetail(videoId)
      .then((res) => {
        Object.assign(formData, res.data);
        // 初始化标签
        if (formData.videoTags) {
          tags.value = formData.videoTags.split(",");
        }
      })
      .catch((error) => {
        console.error("获取视频详情失败:", error);
        message("获取视频详情失败", { type: "error" });
      })
      .finally(() => {
        loading.value = false;
      });
  }
});

// 标签处理
const handleRemoveTag = (tag: string) => {
  tags.value = tags.value.filter((t) => t !== tag);
  updateFormTags();
};

const showTagInput = () => {
  inputTagVisible.value = true;
  nextTick(() => {
    tagInputRef.value?.input?.focus();
  });
};

const handleAddTag = () => {
  if (inputTagValue.value) {
    if (!tags.value.includes(inputTagValue.value)) {
      tags.value.push(inputTagValue.value);
      updateFormTags();
    }
    inputTagVisible.value = false;
    inputTagValue.value = "";
  } else {
    inputTagVisible.value = false;
  }
};

const updateFormTags = () => {
  formData.videoTags = tags.value.join(",");
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        if (isEdit.value) {
          updateVideo(formData).then((res) => {
            message("更新成功", { type: "success" });
            goBack();
          });
        } else {
          createVideo(formData).then((res) => {
            message("创建成功", { type: "success" });
            goBack();
          });
        }
      } catch (error) {
        message("提交失败", { type: "error" });
      } finally {
        loading.value = false;
      }
    }
  });
};

// 返回列表页
const goBack = () => {
  router.push("/video/manage");
};
defineExpose({
  submitForm,
});
</script>

<style scoped>
.video-form-container {
  padding: 24px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: fadeInUp 0.6s ease-out;
}

.preview-container {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.preview-container:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.cover-image {
  width: 200px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.preview-container:hover .cover-image {
  transform: scale(1.05);
}

.tag-input {
  width: 90px;
  margin-left: 8px;
  vertical-align: middle;
}

.button-new-tag {
  margin-left: 8px;
  transition: all 0.3s ease;
}

.button-new-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
