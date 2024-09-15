<template>
  <div>
    {{ form }}
    <el-main style="padding: 0 20px">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="请求接口">
          <span style="color: lightblue">
            (
            <span v-time="form.jobLogTriggerTime" />
            )
          </span>
          {{ form.executorHandler }}
        </el-descriptions-item>
        <el-descriptions-item label="状态代码">{{ form.jobLogTriggerCode }}</el-descriptions-item>
        <el-descriptions-item label="日志时间"><span v-time="form.createTime" /></el-descriptions-item>
      </el-descriptions>
      <el-collapse v-model="activeNames" style="margin-top: 20px">
        <el-collapse-item v-if="form.jobLogTriggerMsg" title="常规" name="1">
          <el-alert :type="typeMap['info']" :closable="false">
            <div v-html="form.jobLogTriggerMsg" />
          </el-alert>
        </el-collapse-item>
        <el-collapse-item title="部分参数" name="2">
          <el-alert :title="form.jobLogTriggerParam" type="info" :closable="false" class="comment" />
        </el-collapse-item>
      </el-collapse>
    </el-main>
  </div>
</template>

<script>
export default {
  props: ["data"],
  data() {
    return {
      form: {},
      activeNames: ["1", "2"],
      typeMap: {
        info: "info",
        warn: "warning",
        error: "error"
      },
      logWatch: undefined,
      logParam: undefined
    };
  }
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
