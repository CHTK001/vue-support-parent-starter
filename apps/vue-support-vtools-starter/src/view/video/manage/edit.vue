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
                <el-input v-model="formState.videoTitle" placeholder="请输入视频标题">
                  <template #prefix>
                    <IconifyIconOnline icon="ep:film" />
                  </template>
                </el-input>
                <div class="form-item-tip">视频的主要标题，将显示在列表和详情页</div>
              </el-form-item>

              <el-form-item label="视频名称" prop="videoName">
                <el-input v-model="formState.videoName" placeholder="请输入视频名称">
                  <template #prefix>
                    <IconifyIconOnline icon="ep:video-camera" />
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="视频别名">
                <el-input v-model="formState.videoAliasName" placeholder="请输入视频别名">
                  <template #prefix>
                    <IconifyIconOnline icon="ep:price-tag" />
                  </template>
                </el-input>
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
                <el-select v-model="selectedDistricts" placeholder="请选择或输入视频地区" filterable allow-create default-first-option multiple class="video-full-width" @change="handleDistrictChange">
                  <el-option v-for="item in districtOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <div class="form-item-tip">可多选或输入新的地区，自动以逗号分隔</div>
              </el-form-item>

              <el-form-item label="视频导演">
                <el-select v-model="selectedDirectors" placeholder="请选择或输入导演" filterable allow-create default-first-option multiple class="video-full-width" @change="handleDirectorChange">
                  <el-option v-for="item in directorOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <div class="form-item-tip">可多选或输入新的导演，自动以逗号分隔</div>
              </el-form-item>

              <el-form-item label="视频编剧">
                <el-select v-model="selectedWriters" placeholder="请选择或输入编剧" filterable allow-create default-first-option multiple class="video-full-width" @change="handleWriterChange">
                  <el-option v-for="item in writerOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <div class="form-item-tip">可多选或输入新的编剧，自动以逗号分隔</div>
              </el-form-item>

              <el-form-item label="视频主演">
                <el-select v-model="selectedActors" placeholder="请选择或输入主演" filterable allow-create default-first-option multiple class="video-full-width" @change="handleActorChange">
                  <el-option v-for="item in actorOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <div class="form-item-tip">可多选或输入新的演员名称，自动以逗号分隔</div>
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
                <el-input v-model="formState.videoCover" placeholder="请输入封面图片URL地址">
                  <template #prefix>
                    <IconifyIconOnline icon="ep:picture" />
                  </template>
                </el-input>
                <div v-if="formState.videoCover" class="video-cover-preview w-full">
                  <el-image :src="formState.videoCover" fit="cover" alt="视频封面" class="video-preview-image">
                    <template #error>
                      <div class="image-error-placeholder">
                        <IconifyIconOnline icon="ep:picture-filled" />
                        <span>图片加载失败</span>
                      </div>
                    </template>
                  </el-image>
                </div>
                <div v-else class="upload-tip">添加封面图片可以提高视频的点击率</div>
              </el-form-item>

              <el-form-item label="视频缩略图">
                <el-input v-model="formState.videoThumbnail" placeholder="请输入缩略图URL地址">
                  <template #prefix>
                    <IconifyIconOnline icon="ep:picture-rounded" />
                  </template>
                </el-input>
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
                <el-select v-model="selectedLanguages" placeholder="请选择或输入视频语言" filterable allow-create default-first-option multiple class="video-full-width" @change="handleLanguageChange">
                  <el-option v-for="item in languageOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <div class="form-item-tip">可多选或输入新的语言，自动以逗号分隔</div>
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
          <el-tooltip content="保存当前视频信息" placement="top" :effect="'light'">
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading" size="large">
              <IconifyIconOnline icon="ep:check" />
              {{ isEdit ? "更新视频" : "保存视频" }}
            </el-button>
          </el-tooltip>
          <el-tooltip content="重置表单内容" placement="top" :effect="'light'">
            <el-button @click="resetForm" size="large" :disabled="submitLoading">
              <IconifyIconOnline icon="ep:refresh" />
              重置
            </el-button>
          </el-tooltip>
          <el-tooltip content="返回视频列表" placement="top" :effect="'light'">
            <el-button @click="goBack" size="large" :disabled="submitLoading">
              <IconifyIconOnline icon="ep:close" />
              取消
            </el-button>
          </el-tooltip>
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

