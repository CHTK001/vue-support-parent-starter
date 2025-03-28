<template>
  <!-- OSS文件浏览器容器 -->
  <div class="oss-browser-container animate__animated animate__fadeIn">
    <el-container class="full-height">
      <!-- 顶部工具栏 -->
      <el-header class="oss-browser-header">
        <div class="left-panel">
          <!-- 视图切换按钮组 -->
          <el-radio-group v-model="showType" size="small" class="view-switcher animate__animated animate__fadeInLeft">
            <el-radio-button label="list">
              <IconifyIconOnline icon="ep:list" class="view-icon" />
              <span>列表</span>
            </el-radio-button>
            <el-radio-button label="grid">
              <IconifyIconOnline icon="ep:grid" class="view-icon" />
              <span>卡片</span>
            </el-radio-button>
            <el-radio-button label="mode">
              <IconifyIconOnline icon="ep:picture" class="view-icon" />
              <span>大图</span>
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="right-panel animate__animated animate__fadeInRight">
          <!-- 每页显示数量选择器 -->
          <el-select v-model="limit" class="limit-selector" placeholder="每页显示">
            <el-option v-for="item in [10, 20, 50, 100, 200, 500, 1000]" :key="item" :label="`${item}条`"
              :value="item" />
          </el-select>
          <!-- 刷新按钮 -->
          <el-button circle class="refresh-btn" type="primary" plain @click="afterPropertiesSet()">
            <IconifyIconOnline icon="ep:refresh" />
          </el-button>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-main class="oss-browser-main  overflow-auto">
        <!-- 页面头部导航 -->
        <el-page-header @back="onBack" class="oss-page-header">
          <template #breadcrumb>
            <!-- 面包屑导航 -->
            <el-breadcrumb separator="/">
              <el-breadcrumb-item v-for="(item, index) in router" :key="index"
                class="breadcrumb-item animate__animated animate__fadeIn"
                :style="{ animationDelay: index * 0.05 + 's' }">
                {{ item }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </template>
          <template #content>
            <div class="flex items-center">
              <!-- 当前标记 -->
              <el-tag v-if="marker" type="info" effect="light" class="marker-tag animate__animated animate__fadeIn">
                {{ marker }}
              </el-tag>
            </div>
          </template>

          <!-- 加载骨架屏 -->
          <el-skeleton :rows="1" :loading="loading" animated class="oss-skeleton" />

          <!-- 内容区域 -->
          <div v-if="!loading" class="oss-content animate__animated animate__fadeIn">
            <!-- 空数据提示 -->
            <el-empty v-if="metadata.length === 0" description="暂无数据"
              class="empty-data animate__animated animate__fadeIn" />

            <!-- 文件列表视图 -->
            <template v-else>
              <!-- 列表布局 -->
              <list-layout v-if="showType === 'list'" :canPreview="canPreview" :canDownload="canDownload" :menu="menu"
                :data="metadata" :parentPath="path" class="layout-component animate__animated animate__fadeIn"
                @copy="doCopy" @download="doDownload" @search="doSearch" @preview="doPreview" />

              <!-- 网格布局 -->
              <grid-layout v-else-if="showType === 'grid'" :menu="menu" :canPreview="canPreview"
                :canDownload="canDownload" :data="metadata" :parentPath="path"
                class="layout-component animate__animated animate__fadeIn" @copy="doCopy" @download="doDownload"
                @search="doSearch" @preview="doPreview" />

              <!-- 大图布局 -->
              <mode-layout v-else-if="showType === 'mode'" :menu="menu" :form="form" :canPreview="canPreview"
                :canDownload="canDownload" :data="metadata" :parentPath="path"
                class="layout-component animate__animated animate__fadeIn full-content" @copy="doCopy"
                @download="doDownload" @search="doSearch" @preview="doPreview" />

              <!-- 预览组件 -->
              <view-layout v-if="viewLayoutStatus && canPreview" ref="viewLayoutRef" :menu="menu"
                class="modal-component" />

              <!-- 下载组件 -->
              <download-layout v-if="downloadLayoutStatus && canDownload" ref="downloadLayoutRef" :menu="menu"
                class="modal-component" />
            </template>
          </div>
        </el-page-header>
      </el-main>

      <!-- 底部分页区域 -->
      <el-footer class="oss-browser-footer z-[-1]" v-if="!loading && metadata.length > 0">
        <el-pagination v-model:current-page="currentPage" next-text="下一页" :page-size="limit" layout="->, next"
          :total="total" class="oss-pagination animate__animated animate__fadeInUp" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import ListLayout from "../layout/ListLayout.vue";
import ModeLayout from "../layout/ModeLayout.vue";
import GridLayout from "../layout/GridLayout.vue";
import ViewLayout from "../layout/ViewLayout.vue";
import DownloadLayout from "../layout/DownloadLayout.vue";
import { fetchOssViewer } from "@/api/monitor/oss";
import { normalizePath } from "@repo/config";
import { copyTextToClipboard } from "@pureadmin/utils";
import { message } from "@repo/utils";

// 定义props
const props = defineProps({
  form: {
    type: Object,
    default: () => ({})
  },
  menu: {
    type: Object,
    default: () => ({})
  }
});

// 响应式状态
const viewLayoutRef = ref(null);
const downloadLayoutRef = ref(null);
const viewLayoutStatus = ref(false);
const downloadLayoutStatus = ref(false);
const total = ref(1000000000);
const currentPage = ref(1);
const showType = ref('grid');
const router = ref(['/']);
const marker = ref(null);
const path = ref('/');
const limit = ref(100);
const loading = ref(true);
const metadata = ref([]);
const canPreview = ref(false);
const canDownload = ref(false);

/**
 * 检查文件预览和下载权限
 * @param {Object} form - 表单数据
 */
const check = (form) => {
  canPreview.value = form.fileStorageProtocolStatus === 1 &&
    (form.fileStorageProtocolPreviewOrDownload === 0 || form.fileStorageProtocolPreviewOrDownload === 1);

  canDownload.value = form.fileStorageProtocolStatus === 1 &&
    (form.fileStorageProtocolPreviewOrDownload === 0 || form.fileStorageProtocolPreviewOrDownload === 2);
};

/**
 * 处理每页显示数量变化
 * @param {Number} val - 新的每页显示数量
 */
const handleSizeChange = (val) => {
  limit.value = val;
};

/**
 * 处理页码变化
 */
const handleCurrentChange = () => {
  afterPropertiesSet(marker.value);
};

/**
 * 返回上一级目录
 */
const onBack = () => {
  router.value = router.value.slice(0, router.value.length - 1);
  if (router.value.length === 0) {
    router.value.push('/');
    return;
  }
  path.value = router.value.join('/');
  afterPropertiesSet();
};

/**
 * 预览文件
 * @param {String} filePath - 文件路径
 * @param {Object} row - 文件数据
 */
const doPreview = (filePath, row) => {
  if (!canPreview.value) {
    return;
  }
  viewLayoutStatus.value = true;
  nextTick(() => {
    viewLayoutRef.value.setData(filePath, row, props.menu, props.form).open();
  });
};

/**
 * 获取主机地址
 * @param {Object} form - 表单数据
 * @returns {String} - 格式化后的主机地址
 */
const getHost = (form) => {
  const fileStorageProtocolHost = form.fileStorageProtocolHost;
  return fileStorageProtocolHost === '0.0.0.0' ? '127.0.0.1' : fileStorageProtocolHost;
};

/**
 * 复制文件链接
 * @param {String} filePath - 文件路径
 * @param {Object} row - 文件数据
 */
const doCopy = (filePath, row) => {
  if (!canPreview.value) {
    return;
  }

  const fullPath =
    props.form.fileStorageProtocolName.toLowerCase() +
    '://' +
    getHost(props.form) +
    ':' +
    props.form.fileStorageProtocolPort +
    (props.menu.fileStorageBucket.startsWith('/') ? props.menu.fileStorageBucket : '/' + props.menu.fileStorageBucket) +
    (filePath.startsWith('/') ? filePath : '/' + filePath);

  if (copyTextToClipboard(fullPath)) {
    message('复制成功!', { duration: 3000, type: 'success' });
  }
};

/**
 * 下载文件
 * @param {String} filePath - 文件路径
 * @param {Object} row - 文件数据
 */
const doDownload = (filePath, row) => {
  if (!canDownload.value) {
    ElMessage.error('该文件不支持下载');
    return;
  }
  downloadLayoutStatus.value = true;
  nextTick(() => {
    downloadLayoutRef.value.setData(filePath, row, props.menu, props.form).open();
  });
};

/**
 * 搜索文件
 * @param {String} searchPath - 搜索路径
 */
const doSearch = (searchPath) => {
  path.value = normalizePath(searchPath);
  router.value = [];
  router.value.push('/');

  path.value.split('/').forEach(item => {
    if (!item) {
      return;
    }
    router.value.push(item);
  });

  afterPropertiesSet();
};

/**
 * 初始化数据
 * @param {String} markerValue - 标记值
 */
const afterPropertiesSet = (markerValue) => {
  if (!markerValue) {
    total.value = 10000000000000;
  }

  loading.value = true;

  fetchOssViewer({
    fileStorageId: props.menu.fileStorageId,
    limit: limit.value,
    marker: markerValue,
    path: path.value
  })
    .then(res => {
      if (res.code === '00000') {
        metadata.value = res.data.metadata || [];
        marker.value = res.data.marker;

        if (metadata.value.length === 0 || metadata.value.length < limit.value) {
          total.value = 0;
          marker.value = null;
        }
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

// 监听表单变化
watch(() => props.form, (newVal) => {
  check(newVal);
}, { deep: true });

// 组件挂载时初始化
onMounted(() => {
  check(props.form);
  afterPropertiesSet();
});
</script>

<style lang="scss" scoped>
/* 引入animate.css动画库 */
@import 'animate.css';

:deep(.el-page-header__main) {
  overflow: auto;
}

/* OSS浏览器容器 */
.oss-browser-container {
  height: 95vh;
  /* 使用视口高度 */
  width: 100%;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 确保容器内的元素也撑满高度 */
.full-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 头部工具栏 */
.oss-browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s;
  flex-shrink: 0;
  /* 防止头部被压缩 */
  border-radius: 20px;

  .left-panel,
  .right-panel {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .view-switcher {
    .view-icon {
      margin-right: 4px;
    }
  }

  .limit-selector {
    width: 100px;
  }

  .refresh-btn {
    transition: all 0.3s;

    &:hover {
      transform: rotate(180deg);
    }
  }
}

/* 主内容区域 */
.oss-browser-main {
  background-color: var(--el-bg-color-page);
  flex: 1;
  /* 让主内容区域占据剩余空间 */
  overflow: hidden;
  display: flex;
  flex-direction: column;

  padding-left: 0;
  padding-right: 0;
}

/* 底部分页区域 */
.oss-browser-footer {
  border-radius: 20px;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  height: auto;
}

/* 页面头部 */
.oss-page-header {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: var(--el-box-shadow-light);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.el-page-header__header) {
    margin-bottom: 16px;
  }
}

/* 面包屑导航 */
.breadcrumb-item {
  transition: all 0.3s;

  &:hover {
    color: var(--el-color-primary);
  }
}

/* 标记标签 */
.marker-tag {
  margin-left: 8px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

/* 内容区域 */
.oss-content {
  margin-top: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 空数据提示 */
.empty-data {
  padding: 40px 0;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 布局组件 */
.layout-component {
  margin-bottom: 0;
  transition: all 0.3s;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* 大图模式特别样式 */
.full-content {
  height: auto;
  max-height: calc(100% - 16px);
  overflow: auto;
}

/* 分页控件 */
.oss-pagination {
  padding: 8px 0;
  display: flex;
  justify-content: flex-end;
}

/* 骨架屏 */
.oss-skeleton {
  margin: 16px 0;
  flex: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .oss-browser-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .right-panel {
      width: 100%;
      justify-content: space-between;
    }
  }

  .full-content {
    height: calc(100vh - 300px);
    /* 移动设备上调整高度 */
  }
}
</style>
