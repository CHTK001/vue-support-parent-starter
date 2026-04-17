<template>
  <div v-if="visible" class="spring-modal-backdrop" @click.self="$emit('close')">
    <div class="spring-modal-card">
      <div class="spring-modal-header">
        <div>
          <h3>{{ title }}</h3>
          <p>这里保留常用字段，复杂参数仍然建议走平台 API 或高级页面。</p>
        </div>
        <button type="button" class="spring-icon-button" @click="$emit('close')">
          ×
        </button>
      </div>
      <form class="spring-modal-form" @submit.prevent="$emit('submit')">
        <div class="spring-form-grid">
          <label class="spring-form-field">
            <span>任务编号</span>
            <input
              v-model.trim="form.jobNo"
              :readonly="mode === 'edit'"
              type="text"
              placeholder="留空则自动生成"
            >
          </label>
          <label class="spring-form-field">
            <span>任务名称</span>
            <input
              v-model.trim="form.jobName"
              type="text"
              required
              placeholder="例如：支付超时清理"
            >
          </label>
          <label class="spring-form-field">
            <span>调度类型</span>
            <select v-model="form.jobScheduleType">
              <option value="CRON">CRON</option>
              <option value="FIXED">FIXED</option>
              <option value="FIXED_MS">FIXED_MS</option>
              <option value="DELAY">DELAY</option>
              <option value="AT">AT</option>
              <option value="NONE">NONE</option>
            </select>
          </label>
          <label class="spring-form-field">
            <span>调度配置</span>
            <input
              v-model.trim="form.jobScheduleTime"
              type="text"
              placeholder="Cron、秒数、毫秒数或绝对时间"
            >
          </label>
          <label class="spring-form-field">
            <span>Glue 类型</span>
            <select v-model="form.jobGlueType">
              <option value="BEAN">BEAN</option>
              <option value="GLUE_GROOVY">GLUE_GROOVY</option>
              <option value="GLUE_SHELL">GLUE_SHELL</option>
              <option value="GLUE_POWERSHELL">GLUE_POWERSHELL</option>
            </select>
          </label>
          <label class="spring-form-field">
            <span>执行 Bean</span>
            <input
              v-model.trim="form.jobExecuteBean"
              :disabled="jobGlueType !== 'BEAN'"
              type="text"
              placeholder="Bean 任务必填"
            >
          </label>
          <label class="spring-form-field">
            <span>分发模式</span>
            <select v-model="form.jobDispatchMode">
              <option value="LOCAL">LOCAL</option>
              <option value="REMOTE">REMOTE</option>
            </select>
          </label>
          <label class="spring-form-field">
            <span>存储模式</span>
            <select v-model="form.jobStorageMode">
              <option value="DATABASE">DATABASE</option>
              <option value="REDIS">REDIS</option>
            </select>
          </label>
          <label class="spring-form-field">
            <span>任务状态</span>
            <select v-model="form.jobTriggerStatus">
              <option value="1">运行中</option>
              <option value="0">停止</option>
            </select>
          </label>
          <label class="spring-form-field">
            <span>负责人</span>
            <input v-model.trim="form.jobAuthor" type="text" placeholder="负责人">
          </label>
          <label class="spring-form-field spring-field-span-2">
            <span>任务描述</span>
            <textarea
              v-model.trim="form.jobDesc"
              rows="4"
              placeholder="描述业务作用和注意事项"
            ></textarea>
          </label>
          <label class="spring-form-field spring-field-span-2">
            <span>脚本源码 / Glue</span>
            <textarea
              v-model.trim="form.jobGlueSource"
              rows="7"
              placeholder="脚本任务填写源码，Bean 任务可留空"
            ></textarea>
          </label>
        </div>
        <div class="spring-modal-footer">
          <button type="button" class="spring-ghost-button" @click="$emit('close')">
            取消
          </button>
          <button type="submit" class="spring-primary-button" :disabled="saving">
            {{ saving ? "保存中..." : "保存任务" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { JobConsoleForm } from "../types";

const props = defineProps<{
  form: JobConsoleForm;
  mode: "create" | "edit";
  saving: boolean;
  selectedJobNo?: string;
  visible: boolean;
}>();

defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
}>();

const title = computed(() =>
  props.mode === "edit" ? `编辑任务 · ${props.selectedJobNo || ""}` : "新建任务",
);

const jobGlueType = computed(() => String(props.form.jobGlueType || "").toUpperCase());
</script>
