<template>
  <el-dialog v-model="visibleProxy" title="在线搜索软件" width="70%" @open="onOpen">
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="输入关键词检索默认仓库" clearable class="w-80" @input="onKeywordInput">
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>
      <el-alert type="info" class="ml-3 flex-1" :closable="false" title="仅检索默认仓库" />
    </div>

    <ScTable ref="tableRef" :url="softwareApi.searchOnlineSoftware" :params="tableParams" row-key="systemSoftCode"
      table-name="docker-soft-online-search" :page-size="10" :auto-load="false">
      <el-table-column type="selection" width="48" />
      <el-table-column label="名称/代码" min-width="260">
        <template #default="{ row }">
          <div class="name-cell">
            <IconifyIconOnline :icon="row.systemSoftIcon || 'ri:apps-line'" class="mr-2" />
            <div>
              <div class="font-semibold">{{ row.systemSoftName }}</div>
              <div class="text-secondary text-xs">{{ row.systemSoftCode }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="镜像" min-width="260" prop="systemSoftDockerImage" />
      <el-table-column label="Stars" width="90">
        <template #default="{ row }">
          <span>{{ row.systemSoftStarCount ?? 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Pulls" width="90">
        <template #default="{ row }">
          <span>{{ row.systemSoftPullCount ?? 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="描述" min-width="300">
        <template #default="{ row }">
          <div class="desc">{{ row.systemSoftDesc || '-' }}</div>
        </template>
      </el-table-column>
    </ScTable>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visibleProxy = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { softwareApi } from '@/api/docker-management';
import ScTable from '@repo/components/ScTable/index.vue';
import { ElMessage } from 'element-plus';
import { computed, reactive, ref } from 'vue';

interface Props { visible: boolean }
interface Emits {
  (e: 'update:visible', v: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const tableRef = ref();
const keyword = ref('');
const saving = ref(false);
let timer: any = null;

const visibleProxy = computed({ get: () => props.visible, set: v => emit('update:visible', v) });

const tableParams = reactive({ keyword: '', page: 1, size: 10 });

function onOpen() {
  // 初次打开不自动搜索，等待输入
}

function onKeywordInput() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const kw = keyword.value.trim();
    tableParams.keyword = kw;
    if (!kw) return; // 关键词为空不触发请求
    tableRef.value?.reload?.(tableParams, 1);
  }, 400);
}

async function handleImport() {
  const selection = tableRef.value?.getSelection?.() || [];
  if (!selection.length) return ElMessage.warning('请选择要导入的软件');
  try {
    saving.value = true;
    const payload = {
      items: selection.map((s: any) => ({
        systemSoftName: s.systemSoftName,
        systemSoftCode: s.systemSoftCode,
        systemSoftDesc: s.systemSoftDesc,
        systemSoftIcon: s.systemSoftIcon,
        systemSoftDockerImage: s.systemSoftDockerImage,
        systemSoftStatus: 1,
      }))
    };
    const res = await softwareApi.importOnlineSoftware(payload);
    if (res.code === '00000') {
      ElMessage.success(res.msg || '已异步提交保存任务');
      emit('success');
      visibleProxy.value = false;
    } else {
      ElMessage.error(res.msg || '保存失败');
    }
  } catch (e) {
    ElMessage.error('保存失败（接口不可用）');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.name-cell {
  display: flex;
  align-items: center;
}

.text-secondary {
  color: var(--app-text-secondary);
}

.desc {
  color: var(--app-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>