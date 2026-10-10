<template>
  <div class="hotsport-leaks">
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>{{ t('hotsport.leaks.title') }}</span>
          <div>
            <el-select v-model="resourceType" :placeholder="t('hotsport.leaks.resourceType')" clearable style="width:140px; margin-right:12px;">
              <el-option label="FileInputStream" value="FileInputStream" />
              <el-option label="Socket" value="Socket" />
              <el-option label="Connection" value="Connection" />
            </el-select>
            <el-button type="primary" @click="fetchLeaks">{{ t('hotsport.refresh') }}</el-button>
          </div>
        </div>
      </template>
      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM 与
           e2e 选择器；pagination=false —— 分页仍由下方 el-pagination 自管，否则会多出一套页码控件；
           toolbar=false 不新增工具栏按钮（按钮清单与改造前逐个一致）；
           原 el-table 带 border → 走 ReTable 默认边框（border: true），stripe 走同名 prop；
           layout-table.minHeight=0 关掉组件默认的 440px 撑高与 fill 自适应。 -->
      <ReTable
        :data="leaks as unknown as Record<string, unknown>[]"
        :columns="leakColumns"
        engine="element"
        :pagination="false"
        :toolbar="false"
        stripe
        :layout-table="{ minHeight: 0 }"
        style="width:100%"
      >
        <template #col-ageMs="{ row }">
          <el-tag :type="ageMsOf(row) > 5000 ? 'danger' : 'warning'" >
            {{ ageMsOf(row).toFixed(0) }}
          </el-tag>
        </template>
        <template #col-stackTrace="{ row }">
          <el-popover trigger="hover" placement="left" width="400">
            <template #reference>
              <el-button type="text" >{{ t('hotsport.leaks.view') }}</el-button>
            </template>
            <pre style="white-space:pre-wrap; font-size:12px;">{{ row.stackTrace || t('hotsport.leaks.noStack') }}</pre>
          </el-popover>
        </template>
      </ReTable>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchLeaks"
        style="margin-top:16px; justify-content:flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { pageLeaks } from '../api/hotsportApi';
import type { LeakRecord } from '../api/types';
import { ElMessage } from 'element-plus';

const { t } = useI18n();
const leaks = ref<LeakRecord[]>([]);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const resourceType = ref('');

/**
 * 列配置：原来散在模板里的 5 个 el-table-column 收敛到这里。
 *
 * <p>列标题里有 {@code t(...)}，写成常量只在 setup 时算一次，切语言表头不会跟着变
 * （原模板里的 {@code :label="t(…)"} 是每次渲染都算的），所以用 computed。</p>
 */
const leakColumns = computed<ReTableColumn[]>(() => [
  { prop: 'resourceType', label: t('hotsport.leaks.resourceType'), width: 140 },
  { prop: 'resourceName', label: t('hotsport.leaks.resourceName'), minWidth: 160 },
  { prop: 'ageMs', label: '存活时间(ms)', width: 120, align: 'center', slot: 'ageMs' },
  { prop: 'detectedAt', label: '检测时间', width: 180 },
  { prop: 'stackTrace', label: t('hotsport.leaks.stack'), minWidth: 200, slot: 'stackTrace' },
]);

/** 插槽里的 row 是宽类型（unknown）：存活毫秒是比较/格式化入参，先收窄成 number */
function ageMsOf(row: Record<string, unknown>): number {
  return Number(row.ageMs ?? 0);
}

const fetchLeaks = async () => {
  try {
    const params: any = { page: page.value, size: size.value };
    if (resourceType.value) params.resourceType = resourceType.value;
    const res = (await pageLeaks(params)) as { total?: number; items?: LeakRecord[]; records?: LeakRecord[] };
    leaks.value = res.items || res.records || [];
    total.value = res.total || leaks.value.length;
  } catch (e) {
    ElMessage.error(t('hotsport.leaks.fetchError'));
  }
};

watch(resourceType, () => { page.value = 1; fetchLeaks(); });

onMounted(fetchLeaks);
</script>