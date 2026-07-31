<template>
  <div class="koi-upload-files-root">
    <!-- 注意：只能通过 on-change 钩子函数来对上传文件的列表进行控制。 -->
    <el-upload
      :file-list="fileList"
      :multiple="props.isMultiple"
      :limit="props.limit"
      :accept="props.acceptType"
      :auto-upload="false"
      :show-file-list="false"
      :disabled="disabled"
      :on-exceed="handleExceed"
      :on-change="handleChange"
      :folderName="folderName"
      :fileParam="fileParam"
    >
      <div class="el-upload-text hover:bg-[--el-color-primary-light-9]">
        <el-icon size="16"><Upload /></el-icon>
        <span>上传文件</span>
      </div>
    </el-upload>
    <div style="margin-top: .375rem">
      <div
        class="template-file text-#555 m-t-0.125rem rounded-0.375rem dark:text-#CFD3DC hover:bg-[--el-color-primary-light-9]"
        v-for="item in fileList"
        :key="item.url"
      >
        <el-icon size="16" style="margin-right: .3125rem"><Link /></el-icon>
        <el-tooltip :content="item.name" placement="top">
          <div class="document-name hover:text-[--el-color-primary]">{{ item.name }}</div>
        </el-tooltip>
        <el-icon class="hover:text-[--el-color-primary]" v-if="!props.disabled" size="16" @click="handleRemove(item.url)">
          <Close />
        </el-icon>
        <!-- 默认不显示下载 -->
        <el-icon
          v-if="isDownload"
          class="p-l-0.3125rem hover:text-[--el-color-primary]"
          size="16"
          @click="handleDownLoad(item.url, item.name)"
          ><Download
        /></el-icon>
      </div>
    </div>
    <span class="file-tips">
      <slot name="tip">
        支持{{ acceptTypes }}；
        <div class="h-0.0625rem"></div>
        文件大小不能超过{{ props.fileSize }}M；最多上传{{ props.limit }}个；
      </slot>
    </span>
    <transition name="el-fade-in-linear">
      <div v-if="activeUploadCount > 0" class="koi-upload-files-progress">
        <el-progress type="circle" :percentage="aggregatedUploadPercent" :width="88" :stroke-width="5" />
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, inject, onBeforeUnmount } from "vue";
import { formContextKey, formItemContextKey } from "element-plus";
import { koiNoticeSuccess, koiNoticeError, koiMsgWarning, koiMsgError } from "@repo/theme/koi/utils/koi.ts";
import koi from "@repo/theme/koi/utils/axios.ts";
import { getEnv } from "@repo/theme/koi/utils/env.ts";

const emits = defineEmits(["fileSuccess", "fileRemove", "update:fileList"]);

interface IUploadFilesProps {
  acceptType?: string; // 上传文件类型
  acceptTypes?: string; // 描述 - 上传文件类型
  isMultiple?: boolean; //   是否可批量上传
  limit?: number; // 允许上传文件的最大数量
  disabled?: boolean; // 是否禁用上传
  fileSize?: number; // 文件大小
  action?: string;
  fileList?: any; // 回显的文件
  isDownload?: boolean; // 是否可以下载
  folderName?: string; // 后端文件夹名称
  fileParam?: string; // 文件类型[可向后端传递参数]
}

// 接收父组件传递过来的参数
const props = withDefaults(defineProps<IUploadFilesProps>(), {
  acceptType: ".png,.jpg,.jpeg,.webp,.gif,.mp3,.mp4,.xls,.xlsx,.pdf,.log,.doc,.docx,.txt,.jar,.zip",
  acceptTypes: "图片[png/jpg/webp/gif]、文件[txt/xls/xlsx]",
  isMultiple: true,
  limit: 5,
  disabled: false,
  fileSize: 10,
  action: "/koi/upload/file",
  fileList: [],
  isDownload: false,
  folderName: "files",
  fileParam: "-1"
});