// 视频地区选项
const districtOptions = ref([
  { label: "中国大陆", value: "中国大陆" },
  { label: "中国香港", value: "中国香港" },
  { label: "中国台湾", value: "中国台湾" },
  { label: "美国", value: "美国" },
  { label: "韩国", value: "韩国" },
  { label: "日本", value: "日本" },
  { label: "英国", value: "英国" },
  { label: "法国", value: "法国" },
  { label: "德国", value: "德国" },
  { label: "印度", value: "印度" },
  { label: "泰国", value: "泰国" },
  { label: "俄罗斯", value: "俄罗斯" },
]);

// 视频语言选项
const languageOptions = ref([
  { label: "普通话", value: "普通话" },
  { label: "粤语", value: "粤语" },
  { label: "英语", value: "英语" },
  { label: "日语", value: "日语" },
  { label: "韩语", value: "韩语" },
  { label: "法语", value: "法语" },
  { label: "德语", value: "德语" },
  { label: "意大利语", value: "意大利语" },
  { label: "西班牙语", value: "西班牙语" },
  { label: "俄语", value: "俄语" },
  { label: "印地语", value: "印地语" },
]);

// 导演选项
const directorOptions = ref([
  { label: "张艺谋", value: "张艺谋" },
  { label: "陈凯歌", value: "陈凯歌" },
  { label: "贾樟柯", value: "贾樟柯" },
  { label: "李安", value: "李安" },
  { label: "王家卫", value: "王家卫" },
  { label: "徐克", value: "徐克" },
  { label: "斯皮尔伯格", value: "斯皮尔伯格" },
  { label: "诺兰", value: "诺兰" },
  { label: "昆汀·塔伦蒂诺", value: "昆汀·塔伦蒂诺" },
  { label: "詹姆斯·卡梅隆", value: "詹姆斯·卡梅隆" },
]);

// 编剧选项
const writerOptions = ref([
  { label: "宁浩", value: "宁浩" },
  { label: "张一白", value: "张一白" },
  { label: "韩寒", value: "韩寒" },
  { label: "郭敬明", value: "郭敬明" },
  { label: "刘震云", value: "刘震云" },
  { label: "阿伦·索金", value: "阿伦·索金" },
  { label: "查理·考夫曼", value: "查理·考夫曼" },
  { label: "克里斯托弗·诺兰", value: "克里斯托弗·诺兰" },
]);

// 演员选项
const actorOptions = ref([
  { label: "章子怡", value: "章子怡" },
  { label: "巩俐", value: "巩俐" },
  { label: "周星驰", value: "周星驰" },
  { label: "成龙", value: "成龙" },
  { label: "李连杰", value: "李连杰" },
  { label: "刘德华", value: "刘德华" },
  { label: "梁朝伟", value: "梁朝伟" },
  { label: "汤姆·汉克斯", value: "汤姆·汉克斯" },
  { label: "莱昂纳多·迪卡普里奥", value: "莱昂纳多·迪卡普里奥" },
  { label: "罗伯特·唐尼", value: "罗伯特·唐尼" },
  { label: "安妮·海瑟薇", value: "安妮·海瑟薇" },
  { label: "斯嘉丽·约翰逊", value: "斯嘉丽·约翰逊" },
]);

// 处理多选的方法
const handleActorChange = (value: string[]) => {
  formState.videoActor = value.join("，");
};

const handleDirectorChange = (value: string[]) => {
  formState.videoDirector = value.join("，");
};

const handleWriterChange = (value: string[]) => {
  formState.videoWriter = value.join("，");
};

const handleDistrictChange = (value: string[]) => {
  formState.videoDistrict = value.join("，");
};

const handleLanguageChange = (value: string[]) => {
  formState.videoLanguage = value.join("，");
};

// 从字符串转换为数组，用于多选
const getActorArray = () => {
  if (!formState.videoActor) return [];
  return formState.videoActor.split(/[,，、]/g).filter((item) => item.trim());
};

// 当前选中的数组
const selectedActors = ref<string[]>([]);
const selectedDirectors = ref<string[]>([]);
const selectedWriters = ref<string[]>([]);
const selectedDistricts = ref<string[]>([]);
const selectedLanguages = ref<string[]>([]);

// 初始化数组的方法
const initActors = () => {
  if (formState.videoActor) {
    selectedActors.value = getActorArray();
  }
};

const initDirectors = () => {
  if (formState.videoDirector) {
    selectedDirectors.value = formState.videoDirector.split(/[,，、]/g).filter((item) => item.trim());
  }
};

const initWriters = () => {
  if (formState.videoWriter) {
    selectedWriters.value = formState.videoWriter.split(/[,，、]/g).filter((item) => item.trim());
  }
};

