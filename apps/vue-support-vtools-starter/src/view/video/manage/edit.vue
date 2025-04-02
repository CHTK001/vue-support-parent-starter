<template>
  <div class="video-container">
    <div class="video-page-header">
      <el-space>
        <el-button @click="goBack">
          <IconifyIconOnline icon="ep:arrow-left" />
          返回列表
        </el-button>
        <h2>{{ isEdit ? "编辑视频" : "新增视频" }}</h2>
      </el-space>
    </div>

    <el-card class="video-card">
      <el-form :model="formState" :rules="rules" ref="formRef" label-position="right" label-width="120px" class="video-form">
        <!-- 表单内容分栏 -->
        <div class="video-form-layout">
          <!-- 左侧区域 -->
          <div class="video-form-left">
            <!-- 基础信息 -->
            <div class="video-section">
              <h3 class="video-section-title">基础信息</h3>
              <el-form-item label="视频标题" prop="videoTitle">
                <el-input v-model="formState.videoTitle" placeholder="请输入视频标题" />
              </el-form-item>

              <el-form-item label="视频名称" prop="videoName">
                <el-input v-model="formState.videoName" placeholder="请输入视频名称" />
              </el-form-item>

              <el-form-item label="视频别名">
                <el-input v-model="formState.videoAliasName" placeholder="请输入视频别名" />
              </el-form-item>

              <el-form-item label="视频类型" prop="videoType">
                <el-select v-model="formState.videoType" placeholder="请选择视频类型" class="video-full-width">
                  <el-option label="电影" value="电影" />
                  <el-option label="电视剧" value="电视剧" />
                  <el-option label="动漫" value="动漫" />
                  <el-option label="综艺" value="综艺" />
                  <el-option label="纪录片" value="纪录片" />
                </el-select>
              </el-form-item>

              <el-form-item label="所属平台">
                <el-input v-model="formState.videoPlatform" placeholder="请输入所属平台" />
              </el-form-item>
            </div>

            <!-- 详情信息 -->
            <div class="video-section">
              <h3 class="video-section-title">详情信息</h3>
              <el-form-item label="视频年份">
                <el-date-picker v-model="formState.videoYear" type="year" placeholder="选择年份" format="YYYY" value-format="YYYY" />
              </el-form-item>

              <el-form-item label="上映日期">
                <el-input v-model="formState.videoRelease" placeholder="例如：2023-01-01中国上映" />
              </el-form-item>

              <el-form-item label="视频地区">
                <el-input v-model="formState.videoDistrict" placeholder="例如：中国大陆、美国" />
              </el-form-item>

              <el-form-item label="视频导演">
                <el-input v-model="formState.videoDirector" placeholder="请输入导演" />
              </el-form-item>

              <el-form-item label="视频编剧">
                <el-input v-model="formState.videoWriter" placeholder="请输入编剧" />
              </el-form-item>

              <el-form-item label="视频主演">
                <el-input v-model="formState.videoActor" placeholder="请输入主演，多个以逗号分隔" />
              </el-form-item>

              <el-form-item label="发布日期">
                <el-date-picker v-model="formState.videoPublishDate" type="datetime" placeholder="选择发布日期时间" />
              </el-form-item>

              <el-form-item label="豆瓣ID">
                <el-input v-model="formState.videoDouBanId" placeholder="请输入豆瓣视频ID" />
              </el-form-item>

              <el-form-item label="视频状态" prop="videoStatus">
                <el-radio-group v-model="formState.videoStatus">
                  <el-radio :label="0">启用</el-radio>
                  <el-radio :label="1">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
          </div>

          <!-- 右侧区域 -->
          <div class="video-form-right">
            <!-- 媒体信息 -->
            <div class="video-section">
              <h3 class="video-section-title">媒体信息</h3>
              <el-form-item label="视频封面" prop="videoCover">
                <el-input v-model="formState.videoCover" placeholder="请输入封面图片URL地址" />
                <div v-if="formState.videoCover" class="video-cover-preview">
                  <el-image :src="formState.videoCover" fit="cover" alt="视频封面" class="video-preview-image" />
                </div>
              </el-form-item>

              <el-form-item label="视频缩略图">
                <el-input v-model="formState.videoThumbnail" placeholder="请输入缩略图URL地址" />
              </el-form-item>

              <el-form-item label="视频地址" prop="videoUrl">
                <el-input v-model="formState.videoUrl" placeholder="请输入视频URL地址" />
              </el-form-item>

              <el-form-item label="视频时长(分钟)">
                <el-input-number v-model="formState.videoDuration" :min="0" placeholder="请输入视频时长" />
              </el-form-item>

              <el-form-item label="视频大小">
                <el-input v-model="formState.videoSize" placeholder="例如：1.2GB" />
              </el-form-item>

              <el-form-item label="视频清晰度">
                <el-select v-model="formState.videoQuality" placeholder="请选择视频清晰度" class="video-full-width">
                  <el-option label="标清SD" value="标清SD" />
                  <el-option label="高清HD" value="高清HD" />
                  <el-option label="超清UHD" value="超清UHD" />
                  <el-option label="蓝光1080P" value="蓝光1080P" />
                  <el-option label="4K" value="4K" />
                </el-select>
              </el-form-item>

              <el-form-item label="视频语言">
                <el-input v-model="formState.videoLanguage" placeholder="请输入视频语言" />
              </el-form-item>

              <el-form-item label="视频评分">
                <el-rate v-model="formState.videoScore" :max="10" :allow-half="true" show-score />
              </el-form-item>
            </div>

            <!-- 视频描述 -->
            <div class="video-section">
              <h3 class="video-section-title">视频描述</h3>
              <el-form-item label="视频描述" prop="videoDescription">
                <el-input v-model="formState.videoDescription" type="textarea" placeholder="请输入视频描述内容" :rows="12" class="video-description-textarea" />
              </el-form-item>
            </div>
          </div>
        </div>

        <!-- 表单底部操作区 -->
        <div class="video-form-footer">
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading" size="large">
            <IconifyIconOnline icon="ep:check" />
            保存视频
          </el-button>
          <el-button @click="resetForm" size="large">
            <IconifyIconOnline icon="ep:refresh" />
            重置
          </el-button>
          <el-button @click="goBack" size="large">
            <IconifyIconOnline icon="ep:close" />
            取消
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "@repo/utils";
import { getVideoDetail, createVideo, updateVideo } from "@/api/video";
import { formatDateTime } from "@repo/utils";
import type { FormInstance, FormRules } from "element-plus";

