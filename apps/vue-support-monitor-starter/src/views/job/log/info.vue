<template>
  <div>
    <el-drawer
      v-model="visible"
      title="日志详情"
      :size="800"
      destroy-on-close
      @close="close"
    >
      <el-main style="padding: 0 20px">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="请求接口">
            <span style="color: lightblue"
              >({{ dateFormat(form.jobLogTriggerTime) }})</span
            >
            {{ form.executorHandler }}
          </el-descriptions-item>
          <el-descriptions-item label="状态代�?>
            <el-tag v-if="form.jobLogTriggerCode !== '00000'" type="danger"
              >失败</el-tag
            >
            <el-tag v-else type="success">成功</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="日志时间">{{
            dateFormat(form.createTime)
          }}</el-descriptions-item>
          <el-descriptions-item label="执行环境">{{
            form.jobLogProfile
          }}</el-descriptions-item>
          <el-descriptions-item label="执行服务�?>{{
            form.jobLogTriggerAddress
          }}</el-descriptions-item>
        </el-descriptions>
        <el-collapse v-model="activeNames" style="margin-top: 20px">
          <el-collapse-item v-if="form.jobLogTriggerMsg" title="常规" name="1">
            <el-alert :type="typeMap['info']" :closable="false">
              <div v-html="form.jobLogTriggerMsg" />
            </el-alert>
          </el-collapse-item>
          <el-collapse-item title="部分参数" name="2">
            <el-alert
              :title="form.jobLogTriggerParam"
              type="info"
              :closable="false"
              class="comment"
            />
          </el-collapse-item>
        </el-collapse>
      </el-main>
    </el-drawer>
  </div>
</template>

<script>
import { dateFormat } from "@repo/utils";

export default {
  data() {
    return {
      form: {},
      visible: false,
      activeNames: ["1", "2"],
      typeMap: {
        info: "info",
        warn: "warning",
        error: "error",
      },
      logWatch: undefined,
      logParam: undefined,
    };
  },
  methods: {
    dateFormat,
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    close() {
      this.visible = false;
      this.form = {};
    },
    open() {
      this.visible = true;
    },
  },
};
</script>

<style scoped>
.code {
  background: #848484;
  padding: 15px;
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
}
.comment {
  white-space: pre-wrap;
}
</style>
