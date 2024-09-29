<template>
  <!-- 右键菜单 -->
  <div v-show="showMenu" class="rightMenu">
    <ul>
      <li v-for="(menu, index) in menus" :key="index" @click="menu.handle(dataData, nodeData)">
        <el-icon>
          <component :is="useRenderIcon(menu.icon)" />
        </el-icon>
        <span style="margin-left: 10px">
          {{ menu.name }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup name="RightClickMenu">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { defineExpose, ref } from "vue";
// 接收菜单信息
const props = defineProps({
  menus: {
    type: Object
  }
});
const showMenu = ref(false);

const nodeData = ref({});
const dataData = ref({});
// 关闭菜单
function close() {
  showMenu.value = false;
}
// 打开菜单和显示位置
function open(event, data, node) {
  // 阻止系统默认行为
  event.preventDefault();
  nodeData.value = node;
  dataData.value = data;
  // 先关闭
  showMenu.value = false;
  // 显示位置
  let menu = document.querySelector(".rightMenu");
  menu.style.left = event.clientX + "px";
  menu.style.top = event.clientY + "px";
  // 显示
  showMenu.value = true;
  // 注册点击侦听事件
  document.addEventListener("click", close);
}
// 暴露方法
defineExpose({ open, close });
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
  border-bottom: 1px solid #c8c9cc;
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
