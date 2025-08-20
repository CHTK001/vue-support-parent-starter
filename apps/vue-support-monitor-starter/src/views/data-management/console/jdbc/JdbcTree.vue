<template>
  <div class="left overflow-auto thin-scrollbar" @contextmenu.prevent>
    <el-input
      v-model="keywordLocal"
      placeholder="搜索..."
      size="small"
      clearable
      @change="$emit('search', keywordLocal)"
    >
      <template #append>
        <IconifyIconOnline icon="ri:search-line" />
      </template>
    </el-input>

    <el-tree
      class="tree"
      :data="treeData"
      :props="treeProps"
      :load="loadChildrenLazy"
      lazy
      node-key="path"
      :expand-on-click-node="false"
      @node-click="$emit('node-click', $event)"
      @node-contextmenu="$emit('node-contextmenu', $event, $event2)"
    >
      <template #default="{ node, data }">
        <IconifyIconOnline :icon="getJdbcNodeIcon(node, data)" class="mr-1" />
        <span class="flex justify-between w-full">
          <span>
            <span>{{ data.name }}</span>
            <span class="el-form-item-msg ml-2 mt-[3px]">{{ data.properties?.columnType }}</span>
            <span v-if="data.properties?.columnSize" class="el-form-item-msg ml-2 mt-[3px]">({{ data.properties?.columnSize }})</span>
          </span>
          <span class="el-form-item-msg ml-2 mt-[3px]">{{ data.properties?.comment }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import IconifyIconOnline from '@/components/IconifyIconOnline.vue';

const props = defineProps({
  treeData: { type: Array, default: () => [] },
  treeProps: { type: Object, default: () => ({ label: 'name', children: 'children', isLeaf: 'leaf' }) },
  loadChildrenLazy: { type: Function, default: () => {} },
  keyword: { type: String, default: '' },
});

const emits = defineEmits(['node-click', 'node-contextmenu', 'search']);

const keywordLocal = ref(props.keyword || '');
watch(() => props.keyword, (v) => keywordLocal.value = v || '');

function getJdbcNodeIcon(node: any, data: any) {
  const type = (data?.type || '').toString().toLowerCase();
  if (type) {
    if (type.includes('db') || type.includes('database') || type.includes('schema') || type.includes('catalog')) return 'ri:database-2-line';
    if (type.includes('table')) return 'ri:table-2';
    if (type.includes('column') || type.includes('field')) return 'ri:braces-line';
    if (type.includes('view')) return 'ri:layout-2-line';
    if (type.includes('index')) return 'ri:hashtag';
  }
  const level = Number(node?.level || 0);
  if (level <= 1) return 'ri:database-2-line';
  if (level === 2) return 'ri:table-2';
  if (level === 3) return 'ri:braces-line';
  return data?.leaf ? 'ri:file-2-line' : 'ri:folder-2-line';
}
</script>

<style scoped>
.tree { margin-top: 8px; }
</style>
