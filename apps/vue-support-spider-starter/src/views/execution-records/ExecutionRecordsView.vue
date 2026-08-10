<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Refresh, Search } from "@element-plus/icons-vue";
import { pageExecutions } from "@/api/spider";
import type { SpiderExecutionRecord } from "@/types/spider";

const list = ref<SpiderExecutionRecord[]>([]);
const total = ref(0);
const loading = ref(false);

const query = reactive({
  pageNo: 1,
  pageSize: 20,
  spiderDefinitionCode: "",
});

async function load() {
  if (!query.spiderDefinitionCode) {
    list.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    const page = await pageExecutions(
      query.pageNo,
      query.pageSize,
      query.spiderDefinitionCode
    );
    list.value = page.records;
    total.value = page.total;
  } catch {
    list.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

const isEmpty = computed(() => !loading.value && list.value.length === 0);

/**
 * 状态 -> 徽标 class。
 */
function statusClass(status?: string) {
  const s = (status || "").toUpperCase();
  if (s.includes("RUN")) return "is-running";
  if (s.includes("SUCCESS") || s.includes("DONE")) return "is-success";
  if (s.includes("FAIL")) return "is-failed";
  return "is-idle";
}

onMounted(load);
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="query.spiderDefinitionCode"
          placeholder="爬虫编码（必填）"
          clearable
          style="width: 240px"
          @keyup.enter="() => { query.pageNo = 1; load() }"
        />
        <el-button
          :icon="Search"
          @click="() => { query.pageNo = 1; load() }"
        >
          查询
        </el-button>
      </div>
      <el-button :icon="Refresh" @click="load">刷新</el-button>
    </div>

    <div class="card-elplus" style="padding: 0">
      <el-table
        v-loading="loading"
        :data="list"
        :empty-text="isEmpty ? '请填写爬虫编码后查询' : ''"
        style="width: 100%"
        row-key="id"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="spiderDefinitionCode" label="爬虫编码" width="160" />
        <el-table-column prop="spiderExecutionNo" label="执行批次" width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span class="status-tag" :class="statusClass(row.spiderStatus)">
              {{ row.spiderStatus || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="spiderTotalPages" label="总数" width="90" align="center" />
        <el-table-column prop="spiderSuccessPages" label="成功" width="90" align="center" />
        <el-table-column prop="spiderFailedPages" label="失败" width="90" align="center" />
        <el-table-column prop="spiderStartTime" label="开始时间" width="170" />
        <el-table-column prop="spiderEndTime" label="结束时间" width="170" />
      </el-table>
      <div style="display: flex; justify-content: flex-end; padding: 12px 16px">
        <el-pagination
          v-model:current-page="query.pageNo"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="load"
          @size-change="() => { query.pageNo = 1; load() }"
        />
      </div>
    </div>
  </div>
</template>