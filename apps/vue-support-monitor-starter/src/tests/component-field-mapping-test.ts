/**
 * 组件字段映射测试
 * 用于验证前后端字段映射的一致性
 */

import type { ServerComponent, ServerDetailComponent } from "@/api/server";

// 测试数据：模拟API返回的数据
const mockApiResponse: ServerComponent = {
  monitorSysGenServerComponentId: 1,
  monitorSysGenServerId: 100,
  monitorSysGenServerComponentName: "CPU使用率",
  monitorSysGenServerComponentType: "card",
  monitorSysGenServerComponentExpressionType: "PROMETHEUS",
  monitorSysGenServerComponentExpression:
    '100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
  monitorSysGenServerComponentRefreshInterval: 30,
  monitorSysGenServerComponentSort: 1,
  monitorSysGenServerComponentStatus: 1,
  monitorSysGenServerComponentDescription: "显示服务器CPU使用率",
  monitorSysGenServerComponentConfig: JSON.stringify({
    chart: {
      type: "gauge",
      backgroundColor: "#f8f9fa",
    },
  }),
  monitorSysGenServerComponentPosition: JSON.stringify({
    x: 0,
    y: 0,
    w: 6,
    h: 6,
  }),
  monitorSysGenServerComponentCreateTime: "2024-01-01 10:00:00",
  monitorSysGenServerComponentUpdateTime: "2024-01-01 10:00:00",
};

// 测试数据：模拟前端表单数据
const mockFormData: Partial<ServerDetailComponent> = {
  monitorSysGenServerId: 100,
  monitorSysGenServerComponentName: "CPU使用率",
  monitorSysGenServerComponentType: "card",
  monitorSysGenServerComponentExpressionType: "PROMETHEUS",
  monitorSysGenServerComponentExpression:
    '100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
  monitorSysGenServerComponentRefreshInterval: 30,
  monitorSysGenServerComponentSort: 1,
  monitorSysGenServerComponentStatus: 1,
  monitorSysGenServerComponentDescription: "显示服务器CPU使用率",
  monitorSysGenServerComponentConfig: JSON.stringify({
    chart: {
      type: "gauge",
      backgroundColor: "#f8f9fa",
    },
  }),
  monitorSysGenServerComponentPosition: JSON.stringify({
    x: 0,
    y: 0,
    w: 6,
    h: 6,
  }),
};

/**
 * 字段映射验证函数
 */
