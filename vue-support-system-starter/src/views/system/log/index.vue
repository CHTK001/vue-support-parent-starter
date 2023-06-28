<template>
  <div class="app-container">
    <div class="search">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="日志名称">
          <el-input v-model="queryParams.logName" placeholder="日志名称" clearable/>
        </el-form-item>
        <el-form-item label="动作">
          <el-input v-model="queryParams.logAction" placeholder="动作" clearable/>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.logStatus" placeholder="状态" clearable>
            <el-option label="全部" value=""/>
            <el-option label="成功" value="0"/>
            <el-option label="失败" value="1"/>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery" :icon="Search"></el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-card shadow="never">
      <el-table :data="data"
                height="600"
                style="width: 100%; padding-left: 10px;padding-right:10px"
                empty-text="暂无数据"
                stripe
                border
                highlight-current-row
      >
        <el-table-column prop="logId" label="id" class="hidden" v-if="false"/>
        <el-table-column prop="logName" label="日志模块"/>
        <el-table-column prop="logAction" label="动作" show-overflow-tooltip width="90"/>
        <el-table-column prop="logStatus" label="状态" show-overflow-tooltip width="70">
          <template #default="scope">
            <el-tag v-if="scope.row.logStatus == '0'" effect="dark" type="success">成功</el-tag>
            <el-tag v-else-if="scope.row.logStatus == '1'" effect="dark" type="danger">失败</el-tag>
            <el-tag v-else effect="dark">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="logAddress" label="访问问地址"/>
        <el-table-column prop="logContent" label="日志内容" width="450"/>
        <el-table-column prop="createTime" label="访问时间" :formatter="timeFormatter"/>
        <el-table-column prop="logMapping" label="请求地址" show-overflow-tooltip/>

        <el-table-column prop="logCost" label="耗时(ms)">
          <template #default="scope">
            <el-popover effect="light" trigger="hover" placement="left" width="auto">
              <template #default>
                <div><label> {{ scope.row.logWatch }}</label></div>
              </template>
              <template #reference>
                <el-tag>{{ scope.row.logCost }}</el-tag>
              </template>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>

      <div class="example-pagination-block">
        <el-pagination
            v-if="total > 0"
            layout="->, prev, pager, next, jumper, ->, total"
            v-model:total="total"
            v-model:current-page="queryParams.pageNum"
            v-model:page-size="queryParams.pageSize"
            @size-change="handleQuery"
            @current-change="handleQuery"
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import {Search} from "@element-plus/icons-vue";
import {onMounted} from "vue";
import {formatDateTime} from "@/utils";
import {page} from "@/api/log"
import {LoggerState, LogQuery} from "@/api/log/types";

const data = ref([]);
const loading = ref(false);
const queryParams = reactive<LogQuery>({
  pageNum: 1,
  pageSize: 10,
});
const total = ref(0);

const onSubmit = function () {

}

const timeFormatter = function (row: LoggerState) {
  return formatDateTime(row.createTime, "yyyy-MM-dd hh:mm:ss");
}


//前端限制分页（tableData为当前展示页表格）
const handleQuery = () => {
  loading.value = !0;
  page(queryParams)
      .then((xhr) => {
        data.value = xhr.data.records;
        total.value = xhr.data.total;
      }).finally(() => loading.value = !1)
};
onMounted(() => {
  handleQuery();
})

</script>

<style scoped>

</style>
