<!--
  一行证书的操作按钮。

  抽出来的理由：同一组操作要在三个地方出现（密集表的行尾、卡片墙的卡脚、
  档案柜的详情底栏）。如果各写一遍，就会出现「表格里有下载、卡片上忘了加」这种
  不一致 —— 而这次重构的目标之一正是消灭这类同一功能两套写法。

  六个操作的取舍：详情与续签是高频动作，直接摆出来；下载 / 重新验证 / 吊销 / 删除
  低频且其中两个不可恢复，收进「更多」，避免一整排红按钮（误点吊销的代价很大）。
-->
<template>
  <template v-if="mode === 'full'">
    <ReButton @click="emit('detail')">详情</ReButton>
    <ReButton :loading="renewing" @click="emit('renew')">续签</ReButton>
    <ReButton @click="emit('download')">下载</ReButton>
    <ReButton v-if="cert.statusCode === 'validating'" :loading="retrying" type="warning" @click="emit('retry')">
      重新验证
    </ReButton>
    <ReButton type="danger" plain @click="emit('revoke')">吊销</ReButton>
    <ReButton type="danger" @click="emit('delete')">删除</ReButton>
  </template>

  <template v-else>
    <button type="button" class="pk-link" @click="emit('detail')">详情</button>
    <button type="button" class="pk-link" :disabled="renewing" @click="emit('renew')">
      {{ renewing ? '续签中…' : '续签' }}
    </button>

    <ElDropdown trigger="click" placement="bottom-end" @command="onCommand">
      <button type="button" class="pk-link" aria-label="更多操作">更多</button>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="download">下载证书</ElDropdownItem>
          <ElDropdownItem v-if="cert.statusCode === 'validating'" command="retry">
            {{ retrying ? '重新验证中…' : '重新验证' }}
          </ElDropdownItem>
          <ElDropdownItem command="revoke" divided>吊销</ElDropdownItem>
          <ElDropdownItem command="delete">删除</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </template>
</template>

<script setup lang="ts">
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import type { CertView } from './acmeView'

const props = withDefaults(
  defineProps<{
    /** 证书展示行 */
    cert: CertView
    /** 续签进行中 */
    renewing?: boolean
    /** 重新验证进行中 */
    retrying?: boolean
    /** `compact` 收进「更多」；`full` 全部平铺（详情底栏用） */
    mode?: 'compact' | 'full'
  }>(),
  { renewing: false, retrying: false, mode: 'compact' },
)

const emit = defineEmits<{
  (e: 'detail'): void
  (e: 'renew'): void
  (e: 'download'): void
  (e: 'retry'): void
  (e: 'revoke'): void
  (e: 'delete'): void
}>()

/**
 * 「更多」里的命令分发
 *
 * @param command 命令名
 */
function onCommand(command: string): void {
  if (command === 'download') emit('download')
  else if (command === 'retry') emit('retry')
  else if (command === 'revoke') emit('revoke')
  else if (command === 'delete') emit('delete')
}

// props 在模板里按名字用；显式引用一次避免「声明未使用」的静态检查误报
void props
</script>

<style scoped>
.pk-link:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
</style>
