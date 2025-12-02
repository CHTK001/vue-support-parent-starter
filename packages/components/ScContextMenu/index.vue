<template>
  <div
    v-show="visible"
    class="full rightMenu"
    :style="[
      'user-select: none',
      {
        top: positionY,
        left: positionX
      }
    ]"
    @contextmenu.prevent=""
  >
    <div class="full" @click="handleClick" @contextmenu.prevent.stop="handleClick" />
    <RightMenuList v-model="visible" :position="position" :menus="menus" :data="data" :node="node" />
  </div>
</template>
<script>
import RightMenuList from "./item.vue";

export default {
  name: "RightMenu",
  components: { RightMenuList },
  props: {
    menus: Array, //菜单数据
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      itemSize: {
        width: 220,
        height: 30
      },
      visible: false,
      position: {
        x: 0,
        y: 0
      },
      data: {},
      node: {}
    };
  },
  computed: {
    positionY() {
      return this.position.y + "px";
    },
    positionX() {
      return this.position.x + "px";
    }
  },
  methods: {
    open(event, data, node) {
      this.visible = true;
      this.data = data;
      this.node = node;
      event.preventDefault();
      event.stopPropagation(); // 阻止冒泡
      this.position.x = event.clientX;
      this.position.y = event.clientY;
      // 注册点击侦听事件
      document.addEventListener("click", this.close);
      // this.calculatePosition();
    },
    /**
     * 统一关闭菜单入口
     */
    close() {
      this.position = {
        x: 0,
        y: 0
      };
      document.removeEventListener("click", this.close);
      this.visible = false;
    },
    /**
     * 单击空白地方，左右键通用
     */
    handleClick(event) {
      this.close();
      setTimeout(() => {
        document.elementFromPoint(event.clientX, event.clientY).dispatchEvent(event);
      }, 10);
    }
  }
};
</script>

<style scoped>
.rightMenu {
  position: fixed;
  z-index: 99999999;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow);
  border-radius: 6px;
  color: var(--el-text-color-regular);
  font-size: 14px;
  background: var(--el-bg-color-overlay);
}

.rightMenu ul {
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 6px;
}

.rightMenu ul li {
  padding: 6px 10px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.rightMenu ul li:last-child {
  border: none;
}

.rightMenu ul li:hover {
  transition: all 0.5s;
  background: var(--el-fill-color-light);
}

.rightMenu ul li:first-child {
  border-radius: 6px 6px 0 0;
}
.rightMenu ul li:last-child {
  border-radius: 0 0 6px 6px;
}
</style>