// API返回类型
interface ReturnResult<T = any> {
  code: number;
  data: T;
  message: string;
  total?: number;
}

// 后端API实际返回的结构
interface ApiResponse<T = any> {
  data: ReturnResult<T>;
}

// 根据Java实体类定义的视频类型
interface VideoItem {
  videoId: number;
  videoTitle: string;
  videoName: string;
  videoAliasName?: string;
  videoScore?: number;
  videoYear?: number | string;
  videoPlatform?: string;
  videoLanguage?: string;
  videoQuality?: string;
  videoThumbnail?: string;
  videoCover: string;
  videoUrl: string;
  videoViews?: number;
  videoLikes?: number;
  videoStatus: number;
  videoDuration?: number;
  videoDouBanId?: string;
  videoPublishDate?: string | Date;
  videoType: string;
  videoRelease?: string;
  videoDistrict?: string;
  videoSize: string; // 确保与Java实体字段类型一致
  videoAuthor?: string;
  videoDirector?: string;
  videoWriter?: string;
  videoActor?: string;
  videoDescription?: string;
  createTime?: string;
  updateTime?: string;
}

// 表单状态接口，可选videoId
interface VideoFormState extends Omit<VideoItem, "videoId"> {
  videoId?: number;
}

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const isEdit = ref(false);
const loading = ref(false);
const submitLoading = ref(false);

const formState = reactive<VideoFormState>({
  videoTitle: "",
  videoName: "",
  videoAliasName: "",
  videoScore: 0,
  videoYear: "",
  videoPlatform: "",
  videoLanguage: "",
  videoQuality: "",
  videoThumbnail: "",
  videoCover: "",
  videoUrl: "",
  videoStatus: 0,
  videoDuration: 0,
  videoType: "",
  videoDescription: "",
  videoSize: "", // 初始化为空字符串
});

const rules = reactive<FormRules>({
  videoTitle: [{ required: true, message: "请输入视频标题", trigger: "blur" }],
  videoName: [{ required: true, message: "请输入视频名称", trigger: "blur" }],
  videoType: [{ required: true, message: "请选择视频类型", trigger: "change" }],
  videoCover: [{ required: true, message: "请输入封面图片URL", trigger: "blur" }],
  videoUrl: [{ required: true, message: "请输入视频URL地址", trigger: "blur" }],
});

