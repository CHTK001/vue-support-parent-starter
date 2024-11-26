<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useGridStackStore } from "@repo/core";
import { useDefer } from "@repo/utils";
import Check from "@iconify-icons/ep/check";
import Close from "@iconify-icons/ep/close";
import Edit from "@iconify-icons/ep/edit";
import Plus from "@iconify-icons/ep/plus";
import { nextTick, onBeforeMount, onMounted, reactive, ref, toRaw } from "vue";
const gridStackStore = useGridStackStore();
import Widgets from "@repo/assets/svg/no-widgets.svg?component";
import { $t } from "@repo/config";
import $ from "jquery";

const widgetsImage = reactive(Widgets?.value);
const customizing = reactive({
  customizing: false,
});

const loadingCollection = reactive({});
var defer = null;
const widgets = ref();
defineOptions({
  name: "home",
});
onBeforeMount(async () => {
  gridStackStore.load();
  defer = useDefer(gridStackStore.layout?.length || 0);
});

onMounted(async () => {
  $(document).ready(function () {
    gridStackStore.loadGridStack();
    gridStackStore.disableLayout();
    gridStackStore.addObserver();
  });
});

//开启自定义
const custom = async () => {
  customizing.customizing = true;
  gridStackStore.customLayout();
  const oldWidth = widgets.value.offsetWidth;
  await nextTick();
  const scale = widgets.value.offsetWidth / oldWidth;
  widgets.value.style.setProperty("transform", `scale(${scale})`);
};
//设置布局
const setLayout = async (layout) => {
  gridStackStore.setLayout(layout);
};
//追加
const push = async (item) => {
  gridStackStore.pushComp(item);
};
//隐藏组件
const remove = async (item) => {
  gridStackStore.removeComp(item);
};
//保存
const save = async () => {
  customizing.customizing = false;
  widgets.value.style.removeProperty("transform");
  gridStackStore.saveLayout();
  //this.$TOOL.data.set("grid", this.grid)
};
//恢复默认
const backDefault = async () => {
  customizing.customizing = false;
  widgets.value.style.removeProperty("transform");
  gridStackStore.resetLayout();
  // this.grid =  JSON.parse(JSON.stringify(this.defaultGrid))
  // this.$TOOL.data.remove("grid")
};
//关闭
const close = async () => {
  this.disableLayout();
  customizing.customizing = false;
  widgets.value.style.removeProperty("transform");
};
</script>

<template>
  <div ref="main" :class="['widgets-home', customizing.customizing ? 'customizing' : '']">
    <div class="widgets-content">
      <div class="widgets-top">
        <div class="widgets-top-title">{{ $t("buttons.board") }}</div>
        <div class="widgets-top-actions">
          <el-button v-if="customizing.customizing" type="primary" :icon="useRenderIcon(Check)" round @click="save">{{ $t("buttons.finish") }}</el-button>
          <el-button v-else type="primary" :icon="useRenderIcon(Edit)" round @click="custom">{{ $t("buttons.custom") }}</el-button>
        </div>
      </div>
      <div ref="widgets" class="widgets">
        <div v-if="!gridStackStore.hasNowCompsList()" class="no-widgets">
          <el-empty :image="widgetsImage" :description="$t('message.noPlugin')" :image-size="280" />
        </div>
        <div class="widgets-wrapper h-full" id="widgets-wrapper">
          <div class="grid-stack h-full">
            <div
              class="grid-stack-item"
              :id="item.id"
              v-for="(item, index) in gridStackStore.component"
              :key="index"
              :gs-id="item.id"
              :gs-x="gridStackStore.loadLayout(item.id)?.x"
              :gs-y="gridStackStore.loadLayout(item.id)?.y"
              :gs-w="gridStackStore.loadLayout(item.id)?.w"
              :gs-h="gridStackStore.loadLayout(item.id)?.h"
            >
              {{ item }}
              <div class="grid-stack-item-content">
                <div class="widgets-item">
                  <div class="h-auto min-h-[100px]">
                    <el-skeleton :loading="gridStackStore.isLoaded(item.id, loadingCollection)" animated />
                    <div class="!w-full" style="width: 100% !important">
                      <keep-alive class="h-full">
                        <component class="h-full" :is="gridStackStore.loadComponent(item.id)" :frameInfo="gridStackStore.loadFrameInfo(item.id)" :key="gridStackStore.loadFrameInfo(item.id).key" @loaded="() => gridStackStore.loaded(item.id, loadingCollection)" />
                      </keep-alive>
                    </div>
                  </div>
                  <div v-if="customizing.customizing" class="customize-overlay">
                    <el-button class="close" type="danger" plain :icon="useRenderIcon(Close)" size="small" @click="remove(item.id)" />
                    <label>
                      <el-icon>
                        <component :is="useRenderIcon(gridStackStore.getComponent(item.id).sysSfcIcon)" />
                      </el-icon>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="customizing.customizing" class="widgets-aside">
      <el-container>
        <el-header>
          <div class="widgets-aside-title">
            <el-icon><el-icon-circle-plus-filled /></el-icon>
            {{ $t("message.addWidget") }}
          </div>
          <div class="widgets-aside-close" @click="close()">
            <el-icon><el-icon-close /></el-icon>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div class="widgets-list">
            <div v-if="!gridStackStore.hasMyCompsList()" class="widgets-list-nodata">
              <el-empty :description="$t('message.noPlugin')" :image-size="60" />
            </div>
            <div v-for="item in gridStackStore.myCompsList()" :key="item.title" class="widgets-list-item" draggable="true">
              <div class="item-logo">
                <el-icon><component :is="useRenderIcon(item.icon)" /></el-icon>
              </div>
              <div class="item-info">
                <h2>{{ item.title }}</h2>
                <p>{{ item.description }}</p>
              </div>
              <div class="item-actions">
                <el-button type="primary" :icon="useRenderIcon(Plus)" size="small" @click="push(item)" />
              </div>
            </div>
          </div>
        </el-main>
        <el-footer style="height: 51px">
          <el-button size="small" @click="backDefault()">{{ $t("buttons.default") }}</el-button>
        </el-footer>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
