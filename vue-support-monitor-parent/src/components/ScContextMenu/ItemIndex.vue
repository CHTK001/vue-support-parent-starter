<template>
  <div ref="item" class="flex flex-1 justify-start">
    <span v-if="menu.children && menu.children.length > 0" class="flex flex-1 justify-start" @mouseenter="handleEnter" @mouseleave="handleLeave">
      <el-icon class="top-[4px]">
        <component :is="useRenderIcon(menu.icon)" />
      </el-icon>
      <span style="margin-left: 10px">
        {{ menu.name }}
      </span>
      <el-icon class="top-[4px]">
        <component :is="useRenderIcon('ep:arrow-right')" />
      </el-icon>
      <Itemlayout2 key="children2" v-model="visible" :menus="menu.children" :position="position" />
    </span>

    <span v-else class="flex flex-1 justify-start">
      <el-icon class="top-[4px]">
        <component :is="useRenderIcon(menu.icon)" />
      </el-icon>
      <span style="margin-left: 10px">
        {{ menu.name }}
      </span>
    </span>
  </div>
</template>

<script>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Itemlayout2 from "./item2.vue";
export default {
  name: "RightMenuItem",
  components: { Itemlayout2 },
  props: {
    menu: Object,
    theme: String,
    itemSize: Object,
    top: Number,
    left: Number
  },
  data() {
    return {
      childPosition: "",
      visible: false,
      position: {},
      cancelTimer: null
    };
  },
  methods: {
    useRenderIcon,
    /**
     * 鼠标进入菜单项时，计算子菜单展示的位置
     */
    handleEnter(event) {
      let x = 0;
      let y = 0;
      let screen = this.getScreen();
      let item = this.$refs.item;
      let itemX = this.left; //当前菜单项的x坐标
      let itemY = this.top; //当前菜单项的y坐标
      let childHeight = this.menu.children.length * item.clientHeight;
      //计算坐标x
      if (screen.width - itemX - item.clientWidth > item.clientWidth) {
        x = itemX + item.clientWidth + 20;
        this.childPosition = "right";
      } else if (itemX > item.clientWidth) {
        x = itemX - item.clientWidth;
      }
      if (this.childPosition === "") {
        this.childPosition = "left";
      }
      //计算坐标y
      if (screen.height - itemY > childHeight) {
        y = itemY + item.offsetTop - 6;
      } else if (screen.height > childHeight) {
        y = screen.height - childHeight - 20;
      }
      this.noCloseChild();
      this.visible = true;
      this.position = {
        x: x,
        y: y
      };
    },
    /**
     * 鼠标离开时，判断从哪个方向离开
     * @param e
     */
    handleLeave() {
      this.noCloseChild();
      this.cancelTimer = setTimeout(() => {
        this.closeChild();
      }, 100);
    },
    /**
     * 获取窗口大小
     */
    getScreen() {
      return {
        width: document.body.clientWidth,
        height: document.body.clientHeight
      };
    },
    isEnable() {
      return this.menu.enable !== false;
    },
    /**
     * 处理点击事件，先关闭按钮，在处理点击事件
     */
    handleClick() {
      if (!this.isEnable()) return;
      this.close();
      setTimeout(() => {
        if (this.menu.click) this.menu?.click();
      }, 10);
    },
    /**
     * 通知整个菜单关闭
     */
    close() {
      this.$parent.close();
    },
    /**
     * 关闭子菜单
     */
    closeChild() {
      this.visible = false;
      this.position.x = 0;
      this.position.y = 0;
      this.childPosition = "";
    },
    /**
     * 取消关闭子菜单
     */
    noCloseChild() {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = null;
    }
  }
};
</script>

<style scoped>
.right_item {
  display: block;
  width: 100%;
  text-align: left;
  padding-left: 5px;
  font-size: 15px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.right_item_light {
  font-size: 15px;
}

.right_item_light:hover {
  background-color: #ffffff;
}

.right_item_dark {
  color: #e2e2e2;
  font-size: 13px;
}

.right_item_dark:hover {
  background-color: #444444;
}
.right_item_enable_light {
  color: #b6b6b6;
}
.right_item_enable_dark {
  color: #797979;
}

.right_item_arrow {
  width: 25px;
  height: 25px;
  float: right;
}
</style>
