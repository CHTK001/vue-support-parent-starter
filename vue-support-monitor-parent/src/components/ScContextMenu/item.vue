<template>
  <div v-show="modelValue" class="rightMenu" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <ul>
      <li
        v-for="(item, index) in menus"
        :key="'a' + index"
        :class="[
          'flex flex-1 justify-start',
          {
            'border-b-[1px] border-b-[#c8c9cc] border-solid w-[80%] ml-[10%] !p-0': item.type == 'LINE'
          }
        ]"
        @click="item.handle(data, node)"
      >
        <RightMenuItem v-if="item.type !== 'LINE'" key="RightMenuItem" class="menu" :menu="item" :theme="theme" :top="position.y" :left="position.x" />
      </li>
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
  }
};
</script>

<style scoped>
.rightMenu {
  position: fixed;
  z-index: 99999999;
  cursor: pointer;
  border: 1px solid #eee;
  box-shadow: 0 0.5em 1em 2px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  color: #606266;
  font-size: 14px;
  background: #fff;
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
  background: #ebeef5;
}
.rightMenu ul li:hover {
  transition: all 0.5s;
  background: #ebeef5;
}

.rightMenu ul li:first-child {
  border-radius: 6px 6px 0 0;
}
.rightMenu ul li:last-child {
  border-radius: 0 0 6px 6px;
}
</style>