// 获取 el-form 组件上下文
const formContext = inject(formContextKey, void 0);
// 获取 el-form-item 组件上下文
const formItemContext = inject(formItemContextKey, void 0);
// 判断是否禁用上传和删除
const disabled = computed(() => {
  return props.disabled || formContext?.disabled;
});

let fileList = ref<any>([]);
// 父组件传递回显数据
fileList.value = props.fileList;

/** 多选并发上传时按 uid 记进度，遮罩为平均百分比 */
const activeUploadCount = ref(0);
const uploadPercentByUid = ref<Record<number, number>>({});

const aggregatedUploadPercent = computed(() => {
  const vals = Object.values(uploadPercentByUid.value);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
});

/** 当前进行中请求数为 0 时，再一次性提示本批成功总数（避免先完成 1 个就弹出，其余还在传导致分条提示） */
const batchSuccessCount = ref(0);

const flushPendingSuccessNoticeIfAllDone = () => {
  if (activeUploadCount.value > 0) return;
  if (batchSuccessCount.value <= 0) return;
  koiNoticeSuccess(`文件上传成功，共 ${batchSuccessCount.value} 个`);
  batchSuccessCount.value = 0;
};

// 修改进行回显的时候使用
watch(
  () => [props.fileList],
  () => {
    // 父组件传递回显数据
    fileList.value = props.fileList;
  }
);

const handleExceed = () => {
  koiMsgWarning(`当前最多只能上传 ${props.limit} 个，请移除后上传！`);
};

/** 文件变化handleChange 这里监听上传文件的变化上传一个，执行一下后端上传单个文件请求方法。 */
const handleChange = async (file: any) => {
  // 防止多次执行change
  const rawFile = file.raw;
  const list = props.acceptTypes.split("/");
  let acceptTypeList = list.map((item: string) => {
    return getType(item);
  });
  // 如果要检索的字符串值没有出现，则该方法返回 -1
  const isString = acceptTypeList.filter((item: string) => {
    return rawFile.type.indexOf(item) > -1;
  });
  // 用于校验是否符合上传条件
  const type = props.acceptTypes.replace("/", ", ");
  if (isString.length < 1) {
    koiMsgWarning(`仅支持格式为${type}的文件`);
    return false;
  } else if (rawFile.size / 1024 / 1024 > props.fileSize) {
    koiMsgWarning(`文件大小不能超过${props.fileSize}MB!`);
    const arr = [...fileList.value];
    fileList.value = arr.filter((item: any) => {
      return item.uid != rawFile.uid;
    });
    return false;
  } else {
    let formData = new FormData();
    formData.append("file", rawFile);
    formData.append("fileSize", props.fileSize.toString());
    formData.append("folderName", props.folderName);
    formData.append("fileParam", props.fileParam === "-1" || props.fileParam === "" ? "-1" : props.fileParam);

    const uid = rawFile.uid;
    activeUploadCount.value++;
    uploadPercentByUid.value = { ...uploadPercentByUid.value, [uid]: 0 };

    const requestURL: string = props.action;

    try {
      const res: any = await koi.upload(requestURL, formData, {
        onUploadProgress: (e: { loaded: number; total?: number }) => {
          let pct = 0;
          if (e.total !== undefined && e.total > 0) {
            pct = Math.min(100, Math.round((e.loaded * 100) / e.total));
          }
          uploadPercentByUid.value = { ...uploadPercentByUid.value, [uid]: pct };
        }
      });
      uploadPercentByUid.value = { ...uploadPercentByUid.value, [uid]: 100 };
      let fileMap = res.data;
      fileList.value.push({
        name: fileMap.fileName,
        url: getEnv("VITE_SERVER", "") + fileMap.fileUploadPath
      });
      emits("update:fileList", fileList.value);
      emits("fileSuccess", fileMap);
      formItemContext?.prop && formContext?.validateField([formItemContext.prop as string]);
      batchSuccessCount.value += 1;
    } catch (error) {
      console.log("文件上传", error);
      const arr = [...fileList.value];
      fileList.value = arr.filter((item: any) => {
        return item.uid != rawFile.uid;
      });
      emits("update:fileList", fileList.value);
      koiNoticeError("上传失败，亲，您的文件不支持上传");
    } finally {
      const next = { ...uploadPercentByUid.value };
      delete next[uid];
      uploadPercentByUid.value = next;
      activeUploadCount.value = Math.max(0, activeUploadCount.value - 1);
      flushPendingSuccessNoticeIfAllDone();
    }
  }
  return true;
};

