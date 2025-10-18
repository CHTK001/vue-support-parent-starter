<template>
  <div class="p-4">
    <div class="border p-6 rounded bg-[var(--el-fill-color-light)] text-center cursor-context-menu" @contextmenu.prevent.stop="open($event)">
      在此区域点击右键打开菜单
    </div>

    <ScContextMenu ref="menuRef" :menus="menus" />

    <el-divider />
    <CodeDisplay :code="codeStr" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScContextMenu from "@repo/components/ScContextMenu/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const menuRef = ref();
const menus = [
  { name: '查看', icon: 'ep:view', handle: () => console.log('查看') },
  { name: '编辑', icon: 'ep:edit', handle: () => console.log('编辑') },
  { type: 'LINE' },
  { name: '更多', icon: 'ep:more-filled', children: [
      { name: '导出', icon: 'ep:download', handle: () => console.log('导出') }
    ]
  }
];

function open(e) { menuRef.value?.open(e, {}, {}); }

const codeStr = computed(() => `<div @contextmenu.prevent.stop=\"open($event)\">右键区域</div>\n<ScContextMenu ref=\"menuRef\" :menus=\"menus\" />`);
</script>