<template>
  <ReDialog v-model="visible" title="标签管理" width="560px" :footer-end="false" @closed="onClosed">
    <div class="dt">
      <div class="dt__hint">标签写在 `设备信息` 的标签字段上，逗号分隔，例如「重点, 室外」。</div>

      <!-- 标签池：所有出现过的标签，按颜色区分 -->
      <div class="dt__pool">
        <div v-for="opt in options" :key="opt.value" class="dt__tag" :class="{ 'is-active': selected.has(opt.value) }" @click="toggle(opt.value)">
          <i class="dt__dot" :style="{ background: opt.color || tagColor(opt.value) }" />
          <span>{{ opt.label }}</span>
          <span v-if="opt.count" class="dt__count">{{ opt.count }}</span>
        </div>
        <div v-if="!options.length" class="dt__empty">还没有标签，先选或先输</div>
      </div>

      <!-- 新增标签 -->
      <div class="dt__new">
        <el-input v-model="newTag" placeholder="新增标签名，回车添加" class="dt__input" maxlength="64" @keyup.enter="addNew" />
        <ReButton icon="Plus" layout="square" tip="新增标签" @click="addNew" :disabled="!newTag.trim()" />
      </div>

      <!-- 已选标签 -->
      <div class="dt__selected">
        <div v-if="tags.length" class="dt__selected-head">已选（{{ tags.length }}）</div>
        <div v-for="tag in tags" :key="tag" class="dt__tag is-selected">
          <i class="dt__dot" :style="{ background: tagColor(tag) }" />
          <span>{{ tag }}</span>
          <button type="button" class="dt__tag__close" @click="removeTag(tag)">
            <ReIcon name="Close" :size="10" />
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <ReButton @click="visible = false">取消</ReButton>
      <ReButton icon="Ok" :show-text="true" type="primary" @click="$emit('confirm', tags)">确定</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 标签管理弹窗。
 *
 * <p>标签池来自全部设备（去重 + 颜色），用户可以从中勾选，也可以新增标签。确认后输出一维标签列表，
 * 父组件负责写回 `deviceInfoTags`（建议走 {@code deviceApi.updateDevice}）。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReIcon from '@repo/ui/re-icon'
import ReDialog from '@repo/ui/re-dialog'
import type { DeviceTagOption } from '../types/device'

const props = defineProps<{
  /** 弹窗显隐 */
  modelValue: boolean
  /** 当前设备的标签 */
  tags?: string[]
  /** 标签池 */
  options: DeviceTagOption[]
}>()

const emit = defineEmits<{
  /** 弹窗显隐 */
  (e: 'update:modelValue', value: boolean): void
  /** 确认 */
  (e: 'confirm', tags: string[]): void
  /** 关闭 */
  (e: 'closed'): void
}>()

/** 弹窗显隐：与父组件 v-model 对齐（ReButton 的取消按钮用 computed setter） */
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const tags = ref<string[]>(props.tags || [])
const newTag = ref('')
const selected = ref<Set<string>>(new Set(props.tags || []))

/** 弹窗打开 / 切换设备：同步当前设备的标签与标签池状态 */
watch(
  () => props.tags,
  (val) => {
    tags.value = val || []
    selected.value = new Set(val || [])
  },
  { immediate: true }
)

/** ReDialog 的原生 closed，透传给父组件（刷新台账） */
function onClosed(): void {
  emit('closed')
}

/** 标签池切换 */
function toggle(value: string) {
  const opt = props.options.find((item) => item.value === value)
  if (!opt) return
  if (selected.value.has(value)) selected.value.delete(value)
  else selected.value.add(value)
}

/** 新增标签 */
function addNew() {
  const tag = newTag.value.trim()
  if (!tag) return
  tags.value = [...new Set([...tags.value, tag])]
  newTag.value = ''
  select(tag)
}

/** 移除标签 */
function removeTag(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag)
}

/** 选择标签池中的标签 */
function select(tag: string) {
  tags.value = [...new Set([...tags.value, tag])]
}

/** 标签的回退色 */
function tagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 10
  }
  const colors = ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#673ab7', '#009688', '#3f51b5', '#795548', '#e91e63']
  return colors[hash]
}
</script>

<style scoped>
.dt { display: flex; flex-direction: column; gap: 14px; }
.dt__hint { font-size: 11.5px; color: var(--el-text-color-secondary); }
.dt__pool { display: flex; flex-wrap: wrap; gap: 6px; }
.dt__tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; background: var(--el-fill-color-light); cursor: pointer; font-size: 11.5px; color: var(--el-text-color-regular); border: 1px solid transparent; }
.dt__tag:hover { background: var(--el-fill-color); }
.dt__tag.is-active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.dt__dot { width: 6px; height: 6px; border-radius: 50%; }
.dt__count { font-size: 10px; color: var(--el-text-color-placeholder); }
.dt__empty { font-size: 11.5px; color: var(--el-text-color-placeholder); }
.dt__new { display: flex; gap: 8px; align-items: center; }
.dt__input { flex: 1; }
.dt__selected { display: flex; flex-direction: column; gap: 6px; }
.dt__selected-head { font-size: 11.5px; color: var(--el-text-color-secondary); }
.dt__tag.is-selected { border-color: var(--el-border-color-lighter); }
.dt__tag.is-selected span { font-weight: 500; }
.dt__tag__close { border: none; background: transparent; color: var(--el-text-color-placeholder); cursor: pointer; display: inline-flex; padding: 2px; border-radius: 4px; }
.dt__tag__close:hover { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
</style>
