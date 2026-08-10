<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Refresh, Search } from "@element-plus/icons-vue";
import { pageDataRecords } from "@/api/spider";
import type { SpiderDataRecord } from "@/types/spider";

const list = ref<SpiderDataRecord[]>([]);
const total = ref(0);
const loading = ref(false);

const query = reactive({
  pageNo: 1,
  pageSize: 50,
  spiderDefinitionCode: "",
  spiderExecutionNo: "",
  depth: undefined as number | undefined,
});

async function load() {
  if (!query.spiderDefinitionCode) {
    list.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    const page = await pageDataRecords(
      query.pageNo,
      query.pageSize,
      query.spiderDefinitionCode,
      query.spiderExecutionNo || undefined,
      query.depth
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
 * 展开查看原始数据。
 */
const expanded = ref<SpiderDataRecord[]>([]);

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
          style="width: 200px"
          @keyup.enter="() => { query.pageNo = 1; load() }"
        />
        <el-input
          v-model="query.spiderExecutionNo"
          placeholder="执行批次号（可选）"
          clearable
          style="width: 200px"
        />
        <el-input-number
          v-model="query.depth"
          :min="0"
          :max="10"
          placeholder="深度"
          style="width: 140px"
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
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding: 0 16px">
              <div class="section-title">原始内容</div>
              <pre
                style="
                  background: #0f172a;
                  color: #cbd5e1;
                  padding: 12px;
                  border-radius: 6px;
                  max-height: 280px;
                  overflow: auto;
                  font-size: 12px;
                  white-space: pre-wrap;
                  word-break: break-all;
                "
              >{{ row.spiderContent }}</pre>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="spiderDefinitionCode" label="爬虫编码" width="160" />
        <el-table-column prop="spiderExecutionNo" label="执行批次" width="200" show-overflow-tooltip />
        <el-table-column prop="spiderDepth" label="深度" width="80" align="center" />
        <el-table-column prop="spiderTitle" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="URL" min-width="280">
          <template #default="{ row }">
            <a
              :href="row.spiderUrl"
              target="_blank"
              rel="noopener"
              style="
                color: var(--el-color-primary);
                text-decoration: none;
              "
            >
              {{ row.spiderUrl }}
            </a>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="采集时间" width="170" />
      </el-table>
      <div style="display: flex; justify-content: flex-end; padding: 12px 16px">
        <el-pagination
          v-model:current-page="query.pageNo"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="load"
          @size-change="() => { query.pageNo = 1; load() }"
        />
      </div>
    </div>
  </div>
</template>