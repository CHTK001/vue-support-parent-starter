<template>
  <el-dialog v-model="visible" title="模板控制台" width="80%" draggable top="20px" :close-on-click-modal="false" class="template-dialog" destroy-on-close>
    <el-container class="template-container">
      <!-- 头部工具栏 -->
      <el-header class="template-header">
        <div class="template-header__left">
          <el-button type="primary" class="template-header__btn" @click="doAddSave">
            <IconifyIconOnline icon="ep:plus" class="mr-1" />
            <span>新增模板</span>
          </el-button>
        </div>
        <div class="template-header__right">
          <el-button type="primary" class="template-header__btn" @click="search">
            <IconifyIconOnline icon="ep:refresh" class="mr-1" />
            <span>刷新</span>
          </el-button>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-main class="template-main">
        <!-- 空数据状态 -->
        <el-empty v-if="returnData.length === 0" description="暂无模板数据" class="template-empty">
          <el-button type="primary" @click="doAddSave">添加模板</el-button>
        </el-empty>

        <!-- 模板标签页 -->
        <el-tabs v-else v-model="activeName" class="template-tabs" @tab-click="handleClick">
          <el-tab-pane
            v-for="item in returnData"
            :key="item.templateId"
            ref="myTable"
            :label="item.templateName + '.' + item.templateType"
            :name="item.templateName + '.' + item.templateType"
            class="template-tab-pane"
          >
            <div class="template-editor-wrapper">
              <!-- 代码编辑器 -->
              <ScCodeEditor
                :ref="item.templateName + '.' + item.templateType"
                v-model="item.templateContent"
                :height="650"
                :options="options"
                :onInput="onInput"
                :onCursorActivity="onCursorActivity"
                mode="groovy"
                class="template-editor"
              />

              <!-- 操作按钮 -->
              <div v-if="item.templateId" class="template-editor__actions">
                <el-button size="small" type="danger" :loading="isLoadDatabase" class="template-editor__btn" @click="doDelete(item)">
                  <IconifyIconOnline icon="ep:delete" class="mr-1" />
                  <span>删除</span>
                </el-button>

                <el-button size="small" type="primary" :loading="isLoadDatabase" class="template-editor__btn" @click="doSave(item)">
                  <IconifyIconOnline icon="ri:save-2-line" class="mr-1" />
                  <span>保存</span>
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>

    <!-- 保存对话框 -->
    <save-dialog v-if="saveDialogStatus" ref="saveDialogRef" @success="handlerSuccess" />
  </el-dialog>
</template>

<script setup>
import { fetchGenTemplateDelete, fetchGenTemplatePage, fetchGenTemplateUpdate } from "@/api/monitor/gen/template";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import SaveDialog from "./save.vue";
import { message } from "@repo/utils";
import { ref, reactive, onMounted, onUnmounted, nextTick, defineExpose } from "vue";

// 对话框可见性
const visible = ref(false);

// 加载状态
const isLoadDatabase = ref(false);

// 保存对话框状态
const saveDialogStatus = ref(false);

// 当前激活的标签页
const activeName = ref("first");

// 当前数据
const data = ref(null);

// 组件引用
const saveDialogRef = ref(null);
const myTable = ref([]);

// 表单数据
const form = reactive({
  page: 1,
  pageSize: 10,
  genId: null
});

// 返回数据
const returnData = ref([]);
const returnTotal = ref(0);

// 编辑器选项
const options = reactive({
  height: 1000,
  hintOptions: {
    // 自定义提示选项
    completeSingle: false
  }
});

/**
 * 打开对话框
 * @param {string} mode - 打开模式
 * @returns {Object} - 当前实例，支持链式调用
 */
const open = (mode = "add") => {
  visible.value = true;
  return { setData };
};

/**
 * 设置数据
 * @param {Object} formData - 表单数据
 * @returns {Object} - 当前实例，支持链式调用
 */
const setData = formData => {
  form.genId = formData.genId;
  window.addEventListener("keydown", handleEvent);
  search();
  return { open };
};

/**
 * 添加新模板
 */
