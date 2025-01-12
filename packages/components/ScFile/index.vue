<template>
  <div>
    <el-tree-select ref="treeRef" :expand-on-click-node="false" @node-click="handleNodeClick" :lazy="true" :load="handleShowTree" class="w-full" v-model="selectValue" :placeholder="placeholder" :props="treeProps">
      <template #default="{ data: { fileName, fileType } }">
        <el-icon :color="handleColor(fileName, fileType)">
          <component :is="useRenderIcon(handleIcon(fileName, fileType))"></component>
        </el-icon>
        {{ fileName }}
      </template>
    </el-tree-select>
  </div>
</template>
<script setup>
import { defineEmits, defineProps, watch, ref, reactive } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const selectValue = ref("");
const treeRef = ref();
const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  placeholder: {
    type: String,
    default: "",
  },
  modelValue: {
    type: String,
    default: "",
  },
  url: {
    type: Function,
  }
});

const treeProps = {
  label: 'absolutePath',
  value: 'absolutePath',
  isLeaf: 'isLeaf',
}
watch(() => props.modelValue, (val) => {
  selectValue.value = val;
}, { immediate: true, deep: true });
// 节点单击事件
const handleNodeClick = async (data, node, component) => {
  emit("update:modelValue", data.absolutePath);
  selectValue.value = data.absolutePath;
}
const handleColor = (fileName, fileType) => {

  if (fileType === 'DIRECTORY') {
    return "orange"
  }

  if (fileName.endsWith('.conf') || fileName.endsWith('.xml')) {
    return 'green'
  }

  if (fileName.endsWith('.log')) {
    return 'blue'
  }

  if (fileName.endsWith('.zip') || fileName.endsWith('.gz') || fileName.endsWith('.tar') || fileName.endsWith('.jar')) {
    return 'skyblue'
  }
  if (fileName.endsWith('.exe')) {
    return 'grey'
  }

  return "blue"
};
const handleIcon = (fileName, fileType) => {

  if (fileType === 'DIRECTORY') {
    return "ri:folder-5-line"
  }

  if (fileName.endsWith('.conf')) {
    return 'simple-icons:nginx'
  }

  if (fileName.endsWith('.txt') || fileName.endsWith('.log')) {
    return 'ri:text-block'
  }
  if (fileName.endsWith('.jar')) {
    return 'ri:java-fill'
  }

  if (fileName.endsWith('.zip') || fileName.endsWith('.tar') || fileName.endsWith('.gz')) {
    return 'ri:file-zip-line'
  }

  if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
    return 'simple-icons:yaml'
  }

  return 'simple-icons:files'
};
const handleShowTree = async (node, resolve, reject) => {
  const _data = node.data;
  if (!_data.absolutePath) {
    props.url({}).then(res => {
      resolve(res.data);
    });
    return;
  }
  if (_data.isLeaf) return resolve([])
  props.url({ absolutePath: _data.absolutePath }).then(res => {
    resolve(res.data);
  });
  return;
};
</script>
