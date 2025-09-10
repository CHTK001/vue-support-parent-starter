<template>
  <el-dialog v-model="visible" title="Arthas 配置" width="620px" @open="onOpen">
    <el-form :model="form" label-width="150px">
      <el-form-item label="Tunnel 地址">
        <el-input v-model="form.address" placeholder="ws://host:port/ws" />
      </el-form-item>
      <el-form-item label="HTTP API 地址">
        <el-input v-model="form.http" placeholder="http://host:port/api" />
      </el-form-item>
      <el-form-item label="HTTP超时时间(ms)">
        <el-input-number v-model="httpTimeout" :min="1000" :step="1000" :max="120000" />
      </el-form-item>
      <el-form-item label="用户名">
        <el-input v-model="form.username" placeholder="可选" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="form.password" type="password" show-password placeholder="可选" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { getTunnelConfig, setTunnelConfig, type ArthasTunnelConfigDto } from "@/api/arthas-management";

const props = defineProps<{
  modelValue: boolean;
  serverId: string | number | undefined;
}>();
const emit = defineEmits(["update:modelValue", "saved"]);

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const loading = ref(false);
const form = ref<ArthasTunnelConfigDto>({
  address: "ws://127.0.0.1:7777/ws",
  http: "http://127.0.0.1:8563/api",
  username: "",
  password: "",
});

// HTTP 超时（仅前端使用，不提交到后端）
const HTTP_TIMEOUT_KEY = "arthas.http.timeout";
const httpTimeout = ref<number>(Number(localStorage.getItem(HTTP_TIMEOUT_KEY) || 15000));

function close() {
  visible.value = false;
}

async function onOpen() {
  if (!props.serverId) return;
  try {
    loading.value = true;
    const res: any = await getTunnelConfig(props.serverId as any);
    if (res?.success) {
      form.value.address = res.data?.arthasTunnelConfigAddress || "ws://127.0.0.1:7777/ws";
      form.value.username = res.data?.arthasTunnelConfigUsername || "";
      form.value.http = res.data?.arthasTunnelConfigHttp || "http://127.0.0.1:8563/api";
      form.value.password = res.data?.arthasTunnelConfigPassword || "";
      // 读取本地已保存的超时，若无则保持默认
      const t = Number(localStorage.getItem(HTTP_TIMEOUT_KEY) || httpTimeout.value || 15000);
      httpTimeout.value = isNaN(t) ? 15000 : t;
    } else {
      ElMessage.error(res?.msg || "获取配置失败");
    }
  } catch (e: any) {
    ElMessage.error(e?.message || "获取配置异常");
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!props.serverId) return;
  try {
    loading.value = true;
    // 保存后端可识别的字段
    const ok: any = await setTunnelConfig(props.serverId as any, form.value);
    // 同步保存前端HTTP超时到本地
    localStorage.setItem(HTTP_TIMEOUT_KEY, String(httpTimeout.value || 15000));
    if (ok?.success) {
      ElMessage.success("保存成功");
      emit("saved");
      close();
    } else {
      ElMessage.error(ok?.msg || "保存失败");
    }
  } catch (e: any) {
    ElMessage.error(e?.message || "保存异常");
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.serverId,
  (n, o) => {
    // 切换服务器时清空或重新加载
    form.value = { address: "", username: "", password: "" };
  }
);
</script>
