<template>
  <div class="h-full w-full">
    <!-- 主容器 -->
    <el-container class="oss-detail-container">
      <!-- 左侧菜单区域 -->
      <el-aside width="300px" class="oss-detail-aside animate__animated animate__fadeInLeft">
        <el-skeleton v-if="menuloading" :rows="10" animated class="oss-menu-skeleton" />

        <el-container v-else class="oss-menu-container">
          <!-- 搜索框 -->
          <el-header class="oss-menu-header">
            <el-input v-model="menuFilterText" placeholder="输入关键字进行过滤" clearable class="oss-search-input"
              prefix-icon="ep:search">
            </el-input>
          </el-header>

          <!-- 文件树 -->
          <el-main class="oss-menu-main">
            <el-scrollbar>
              <el-tree ref="menuRef" class="oss-file-tree" node-key="id" :data="menuList" :props="menuProps" draggable
                highlight-current :expand-on-click-node="false" check-strictly :filter-node-method="filterNode"
                @node-click="menuClick">
                <template #default="{ data }">
                  <div class="oss-tree-node animate__animated animate__fadeIn">
                    <div class="oss-node-content">
                      <div class="oss-node-icon">
                        <IconifyIconOnline :icon="data.fileStorageIcon || 'ep:document'" class="oss-file-icon" />
                      </div>
                      <span class="oss-node-label">{{ data.fileStorageName }}</span>
                      <!-- 文件树节点中的状态标签 -->
                      <el-tag v-if="data.fileStorageStatus == 1" size="small" type="success" effect="light"
                        class="oss-status-tag">
                        启用
                      </el-tag>
                      <el-tag v-else size="small" type="info" effect="light" class="oss-status-tag">
                        未启用
                      </el-tag>
                    </div>

                    <div class="oss-node-actions">
                      <el-tooltip v-if="data.fileStorageStatus == 1" content="查看文件" placement="top" :show-after="300">
                        <el-button type="primary" plain circle size="small" class="oss-action-btn"
                          @click.stop="doView(data)">
                          <IconifyIconOnline icon="ep:view" />
                        </el-button>
                      </el-tooltip>

                      <el-tooltip content="删除" placement="top" :show-after="300">
                        <el-button type="danger" plain circle size="small" class="oss-action-btn"
                          @click.stop="doDelete(data)">
                          <IconifyIconOnline icon="ep:delete" />
                        </el-button>
                      </el-tooltip>
                    </div>
                  </div>
                </template>
              </el-tree>
            </el-scrollbar>
          </el-main>

          <!-- 底部操作栏 -->
          <el-footer class="oss-menu-footer">
            <el-button type="primary" class="oss-add-btn animate__animated animate__fadeInUp" @click="doAdd">
              <IconifyIconOnline icon="ep:plus" />
              <span>添加文件</span>
            </el-button>
          </el-footer>
        </el-container>
      </el-aside>

      <!-- 右侧内容区域 -->
      <el-container class="oss-detail-content animate__animated animate__fadeIn">
        <el-main ref="mainRef" class="oss-content-main">
          <div class="oss-content-wrapper">
            <!-- 保存对话框组件 -->
            <save-dialog v-if="saveDialogVisible" ref="saveRef" :form="form" :menu="clickNode"
              class="oss-dialog-component" @success="afterPropertiesSet" />

            <!-- OSS对话框组件 -->
            <oss-dialog v-else ref="saveRef" :form="form" :menu="clickNode" class="oss-dialog-component" />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { fetchOssDelete, fetchOssPage } from "@/api/monitor/oss";
import { ElMessage, ElMessageBox } from 'element-plus';
import { defineAsyncComponent, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import OssDialog from "./detail/oss.vue";
import { message, uuid } from "@repo/utils";

// 异步组件
const SaveDialog = defineAsyncComponent(() => import("./detail/save.vue"));

// 响应式状态
const menuRef = ref(null);
const mainRef = ref(null);
const saveRef = ref(null);
const menuList = ref([]);
const clickNode = ref({});
const saveDialogVisible = ref(true);
const menuFilterText = ref(null);
const menuloading = ref(false);
const form = reactive({});
const visible = ref(false);
const mode = ref("add");
const title = ref("存储详情");

// 广播频道
let broadcastChannel = null;
let detailBroadcastChannel = null;
let uid = uuid();
// 菜单属性配置
const menuProps = {
  label: 'fileStorageName',
  children: 'children'
};

// 监听菜单过滤文本变化，实时过滤树节点
watch(menuFilterText, (val) => {
  menuRef.value?.filter(val);
});
const handleBeforeUnload = (event) => {
  detailBroadcastChannel.postMessage({
    uid: uid,
    action: 'delete'
  });
};

const handleUnload = () => {
  handleBeforeUnload()
};
// 生命周期钩子
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('unload', handleUnload);
  broadcastChannel = new BroadcastChannel("oss-detail");
  detailBroadcastChannel = new BroadcastChannel("oss-detail-response");
  broadcastChannel.onmessage = channelMessage;
  detailBroadcastChannel.postMessage({
    uid: uid,
    action: 'save'
  });
});

