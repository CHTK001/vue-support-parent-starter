<template>
  <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true" width="550px" draggable title="下载备份" @close="close">
    <el-form :inline="true" class="demo-form-inline">
      <el-form-item>
        <el-date-picker v-model="rangTimeValue" :editable="false" type="daterange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="useRenderIcon('ep:download')" @click="doSearch" />
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
export default {
  components: {},
  data() {
    return {
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
    async doSearch() {
      if (!this.rangTimeValue || this.rangTimeValue.length != 2) {
        this.$message.error("请选择时间");
        return;
      }

      const startDay = this.$TOOL.dateFormat(this.getTime(0), "yyyy-MM-dd");
      const endDay = this.$TOOL.dateFormat(this.getTime(1), "yyyy-MM-dd");

      this.$API.gen.backup2.download.get(this.form).then(res => {});
    },
    getTime(i) {
      try {
        return this.rangTimeValue[i].getTime();
      } catch (error) {
        return this.rangTimeValue[i].$d.getTime();
      }
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
