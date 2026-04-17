<template>
  <div class="basic-form">
    <!-- 行1：项目名称（全宽） -->
    <ScFormItem label="项目名称" prop="projectName" required>
      <ScInput
        v-model="form.projectName"
        placeholder="请输入项目名称"
        clearable
        maxlength="100"
      >
        <template #prefix>
          <ScIcon><component :is="useRenderIcon('ri:apps-line')" /></ScIcon>
        </template>
      </ScInput>
    </ScFormItem>

    <!-- 行2：项目描述（全宽） -->
    <ScFormItem label="项目描述" prop="projectDescription">
      <ScInput
        v-model="form.projectDescription"
        type="textarea"
        :rows="2"
        placeholder="请输入项目描述"
        maxlength="500"
        show-word-limit
      />
    </ScFormItem>

    <!-- 行3：图标 + 状态 -->
    <div class="form-row">
      <ScFormItem label="项目图标" prop="projectIcon">
        <ScInput v-model="form.projectIcon" placeholder="图标 URL" clearable>
          <template #prefix>
            <ScIcon><component :is="useRenderIcon('ri:image-line')" /></ScIcon>
          </template>
        </ScInput>
      </ScFormItem>

      <ScFormItem label="状态" prop="status">
        <ScSwitch
          v-model="form.status"
          layout="modern"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
          :active-icon="useRenderIcon('ri:checkbox-circle-line')"
          :inactive-icon="useRenderIcon('ri:close-circle-line')"
        />
      </ScFormItem>
    </div>

    <!-- 行4：排序（半宽） -->
    <div class="form-row">
      <ScFormItem label="排序" prop="sortOrder">
        <ScInputNumber v-model="form.sortOrder" :min="0" :max="9999" style="width: 100%" />
      </ScFormItem>
      <div /><!-- 占位 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import type { SysProject } from "../../api/manage/project";

defineProps<{ form: Partial<SysProject> }>();
</script>

<style scoped lang="scss">
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
</style>
