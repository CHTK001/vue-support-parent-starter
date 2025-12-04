<template>
  <div class="sm-viewer">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <el-input v-model="classPattern" placeholder="类名/通配（如 com.example.UserService 或 com.example.*Service）" style="min-width: 280px" clearable />
        <el-input v-model="methodPattern" placeholder="方法名/通配（可选，默认 *）" style="width: 200px" clearable />
        <el-checkbox v-model="useRegex">正则(-E)</el-checkbox>
        <el-checkbox v-model="declaredOnly">仅声明方法(-d)</el-checkbox>
        <el-input-number v-model="collectMillis" :min="2000" :max="60000" :step="1000" controls-position="right" style="width: 160px" />
        <span class="label">超时(ms)</span>
        <el-button type="primary" :disabled="!nodeId || !classPatternTrim" :loading="loading" @click="run"> 执行 </el-button>
        <el-button @click="clearData">清空</el-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon class="mb-4" />

    <!-- 结果表格 -->
    <el-table v-if="rows.length > 0" :data="rows" stripe>
      <el-table-column prop="className" label="类名" min-width="260" show-overflow-tooltip />
      <el-table-column prop="methodName" label="方法" width="180" />
      <el-table-column prop="returnType" label="返回类型" width="180" show-overflow-tooltip />
      <el-table-column prop="modifiers" label="修饰符" width="140" />
      <el-table-column prop="parameters" label="参数" min-width="220" show-overflow-tooltip />
      <el-table-column prop="declared" label="声明" width="90">
        <template #default="{ row }">
          <el-tag :type="row.declared ? 'success' : 'info'" size="small">{{ row.declared ? "是" : "否" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="classLoader" label="类加载器" min-width="220" show-overflow-tooltip />
    </el-table>

    <!-- 空状态 -->
    <div v-if="!loading && !error && rows.length === 0" class="empty-state">
      <el-empty description="暂无方法信息，请配置类/方法并点击执行" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { execArthasCommand } from "@/api/arthas/arthas-http";
import { ref, computed } from "vue";

const props = defineProps<{ nodeId: string }>();

// 表单
const classPattern = ref("");
const classPatternTrim = computed(() => (classPattern.value || "").trim());
const methodPattern = ref("*");
const declaredOnly = ref(true);
const useRegex = ref(false);
const collectMillis = ref(5000);

// 状态
const loading = ref(false);
const error = ref("");

// 结果
interface SmRow {
  className: string;
  methodName: string;
  returnType: string;
  parameters: string;
  modifiers: string;
  declared: boolean;
  classLoader?: string;
}
const rows = ref<SmRow[]>([]);

function clearData() {
  rows.value = [];
  error.value = "";
}

function buildCmd(): string {
  const parts: string[] = ["sm"];
  if (declaredOnly.value) parts.push("-d");
  if (useRegex.value) parts.push("-E");
  parts.push(classPatternTrim.value);
  const m = (methodPattern.value || "").trim();
  if (m && m !== "*") parts.push(m);
  return parts.join(" ");
}

function parseSm(output: any): SmRow[] {
  try {
    if (!output?.body?.results) return [];
    const results = output.body.results;
    // Arthas 的 sm 通常返回一个或多个条目，type 可能标识为 "sm" 或包含方法信息
    const smResults = results.filter((r: any) => (r.type || "").toLowerCase().includes("sm") || r.methodInfo || r.method || r.modifier);
    const parsed: SmRow[] = [];

    for (const r of smResults) {
      // 统一提取字段
      const klass = r.className || r.declaringClass || r.class || "";
      const methodName = r.methodName || r.name || r.method || "";
      const returnType = r.returnType || r.return || r.ret || "";
      const paramsArr: any[] = r.parameterTypes || r.parameters || r.args || [];
      const parameters = Array.isArray(paramsArr) ? paramsArr.join(", ") : typeof paramsArr === "string" ? paramsArr : "";
      const modifiers = r.modifiers || r.modifier || r.access || "";
      const declared = !!(r.declared || r.isDeclared || declaredOnly.value);
      const classLoader = r.classLoader || r.classLoaderHash || r.loader || undefined;

      if (klass && methodName) {
        parsed.push({
          className: klass,
          methodName,
          returnType,
          parameters,
          modifiers,
          declared,
          classLoader,
        });
      }

      // 有些实现把 methods 放在数组里
      if (Array.isArray(r.methods)) {
        for (const m of r.methods) {
          const p = Array.isArray(m.parameterTypes) ? m.parameterTypes.join(", ") : m.parameters || "";
          parsed.push({
            className: m.className || klass,
            methodName: m.methodName || m.name || methodName,
            returnType: m.returnType || returnType,
            parameters: p,
            modifiers: m.modifiers || modifiers,
            declared: !!(m.declared ?? declared),
            classLoader,
          });
        }
      }
    }
    return parsed;
  } catch (e) {
    console.error("解析 sm 数据失败", e);
    return [];
  }
}

async function run() {
  if (!props.nodeId || !classPatternTrim.value) return;
  loading.value = true;
  error.value = "";
  try {
    const cmd = buildCmd();
    const res = await execArthasCommand(props.nodeId, cmd, collectMillis.value);
    if (res?.success) {
      const parsed = parseSm(res.data?.output);
      rows.value = parsed;
      if (parsed.length === 0) error.value = "未获取到方法数据，请检查类/方法是否匹配";
    } else {
      error.value = res?.msg || "执行失败";
    }
  } catch (e: any) {
    error.value = e?.message || "执行异常";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.sm-viewer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}
.control-panel {
  background: var(--el-bg-color-overlay);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}
.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.label {
  color: var(--el-text-color-primary);
  font-size: 12px;
}
.mb-4 {
  margin-bottom: 16px;
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
