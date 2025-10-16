<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex gap-3 items-center">
        <el-input v-model="keyword" placeholder="搜索软件名称/代码" clearable style="width:280px" @change="reload" />
        <el-select v-model="category" placeholder="分类" clearable style="width:160px" @change="reload">
          <el-option label="全部" :value="undefined" />
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
      </div>
      <div class="flex gap-2">
        <el-button v-role="'admin'" type="primary" @click="openEdit()">
          <IconifyIconOnline icon="mdi:plus" /> 新增软件
        </el-button>
        <el-button @click="reload">
          <IconifyIconOnline icon="mdi:refresh" /> 刷新
        </el-button>
      </div>
    </div>

    <el-row :gutter="12">
      <el-col v-for="item in list" :key="item.systemSoftId" :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
        <ScCard class="mb-3">
          <template #title>
            <div class="flex items-center justify-between">
              <span class="font-semibold">{{ item.systemSoftName }}</span>
              <el-tag type="success" v-if="item.systemSoftStatus===1">启用</el-tag>
              <el-tag v-else type="info">禁用</el-tag>
            </div>
          </template>
          <div class="text-sm text-gray-500 mb-2">代码：{{ item.systemSoftCode }}</div>
          <div class="text-sm text-gray-500 mb-2 truncate-2">{{ item.systemSoftDescription || '—' }}</div>
          <div class="flex gap-2 mt-2">
            <el-button size="small" type="primary" @click="openInstall(item)">
              <IconifyIconOnline icon="mdi:download" /> 安装
            </el-button>
            <el-button v-role="'admin'" size="small" @click="openEdit(item)">
              <IconifyIconOnline icon="mdi:pencil" /> 编辑
            </el-button>
            <el-button v-role="'admin'" size="small" type="danger" @click="onDelete(item)">
              <IconifyIconOnline icon="mdi:delete-outline" /> 删除
            </el-button>
          </div>
        </ScCard>
      </el-col>
    </el-row>

    <div class="text-center mt-2">
      <el-pagination
        background
        layout="prev, pager, next"
        :page-size="size"
        :total="total"
        @current-change="(p:number)=>{page=p;reload()}"
      />
    </div>

    <!-- 新增/编辑软件 -->
    <ScDialog v-model:visible="editVisible" title="软件信息" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="名称" prop="systemSoftName">
          <el-input v-model="form.systemSoftName" />
        </el-form-item>
        <el-form-item label="代码" prop="systemSoftCode">
          <el-input v-model="form.systemSoftCode" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.systemSoftCategory" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.systemSoftDescription" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.systemSoftStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible=false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </template>
    </ScDialog>

    <!-- 安装到服务器 -->
    <ScDialog v-model:visible="installVisible" title="选择服务器安装" width="720px">
      <div class="mb-3">
        <el-select v-model="installTag" placeholder="镜像标签" clearable filterable style="width:220px">
          <el-option v-for="t in tags" :key="t" :label="t" :value="t" />
        </el-select>
      </div>
      <ScTable
        ref="serverTableRef"
        :url="'/system/server/page'"
        :query="{page:1,size:10}"
        :columns="serverColumns"
        row-key="systemServerId"
        selectable
      />
      <template #footer>
        <el-button @click="installVisible=false">取消</el-button>
        <el-button type="primary" @click="doInstall">开始安装</el-button>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

const page = ref(1);
const size = ref(12);
const total = ref(0);
const list = ref<any[]>([]);
const keyword = ref<string>("");
const category = ref<string | undefined>();
const categories = ref<string[]>([]);

const editVisible = ref(false);
const formRef = ref();
const form = reactive<any>({ systemSoftId: undefined, systemSoftName: "", systemSoftCode: "", systemSoftStatus: 1, systemSoftCategory: "", systemSoftDescription: "" });
const rules = {
  systemSoftName: [{ required: true, message: "必填", trigger: "blur" }],
  systemSoftCode: [{ required: true, message: "必填", trigger: "blur" }]
};

async function loadSofts() {
  const qs = new URLSearchParams({ page: String(page.value), size: String(size.value) });
  if (keyword.value) qs.set("softName", keyword.value);
  if (category.value) qs.set("category", category.value);
  const resp = await fetch(`/api/monitor/system-soft/page?${qs.toString()}`);
  const data = await resp.json();
  if (data?.ok || data?.code === 0) {
    list.value = data.data?.records || [];
    total.value = data.data?.total || 0;
  }
}
function reload() { loadSofts(); }

function openEdit(row?: any) {
  if (row) Object.assign(form, row);
  else Object.assign(form, { systemSoftId: undefined, systemSoftStatus: 1 });
  editVisible.value = true;
}

async function onSubmit() {
  await formRef.value?.validate();
  const method = form.systemSoftId ? "PUT" : "POST";
  const url = "/api/monitor/system-soft";
  const resp = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
  const data = await resp.json();
  if (data?.ok || data?.code === 0) {
    ElMessage.success("保存成功");
    editVisible.value = false;
    reload();
  } else {
    ElMessage.error(data?.msg || "保存失败");
  }
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除软件【${row.systemSoftName}】?`, "提示", { type: "warning" });
  const resp = await fetch(`/api/monitor/system-soft/${row.systemSoftId}`, { method: "DELETE" });
  const data = await resp.json();
  if (data?.ok || data?.code === 0) {
    ElMessage.success("删除成功");
    reload();
  } else {
    ElMessage.error(data?.msg || "删除失败");
  }
}

// 安装到服务器
const installVisible = ref(false);
const currentSoft = ref<any>();
const serverTableRef = ref();
const installTag = ref<string>("latest");
const tags = ref<string[]>(["latest"]);
const serverColumns = [
  { type: "selection", width: 40 },
  { label: "名称", prop: "systemServerName", minWidth: 160 },
  { label: "类型", prop: "systemServerType", width: 120 },
  { label: "状态", prop: "systemServerStatus", width: 100 }
];

async function openInstall(soft: any) {
  currentSoft.value = soft;
  installVisible.value = true;
  // 获取 tags
  const resp = await fetch(`/api/monitor/system-soft/${soft.systemSoftId}/tags`);
  const data = await resp.json();
  tags.value = (data?.data || ["latest"]) as string[];
}

async function doInstall() {
  const selection = serverTableRef.value?.getSelection?.() || [];
  const serverIds = selection.map((s: any) => s.systemServerId);
  if (!serverIds.length) return ElMessage.warning("请选择服务器");
  const resp = await fetch(`/api/monitor/system-soft/install`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ softId: String(currentSoft.value.systemSoftId), imageTag: installTag.value || "latest", serverIds: serverIds.join(",") })
  });
  const data = await resp.json();
  if (data?.ok || data?.code === 0) {
    ElMessage.success("已开始安装，稍后在镜像/容器管理查看进度");
    installVisible.value = false;
  } else {
    ElMessage.error(data?.msg || "安装启动失败");
  }
}

onMounted(() => loadSofts());
</script>

<style scoped>
.truncate-2{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden}
</style>
