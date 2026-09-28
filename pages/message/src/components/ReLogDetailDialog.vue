<script setup lang="ts">
/**
 * 推送日志详情弹窗组件
 *
 * 通过 v-model:visible 控制显隐，v-model:model 绑定当前日志行数据。
 */
import type { MessageLog } from "../api/types";
import ReTime from "@repo/ui/re-time";
import { costMs } from "@repo/utils";

const visible = defineModel<boolean>("visible", { required: true });

const model = defineModel<MessageLog | null>("model", { required: true });
</script>

<template>
  <el-dialog v-model="visible" title="推送日志详情" width="560px">
    <el-descriptions v-if="model" :column="1" border>
      <el-descriptions-item label="接收人">{{ model.sysMessageLogTarget }}</el-descriptions-item>
      <el-descriptions-item label="渠道">{{ model.sysMessageLogChannel }}</el-descriptions-item>
      <el-descriptions-item label="主题">{{ model.sysMessageLogSubject ?? "-" }}</el-descriptions-item>
      <el-descriptions-item label="批次号">{{ model.sysMessageBatchId ?? "-" }}</el-descriptions-item>
      <el-descriptions-item label="消息ID">{{ model.sysMessageLogMessageId ?? "-" }}</el-descriptions-item>
      <el-descriptions-item label="返回码">
        <el-tag
          
          :type="model.sysMessageCode === 'SUCCESS' ? 'success' : 'danger'"
          effect="plain"
        >
          {{ model.sysMessageCode }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="耗时"><ReTime :value="costMs(model.sysMessageCost)" format="duration" placeholder="—" /></el-descriptions-item>
      <el-descriptions-item label="返回消息">{{ model.sysMessageMessage ?? "-" }}</el-descriptions-item>
      <el-descriptions-item label="阅读状态">
        <template v-if="model.sysMessageTrackToken">
          <el-tag
            
            :type="model.sysMessageReadStatus === 1 ? 'success' : 'info'"
            effect="plain"
          >
            {{ model.sysMessageReadStatus === 1 ? "已读" : "未读" }}
          </el-tag>
          <span v-if="model.sysMessageReadTime" class="ml-2 text-xs text-[--el-text-color-secondary]">
            {{ model.sysMessageReadTime }}
          </span>
        </template>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="参数">{{ model.sysMessageLogParam ?? "-" }}</el-descriptions-item>
      <el-descriptions-item label="发送内容">{{ model.sysMessageLogContent ?? "-" }}</el-descriptions-item>
      <el-descriptions-item label="发送时间">{{ model.createTime }}</el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>
