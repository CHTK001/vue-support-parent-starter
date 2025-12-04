<template>
  <div
    class="serial-manage-container !overflow-hidden h-[100vh]"
    :style="{
      '--layoutRadius': ($storage?.configure.layoutRadius || 10) + 'px',
      '--layoutBlur': ($storage?.configure.layoutBlur || 4) + 'px'
    }"
  >
    <el-container class="manage-layout rounded">
      <!-- 顶部导航�?-->
      <el-header class="manage-header rounded flex items-center">
        <div class="manage-header__back cursor-pointer flex items-center hover:!text-primary transition-all duration-300" @click="router.go(-1)">
          <IconifyIconOnline icon="ep:arrow-left" class="mr-2" />
          <span>{{ $t("buttons.back") }}</span>
        </div>

        <!-- 串口信息 -->
        <div class="manage-header__info ml-4 flex items-center">
          <el-avatar :size="28" class="mr-2 flex-shrink-0 bg-primary-light">
            <IconifyIconOnline icon="mdi:serial-port" />
          </el-avatar>
          <span class="manage-header__title text-text_color_primary font-medium truncate">
            串口监控
          </span>
        </div>

        <!-- 右侧工具�?-->
        <div class="manage-header__tools ml-auto flex items-center gap-3">
          <el-tooltip content="刷新数据" placement="bottom">
            <el-button type="primary" text circle class="manage-header__btn" @click="refreshData">
              <IconifyIconOnline icon="ep:refresh" />
            </el-button>
          </el-tooltip>

          <el-tooltip :content="visible.sideShow ? '隐藏侧边�? : '显示侧边�?" placement="bottom">
            <el-button type="primary" text circle class="manage-header__btn" @click="hideSide">
              <IconifyIconOnline :icon="visible.sideShow ? 'ep:d-arrow-left' : 'ep:d-arrow-right'" />
            </el-button>
          </el-tooltip>

          <el-tooltip content="设置" placement="bottom">
            <el-button type="primary" text circle class="manage-header__btn" @click="openSettings">
              <IconifyIconOnline icon="ep:setting" />
            </el-button>
          </el-tooltip>
        </div>
      </el-header>

      <!-- 主内容区�?-->
      <el-main class="manage-main !p-[5px]">
        <div class="manage-split-pane relative">
          <splitpane :splitSet="settingLR">
            <!-- 左侧面板：串口列�?-->
            <template #paneL>
              <div v-if="visible.sideShow" class="manage-panel h-full">
                <serial-list
                  ref="serialListRef"
                  :serialList="serialList"
                  :selectedSerialId="selectedSerialId"
                  :availablePorts="availablePorts"
                  :loadingPorts="loadingPorts"
                  @select-serial="handleSelectSerial"
                  @add-serial="handleAddSerial"
                  @edit-serial="handleEditSerial"
                  @delete-serial="handleDeleteSerial"
                  @refresh="loadSerialList"
                  @refresh-ports="loadAvailablePorts"
                />
              </div>
            </template>

            <!-- 右侧面板：串口监�?-->
            <template #paneR>
              <Suspense>
                <template #default>
                  <ScLazy :time="200">
                    <serial-monitor
                      ref="serialMonitorRef"
                      :serialData="currentSerialData"
                      @connect="handleConnect"
                      @disconnect="handleDisconnect"
                      @send="handleSend"
                    />
                  </ScLazy>
                </template>
                <template #fallback>
                  <div class="manage-loading flex items-center justify-center h-full">
                    <div class="manage-loading__content text-center">
                      <el-skeleton :rows="10" animated />
                      <p class="manage-loading__text mt-4 text-text_color_secondary">正在加载数据，请稍�?..</p>
                    </div>
                  </div>
                </template>
              </Suspense>
            </template>
          </splitpane>
        </div>
      </el-main>
    </el-container>

    <!-- 设置对话�?-->
    <el-dialog
      v-model="settingsDialogVisible"
      title="串口设置"
      width="500px"
      destroy-on-close
    >
      <serial-settings
        ref="settingsRef"
        :serialData="currentSerialData"
        @save="handleSaveSettings"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="settingsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useGlobal } from "@pureadmin/utils";
