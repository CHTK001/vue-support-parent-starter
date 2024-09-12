<template>
  <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true" width="70%" top="10px" draggable title="检索日志" @close="close">
    <el-form :inline="true" class="demo-form-inline" label-width="80px" label-position="left">
      <el-form-item label="检索时间">
        <el-date-picker v-model="rangTimeValue" :editable="false" type="datetimerange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
      </el-form-item>
      <el-form-item label="动作" class="w-[280px]">
        <el-select v-model="query.action" placeholder="请选择动作" class="w-[280px]">
          <el-option label="全部" value="" />
          <el-option label="删除" value="DELETE" />
          <el-option label="新增" value="INSERT" />
          <el-option label="更新" value="UPDATE" />
          <el-option label="查询" value="SELECT" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" placeholder="请输入关键词" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="doSearch" />
      </el-form-item>
    </el-form>
    <search-dialog ref="searchDialogRef" :time="rangTimeValue" @success="doSearchSuccess" />
  </el-dialog>
</template>

<script>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import SearchDialog from "./search.vue";

export default {
  components: {
    SearchDialog
  },
  data() {
    return {
      searchTitle: null,
      editDialogStatus: false,
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

      this.$refs.searchDialogRef.open(this.rangTimeValue, this.form, this.query);
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
