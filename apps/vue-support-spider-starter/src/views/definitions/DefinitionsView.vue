<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import {
  deleteDefinition,
  pageDefinitions,
  saveDefinition,
  toggleStatus,
} from "@/api/spider";
import type { SpiderDefinition, SpiderDefinitionSaveRequest } from "@/types/spider";
import type { PageResult } from "@/types/spider";

/**
 * 鍒楄〃鐘舵€併€? */
const list = ref<SpiderDefinition[]>([]);
const total = ref(0);
const loading = ref(false);

const query = reactive({
  pageNo: 1,
  pageSize: 20,
  keyword: "",
});

/**
 * 鍔犺浇鍒楄〃銆? */
async function load() {
  loading.value = true;
  try {
    const page = await pageDefinitions(
      query.pageNo,
      query.pageSize,
      query.keyword || undefined
    );
    list.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

const isEmpty = computed(() => !loading.value && list.value.length === 0);

/**
 * 琛ㄥ崟瀵硅瘽妗嗐€? */
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const formRef = ref();
const submitting = ref(false);

const initialForm = (): SpiderDefinitionSaveRequest => ({
  spiderCode: "",
  spiderName: "",
  spiderEntryUrl: "",
  spiderMaxDepth: 1,
  spiderMaxPages: 10,
  spiderStatus: 1,
  spiderDescription: "",
});

const form = reactive<SpiderDefinitionSaveRequest>(initialForm());

const rules = {
  spiderCode: [
    { required: true, message: "璇疯緭鍏ョ埇铏紪鐮?, trigger: "blur" },
    {
      pattern: /^[A-Za-z0-9_-]+$/,
      message: "浠呮敮鎸佸瓧姣嶃€佹暟瀛椼€佷笅鍒掔嚎銆佹í绾?,
      trigger: "blur",
    },
  ],
  spiderName: [{ required: true, message: "璇疯緭鍏ュ悕绉?, trigger: "blur" }],
  spiderEntryUrl: [
    { required: true, message: "璇疯緭鍏ュ叆鍙?URL", trigger: "blur" },
    { type: "url", message: "URL 鏍煎紡涓嶆纭?, trigger: "blur" },
  ],
  spiderMaxDepth: [
    { required: true, message: "璇疯緭鍏ユ渶澶ф繁搴?, trigger: "blur" },
  ],
  spiderMaxPages: [
    { required: true, message: "璇疯緭鍏ユ渶澶ч〉鏁?, trigger: "blur" },
  ],
};

/**
 * 鎵撳紑鏂板瀵硅瘽妗嗐€? */
function openCreate() {
  dialogMode.value = "create";
  Object.assign(form, initialForm());
  dialogVisible.value = true;
}

/**
 * 鎵撳紑缂栬緫瀵硅瘽妗嗐€? */
function openEdit(row: SpiderDefinition) {
  dialogMode.value = "edit";
  Object.assign(form, {
    ...initialForm(),
    ...row,
  });
  dialogVisible.value = true;
}

/**
 * 鎻愪氦淇濆瓨銆? */
async function submit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  submitting.value = true;
  try {
    await saveDefinition({ ...form });
    ElMessage.success(dialogMode.value === "create" ? "鍒涘缓鎴愬姛" : "鏇存柊鎴愬姛");
    dialogVisible.value = false;
    await load();
  } finally {
    submitting.value = false;
  }
}

/**
 * 鍒犻櫎銆? */
async function remove(row: SpiderDefinition) {
  if (!row.spiderCode) return;
  await ElMessageBox.confirm(
    `纭鍒犻櫎銆?{row.spiderName}銆嶏紵璇ユ搷浣滀笉鍙仮澶峘,
    "鍒犻櫎纭",
    { type: "warning" }
  );
  await deleteDefinition(row.spiderCode);
  ElMessage.success("宸插垹闄?);
  await load();
}

/**
 * 鍒囨崲鍚仠銆? */
async function toggle(row: SpiderDefinition) {
  if (!row.spiderCode) return;
  const target: 0 | 1 = row.spiderStatus === 1 ? 0 : 1;
  await toggleStatus(row.spiderCode, target);
  ElMessage.success(target === 1 ? "宸插惎鐢? : "宸茬鐢?);
  await load();
}

onMounted(load);
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="query.keyword"
          placeholder="鎸夌紪鐮?/ 鍚嶇О鎼滅储"
          clearable
          style="width: 240px"
          @keyup.enter="() => { query.pageNo = 1; load() }"
          @clear="() => { query.pageNo = 1; load() }"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button @click="() => { query.pageNo = 1; load() }">鎼滅储</el-button>
      </div>
      <div style="display: flex; gap: 8px">
        <el-button :icon="Refresh" @click="load">鍒锋柊</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">
          鏂板鐖櫕瀹氫箟
        </el-button>
      </div>
    </div>

    <div class="card-elplus" style="padding: 0">
      <el-table
        v-loading="loading"
        :data="list"
        :empty-text="isEmpty ? '鏆傛棤鏁版嵁锛岀偣鍑诲彸涓婅鈥滄柊澧炵埇铏畾涔夆€濆垱寤? : ''"
        style="width: 100%"
        row-key="spiderId"
      >
        <el-table-column prop="spiderCode" label="缂栫爜" min-width="140" />
        <el-table-column prop="spiderName" label="鍚嶇О" min-width="180" />
        <el-table-column prop="spiderEntryUrl" label="鍏ュ彛 URL" min-width="240" show-overflow-tooltip />
        <el-table-column prop="spiderMaxDepth" label="鏈€澶ф繁搴? width="100" align="center" />
        <el-table-column prop="spiderMaxPages" label="鏈€澶ч〉鏁? width="100" align="center" />
        <el-table-column label="鐘舵€? width="100" align="center">
          <template #default="{ row }">
            <span
              class="status-tag"
              :class="row.spiderStatus === 1 ? 'is-success' : 'is-idle'"
            >
              {{ row.spiderStatus === 1 ? "鍚敤" : "绂佺敤" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="鏇存柊鏃堕棿" width="170" />
        <el-table-column label="鎿嶄綔" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link @click="openEdit(row)">缂栬緫</el-button>
            <el-button size="small" link @click="toggle(row)">
              {{ row.spiderStatus === 1 ? "绂佺敤" : "鍚敤" }}
            </el-button>
            <el-button size="small" link type="danger" @click="remove(row)">
              鍒犻櫎
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="display: flex; justify-content: flex-end; padding: 12px 16px">
        <el-pagination
          v-model:current-page="query.pageNo"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="load"
          @size-change="() => { query.pageNo = 1; load() }"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '鏂板鐖櫕瀹氫箟' : '缂栬緫鐖櫕瀹氫箟'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="96px"
        label-position="right"
      >
        <el-form-item label="鐖櫕缂栫爜" prop="spiderCode">
          <el-input
            v-model="form.spiderCode"
            placeholder="渚嬪锛歊EAL-GITEE"
            :disabled="dialogMode === 'edit'"
          />
        </el-form-item>
        <el-form-item label="鍚嶇О" prop="spiderName">
          <el-input v-model="form.spiderName" placeholder="渚嬪锛氱湡瀹為噰闆?Gitee" />
        </el-form-item>
        <el-form-item label="鍏ュ彛 URL" prop="spiderEntryUrl">
          <el-input
            v-model="form.spiderEntryUrl"
            placeholder="https://example.com"
          />
        </el-form-item>
        <el-form-item label="鏈€澶ф繁搴? prop="spiderMaxDepth">
          <el-input-number v-model="form.spiderMaxDepth" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="鏈€澶ч〉鏁? prop="spiderMaxPages">
          <el-input-number v-model="form.spiderMaxPages" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="鐘舵€?>
          <el-radio-group v-model="form.spiderStatus">
            <el-radio :value="1">鍚敤</el-radio>
            <el-radio :value="0">绂佺敤</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="鎻忚堪">
          <el-input
            v-model="form.spiderDescription"
            type="textarea"
            :rows="3"
            placeholder="鍙€?
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">鍙栨秷</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">
          淇濆瓨
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
