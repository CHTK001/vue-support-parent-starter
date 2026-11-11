<template>
  <el-select
    ref="selectRef"
    :model-value="modelValue"
    class="org-select"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    popper-class="org-select__popper"
    @clear="onClear"
  >
    <!-- 影子选项：只负责把当前值翻成上面显示的文案，不在下拉里露脸
         （早期用 el-tree-select，选中值偶尔只剩裸 id，这里用 el-select + el-tree 自己接管文案） -->
    <el-option
      v-if="modelValue"
      class="org-select__ghost"
      :value="modelValue"
      :label="selectedLabel"
    />

    <template v-if="searchable" #header>
      <div class="org-select__search" @click.stop>
        <el-input
          v-model="keyword"
          size="small"
          placeholder="搜索组织"
          clearable
        />
      </div>
    </template>

    <el-tree
      ref="treeRef"
      :data="data"
      :props="treeProps"
      node-key="deviceOrganizationId"
      highlight-current
      :default-expand-all="defaultExpandAll"
      :expand-on-click-node="false"
      :current-node-key="modelValue"
      :filter-node-method="filterNode"
      :empty-text="emptyText"
      class="org-select__tree"
      @node-click="onNodeClick"
    />
  </el-select>
</template>

<script setup lang="ts">
/**
 * 组织选择器：el-select + el-tree
 *
 * <p>为什么不用 el-tree-select：组织树是后端回传的嵌套结构，叶子节点的
 * `children` 往往是空数组，el-tree-select 在「清空 / 回显不在第一屏的节点」时
 * 会把选中值渲染成裸 id。这里用 el-select 承载值、el-tree 承载层级：
 * 值只走 v-model，文案由 {@link selectedLabel} 从树里查出来，两边不互相依赖。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, nextTick, ref, watch } from 'vue'
import type { ElSelect, ElTree } from 'element-plus'
import type { OrgNode } from '../types/device'

const props = withDefaults(
  defineProps<{
    /** 选中的组织 id */
    modelValue?: string
    /** 组织树（后端 getOrgTree 结果，嵌套 children） */
    data?: OrgNode[]
    placeholder?: string
    clearable?: boolean
    disabled?: boolean
    /** 下拉里是否带搜索框 */
    searchable?: boolean
    defaultExpandAll?: boolean
    emptyText?: string
  }>(),
  {
    modelValue: '',
    data: () => [],
    placeholder: '选择组织',
    clearable: true,
    disabled: false,
    searchable: true,
    defaultExpandAll: true,
    emptyText: '暂无组织'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const treeProps = { label: 'deviceOrganizationName', children: 'children' } as const

const selectRef = ref<InstanceType<typeof ElSelect> | null>(null)
const treeRef = ref<InstanceType<typeof ElTree> | null>(null)
const keyword = ref('')

/** 组织树拍平：查文案用 */
const flat = computed<OrgNode[]>(() => {
  const out: OrgNode[] = []
  const walk = (nodes?: OrgNode[]) => {
    if (!Array.isArray(nodes)) return
    for (const node of nodes) {
      out.push(node)
      walk(node.children)
    }
  }
  walk(props.data)
  return out
})

/** 当前值在树里的名称；查不到时退回 id，避免文字完全空掉 */
const selectedLabel = computed<string>(() => {
  if (!props.modelValue) return ''
  return (
    flat.value.find((node) => node.deviceOrganizationId === props.modelValue)?.deviceOrganizationName ||
    props.modelValue
  )
})

/** 树过滤：只看节点名，父节点命中后 el-tree 会保留其子树 */
function filterNode(value: string, data: Record<string, unknown>): boolean {
  if (!value) return true
  return String(data.deviceOrganizationName || '').includes(value)
}

watch(keyword, (value) => {
  treeRef.value?.filter(String(value || '').trim())
})

function onNodeClick(node: OrgNode): void {
  emit('update:modelValue', node.deviceOrganizationId)
  emit('change', node.deviceOrganizationId)
  // 点完节点收起下拉：点的是自定义内容，el-select 不会自己关
  nextTick(() => {
    ;(selectRef.value as unknown as { blur?: () => void })?.blur?.()
  })
}

function onClear(): void {
  emit('update:modelValue', '')
  emit('change', '')
}

/** 值从外部变（回显 / 清空）时把树的高亮同步过去 */
watch(
  () => props.modelValue,
  (value) => {
    nextTick(() => {
      treeRef.value?.setCurrentKey(value || undefined, true)
    })
  }
)

defineOptions({ name: 'ReOrgTreeSelect' })
</script>

<style scoped>
.org-select {
  width: 100%;
}

/* 影子选项：只做文案映射，不占下拉里的一行 */
.org-select__ghost {
  display: none !important;
}

.org-select__tree {
  max-height: 260px;
  overflow: auto;
  padding: 4px 0;
}

.org-select__search {
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
</style>