import splitpane from "@repo/components/ReSplitPane";
import ScLazy from "@repo/components/ScLazy/index.vue";
import { useConfigStore } from "@repo/core";
import { message } from "@repo/utils";
import { computed, defineAsyncComponent, onMounted, reactive, ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { SerialDB } from "@/utils/serialDB";

// 全局配置
const { $storage, $config } = useGlobal();
const router = useRouter();
const route = useRoute();

// 组件引用
const serialListRef = ref();
const serialMonitorRef = ref();
const settingsRef = ref();

// 异步加载组件
const SerialList = defineAsyncComponent(() => import("./components/SerialList.vue"));
const SerialMonitor = defineAsyncComponent(() => import("./components/SerialMonitor.vue"));
const SerialSettings = defineAsyncComponent(() => import("./components/SerialSettings.vue"));

// 串口数据
const serialList = ref([]);
const selectedSerialId = ref('');
const currentSerialData = ref({});
const settingsDialogVisible = ref(false);
const availablePorts = ref([]);
const loadingPorts = ref(false);

// 界面显示状�?
const visible = reactive({
  sideShow: true // 是否显示侧边�?
});

/**
 * 计算分屏设置
 * 根据侧边栏显示状态动态调整分屏比�?
 */
const settingLR = computed(() => {
  return {
    minPercent: visible.sideShow ? 10 : 0,
    defaultPercent: visible.sideShow ? 25 : 0,
    split: "vertical"
  };
});

/**
 * 切换侧边栏显示状�?
 */
const hideSide = () => {
  visible.sideShow = !visible.sideShow;
  // 强制更新分屏设置
  nextTick(() => {
    console.log("侧边栏状�?", visible.sideShow);
  });
};

/**
 * 加载可用串口列表
 */
const loadAvailablePorts = async () => {
  try {
    loadingPorts.value = true;
    const response = await SerialDB.fetchSerialAvailablePorts();

    if (response.code === '00000') {
      availablePorts.value = response.data || [];
    } else {
      console.warn('获取可用串口失败:', response.msg);
      availablePorts.value = [];
    }
  } catch (error) {
    console.error('获取可用串口失败:', error);
    availablePorts.value = [];
  } finally {
    loadingPorts.value = false;
  }
};

/**
 * 加载串口列表
 */
const loadSerialList = async () => {
  try {
    const response = await SerialDB.fetchSerialPage({ page: 1, pageSize: 100 });

    if (response.code === '00000') {
      serialList.value = response.data.records || [];

      // 如果有串口，默认选择第一�?
      if (serialList.value.length > 0 && !selectedSerialId.value) {
        selectedSerialId.value = serialList.value[0].monitorSerialId;
        currentSerialData.value = serialList.value[0];
      }
    } else {
      console.error('加载串口列表失败:', response.msg);
      message.error('加载串口列表失败');
    }
  } catch (error) {
    console.error('加载串口列表失败:', error);
    message.error('加载串口列表失败');
  }
};

/**
 * 处理选择串口
 */
const handleSelectSerial = (serialId) => {
  selectedSerialId.value = serialId;
  currentSerialData.value = serialList.value.find(item => item.monitorSerialId === serialId) || {};
};

/**
 * 处理添加串口
 */
const handleAddSerial = async (serialData) => {
  try {
    const response = await SerialDB.fetchSerialSave(serialData);

    if (response.code === '00000') {
      message.success('添加串口成功');
      await loadSerialList();

      // 选择新添加的串口
      if (response.data) {
        selectedSerialId.value = response.data.monitorSerialId;
        currentSerialData.value = response.data;
      }
    } else {
      message.error(response.msg || '添加串口失败');
    }
  } catch (error) {
    console.error('添加串口失败:', error);
    message.error('添加串口失败');
  }
};

/**
 * 处理编辑串口
 */
const handleEditSerial = async (serialData) => {
  try {
    const response = await SerialDB.fetchSerialUpdate(serialData);

    if (response.code === '00000') {
      message.success('更新串口成功');
      await loadSerialList();

      // 如果编辑的是当前选中的串口，更新当前数据
      if (selectedSerialId.value === serialData.monitorSerialId) {
        currentSerialData.value = response.data;
      }
    } else {
      message.error(response.msg || '更新串口失败');
    }
  } catch (error) {
    console.error('更新串口失败:', error);
    message.error('更新串口失败');
  }
};

/**
 * 处理删除串口
 */
const handleDeleteSerial = async (serialId) => {
  try {
    const response = await SerialDB.fetchSerialDelete(serialId);

    if (response.code === '00000') {
      message.success('删除串口成功');
      await loadSerialList();

      // 如果删除的是当前选中的串口，选择列表中的第一个串口或清空当前数据
      if (selectedSerialId.value === serialId) {
        if (serialList.value.length > 0) {
          selectedSerialId.value = serialList.value[0].monitorSerialId;
          currentSerialData.value = serialList.value[0];
        } else {
          selectedSerialId.value = '';
          currentSerialData.value = {};
        }
      }
    } else {
      message.error(response.msg || '删除串口失败');
    }
  } catch (error) {
    console.error('删除串口失败:', error);
    message.error('删除串口失败');
  }
};

/**
 * 刷新数据
 */
const refreshData = () => {
  loadSerialList();
  message.success('数据已刷�?);
};

/**
 * 打开设置对话�?
 */
const openSettings = () => {
  settingsDialogVisible.value = true;
};

/**
 * 保存设置
 */
const saveSettings = async () => {
  try {
    if (settingsRef.value) {
      const settings = await settingsRef.value.getSettings();
      
      // 更新当前串口设置
      if (selectedSerialId.value) {
        const index = serialList.value.findIndex(item => item.monitorSerialId === selectedSerialId.value);
        if (index !== -1) {
          serialList.value[index] = { ...serialList.value[index], ...settings };
          currentSerialData.value = serialList.value[index];
          await indexedDBProxy.setItem('serialList', serialList.value);
        }
      }
      
      settingsDialogVisible.value = false;
      message.success('设置已保�?);
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    message.error('保存设置失败');
  }
};

/**
 * 处理串口连接
 */
const handleConnect = (data) => {
  console.log('连接串口:', data);
  // 实际连接串口的逻辑
};

/**
 * 处理串口断开连接
 */
const handleDisconnect = (data) => {
  console.log('断开串口连接:', data);
  // 实际断开串口连接的逻辑
};

/**
 * 处理发送数�?
 */
const handleSend = (data) => {
  console.log('发送数�?', data);
  // 实际发送数据的逻辑
};

/**
 * 处理保存设置
 */
const handleSaveSettings = (settings) => {
  console.log('保存设置:', settings);
  // 实际保存设置的逻辑
};

// 组件挂载时初始化
onMounted(async () => {
  // 并行加载串口列表和可用端�?
  await Promise.all([
    loadSerialList(),
    loadAvailablePorts()
  ]);

  // 加载配置
  useConfigStore().load();
});
</script>

<style lang="scss" scoped>
.serial-manage-container {
  background-color: var(--el-bg-color);
}

.manage-layout {
  height: 100%;
  box-shadow: var(--el-box-shadow-light);
}

.manage-header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  height: 60px !important;
  padding: 0 20px;

  &__back {
    font-size: 14px;
    font-weight: 500;
  }

  &__info {
    max-width: 200px;
  }

  &__title {
    font-size: 15px;
    max-width: 150px;
  }

  &__btn {
    transition: all 0.3s;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.manage-main {
  height: calc(100vh - 60px);
  overflow: hidden;
  position: relative;
}

.manage-split-pane {
  width: 100%;
  height: 100%;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  transition: all 0.3s ease;
}

.manage-panel {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
}

.manage-loading {
  padding: 20px;

  &__content {
    max-width: 600px;
  }

  &__text {
    font-size: 14px;
  }
}

:deep(.splitter-pane-resizer.horizontal),
:deep(.splitter-pane-resizer.vertical) {
  background-color: var(--el-border-color) !important;
  opacity: 0.6;
  transition: all 0.3s;

  &:hover {
    background-color: var(--el-color-primary) !important;
    opacity: 1;
  }
}

.bg-primary-light {
  background-color: var(--el-color-primary-light-8);
}
</style> 