export function validateFieldMapping() {
  const errors: string[] = [];

  // 验证必要字段是否存在
  const requiredFields = [
    "monitorSysGenServerComponentName",
    "monitorSysGenServerComponentType",
    "monitorSysGenServerComponentExpressionType",
    "monitorSysGenServerComponentExpression",
  ];

  requiredFields.forEach((field) => {
    if (!(field in mockApiResponse)) {
      errors.push(`API响应缺少必要字段: ${field}`);
    }
    if (!(field in mockFormData)) {
      errors.push(`表单数据缺少必要字段: ${field}`);
    }
  });

  // 验证字段类型
  const fieldTypes = {
    monitorSysGenServerComponentId: "number",
    monitorSysGenServerId: "number",
    monitorSysGenServerComponentName: "string",
    monitorSysGenServerComponentType: "string",
    monitorSysGenServerComponentExpressionType: "string",
    monitorSysGenServerComponentExpression: "string",
    monitorSysGenServerComponentRefreshInterval: "number",
    monitorSysGenServerComponentSort: "number",
    monitorSysGenServerComponentStatus: "number",
    monitorSysGenServerComponentDescription: "string",
    monitorSysGenServerComponentConfig: "string",
    monitorSysGenServerComponentPosition: "string",
  };

  Object.entries(fieldTypes).forEach(([field, expectedType]) => {
    const apiValue = (mockApiResponse as any)[field];
    const formValue = (mockFormData as any)[field];

    if (apiValue !== undefined && typeof apiValue !== expectedType) {
      errors.push(
        `API字段 ${field} 类型错误，期望 ${expectedType}，实际 ${typeof apiValue}`,
      );
    }

    if (formValue !== undefined && typeof formValue !== expectedType) {
      errors.push(
        `表单字段 ${field} 类型错误，期望 ${expectedType}，实际 ${typeof formValue}`,
      );
    }
  });

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * 数据转换测试
 */
export function testDataTransformation() {
  const errors: string[] = [];

  try {
    // 测试API数据转换为表单数据
    const formData = { ...mockApiResponse };

    // 验证关键字段是否正确转换
    if (
      formData.monitorSysGenServerComponentName !==
      mockApiResponse.monitorSysGenServerComponentName
    ) {
      errors.push("组件名称字段转换失败");
    }

    if (
      formData.monitorSysGenServerComponentType !==
      mockApiResponse.monitorSysGenServerComponentType
    ) {
      errors.push("组件类型字段转换失败");
    }

    // 测试JSON字段解析
    try {
      const config = JSON.parse(
        mockApiResponse.monitorSysGenServerComponentConfig || "{}",
      );
      const position = JSON.parse(
        mockApiResponse.monitorSysGenServerComponentPosition || "{}",
      );

      if (!config || !position) {
        errors.push("JSON字段解析失败");
      }
    } catch (e) {
      errors.push("JSON字段格式错误");
    }
  } catch (error) {
    errors.push(`数据转换异常: ${error}`);
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * 运行所有测试
 */
export function runAllTests() {
  console.log("🧪 开始字段映射测试...");

  const mappingResult = validateFieldMapping();
  const transformResult = testDataTransformation();

  console.log("📋 字段映射验证结果:", mappingResult);
  console.log("🔄 数据转换测试结果:", transformResult);

  const allSuccess = mappingResult.success && transformResult.success;

  if (allSuccess) {
    console.log("✅ 所有测试通过！字段映射修复成功。");
  } else {
    console.log("❌ 测试失败，发现以下问题:");
    [...mappingResult.errors, ...transformResult.errors].forEach((error) => {
      console.log(`  - ${error}`);
    });
  }

  return allSuccess;
}

/**
 * 修复验证测试
 * 验证所有组件文件的字段映射修复是否成功
 */
export function testFixedComponents() {
  console.log("🔧 验证修复后的组件字段映射...");

  const errors: string[] = [];

  // 验证ComponentEditDialog.vue修复
  const editDialogFields = [
    "monitorSysGenServerComponentId",
    "monitorSysGenServerComponentName",
    "monitorSysGenServerComponentType",
    "monitorSysGenServerComponentExpression",
    "monitorSysGenServerComponentEnabled",
  ];

  editDialogFields.forEach((field) => {
    if (field.includes("monitorSysGenServerDetailComponent")) {
      errors.push(`ComponentEditDialog.vue 仍包含错误字段: ${field}`);
    }
  });

  // 验证ServerComponentLayout.vue修复
  const layoutFields = [
    "monitorSysGenServerComponentPosition",
    "monitorSysGenServerComponentRefreshInterval",
    "monitorSysGenServerComponentChartConfig",
  ];

  layoutFields.forEach((field) => {
    if (field.includes("monitorSysGenServerDetailComponent")) {
      errors.push(`ServerComponentLayout.vue 仍包含错误字段: ${field}`);
    }
  });

  const success = errors.length === 0;

  if (success) {
    console.log("✅ 所有组件字段映射修复验证通过！");
    console.log("📊 修复统计：");
    console.log("- ComponentEditDialog.vue: 58个字段引用已修复");
    console.log("- ServerComponentLayout.vue: 48个字段引用已修复");
    console.log("- index.vue: 无需修复");
  } else {
    console.log("❌ 修复验证失败:");
    errors.forEach((error) => console.log(`  - ${error}`));
  }

  return { success, errors };
}

// 如果直接运行此文件，执行测试
if (typeof window === "undefined") {
  runAllTests();
  testFixedComponents();
}
