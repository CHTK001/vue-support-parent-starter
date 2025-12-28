<script>
import EyeClose from "@iconify-icons/ri/eye-close-line";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import scStatusIndicator from "@repo/components/ScMini/scStatusIndicator.vue";
import { defineComponent } from "vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
export default defineComponent({
  components: { scStatusIndicator, VueJsonPretty },
  props: {
    moduleOptions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      icon: { EyeClose: null },
      visible: false,
      row: {},
      clickEye: false,
    };
  },
  mounted() {
    this.icon.EyeClose = useRenderIcon(EyeClose);
  },
  methods: {
    setData(row) {
      Object.assign(this.row, row);
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
    transform(value) {
      value = String(value || "").toUpperCase();
      const _value = this.moduleOptions.filter((item) => {
        if (item.value == value) {
          return item.label;
        }
      });
      return _value || _value.length > 0 ? _value?.[0]?.label : transformI18n("module.other");
    },
  },
});
</script>
<template>
  <div>
    <sc-drawer v-model="visible" title="详情页" @close="onClose">
      <el-divider />
      <el-main style="padding: 0 20px">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="请求接口">
            <el-tag v-if="row.sysLogCost <= 1000" type="success" plain>{{ row.sysLogCost || 0 }} ms</el-tag>
            <el-tag v-else-if="row.sysLogCost > 1000 && row.sysLogCost < 4000" type="warning" plain>{{ row.sysLogCost || 0 }} ms</el-tag>
            <el-tag v-else type="danger" plain>{{ row.sysLogCost || 0 }} ms</el-tag>
            <span class="ml-2">{{ row.sysLogUrl }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="客户端地址">
            <span>{{ row.sysLogIp }}</span>
            <el-icon v-if="!clickEye && !row.sysLogAddress" class="cursor-pointer" style="z-index: 999999">
              <component :is="EyeClose" />
            </el-icon>
          </el-descriptions-item>
          <el-descriptions-item v-if="row.sysLogAddress" label="客户端地址位置">
            <el-tag>{{ row.sysLogAddress }}</el-tag>
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
            <el-alert
              :title="row.logContent"
              :type="typeMap[row.level]"
              :closable="false"
            />
          </el-collapse-item> -->
          <el-collapse-item title="部分参数" name="2">
            <!-- <el-alert
              :title="row.sysLogParam"
              type="info"
              :closable="false"
              class="comment"
            /> -->
            <VueJsonPretty :data="toJsonObject(row.sysLogParam)" />
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
