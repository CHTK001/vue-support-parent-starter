<template>
  <!-- 右键菜单 -->
  <div v-show="showMenu" class="rightMenu" :style="{ left: position.x + 'px', top: position.y + 'px' }">
    <ul>
      <li
        v-for="(menu, index) in menus"
        :key="index"
        :class="[
          'flex flex-1 justify-start',
          {
            'border-b-[1px] border-b-[#c8c9cc] border-solid w-[80%] ml-[10%] !p-0': menu.type == 'LINE'
          }
        ]"
        @click="menu.handle(dataData, nodeData)"
      >
        <span v-if="menu.type == 'LINE'" />
        <span v-else class="flex flex-1 justify-start">
          <el-icon class="top-[4px]">
            <component :is="useRenderIcon(menu.icon)" />
          </el-icon>
          <span style="margin-left: 10px">
            {{ menu.name }}
          </span>
          <ul v-if="menu.children && menu.children.length > 0">
            <li
              v-for="(child, index) in menu.children"
              :key="index"
              :class="[
                'flex flex-1 justify-start',
                {
                  'border-b-[1px] border-b-[#c8c9cc] border-solid w-[80%] ml-[10%] !p-0': child.type == 'LINE'
                }
              ]"
              @click="child.handle(dataData, nodeData)"
            >
              <el-icon class="top-[4px]">
                <component :is="useRenderIcon(child.icon)" />
              </el-icon>
              <span style="margin-left: 10px">
                {{ child.name }}
              </span>
            </li>
          </ul>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup name="RightClickMenu">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineExpose, onUnmounted, reactive, ref } from "vue";
// 接收菜单信息
const props = defineProps({
  menus: {
    type: Object
  }
});
const showMenu = ref(false);

const nodeData = ref({});
const dataData = ref({});
const position = reactive({
  x: 0,
  y: 0
});
// 关闭菜单
function close() {
  showMenu.value = false;
}

onUnmounted(async () => {
  close();
});
// 打开菜单和显示位置
function open(event, data, node) {
  // 阻止系统默认行为
  event.preventDefault();
  event.stopPropagation(); // 阻止冒泡
  nodeData.value = node;
  dataData.value = data;
  // 先关闭
  showMenu.value = false;
  position.x = event.clientX;
  position.y = event.clientY;
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
