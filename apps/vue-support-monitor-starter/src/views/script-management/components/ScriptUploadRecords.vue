<template>
  <div class="upload-records">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="按文件名/目标路径搜索"
        clearable
        size="small"
        style="width: 260px"
      />
      <div class="spacer" />
      <el-button size="small" @click="reload">
        <IconifyIconOnline icon="ri:refresh-line" /> 刷新
      </el-button>
    </div>

    <el-table :data="filteredRecords" stripe v-loading="loading">
      <el-table-column
        prop="monitorSysGenScriptUploadRecordId"
        label="ID"
        width="80"
      />
      <el-table-column prop="monitorSysGenScriptId" label="脚本ID" width="90" />

      <el-table-column
        prop="monitorSysGenScriptUploadScriptName"
        label="脚本名称"
        min-width="140"
      >
        <template #default="{ row }">{{
          row.monitorSysGenScriptUploadScriptName || "-"
        }}</template>
      </el-table-column>
      <el-table-column
        prop="monitorSysGenScriptUploadScriptDescription"
        label="脚本描述"
        min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">{{
          row.monitorSysGenScriptUploadScriptDescription || "-"
        }}</template>
      </el-table-column>

      <el-table-column
        prop="monitorSysGenScriptUploadType"
        label="类型"
        width="90"
      >
        <template #default="{ row }">
          <el-tag
            :type="
              row.monitorSysGenScriptUploadStatus === 'SUCCESS'
                ? 'success'
                : 'danger'
            "
            >{{ row.monitorSysGenScriptUploadType }}</el-tag
          >
        </template>
      </el-table-column>

      <el-table-column label="目标">
        <template #default="{ row }">
          <span v-if="row.monitorSysGenScriptUploadServerId"
            >SERVER#{{ row.monitorSysGenScriptUploadServerId }}</span
          >
          <span v-else-if="row.monitorSysGenScriptUploadNodeId"
            >NODE#{{ row.monitorSysGenScriptUploadNodeId }}</span
          >
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column
        prop="monitorSysGenScriptUploadIp"
        label="服务器IP"
        width="140"
      >
        <template #default="{ row }">{{
          row.monitorSysGenScriptUploadIp || "-"
        }}</template>
      </el-table-column>

      <el-table-column
        prop="monitorSysGenScriptUploadTargetPath"
        label="目标路径"
      />
      <el-table-column label="文件">
        <template #default="{ row }">
          {{ row.monitorSysGenScriptUploadFileName }}
          <span v-if="row.monitorSysGenScriptUploadFileSize"
            >（{{ formatBytes(row.monitorSysGenScriptUploadFileSize) }}）</span
          >
        </template>
      </el-table-column>
      <el-table-column
        prop="monitorSysGenScriptUploadStatus"
        label="状态"
        width="100"
      >
        <template #default="{ row }">
          <el-tag
            :type="
              row.monitorSysGenScriptUploadStatus === 'SUCCESS'
                ? 'success'
                : 'danger'
            "
            >{{ row.monitorSysGenScriptUploadStatus }}</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column
        prop="monitorSysGenScriptUploadErrorMessage"
        label="错误信息"
        show-overflow-tooltip
      />
    </el-table>

    <div class="table-footer">
      <el-pagination
        background
        layout="prev, pager, next, sizes, total"
        :page-size="pageSize"
        :current-page="pageNum"
        :total="total"
        @update:page-size="
          (s: number) => {
            pageSize = s;
            reload();
          }
        "
        @update:current-page="
          (p: number) => {
            pageNum = p;
            reload();
          }
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import { fetchScriptUploadRecords } from "@/api/script-upload";
import { formatBytes } from "@pureadmin/utils";

const props = defineProps<{
  scriptId?: number | string;
}>();

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const keyword = ref("");

const filteredRecords = computed(() => {
  if (!keyword.value) return list.value;
  const k = keyword.value.toLowerCase();
  return list.value.filter((r) => {
    const file = (r.monitorSysGenScriptUploadFileName || "").toLowerCase();
    const path = (r.monitorSysGenScriptUploadTargetPath || "").toLowerCase();
    const name = (r.monitorSysGenScriptUploadScriptName || "").toLowerCase();
    const desc = (
      r.monitorSysGenScriptUploadScriptDescription || ""
    ).toLowerCase();
    const ip = (r.monitorSysGenScriptUploadIp || "").toLowerCase();
    return (
      file.includes(k) ||
      path.includes(k) ||
      name.includes(k) ||
      desc.includes(k) ||
      ip.includes(k)
    );
  });
});

const reload = async () => {
  try {
    loading.value = true;
    const res = await fetchScriptUploadRecords({
      scriptId: props.scriptId as any,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    if (res.success) {
      list.value = res.data.records || [];
      total.value = res.data.total || 0;
    } else {
      ElMessage.error(res.msg || "加载失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("加载失败");
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.scriptId,
  () => {
    pageNum.value = 1;
    reload();
  }
);

onMounted(() => reload());

const formatTime = (t: any) =>
  t ? dayjs(t).format("YYYY-MM-DD HH:mm:ss") : "-";
</script>

<style scoped>
.upload-records {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.toolbar .spacer {
  flex: 1;
}
.table-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}
</style>
