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
      <el-table :data="leaks" border stripe style="width:100%">
        <el-table-column prop="resourceType" :label="t('hotsport.leaks.resourceType')" width="140" />
        <el-table-column prop="resourceName" :label="t('hotsport.leaks.resourceName')" min-width="160" />
        <el-table-column prop="ageMs" label="存活时间(ms)" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.ageMs > 5000 ? 'danger' : 'warning'" >
              {{ row.ageMs.toFixed(0) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detectedAt" label="检测时间" width="180" />
        <el-table-column :label="t('hotsport.leaks.stack')" min-width="200">
          <template #default="{ row }">
            <el-popover trigger="hover" placement="left" width="400">
              <template #reference>
                <el-button type="text" >{{ t('hotsport.leaks.view') }}</el-button>
              </template>
              <pre style="white-space:pre-wrap; font-size:12px;">{{ row.stackTrace || t('hotsport.leaks.noStack') }}</pre>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
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
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { pageLeaks } from '../api/hotsportApi';
import type { LeakRecord } from '../api/types';
import { ElMessage } from 'element-plus';

const { t } = useI18n();
const leaks = ref<LeakRecord[]>([]);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const resourceType = ref('');

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