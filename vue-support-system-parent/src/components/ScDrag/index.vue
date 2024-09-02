<script>
import Close from "@iconify-icons/ep/close";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { uuid } from "@pureadmin/utils";
import { defineComponent } from "vue";
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
    zIndex: { type: Number, default: 10000 },
    grid: { type: Array, default: null }
  },
  data() {
    return {
      uid: null,
      icon: {
        close: null
      },
      draggie: null,
      showContent: true,
      dialogLeft: null,
      dialogTop: null,
      dialogLeft1: null,
      dialogTop1: null,
      x: null,
      y: null
    };
  },
  computed: {
    dialogWidth() {
      const element = document.getElementById(this.uid);
      return element?.children[0]?.offsetWidth;
    }
  },
  watch: {
    dialogLeft1: {
      handler(value, oldValue) {
        if (value == null) {
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
      },
      immediate: !0
    },
    dialogTop1: {
      handler(value) {
        if (value == null) {
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
      }
    }
  },
  created() {
    this.uid = uuid().replaceAll("-", "");
    this.icon.close = useRenderIcon(Close);
  },
  mounted() {
    this.$nextTick(() => {
      this.initial();
    });
  },
  unmounted() {
    this.uninitial();
  },
  methods: {
    uninitial() {
      if (!this.draggie) {
        return;
      }
      this.draggie.off("dragStart", this.dragStart);
      this.draggie.off("dragMove", this.dragMove);
      this.draggie.off("dragEnd", this.dragEnd);
      this.draggie?.destroy();
      this.draggie = null;
    },
    initial() {
      const element = document.getElementById(this.uid);
      console.log(element);
      this.draggie = new Draggabilly(element, {
        axis: this.axis,
        grid: this.grid,
        containment: "body"
      });
      const dialogWidth1 = element?.children[0]?.offsetWidth;
      element.style.left = document.body.clientWidth / 2 - dialogWidth1 / 2 + "px";
      element.style.top = document.body.clientHeight / 2 - element?.children[0]?.offsetHeight / 2 + "px";
      this.draggie.on("dragStart", this.dragStart);
      this.draggie.on("dragMove", this.dragMove);
      this.draggie.on("dragEnd", this.dragEnd);
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
      this.clickDialog();
      const position = this.getPosition();
      const { x, y } = position;
      this.x = x;
      this.dialogLeft = x;
      this.dialogTop = y;
      this.y = y;
      if (x <= 0) {
        //左侧
        this.edgeLeft(x, y);
        return;
      }

      if (y <= 0) {
        //上方
        this.edgeTop(x, y);
        return;
      }

      const element = document.getElementById(this.uid);
      if (x >= document.body.clientWidth - element.clientWidth) {
        //右侧
        this.edgeRight(x, y);
        return;
      }

      if (y >= document.body.clientHeight - element.clientHeight) {
        //下方
        this.edgeBottom(x, y);
        return;
      }
      this.$nextTick(() => {
        this.dialogLeft1 = null;
        this.dialogTop1 = null;
      });
      this.showContent = true;
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
        document.getElementById(this.uid).style["z-index"] = this.zIndex + 1;
      });
    },
    doClose() {
      this.uninitial();
      this.$emit("close");
    }
  }
});
</script>
<template>
  <teleport to="body">
    <div
      :id="uid"
      :class="'drag drag-container ' + uid"
      :style="{
        'z-index': zIndex,
        width: dialogWidth + 'px',
        left: dialogLeft + 'px',
        top: dialogTop + 'px'
      }"
      @click="clickDialog()"
    >
      <div v-if="showContent" class="el-drag-dialog" tabindex="-1">
        <header class="el-dialog__header show-close handle">
          <span role="heading" aria-level="2" class="el-dialog__title">{{ title }}</span>
          <button aria-label="Close this dialog" class="el-dialog__headerbtn" type="button" @click="doClose()">
            <el-icon>
              <component :is="icon.close" />
            </el-icon>
          </button>
        </header>
        <div id="el-id-1024-54" class="el-dialog__body">
          <slot />
        </div>
        <!--v-if-->
      </div>
      <div v-show="!showContent">
        <el-button size="default" :icon="miniIcon" class="w-12 h-12" />
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