const doAddSave = () => {
  saveDialogStatus.value = true;
  nextTick(() => {
    saveDialogRef.value.open();
  });
};

/**
 * 处理保存成功事件
 */
const handlerSuccess = () => {
  search();
};

/**
 * 保存模板
 * @param {Object} row - 模板数据
 */
const doSave = row => {
  isLoadDatabase.value = true;
  fetchGenTemplateUpdate(row)
    .then(res => {
      if (res.code == "00000") {
        message("保存成功", { type: "success" });
        return;
      }
      message(res.msg, { type: "error" });
    })
    .finally(() => (isLoadDatabase.value = false));
};

/**
 * 删除模板
 * @param {Object} row - 模板数据
 */
const doDelete = row => {
  isLoadDatabase.value = true;
  fetchGenTemplateDelete({ id: row.templateId })
    .then(res => {
      if (res.code == "00000") {
        message("删除成功", { type: "success" });
        search();
        return;
      }
      message(res.msg, { type: "error" });
    })
    .finally(() => (isLoadDatabase.value = false));
};

/**
 * 处理标签页点击事件
 * @param {Object} tab - 标签页对象
 */
const handleClick = tab => {
  data.value = returnData.value[tab.index];
  nextTick(() => {
    if (myTable.value[tab.paneName] && myTable.value[tab.paneName][0]) {
      myTable.value[tab.paneName][0].refresh();
    }
  });
};

/**
 * 编辑器输入事件
 * @param {Object} val - 编辑器实例
 * @param {Object} s - 事件对象
 */
const onInput = (val, s) => {
  if (s.code.indexOf("Arrow") > -1) {
    return false;
  }
  val.showHint();
};

/**
 * 编辑器光标活动事件
 * @param {Object} cm - 编辑器实例
 * @param {Object} s - 事件对象
 */
const onCursorActivity = (cm, s) => {
  if (!cm.getSelection()) {
    // 获取到选中部分内容，用来实现执行部分内容
  }
};

/**
 * 搜索模板
 */
const search = () => {
  isLoadDatabase.value = true;
  fetchGenTemplatePage(form)
    .then(res => {
      if (res.code == "00000") {
        returnData.value = res.data.data;
        returnTotal.value = res.data.total;
        if (returnData.value.length > 0) {
          data.value = returnData.value[0];
          activeName.value = data.value.templateName + "." + data.value.templateType;
        }
        return;
      }
      message(res.msg, { type: "error" });
    })
    .finally(() => (isLoadDatabase.value = false));
};

/**
 * 处理键盘事件
 * @param {Event} event - 键盘事件
 */
const handleEvent = event => {
  // 处理Ctrl+S保存
  if (event.ctrlKey && event.code === "KeyS") {
    event.preventDefault();
    event.returnValue = false; // 阻止直接保存网页

    if (data.value) {
      doSave(data.value);
    }
  }
};

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener("keydown", handleEvent);
});

// 导出组件方法
defineExpose({
  open,
  setData
});
</script>

<style lang="scss" scoped>
.template-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.template-container {
  height: 100%;
  background-color: var(--el-bg-color);
}

.template-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid var(--el-border-color-light);

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__btn {
    display: flex;
    align-items: center;
  }
}

.template-main {
  padding: 0;
  height: calc(100% - 60px);
  overflow: hidden;
}

.template-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.template-tabs {
  height: 100%;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
    padding: 0 20px;
    background-color: var(--el-bg-color-overlay);
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    padding: 0;
  }
}

.template-tab-pane {
  height: 100%;
}

.template-editor-wrapper {
  position: relative;
  height: 100%;
  padding: 10px;
}

.template-editor {
  width: 100%;
  height: 100%;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;

  &__actions {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 10;
  }

  &__btn {
    display: flex;
    align-items: center;
    backdrop-filter: blur(8px);
    background-color: rgba(var(--el-bg-color-rgb), 0.8);
    border: 1px solid var(--el-border-color);
    box-shadow: var(--el-box-shadow-light);
  }
}
</style>
