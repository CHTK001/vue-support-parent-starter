<template>
  <el-dialog v-model="dialogStatus" title="代码预览" :close-on-click-modal="false" width="75%" top="5vh" destroy-on-close draggable class="code-view-dialog" @closed="$emit('closed')">
    <template #header>
      <div class="code-view-header">
        <IconifyIconOnline icon="ri:code-box-line" class="code-view-header__icon" />
        <span class="code-view-header__title">生成代码预览</span>
      </div>
    </template>

    <el-skeleton :rows="15" :animated="true" :loading="codeLoading" class="code-view-skeleton">
      <template v-if="viewData.length > 0">
        <el-tabs v-model="activeName" class="code-view-tabs" type="border-card" @tab-click="handleClick">
          <el-tab-pane v-for="item in viewData" :key="item.name" :label="item.name" :name="item.name" class="code-view-tab-pane">
            <div class="code-view-toolbar">
              <el-tag v-if="item.path" type="info" class="code-view-path">
                <IconifyIconOnline icon="ri:file-code-line" class="code-view-path__icon" />
                {{ item.path }}
              </el-tag>

              <div class="code-view-actions">
                <el-tooltip content="复制代码" placement="top">
                  <el-button type="primary" link @click="copyCode(item.content)">
                    <IconifyIconOnline icon="ri:clipboard-line" />
                    复制
                  </el-button>
                </el-tooltip>
              </div>
            </div>

            <highlightjs :language="item.type" :autodetect="false" :code="item.content" class="code-view-highlight" />
          </el-tab-pane>
        </el-tabs>
      </template>

      <el-empty v-else description="暂无代码可预览" class="code-view-empty">
        <template #image>
          <IconifyIconOnline icon="ri:code-s-slash-line" class="code-view-empty__icon" />
        </template>
      </el-empty>
    </el-skeleton>
  </el-dialog>
</template>

<script setup>
import { fetchGenTableTemplate } from "@/api/monitor/gen/table";
import "highlight.js/styles/atom-one-light.css";
import hljsVuePlugin from "@highlightjs/vue-plugin";
import "highlight.js/lib/common";
import { copyTextToClipboard } from "@pureadmin/utils";
import { message } from "@repo/utils";
import { ref, reactive, defineEmits } from "vue";

// 组件
const { component: highlightjs } = hljsVuePlugin;

// 定义组件事件
defineEmits(["closed"]);

// 组件状态
const codeLoading = ref(true);
const activeName = ref("");
const dialogStatus = ref(false);
const downloadForm = reactive({});
const viewData = ref([]);

/**
 * 复制代码到剪贴板
 * @param {String} content - 要复制的代码内容
 */
const copyCode = content => {
  copyTextToClipboard(content);
  message("代码已复制到剪贴板", { type: "success" });
};

/**
 * 处理标签页点击事件
 */
const handleClick = () => {
  // 可以在这里添加标签页切换逻辑
};

/**
 * 打开对话框并加载代码
 * @param {Object} data - 请求参数
 */
const open = data => {
  dialogStatus.value = true;
  codeLoading.value = true;

  // 复制请求参数
  Object.assign(downloadForm, data);

  // 获取代码模板
  fetchGenTableTemplate(data)
    .then(res => {
      if (res.code === "00000") {
        viewData.value = res.data;

        // 默认选中第一个标签页
        if (viewData.value.length > 0) {
          activeName.value = viewData.value[0].name;
        }
      } else {
        message(res.msg || "获取代码模板失败", { type: "error" });
      }
    })
    .catch(error => {
      console.error("获取代码模板出错:", error);
      message("获取代码模板出错", { type: "error" });
    })
    .finally(() => {
      codeLoading.value = false;
    });
};

// 导出组件方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.code-view-dialog {
  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__title) {
    font-weight: 600;
    font-size: 18px;
  }
}

.code-view-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;

  &__icon {
    font-size: 20px;
    color: var(--el-color-primary);
    margin-right: 8px;
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.code-view-skeleton {
  padding: 0 20px 20px;
}

.code-view-tabs {
  min-height: 600px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav) {
    border-radius: 4px 4px 0 0;
  }

  :deep(.el-tabs__item) {
    height: 40px;
    line-height: 40px;
    font-size: 14px;

    &.is-active {
      font-weight: 500;
    }
  }

  :deep(.el-tabs__content) {
    padding: 0;
    overflow: hidden;
  }
}

.code-view-tab-pane {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.code-view-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);
}

.code-view-path {
  display: flex;
  align-items: center;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;

  &__icon {
    margin-right: 4px;
  }
}

.code-view-actions {
  display: flex;
  gap: 8px;
}

.code-view-highlight {
  flex: 1;
  overflow: auto;
  height: calc(100% - 40px);
  font-size: 14px;
  font-family: "Consolas", "Monaco", "Menlo", "Courier New", monospace;
  padding: 16px;

  :deep(pre) {
    margin: 0;
    border-radius: 4px;
  }

  :deep(code) {
    font-family: "Consolas", "Monaco", "Menlo", "Courier New", monospace;
    line-height: 1.6;
  }
}

.code-view-empty {
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &__icon {
    font-size: 80px;
    color: var(--el-color-info-light-5);
  }
}
</style>