// 返回列表页 - 异步方法，不使用await
const goBack = (): void => {
  setTimeout(() => {
    router.push("/video/manager");
  }, 0);
};

// 获取视频详情 - 异步方法，不使用await
const fetchVideoDetail = (id: string): void => {
  loading.value = true;

  // 使用Promise.then代替await
  getVideoDetail(id)
    .then(({ data }) => {
      // 转换数据结构
      Object.assign(formState, data);
    })
    .catch((error) => {
      message("获取视频详情失败", { type: "error" });
    })
    .finally(() => (loading.value = false));
};

// 处理表单提交 - 异步方法，不使用await
const handleSubmit = (): void => {
  if (!formRef.value) return;

  // 使用回调而非await处理表单验证
  formRef.value.validate((valid) => {
    if (!valid) return;

    submitLoading.value = true;

    // 异步处理
    setTimeout(() => {
      try {
        // 确保submitData与API期望的类型兼容
        const submitData = {
          ...formState,
          videoId: isEdit.value && formState.videoId ? formState.videoId : 0,
          videoSize: formState.videoSize || "", // 确保videoSize是字符串
        };

        const apiMethod = isEdit.value ? updateVideo : createVideo;

        // 使用Promise.then代替await
        apiMethod(submitData as any)
          .then((res: any) => {
            setTimeout(() => {
              if (res.data && res.data.code === 0) {
                message(isEdit.value ? "更新成功" : "创建成功", { type: "success" });
                // 异步导航
                setTimeout(goBack, 0);
              } else {
                message(res.data?.message || (isEdit.value ? "更新失败" : "创建失败"), { type: "error" });
              }
              submitLoading.value = false;
            }, 0);
          })
          .catch((error) => {
            console.error("表单提交出错:", error);
            setTimeout(() => {
              message("提交失败，请稍后重试", { type: "error" });
              submitLoading.value = false;
            }, 0);
          });
      } catch (error) {
        console.error("表单处理出错:", error);
        setTimeout(() => {
          message("提交处理失败", { type: "error" });
          submitLoading.value = false;
        }, 0);
      }
    }, 0);
  });
};

// 重置表单 - 异步方法，不使用await
const resetForm = (): void => {
  setTimeout(() => {
    formRef.value?.resetFields();
    if (isEdit.value && formState.videoId) {
      // 异步调用fetchVideoDetail
      setTimeout(() => {
        fetchVideoDetail(String(formState.videoId));
      }, 0);
    }
  }, 0);
};

// 生命周期钩子，不使用async/await
onMounted(() => {
  setTimeout(() => {
    const id = route.query.id as string;
    if (id) {
      isEdit.value = true;
      formState.videoId = Number(id);
      // 异步调用fetchVideoDetail
      setTimeout(() => {
        fetchVideoDetail(id);
      }, 0);
    }
  }, 0);
});
</script>

<style scoped>
.video-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.video-page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
}

.video-page-header h2 {
  margin: 0;
  margin-left: 12px;
  font-size: 22px;
  color: #303133;
}

.video-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.video-form-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
}

.video-form-left,
.video-form-right {
  flex: 1;
  min-width: 300px;
}

.video-section {
  margin-bottom: 28px;
  background-color: #f9fafc;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
}

.video-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #c6e2ff;
}

.video-section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 500;
  color: #409eff;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
}

.video-section-title::before {
  content: "";
  display: block;
  width: 4px;
  height: 18px;
  background-color: #409eff;
  margin-right: 8px;
  border-radius: 2px;
}

.video-full-width {
  width: 100%;
}

.video-cover-preview {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
}

.video-preview-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  transition: transform 0.5s ease;
}

.video-cover-preview:hover .video-preview-image {
  transform: scale(1.05);
}

.video-description-textarea {
  width: 100%;
  border-radius: 8px;
  resize: vertical;
}

.video-form-footer {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
  gap: 16px;
}

.video-form-footer .el-button {
  min-width: 120px;
  transition: all 0.3s ease;
}

.video-form-footer .el-button:hover {
  transform: translateY(-2px);
}

@media (max-width: 1024px) {
  .video-form-layout {
    flex-direction: column;
  }
}
</style>
