<template>
  <div v-show="modelValue" class="rightMenu" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <ul>
      <template v-for="(item, index) in menus" :key="'a' + index">
        <li
          v-if="showMenu(item)"
          :class="[
            'flex flex-1 justify-start',
            {
              'border-b-[1px] border-b-[var(--el-border-color)] border-solid w-[80%] ml-[10%] !p-0': item.type == 'LINE'
            }
          ]"
          @click="item.handle(data, node)"
        >
          <RightMenuItem key="RightMenuItem" class="menu" :menu="item" :data="data" :node="node" :theme="theme" :top="position.y" :left="position.x" />
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
import RightMenuItem from "./ItemIndex.vue";
export default {
  name: "RightMenuList",
  components: { RightMenuItem },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    menus: Array,
    position: Object,
    data: Object,
    node: Object
  },
  methods: {
    showMenu(item) {
      return !item.show || item.show(this.data) == true;
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
  box-shadow: var(--el-box-shadow-light);
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
