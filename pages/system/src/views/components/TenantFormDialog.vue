<script setup lang="ts">
/**
 * 租户新增/编辑表单弹窗组件
 *
 * 通过 v-model:visible 控制显隐，v-model:model 绑定租户表单数据。
 * 新增模式必填初始密码，编辑模式不传密码表示不修改。
 * 保存成功后通过 success 事件通知父组件刷新。
 */
import { reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { saveTenant, updateTenant } from "../../api/systemApi";
import type { SysTenant } from "../../api/types";
import ReDialog from "@repo/ui/re-dialog";

const visible = defineModel<boolean>("visible", { required: true });

const model = defineModel<SysTenant>("model", { required: true });

const props = defineProps<{
  /** create-新增 / edit-编辑 */
  mode: "create" | "edit";
}>();

const emit = defineEmits<{
  (e: "success"): void;
}>();

const formRef = ref();

/** 表单数据（与 model 解耦，打开时按 model 快照） */
const form = reactive<Partial<SysTenant>>({});

/** 打开弹窗时按 model 重置表单 */
watch(
  () => visible.value,
  (open) => {
    if (open) {
      const source = model.value ?? {};
      Object.assign(form, source);
      if (props.mode === "create") {
        form.sysTenantStatus = 0;
        form.sysTenantDelete = 0;
      }
    }
  },
);

/** 保存租户 */
async function handleSubmit() {
  await formRef.value?.validate?.();
  if (props.mode === "create") {
    await saveTenant({ ...form });
    ElMessage.success("租户创建成功，菜单已重置推送");
  } else {
    await updateTenant({ ...form });
    ElMessage.success("租户更新成功，菜单已重置推送");
  }
  visible.value = false;
  emit("success");
}
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="mode === 'create' ? '新增租户' : '编辑租户'"
    width="560px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" label-width="90px">
      <el-form-item
        label="租户名称"
        prop="sysTenantName"
        :rules="[{ required: true, message: '请输入租户名称', trigger: 'blur' }]"
      >
        <el-input v-model="form.sysTenantName" placeholder="请输入租户名称" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item
        label="租户账号"
        prop="sysTenantUsername"
        :rules="[{ required: true, message: '请输入租户账号', trigger: 'blur' }]"
      >
        <el-input v-model="form.sysTenantUsername" placeholder="租户端登录账号" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item
        v-if="mode === 'create'"
        label="初始密码"
        prop="sysTenantPassword"
        :rules="[{ required: true, message: '请输入初始密码', trigger: 'blur' }]"
      >
        <el-input v-model="form.sysTenantPassword" type="password" show-password placeholder="租户端登录密码" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="联系人">
        <el-input v-model="form.sysTenantContact" placeholder="联系人" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="form.sysTenantPhone" placeholder="手机号" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.sysTenantEmail" placeholder="邮箱" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="公司">
        <el-input v-model="form.sysTenantCorporation" placeholder="公司" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="访问地址">
        <el-input v-model="form.sysTenantHomeUrl" placeholder="租户访问地址" maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.sysTenantStatus">
          <el-radio :label="0">启用</el-radio>
          <el-radio :label="1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.sysTenantRemark" type="textarea" :rows="2" placeholder="备注" maxlength="1000" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </ReDialog>
</template>