onUnmounted(() => {
  handleBeforeUnload();
  window.removeEventListener('beforeunload', handleBeforeUnload);
  window.removeEventListener('unload', handleUnload);
  broadcastChannel?.close();
  detailBroadcastChannel?.close();
});

// 方法
const channelMessage = (messageEvent) => {
  setData(JSON.parse(messageEvent.data));
  open();
};

/**
 * 树节点过滤方法
 * @param {string} value - 过滤值
 * @param {Object} data - 节点数据
 * @returns {boolean} - 是否显示节点
 */
const filterNode = (value, data) => {
  if (!value) return true;
  return data.fileStorageName.toLowerCase().includes(value.toLowerCase());
};

/**
 * 菜单节点点击处理
 * @param {Object} item - 点击的节点数据
 */
const menuClick = (item) => {
  saveDialogVisible.value = true;
  clickNode.value = item;

  // 添加动画效果
  nextTick(() => {
    const contentEl = document.querySelector('.oss-content-wrapper');
    if (contentEl) {
      contentEl.classList.add('animate__animated', 'animate__fadeIn');
      setTimeout(() => {
        contentEl.classList.remove('animate__animated', 'animate__fadeIn');
      }, 500);
    }
  });
};

/**
 * 删除文件处理
 * @param {Object} row - 要删除的行数据
 */
const doDelete = (row) => {
  ElMessageBox.confirm('确定要删除该文件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    menuloading.value = true;
    fetchOssDelete({
      id: row.fileStorageId
    })
      .then(res => {
        if (res.code === "00000") {
          message(res.msg || '删除成功', { type: 'success' });
          // 从列表中移除已删除项
          menuList.value = menuList.value.filter(item => item.id !== row.id);
          // 如果删除的是当前选中项，清空选中状态
          if (clickNode.value.id === row.id) {
            clickNode.value = {};
            saveDialogVisible.value = true;
          }
        } else {
          message(res.msg || '删除失败', { type: 'error' });
        }
      })
      .finally(() => {
        menuloading.value = false;
      });
  }).catch(() => {
    // 取消删除操作
  });
};

/**
 * 查看文件处理
 * @param {Object} row - 要查看的行数据
 */
const doView = (row) => {
  saveDialogVisible.value = false;
  clickNode.value = row;

  // 添加动画效果
  nextTick(() => {
    const contentEl = document.querySelector('.oss-content-wrapper');
    if (contentEl) {
      contentEl.classList.add('animate__animated', 'animate__fadeIn');
      setTimeout(() => {
        contentEl.classList.remove('animate__animated', 'animate__fadeIn');
      }, 500);
    }
  });
};

/**
 * 添加文件处理
 */
const doAdd = () => {
  saveDialogVisible.value = true;
  clickNode.value = {};

  // 添加动画效果
  nextTick(() => {
    const contentEl = document.querySelector('.oss-content-wrapper');
    if (contentEl) {
      contentEl.classList.add('animate__animated', 'animate__fadeIn');
      setTimeout(() => {
        contentEl.classList.remove('animate__animated', 'animate__fadeIn');
      }, 500);
    }
  });
};

/**
 * 关闭抽屉处理
 */
const close = () => {
  Object.keys(form).forEach(key => {
    delete form[key];
  });
  visible.value = false;
  emit('close');
};

/**
 * 设置数据
 * @param {Object} row - 行数据
 * @returns {Object} - 当前实例，用于链式调用
 */
const setData = (row) => {
  Object.assign(form, row);
  return {
    open
  };
};

/**
 * 初始化数据
 */
const afterPropertiesSet = () => {
  menuloading.value = true;
  fetchOssPage({
    pageNo: 1,
    pageSize: 1000,
    fileStorageProtocolId: form.fileStorageProtocolId,
    fileStorageName: menuFilterText.value
  })
    .then(res => {
      if (res.code === "00000") {
        menuList.value = res.data.data;
      } else {
        ElMessage.error(res.msg || '获取数据失败');
      }
    })
    .finally(() => {
      menuloading.value = false;
    });
};

/**
 * 打开抽屉
 * @param {string} mode - 操作模式
 */
const open = (openMode = "add") => {
  visible.value = true;
  mode.value = openMode;
  afterPropertiesSet();
  if (openMode == "add") {
    title.value = "存储详情";
  }
};

// 对外暴露的方法
defineExpose({
  setData,
  open,
  close
});
</script>

<style lang="scss" scoped>
/* 引入animate.css动画库 */
@import 'animate.css';

/* 抽屉组件样式 */
.oss-detail-drawer {
  :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-bg-color));
  }

  :deep(.el-drawer__body) {
    padding: 0;
    overflow: hidden;
    background-color: var(--el-bg-color-page);
    background-image: radial-gradient(var(--el-color-primary-light-9) 1px, transparent 1px);
    background-size: 30px 30px;
    background-position: -19px -19px;
  }
}

