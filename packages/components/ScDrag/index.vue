<script>
import Close from "@iconify-icons/ep/close";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { uuid } from "@pureadmin/utils";
import { defineComponent, markRaw } from "vue";
import Setting from "@iconify-icons/ep/setting";

export default defineComponent({
  props: {
    title: { type: String, default: "标题" },
    axis: { type: String, default: null },
    miniIcon: {
      type: Object,
      default: () => {
        return useRenderIcon(Setting);
      }
    },
    overlay: {
      type: Boolean,
      default: false
    },
    tech: { type: Boolean, default: false },
    techConfig: {
      type: Object,
      default: () => {
        return {
          backgroundColor: $c.bll9,
          borderColor: $c.bll7,
          decorationColor: [$c.bll3, $c.cyl5]
        };
      }
    },
    techTitle: {
      scale: 1.3,
      position: "left",
      decorationColor: '#fff',
      fontWeight: "bold",
      color: $c.yel5
    },
    height: {
      type: String,
      default: "60vh"
    },
    width: {
      type: String,
      default: "60vh"
    },
    draggable: {
      type: Boolean,
      default: true
    },
    mini: {
      type: Boolean,
      default: false
    },
    direction: {
      type: Array,
      default: () => {
        return ["top", "left", "bottom", "right"];
      }
    },
    zIndex: { type: Number, default: 9 },
    grid: { type: Array, default: null },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      visible: false,
      uid: null,
      draggie: null,
      showContent: true,
      dialogLeft: null,
      dialogTop: null,
      dialogLeft1: null,
      dialogTop1: null,
      dialogWidth: this.width,
      dialogHeight: this.height,
      x: null,
      y: null
    };
  },
  watch: {
    dialogLeft1: {
      handler(value, oldValue) {
        if (value == null) {
          this.dialogWidth = this.width;
          this.dialogHeight = this.height;
          return;
        }
        const element = document.getElementById(this.uid);
        if (!element) {
          return null;
        }
        const left = parseInt(element.style.left);
        if (left <= 0) {
          this.dialogLeft = 0;
          return;
        }
        this.dialogLeft = document.body.offsetWidth - element?.children[0]?.offsetWidth;
        this.dialogWidth = element?.children[0].clientWidth + "px";
        this.dialogHeight = element?.children[0].clientHeight + "px";
      },
      immediate: !0
    },
    dialogTop1: {
      handler(value) {
        if (value == null) {
          this.dialogWidth = this.width;
          this.dialogHeight = this.height;
          return;
        }
        const element = document.getElementById(this.uid);
        if (!element) {
          return null;
        }
        const top = parseInt(element.style.top);
        if (top <= 0) {
          this.dialogTop = 0;
          return 0;
        }
        this.dialogTop = document.body.offsetHeight - element?.children[0]?.offsetHeight;
        this.dialogWidth = element?.children[0].clientWidth + "px";
        this.dialogHeight = element?.children[0].clientHeight + "px";
      }
    },
    modelValue: {
      handler(value) {
        this.visible = value;
        if (this.visible) {
          this.$nextTick(() => {
            this.initial();
          });
          return;
        }
        this.$nextTick(() => {
          this.uninitial();
        });
      },
      immediate: !0
    }
  },
  created() {
    this.uid = uuid().replaceAll("-", "");
    this.visible = this.modelValue;
    if (!this.visible) {
      return;
    }
  },
  unmounted() {
    this.uninitial();
  },
  methods: {
    useRenderIcon,
    uninitial() {
      this.visible = false;
      if (!this.draggie) {
        return;
      }
      this.$emit("close");
      this.draggie?.off("dragStart", this.dragStart);
      this.draggie?.off("dragMove", this.dragMove);
      this.draggie?.off("dragEnd", this.dragEnd);
      this.draggie?.destroy();
      this.draggie = null;
    },
    initial() {
      const element = document.getElementById(this.uid);
      this.draggie = this.draggable
        ? new Draggabilly(element, {
            axis: this.axis,
            grid: this.grid,
            containment: "body"
          })
        : null;
      const dialogWidth1 = element?.children[0]?.offsetWidth;
      element.style.left = document.body.clientWidth / 2 - dialogWidth1 / 2 + "px";
      element.style.top = document.body.clientHeight / 2 - element?.children[0]?.offsetHeight / 2 + "px";
      this.draggie?.on("dragStart", this.dragStart);
      this.draggie?.on("dragMove", this.dragMove);
      this.draggie?.on("dragEnd", this.dragEnd);
    },
    edgeLeft(x, y) {
      this.showContent = false;
    },
    edgeRight(x, y) {
      this.showContent = false;
      this.$nextTick(() => {
        this.dialogLeft1 = -1;
      });
    },
    edgeTop(x, y) {
      this.showContent = false;
    },
    edgeBottom(x, y) {
      this.showContent = false;
      this.$nextTick(() => {
        this.dialogTop1 = -1;
      });
    },
    async dragStart(event, pointer) {},
    async dragMove(event, pointer) {},
    async dragEnd(event, pointer) {
      if (!this.mini) {
        return false;
      }
      this.clickDialog();
      const position = this.getPosition();
      const { x, y } = position;
      this.x = x;
      this.dialogLeft = x;
      this.dialogTop = y;
      this.y = y;
      if (x <= 0 && this.direction.indexOf("left") > -1) {
        //左侧
        this.edgeLeft(x, y);
        return;
      }

      if (y <= 0 && this.direction.indexOf("top") > -1) {
        //上方
        this.edgeTop(x, y);
        return;
      }

      const element = document.getElementById(this.uid + "_content") || document.getElementById(this.uid);
      if (x >= document.body.clientWidth - element.clientWidth && this.direction.indexOf("right") > -1) {
        //右侧
        this.edgeRight(x, y);
        return;
      }

      if (y >= document.body.clientHeight - element.clientHeight && this.direction.indexOf("bottom") > -1) {
        //下方
        this.edgeBottom(x, y);
        this.dialogTop = document.body.clientHeight - 42;
        return;
      }
      this.$nextTick(() => {
        this.dialogLeft1 = null;
        this.dialogTop1 = null;
      });
      this.showContent = true;
    },
    reset() {
      this.$nextTick(() => {
        this.uninitial();
        this.initial();
      });
    },
    getPosition() {
      return this.draggie.position;
    },
    disable() {
      this.draggie.disable();
    },
    enable() {
      this.draggie.enable();
    },
    async clickDialog() {
      this.$nextTick(() => {
        const ele = document.querySelectorAll(".drag-container");
        for (var i = 0; i < ele.length; i++) {
          ele[i].style["z-index"] = this.zIndex;
        }
        const dom = document.getElementById(this.uid);
        if (!dom) {
          return;
        }
        dom.style["z-index"] = this.zIndex + 1;
      });
    },
    doClose() {
      this.uninitial();
      this.$emit("close");
    },
    markRaw
  }
});
</script>
<template>
  <teleport to="body">
    <div v-if="overlay && visible && showContent" class="el-overlay drag-overlay">
      <div class="el-overlay-dialog" />
    </div>
    <div
      v-if="visible"
      :id="uid"
      :class="'drag drag-container ' + uid"
      :style="{
        'z-index': zIndex,
        width: dialogWidth,
        height: dialogHeight,
        left: dialogLeft + 'px',
        top: dialogTop + 'px'
      }"
      @click="clickDialog()"
    >
      <div
        v-if="showContent"
        :id="uid + '_content'"
        :class="{
          'h-full': true,
          'el-drag-dialog': !tech,
          'el-drag-tech-dialog': tech
        }"
        tabindex="-1"
      >
        <div v-if="!tech" class="h-full">
          <header class="el-dialog__header show-close handle">
            <span role="heading" aria-level="2" class="el-dialog__title">{{ title }}</span>
            <div class="el-dialog-tech__header absolute right-2 top-2 cursor-pointer !z-[2]">
              <el-icon
                size="20"
                class="!text-[#000]"
                @click="
                  () => {
                    $emit('refresh');
                  }
                "
              >
                <component :is="useRenderIcon('ep:refresh')" />
              </el-icon>
              <el-icon size="20" class="!text-[#000]" @click="doClose()">
                <component :is="useRenderIcon('ep:close')" />
              </el-icon>
            </div>
          </header>
          <div id="el-id-1024-54" class="el-dialog__body !p-0">
            <slot />
          </div>
        </div>
        <div v-else class="h-full">
          <aYinTechBorderB4 :config="techConfig" class="h-full min-h-[600px] relative">
            <div class="el-dialog-tech__header absolute right-2 top-2 cursor-pointer !z-[2]">
              <el-icon color="#fff" size="20">
                <component
                  :is="useRenderIcon('ep:refresh')"
                  @click="
                    () => {
                      $emit('refresh');
                    }
                  "
                />
              </el-icon>
              <el-icon color="#fff" size="20" @click="doClose()">
                <component :is="useRenderIcon('ep:close')" />
              </el-icon>
            </div>
            <panelTitleB1 :config="techTitle">{{ title }}</panelTitleB1>
            <div id="el-id-1024-54" class="el-dialog-tech__body h-full pt-[40px]">
              <slot />
            </div>
          </aYinTechBorderB4>
        </div>
        <!--v-if-->
      </div>
      <div v-show="!showContent" class="!w-[48px] !h-[48px]">
        <el-button v-if="!tech" size="default" :icon="miniIcon" class="!h-full !w-full" />
        <techButtonB1 v-else class="!w-[48px] !h-[48px]" @click="showContent = !showContent">
          <el-icon size="18" class="left-[-5px] top-[5px]">
            <component :is="useRenderIcon(miniIcon)" />
          </el-icon>
        </techButtonB1>
      </div>
    </div>
  </teleport>
