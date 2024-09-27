<template>
  <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true" width="550px" draggable title="检索日志" @close="close">
    <el-form :inline="false" class="demo-form-inline" label-width="80px" label-position="left">
      <el-form-item label="检索时间">
        <el-date-picker v-model="rangTimeValue" :editable="false" type="datetimerange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
      </el-form-item>
      <el-form-item label="动作">
        <el-select v-model="query.action" placeholder="请选择动作">
          <el-option label="全部" />
          <el-option label="删除" value="DELETE" />
          <el-option label="新增" value="INSERT" />
          <el-option label="更新" value="UPDATE" />
          <el-option label="查询" value="QUERY" />
        </el-select>
      </el-form-item>
      <el-form-item label="表名">
        <el-input v-model="query.tableName" placeholder="请输入表名" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="doSearch" />
    </template>
  </el-dialog>
  <el-dialog v-model="searchDialogStatus" :title="searchTitle" :close-on-click-modal="false" draggable width="60%" top="20px" :destroy-on-close="true" @close="close">
    <search-dialog ref="searchDialogRef" :time="rangTimeValue" @success="doSearchSuccess" />
  </el-dialog>
</template>

<script>
import SearchDialog from "./search.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

export default {
  components: {
    SearchDialog
  },
  data() {
    return {
      searchTitle: null,
      editDialogStatus: false,
      searchDialogStatus: false,
      query: {},
      rangTimeValue: [],
      form: {
        tableName: null,
        action: null
      }
    };
  },
  mounted() {
    this.rangTimeValue[1] = new Date();
    this.rangTimeValue[0] = new Date(new Date().getTime() - 86400 * 1000);
  },
  methods: {
    useRenderIcon,
    doSearchSuccess(item) {
      this.searchTitle = item;
    },
    doSearch() {
      if (!this.rangTimeValue || this.rangTimeValue.length != 2) {
        this.$message.error("请选择时间");
        return;
      }

      this.searchDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.searchDialogRef.open(this.rangTimeValue, this.form, this.query);
        this.close();
      });
    },
    open(form) {
      Object.assign(this.form, form);
      this.editDialogStatus = true;
    },
    close() {
      this.editDialogStatus = false;
      this.form = {};
      // this.query.tableName = null;
      // this.query.action = null;
    }
  }
};
</script>
