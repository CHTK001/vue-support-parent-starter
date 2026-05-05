import type { FormInstance } from "element-plus";

export async function validateForm(formRef: FormInstance | null): Promise<boolean> {
  if (!formRef) return false;
  try {
    await formRef.validate();
    return true;
  } catch {
    return false;
  }
}

export function resetForm(formRef: FormInstance | null) {
  formRef?.resetFields();
}

export const requiredRule = (label: string) => ({
  required: true,
  message: `请输入${label}`,
  trigger: "blur" as const,
});

export const selectRequiredRule = (label: string) => ({
  required: true,
  message: `请选择${label}`,
  trigger: "change" as const,
});
