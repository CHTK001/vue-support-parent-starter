<script>
import { defineComponent } from "vue";
import EyeClose from "@iconify-icons/ri/eye-close-line";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

export default defineComponent({
  props: {
    data: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      icon: { EyeClose: null },
      visible: false
    };
  },
  mounted() {
    this.icon.EyeClose = useRenderIcon(EyeClose);
  },
  methods: {
    onClose() {
      this.$emit("close");
    }
  }
});
</script>
<template>
  <div>
    <el-drawer v-model="visible" @close="onClose">
      <el-divider />
      <el-main style="padding: 0 20px">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="请求接口"
            ><span style="color: lightblue">({{ data.logCost }} ms) </span
            >{{ data.logMapping }}
          </el-descriptions-item>
          <el-descriptions-item label="客户端地址">
            <span>{{ data.clientIp }}</span>
            <el-icon
              v-if="!clickEye && !data.clientIpPosition"
              class="cursor-pointer"
              style="z-index: 999999"
              @click.stop="openIp(data.logId, data.clientIp)"
              ><component :is="EyeClose"
            /></el-icon>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="data.clientIpPosition"
            label="客户端地址位置"
          >
            <el-tag>{{ data.clientIpPosition }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态代码">
            <sc-status-indicator
              v-if="data.logStatus == 1"
              pulse
              type="success"
            />
            <sc-status-indicator
              v-if="data.logStatus == 0"
              pulse
              type="danger"
            />
            {{ data.logStatus == 1 ? "成功" : "失败" }}</el-descriptions-item
          >
          <el-descriptions-item label="日志名"
            >{{ data.logName
            }}<span v-if="data.logAction"
              >({{ data.logAction }})</span
            ></el-descriptions-item
          >
          <el-descriptions-item label="日志时间">{{
            data.createTime
          }}</el-descriptions-item>
        </el-descriptions>
        <el-collapse v-model="activeNames" style="margin-top: 20px">
          <el-collapse-item title="常规" name="1">
            <el-alert
              :title="data.logContent"
              :type="typeMap[data.level]"
              :closable="false"
            />
          </el-collapse-item>
          <el-collapse-item title="部分参数" name="2">
            <el-alert
              :title="data.logParam"
              type="info"
              :closable="false"
              class="comment"
            />
          </el-collapse-item>
          <el-collapse-item
            v-if="logWatch && logWatch != 'undefined'"
            title="详细"
            name="3"
          >
            <div ref="code" class="code" v-html="logWatch" />
          </el-collapse-item>
        </el-collapse>
      </el-main>
    </el-drawer>
  </div>
</template>