</template>
<style scoped lang="scss">
.drag-container {
  position: fixed !important;
}
.handle {
  cursor: move;
}
.drag > div {
  border-radius: var(--layoutRadius, 12px);
}
.el-drag-tech-dialog {
  --el-dialog-margin-top: 15vh;
  --el-dialog-bg-color: var(--el-bg-color);
  --el-dialog-box-shadow: var(--el-box-shadow);
  --el-dialog-title-font-size: var(--el-font-size-large);
  --el-dialog-content-font-size: 14px;
  --el-dialog-font-line-height: var(--el-font-line-height-primary);
  --el-dialog-padding-primary: 16px;
  --el-dialog-border-radius: var(--el-border-radius-small);
  background: transparent;
  border-radius: var(--el-dialog-border-radius);
  box-shadow: var(--el-dialog-box-shadow);
  box-sizing: border-box;
  overflow-wrap: break-word;
  position: relative;
  width: 100%;
}
.el-drag-dialog {
  --el-dialog-margin-top: 15vh;
  --el-dialog-bg-color: var(--el-bg-color);
  --el-dialog-box-shadow: var(--el-box-shadow);
  --el-dialog-title-font-size: var(--el-font-size-large);
  --el-dialog-content-font-size: 14px;
  --el-dialog-font-line-height: var(--el-font-line-height-primary);
  --el-dialog-padding-primary: 16px;
  --el-dialog-border-radius: var(--el-border-radius-small);
  background: var(--el-dialog-bg-color);
  border-radius: var(--el-dialog-border-radius);
  box-shadow: var(--el-dialog-box-shadow);
  box-sizing: border-box;
  overflow-wrap: break-word;
  padding: var(--el-dialog-padding-primary);
  position: relative;
  width: 100%;
}
</style>
