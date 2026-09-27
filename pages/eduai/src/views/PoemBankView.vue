<template>
  <div class="pb-page">
    <header class="pb-header">
      <div>
        <h1 class="pb-header__title">古诗库</h1>
        <p class="pb-header__sub">维护古诗内容与适用学段年级，供「古诗补全」趣味游戏取材</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增古诗</el-button>
    </header>

    <div class="pb-stats">
      <div class="pb-stat">
        <div class="pb-stat__label">古诗总数</div>
        <div class="pb-stat__value">{{ total }}</div>
        <div class="pb-stat__hint">按筛选条件统计</div>
      </div>
      <div class="pb-stat">
        <div class="pb-stat__label">可游戏篇目</div>
        <div class="pb-stat__value">{{ playableCount }}</div>
        <div class="pb-stat__hint">正文含两句及以上</div>
      </div>
      <div class="pb-stat">
        <div class="pb-stat__label">收录作者</div>
        <div class="pb-stat__value">{{ authorCount }}</div>
        <div class="pb-stat__hint">去重后数量</div>
      </div>
    </div>

    <section class="pb-card">
      <div class="pb-filter">
        <el-select v-model="search.gradeLevel" clearable placeholder="全部学段" style="width: 160px">
          <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
        </el-select>
        <el-input v-model="search.keyword" clearable placeholder="标题 / 作者 关键字" style="width: 220px" />
        <el-button type="primary" :icon="Search" @click="load">搜索</el-button>
        <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" border stripe style="width: 100%">
        <el-table-column prop="poemId" label="ID" width="70" align="center" />
        <el-table-column prop="poemTitle" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="poemAuthor" label="作者" width="110" />
        <el-table-column prop="poemDynasty" label="朝代" width="90" align="center" />
        <el-table-column label="正文" min-width="320">
          <template #default="{ row }">
            <span class="pb-content">{{ preview(row.poemContent) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="难度" width="80" align="center">
          <template #default="{ row }">{{ difficultyLabel(row.poemDifficulty) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无古诗数据：可在「采集管理」启用古诗采集，或点右上角手工新增" />
        </template>
      </el-table>

      <div class="pb-pager">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="form.poemId ? '编辑古诗' : '新增古诗'"
      width="880px"
      top="6vh"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标题" required>
              <el-input v-model="form.poemTitle" placeholder="如：静夜思" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="作者">
              <el-input v-model="form.poemAuthor" placeholder="如：李白" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="朝代">
              <el-input v-model="form.poemDynasty" placeholder="如：唐代" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="正文" required>
          <el-input
            v-model="form.poemContent"
            type="textarea"
            :rows="5"
            placeholder="整首正文，句间可用换行或标点分隔，如：床前明月光，疑是地上霜。举头望明月，低头思故乡。"
          />
        </el-form-item>
        <el-form-item label="译文">
          <el-input v-model="form.poemTranslation" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="赏析">
          <el-input v-model="form.poemAppreciation" type="textarea" :rows="3" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标签">
              <el-input v-model="form.poemTags" placeholder="逗号分隔，如：思乡,写景" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度">
              <el-select v-model="form.poemDifficulty" style="width: 100%">
                <el-option :value="1" label="简单" />
                <el-option :value="2" label="中等" />
                <el-option :value="3" label="较难" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="适用学段">
          <el-select v-model="formLevels" multiple placeholder="选择适用学段" style="width: 100%">
            <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用年级">
          <el-select v-model="formGrades" multiple placeholder="不选表示该学段通用" style="width: 100%">
            <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 古诗库管理
 *
 * - 页头 + 三张统计卡 + 筛选 + 表格 + 新增/编辑弹窗
 * - 保存时同步 edu_poem_grade 学段/年级映射（供游戏按学段取数）
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type { Poem } from "../api/types";

/** 学段与对应年级（与后端入库值保持一致） */
const GRADE_LEVELS = ["小学", "初中", "高中", "大学"] as const;
const GRADES_BY_LEVEL: Record<string, string[]> = {
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["初一", "初二", "初三"],
  高中: ["高一", "高二", "高三"],
  大学: ["大一", "大二", "大三", "大四"],
};

const loading = ref(false);
const saving = ref(false);
const rows = ref<Poem[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const search = reactive({ gradeLevel: "", keyword: "" });

const dialogVisible = ref(false);
const formLevels = ref<string[]>([]);
const formGrades = ref<string[]>([]);
const form = reactive<Partial<Poem>>(emptyForm());

const authorCount = computed(() => new Set(rows.value.map((r) => r.poemAuthor).filter(Boolean)).size);
const playableCount = computed(() => rows.value.filter((r) => splitCount(r.poemContent) >= 2).length);
const gradeOptions = computed(() => {
  const set = new Set<string>();
  (formLevels.value.length ? formLevels.value : GRADE_LEVELS).forEach((lv) =>
    (GRADES_BY_LEVEL[lv] ?? []).forEach((g) => set.add(g))
  );
  return [...set];
});

function emptyForm(): Partial<Poem> {
  return {
    poemTitle: "",
    poemAuthor: "",
    poemDynasty: "",
    poemContent: "",
    poemTranslation: "",
    poemAppreciation: "",
    poemTags: "",
    poemDifficulty: 1,
  };
}

/** 正文句数（按句末标点粗略统计） */
function splitCount(content?: string) {
  if (!content) {
    return 0;
  }
  return content.split(/[。！？!?；;]/).map((s) => s.trim()).filter(Boolean).length;
}

function preview(content?: string) {
  if (!content) {
    return "";
  }
  const text = content.replace(/[\[\]"]/g, "").replace(/,/g, " ");
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

function difficultyLabel(v?: number) {
  return { 1: "简单", 2: "中等", 3: "较难" }[v ?? 1] ?? "简单";
}

async function load() {
  loading.value = true;
  try {
    // 取较大数量后在本地做分页与关键字过滤，避免后端额外加接口
    const list = (await eduaiApi.listPoems({ gradeLevel: search.gradeLevel || undefined, count: 5000 })) ?? [];
    const kw = search.keyword.trim();
    const filtered = kw
      ? list.filter((p) => (p.poemTitle ?? "").includes(kw) || (p.poemAuthor ?? "").includes(kw))
      : list;
    total.value = filtered.length;
    const start = (pageNo.value - 1) * pageSize.value;
    rows.value = filtered.slice(start, start + pageSize.value);
  } catch {
    rows.value = [];
    total.value = 0;
    ElMessage.error("加载古诗失败");
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  search.gradeLevel = "";
  search.keyword = "";
  pageNo.value = 1;
  void load();
}

function openCreate() {
  Object.assign(form, emptyForm());
  form.poemId = undefined;
  formLevels.value = [];
  formGrades.value = [];
  dialogVisible.value = true;
}

async function openEdit(row: Poem) {
  try {
    const detail = await eduaiApi.getPoemDetail(row.poemId);
    Object.assign(form, detail ?? row);
    formLevels.value = detail?.gradeLevels ?? [];
    formGrades.value = detail?.grades ?? [];
  } catch {
    Object.assign(form, row);
    formLevels.value = [];
    formGrades.value = [];
  }
  dialogVisible.value = true;
}

async function save() {
  if (!form.poemTitle?.trim()) {
    ElMessage.warning("请填写标题");
    return;
  }
  if (!form.poemContent?.trim()) {
    ElMessage.warning("请填写正文");
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.savePoem({
      ...form,
      gradeLevels: formLevels.value,
      grades: formGrades.value,
    });
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    await load();
  } catch {
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
}

async function remove(row: Poem) {
  try {
    await ElMessageBox.confirm(`确认删除《${row.poemTitle}》？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await eduaiApi.deletePoem(row.poemId);
    ElMessage.success("已删除");
    await load();
  } catch {
    ElMessage.error("删除失败");
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.pb-page {
  padding: 20px;
}
.pb-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.pb-header__title {
  margin: 0;
  font-size: 26px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.pb-header__sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pb-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.pb-stat {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: var(--el-box-shadow-lighter);
}
.pb-stat__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pb-stat__value {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 900;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}
.pb-stat__hint {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.pb-card {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: var(--el-box-shadow-lighter);
}
.pb-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.pb-content {
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.pb-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