.widgets-home {
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 100%;
}
.widgets-content {
  flex: 1;
  overflow: auto;
  overflow-x: hidden;
  padding: 15px;
}
.widgets-aside {
  width: 360px;
  background: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: auto;
}
.widgets-aside-title {
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.widgets-aside-title i {
  margin-right: 10px;
  font-size: 18px;
}
.widgets-aside-close {
  font-size: 18px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: pointer;
}
.widgets-aside-close:hover {
  background: rgba(180, 180, 180, 0.1);
}

.widgets-top {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.widgets-top-title {
  font-size: 18px;
  font-weight: bold;
}

.widgets {
  transform-origin: top left;
  transition: transform 0.15s;
}
.draggable-box {
  height: 100%;
}

.customizing .widgets-wrapper {
  margin-right: -360px;
}
.customizing .widgets-wrapper .el-col {
  padding-bottom: 15px;
}
.customizing .widgets-wrapper .draggable-box {
  border: 1px dashed var(--el-color-primary);
  padding: 15px;
}
.customizing .widgets-wrapper .no-widgets {
  display: none;
}
.customizing .widgets-item {
  position: relative;
  margin-bottom: 15px;
}
.customize-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  cursor: move;
}
.customize-overlay label {
  background: var(--el-color-primary);
  color: #fff;
  height: 40px;
  padding: 0 30px;
  border-radius: 40px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
}
.customize-overlay label i {
  margin-right: 15px;
  font-size: 24px;
}
.customize-overlay .close {
  position: absolute;
  top: 15px;
  right: 15px;
}
.customize-overlay .close:focus,
.customize-overlay .close:hover {
  background: var(--el-button-hover-color);
}

.widgets-list {
}
.widgets-list-item {
  display: flex;
  flex-direction: row;
  padding: 15px;
  align-items: center;
}
.widgets-list-item .item-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(180, 180, 180, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 15px;
  color: #6a8bad;
}
.widgets-list-item .item-info {
  flex: 1;
}
.widgets-list-item .item-info h2 {
  font-size: 16px;
  font-weight: normal;
  cursor: default;
}
.widgets-list-item .item-info p {
  font-size: 12px;
  color: #999;
  cursor: default;
}
.widgets-list-item:hover {
  background: rgba(180, 180, 180, 0.1);
}

.widgets-wrapper .sortable-ghost {
  opacity: 0.5;
}

.selectLayout {
  width: 100%;
  display: flex;
}
.selectLayout-item {
  width: 60px;
  height: 60px;
  border: 2px solid var(--el-border-color-light);
  padding: 5px;
  cursor: pointer;
  margin-right: 11px;
  margin-top: 11px;
}
.selectLayout-item span {
  display: block;
  background: var(--el-border-color-light);
  height: 46px;
}
.selectLayout-item.item02 span {
  height: 30px;
}
.selectLayout-item.item02 .el-col:nth-child(1) span {
  height: 14px;
  margin-bottom: 2px;
}
.selectLayout-item.item03 span {
  height: 14px;
  margin-bottom: 2px;
}
.selectLayout-item:hover {
  border-color: var(--el-color-primary);
}
.selectLayout-item.active {
  border-color: var(--el-color-primary);
}
.selectLayout-item.active span {
  background: var(--el-color-primary);
}

.dark {
  .widgets-aside {
    background: #2b2b2b;
  }
  .customize-overlay {
    background: rgba(43, 43, 43, 0.9);
  }
}

@media (max-width: 992px) {
  .customizing .widgets {
    transform: scale(1) !important;
  }
  .customizing .widgets-aside {
    width: 100%;
    position: absolute;
    top: 50%;
    right: 0;
    bottom: 0;
  }
  .customizing .widgets-wrapper {
    margin-right: 0;
  }
}
</style>