/* 抽屉头部样式 */
.oss-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.oss-detail-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  position: relative;

  .oss-detail-icon {
    margin-right: 10px;
    font-size: 22px;
    color: var(--el-color-primary);
    filter: drop-shadow(0 2px 4px rgba(var(--el-color-primary-rgb), 0.3));
    animation: pulse 2s infinite;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background-color: var(--el-color-primary);
    transition: width 0.5s ease;
  }

  &:hover::after {
    width: 100%;
  }
}

.oss-refresh-btn {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent);
    transition: all 0.5s;
  }

  &:hover {
    transform: rotate(180deg);
    box-shadow: 0 5px 15px rgba(var(--el-color-primary-rgb), 0.3);

    &::before {
      left: 100%;
    }
  }
}

/* 主容器样式 */
.oss-detail-container {
  height: 100%;
  backdrop-filter: blur(5px);
}

/* 左侧菜单区域样式 */
.oss-detail-aside {
  border-right: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  transition: all 0.3s;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

.oss-menu-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.oss-menu-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

.oss-search-input {
  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
    transition: all 0.3s;
    border-radius: 20px;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
      transform: translateY(-2px);
    }
  }
}

.oss-menu-main {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.oss-file-tree {
  padding: 10px;

  :deep(.el-tree-node) {
    position: relative;
    margin: 5px 0;

    &.is-current {
      >.el-tree-node__content {
        background-color: var(--el-color-primary-light-9);
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
        transform: translateX(5px);

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background-color: var(--el-color-primary);
          border-radius: 0 2px 2px 0;
        }
      }
    }

    &:not(.is-current)>.el-tree-node__content:hover {
      background-color: var(--el-fill-color-light);
      border-radius: 6px;
      transform: translateX(3px);
    }
  }

  :deep(.el-tree-node__content) {
    height: auto;
    padding: 8px 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 6px;
    margin: 2px 0;
  }
}

.oss-tree-node {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.oss-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.oss-node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  transition: all 0.3s;

  .oss-tree-node:hover & {
    background-color: var(--el-color-primary-light-9);
    transform: rotate(5deg);
  }
}

.oss-file-icon {
  font-size: 18px;
  color: var(--el-color-primary);
  transition: all 0.3s;

  .oss-tree-node:hover & {
    transform: scale(1.1);
  }
}

.oss-node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.3s;

  .oss-tree-node:hover & {
    color: var(--el-color-primary);
    font-weight: 500;
  }
}

.oss-status-tag {
  margin-left: 8px;
  transform-origin: center right;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 5px rgba(var(--el-color-success-rgb), 0.3);
  }
}

.oss-node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: all 0.3s;
  transform: translateX(10px);
}

.oss-tree-node:hover .oss-node-actions {
  opacity: 1;
  transform: translateX(0);
}

.oss-action-btn {
  padding: 4px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-2px) scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  }
}

.oss-menu-footer {
  height: auto !important;
  padding: 16px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: center;
  background-color: var(--el-bg-color);
}

.oss-add-btn {
  width: 100%;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 20px;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent);
    transition: all 0.5s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(var(--el-color-primary-rgb), 0.3);

    &::before {
      left: 100%;
    }
  }
}

/* 右侧内容区域样式 */
.oss-detail-content {
  background-color: var(--el-bg-color);
  position: relative;
  z-index: 5;
}

.oss-content-main {
  padding: 20px;
  overflow-y: auto;

  /* 隐藏滚动条但保留功能 */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */

  &::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
  }
}

.oss-menu-main {
  flex: 1;
  padding: 0;
  overflow: hidden;

  :deep(.el-scrollbar__wrap) {
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */

    &::-webkit-scrollbar {
      display: none;
      /* Chrome, Safari, Opera */
    }
  }
}

.oss-content-wrapper {
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s;
  min-height: 300px;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(to right, var(--el-color-primary), var(--el-color-success));
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    box-shadow: var(--el-box-shadow);
    transform: translateY(-3px);

    &::before {
      opacity: 1;
    }
  }
}

.oss-dialog-component {
  padding: 20px;
  animation: fadeIn 0.5s;
}

/* 骨架屏样式 */
.oss-menu-skeleton {
  padding: 20px;

  :deep(.el-skeleton__item) {
    margin: 8px 0;
    border-radius: 6px;
  }
}

/* 动画关键帧 */
@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .oss-detail-aside {
    width: 100% !important;
  }

  .oss-detail-container {
    flex-direction: column;
  }

  .oss-node-actions {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .oss-detail-drawer {
    :deep(.el-drawer__body) {
      background-image: radial-gradient(rgba(var(--el-color-primary-rgb), 0.1) 1px, transparent 1px);
    }
  }

  .oss-node-icon {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
</style>