const initDistricts = () => {
  if (formState.videoDistrict) {
    selectedDistricts.value = formState.videoDistrict.split(/[,，、]/g).filter((item) => item.trim());
  }
};

const initLanguages = () => {
  if (formState.videoLanguage) {
    selectedLanguages.value = formState.videoLanguage.split(/[,，、]/g).filter((item) => item.trim());
  }
};

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
      // 在获取数据后初始化所有多选数组
      setTimeout(() => {
        initActors();
        initDirectors();
        initWriters();
        initDistricts();
        initLanguages();
      }, 100);
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
    } else {
      // 如果是新增模式，清空所有多选
      selectedActors.value = [];
      selectedDirectors.value = [];
      selectedWriters.value = [];
      selectedDistricts.value = [];
      selectedLanguages.value = [];
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
  background-color: var(--el-bg-color-page, #f5f7fa);
  min-height: 100vh;
}

.video-page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.video-page-header h2 {
  margin: 0;
  margin-left: 12px;
  font-size: 22px;
  color: var(--el-text-color-primary, #303133);
  font-weight: 600;
}

.video-card {
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.video-card:hover {
  box-shadow: var(--el-box-shadow);
}

.video-form-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  margin-bottom: 28px;
}

.video-form-left,
.video-form-right {
  flex: 1;
  min-width: 320px;
  transition: all 0.3s ease;
}

.video-section {
  margin-bottom: 28px;
  background-color: var(--el-bg-color, #f9fafc);
  border-radius: 10px;
  padding: 24px;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-light, #ebeef5);
  animation: fadeIn 0.5s ease-in-out;
  animation-fill-mode: both;
}

.video-form-left .video-section:nth-child(1) {
  animation-delay: 0.1s;
}

.video-form-left .video-section:nth-child(2) {
  animation-delay: 0.2s;
}

.video-form-right .video-section:nth-child(1) {
  animation-delay: 0.3s;
}

.video-form-right .video-section:nth-child(2) {
  animation-delay: 0.4s;
}

.video-section:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-5, #c6e2ff);
  transform: translateY(-2px);
}

.video-section-title {
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary, #409eff);
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-light, #ebeef5);
  display: flex;
  align-items: center;
  letter-spacing: 0.5px;
}

.video-section-title::before {
  content: "";
  display: block;
  width: 4px;
  height: 20px;
  background-color: var(--el-color-primary, #409eff);
  margin-right: 10px;
  border-radius: 2px;
}

.video-full-width {
  width: 100%;
}

.video-cover-preview {
  margin-top: 16px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
  position: relative;
  transition: all 0.3s ease;
}

.video-preview-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 10px;
  transition: transform 0.5s ease;
}

.video-cover-preview:hover {
  box-shadow: var(--el-box-shadow);
}

.video-cover-preview:hover .video-preview-image {
  transform: scale(1.05);
}

.video-description-textarea {
  width: 100%;
  border-radius: 8px;
  resize: vertical;
  transition: all 0.3s ease;
}

.video-form-footer {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid var(--el-border-color-light, #ebeef5);
  gap: 20px;
  animation: fadeIn 0.5s ease-in-out;
  animation-delay: 0.5s;
  animation-fill-mode: both;
}

.video-form-footer .el-button {
  min-width: 130px;
  transition: all 0.3s ease;
  padding: 12px 24px;
}

.video-form-footer .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.el-form-item {
  margin-bottom: 22px;
  transition: all 0.3s ease;
}

.el-form-item:hover {
  transform: translateX(2px);
}

.el-input,
.el-select,
.el-date-picker,
.el-input-number {
  transition: all 0.3s ease;
}

.el-input:hover,
.el-select:hover,
.el-date-picker:hover,
.el-input-number:hover {
  transform: translateY(-1px);
}

.el-rate {
  margin-top: 5px;
}

.upload-tip,
.form-item-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
  padding-left: 2px;
  transition: all 0.3s ease;
}

.upload-tip:hover,
.form-item-tip:hover {
  color: var(--el-color-primary);
}

.image-error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 220px;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  border-radius: 10px;
}

.image-error-placeholder .iconify {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.7;
}

@media (max-width: 1200px) {
  .video-form-layout {
    gap: 20px;
  }

  .video-section {
    padding: 20px;
  }
}

@media (max-width: 1024px) {
  .video-form-layout {
    flex-direction: column;
  }

  .video-form-left,
  .video-form-right {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .video-container {
    padding: 16px;
  }

  .video-section {
    padding: 16px;
  }

  .video-form-footer .el-button {
    min-width: 100px;
    padding: 10px 16px;
  }
}
</style>
