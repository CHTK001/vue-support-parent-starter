<script>
import scStatusIndicator from "@repo/components/ScMini/scStatusIndicator.vue";
import { defineComponent } from "vue";
export default defineComponent({
  components: { scStatusIndicator },
  props: {
    moduleOptions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      visible: false,
      row: {},
      activeNames: ["2"],
    };
  },
  methods: {
    setData(row) {
      this.row = { ...(row || {}) };
      return this;
    },
    open(node) {
      this.visible = true;
    },
    onClose() {
      this.visible = false;
      this.row = {};
      this.$emit("close");
    },
    toJsonObject(value) {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    },
    formatJsonText(value) {
      if (value === null || value === undefined || value === "") {
        return "";
      }
      const jsonValue = this.toJsonObject(value);
      if (typeof jsonValue === "string") {
        return jsonValue;
      }
      try {
        return JSON.stringify(jsonValue, null, 2);
      } catch (error) {
        return String(value);
      }
    },
    transform(value) {
      value = String(value || "").toUpperCase();
      const _value = this.moduleOptions.filter((item) => {
        if (item.value == value) {
          return item.label;
        }
      });
      return _value && _value.length > 0 ? _value?.[0]?.label : "其他";
    },
  },
});
</script>
<template>
  <div>
    <sc-drawer v-model="visible" title="详情页" @close="onClose">
      <ScDivider />
      <el-main style="padding: 0 20px">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="请求接口">
            <ScTag v-if="row.sysLogCost <= 1000" type="success" plain>{{ row.sysLogCost || 0 }} ms</ScTag>
            <ScTag v-else-if="row.sysLogCost > 1000 && row.sysLogCost < 4000" type="warning" plain>{{ row.sysLogCost || 0 }} ms</ScTag>
            <ScTag v-else type="danger" plain>{{ row.sysLogCost || 0 }} ms</ScTag>
            <span class="ml-2">{{ row.sysLogUrl }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="客户端地址">
            <span>{{ row.sysLogIp }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="row.sysLogAddress" label="客户端地址位置">
            <ScTag>{{ row.sysLogAddress }}</ScTag>
          </el-descriptions-item>
          <el-descriptions-item label="状态代码">
            <sc-status-indicator v-if="row.sysLogStatus == 1" pulse type="success" />
            <sc-status-indicator v-if="row.sysLogStatus == 0" pulse type="danger" />
            {{ row.sysLogStatus == 1 ? "成功" : "失败" }}
          </el-descriptions-item>
          <el-descriptions-item label="日志名">
            {{ transform(row.sysLogFrom) }}
            <span v-if="row.logAction">({{ row.logAction }})</span>
          </el-descriptions-item>
          <el-descriptions-item label="日志时间">
            {{ row.createTime }}
          </el-descriptions-item>
        </el-descriptions>
        <el-collapse v-model="activeNames" style="margin-top: 20px">
          <!-- <el-collapse-item title="常规" name="1">
            <ScAlert 
              :title="row.logContent"
              :type="typeMap[row.level]"
              :closable="false"
            />
          </el-collapse-item> -->
          <el-collapse-item title="部分参数" name="2">
            <!-- <ScAlert 
              :title="row.sysLogParam"
              type="info"
              :closable="false"
              class="comment"
            /> -->
            <pre class="json-pretty">{{ formatJsonText(row.sysLogParam) }}</pre>
          </el-collapse-item>
          <!-- <el-collapse-item
            v-if="logWatch && logWatch != 'undefined'"
            title="详细"
            name="3"
          >
            <div ref="code" class="code" v-html="logWatch" />
          </el-collapse-item> -->
        </el-collapse>
      </el-main>
    </sc-drawer>
  </div>
</template>
<style scoped>
.json-pretty {
  margin: 0;
  padding: 12px 14px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
  font-size: 13px;
  line-height: 1.65;
  background: var(--el-fill-color-lighter, #f8fafc);
  border-radius: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