// 文件类型映射表
const fileTypeMap: any = {
  xls: "excel",
  xlsx: "sheet",
  doc: "word",
  docx: "document",
  pdf: "pdf",
  zip: "zip",
  pptx: "presentation",
  text: "text",
  log: "text",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  webm: "video/webm",
  json: "application/json",
  xml: "application/xml",
  yaml: "application/yaml",
  js: "application/javascript",
  css: "text/css",
  html: "text/html",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  sql: "application/sql",
  sh: "application/x-sh",
  py: "text/x-python",
  rb: "text/x-ruby",
  java: "text/x-java",
  c: "text/x-csrc",
  h: "text/x-chdr",
  cpp: "text/x-c++src",
  hpp: "text/x-c++hdr",
  ts: "application/typescript",
  sass: "text/x-sass",
  scss: "text/x-scss",
  less: "text/x-less"
};

/** 校验上传文件格式 */
const getType = (acceptType: string) => {
  const lowerCaseExt = acceptType.toLowerCase();
  return fileTypeMap[lowerCaseExt] || "";
};

/** 移除文件 */
const handleRemove = (url: string) => {
  fileList.value = fileList.value.filter((item: any) => item.url !== url);
  emits("update:fileList", fileList.value);
  emits("fileRemove", url);
};

/** 下载文件 */
const handleDownLoad = async (url: string, name: string) => {
  if (!url && !name) {
    koiMsgError("文件获取失败，请刷新重试");
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      koiMsgError("网络异常，请刷新重试");
      return;
    }
    // 创建 Blob 对象
    const blob = await response.blob();
    // 创建对象 URL
    const downloadUrl = window.URL.createObjectURL(blob);
    // 创建一个隐藏的下载链接
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = name; // 设置下载文件名
    link.style.display = "none";
    // 添加到 DOM 中
    document.body.appendChild(link);
    // 触发点击事件
    link.click();
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("下载失败：", error);
    koiNoticeError("下载失败，请刷新重试");
  }
};

onBeforeUnmount(() => {
  if (batchSuccessCount.value > 0) {
    koiNoticeSuccess(`文件上传成功，共 ${batchSuccessCount.value} 个`);
    batchSuccessCount.value = 0;
  }
});
</script>

<style lang="scss" scoped>
.koi-upload-files-root {
  position: relative;
  display: inline-block;
  min-width: 12.5rem;
  max-width: 100%;
}
.koi-upload-files-progress {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 7.5rem;
  border-radius: .5rem;
  background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
  pointer-events: none;
}
.el-upload-text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6.625rem;
  height: 2rem;
  color: var(--el-color-primary);

  /* 设置用户禁止选择 */
  user-select: none;
  border: .125rem dashed var(--el-color-primary);
  border-radius: .375rem;
  span {
    padding-left: .375rem;
    font-size: .875rem;
    font-weight: 500;
  }
}
.template-file {
  display: flex;
  align-items: center;
  height: 1.125rem;
  border-radius: .25rem;
  padding: .1875rem .375rem;
  max-width: 22.5rem;
  .document-name {
    margin-right: .75rem;
    font-size: .875rem;
    line-height: 1rem;
    height: 1rem;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }
}
.file-tips {
  font-size: .75rem;
  color: var(--el-color-primary);
}
</style>
