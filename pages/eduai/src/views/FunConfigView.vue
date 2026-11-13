<template>
  <div class="pm">
    <!-- 页头：标题 + 保存 -->
    <header class="pm-hd">
      <div class="pm-hd__text">
        <h1 class="pm-hd__title">门户菜单</h1>
        <p class="pm-hd__sub">配置学生端与教师端的入口、顺序和启停；保存后立即生效，不用改代码。</p>
      </div>
      <div class="pm-hd__act">
        <span class="pm-saved" :class="{ 'is-dirty': dirty }">
          {{ dirty ? "有未保存的修改" : "已保存" }}
        </span>
        <el-button :icon="RefreshLeft" :loading="loading" @click="reload()">刷新</el-button>
        <el-button type="primary" :loading="saving" :disabled="!dirty" @click="saveAll">保存</el-button>
      </div>
    </header>

    <!-- 作用域：小学 / 初中 / 高中 / 教师端 -->
    <nav class="pm-scopes" aria-label="配置范围">
      <button
        v-for="s in SCOPES"
        :key="s.key"
        type="button"
        class="pm-scope"
        :class="{ 'is-on': scope === s.key }"
        @click="switchScope(s.key)"
      >
        {{ s.label }}
        <span class="pm-scope__n">{{ countOf(s.key) }}</span>
      </button>
    </nav>

    <div class="pm-body">
      <!-- 左：所见即所配 -->
      <section class="pm-stage">
        <div class="pm-stage__hd">
          <div class="pm-stage__title">
            <b>{{ scopeTitle }}</b>
            <span class="pm-stage__sum">
              启用 {{ summary.enabled }} · 停用 {{ summary.disabled }} · 自定义 {{ summary.custom }}
            </span>
          </div>
          <div class="pm-stage__act">
            <el-input
              v-model="keyword"
              clearable
              placeholder="搜索名称 / 编码"
              :prefix-icon="Search"
              class="pm-search"
            />
            <el-button link type="primary" @click="previewVisible = true">预览</el-button>
            <el-button v-if="!isGeneric" link type="primary" @click="restoreDefaults">恢复默认</el-button>
            <el-button v-if="!isTeacher && !isGeneric" link type="primary" @click="openCopy">
              从其他学段复制
            </el-button>
          </div>
        </div>

        <div v-if="loading" class="pm-empty">加载中…</div>

        <div v-else-if="!scopeRows.length" class="pm-empty">
          <p class="pm-empty__t">
            {{ isTeacher ? "教师端还没有菜单配置" : isGeneric ? "还没有通用模块" : "该学段还没有菜单项" }}
          </p>
          <p class="pm-empty__s">
            {{
              isTeacher
                ? "生成默认的三项后，再按需启停或调整顺序。"
                : isGeneric
                  ? "通用模块只给管理端读取，不在学生端/教师端出现。"
                  : "可以从内置模块目录一次性导入，也可以从其他学段复制。"
            }}
          </p>
          <el-button v-if="isGeneric" type="primary" @click="addItem">添加通用模块</el-button>
          <el-button v-else type="primary" :loading="seeding" @click="seedDefaults">
            {{ isTeacher ? "生成教师端默认菜单" : "导入内置模块" }}
          </el-button>
        </div>

        <template v-else>
          <!-- 学生端 / 通用：卡片预览 -->
          <div v-if="!isTeacher" class="pv">
            <div class="pv-head" :class="{ 'pv-head--plain': isGeneric }">
              <b>{{ isGeneric ? "通用模块" : "趣味学习" }}</b>
              <i>{{ isGeneric ? "仅管理端读取，不出现在学生端 / 教师端" : `${stageLabel(scope)} · 你好，同学` }}</i>
            </div>
            <div class="pv-grid">
              <button
                v-for="(item, idx) in filteredShown"
                :key="item.key"
                type="button"
                class="pvc"
                :class="{ 'is-sel': isSelected(item), 'is-dirty': item.dirty || item.isNew }"
                :draggable="!keyword"
                @dragstart="onDragStart(idx)"
                @dragover.prevent
                @drop.prevent="onDrop(idx)"
                @click="select(item)"
              >
                <span v-if="item.dirty || item.isNew" class="pvc-dot" title="未保存"></span>
                <span class="pvc-ic" :style="iconStyle(item)">{{ item.moduleIcon || "✨" }}</span>
                <span class="pvc-tx">
                  <b>{{ item.moduleName }}</b>
                  <i>{{ item.funConfigSubtitle || "—" }}</i>
                </span>
                <span class="pvc-grip" aria-hidden="true">⠿</span>
              </button>
              <button v-if="!keyword" type="button" class="pvc pvc--add" @click="addItem">＋ 添加菜单项</button>
            </div>
            <p v-if="keyword && !filteredShown.length" class="pm-filter-empty">
              没有匹配「{{ keyword }}」的启用入口
            </p>
            <p class="pv-tip">
              {{
                keyword
                  ? "搜索时不能拖动排序；清空搜索后用拖动或右侧「上移/下移」调整。"
                  : isGeneric
                    ? "通用模块按编码供管理端读取，不参与门户渲染。"
                    : "这里只预览入口；卡片上的学习统计取学生实时数据。"
              }}
            </p>
          </div>

          <!-- 教师端：页签预览 -->
          <div v-else class="pv">
            <div class="pv-head"><b>教师工作台</b><i>老师端顶部页签</i></div>
            <div class="pv-tabs">
              <button
                v-for="(item, idx) in filteredShown"
                :key="item.key"
                type="button"
                class="pv-tab"
                :class="{ 'is-on': isSelected(item) }"
                :draggable="!keyword"
                @dragstart="onDragStart(idx)"
                @dragover.prevent
                @drop.prevent="onDrop(idx)"
                @click="select(item)"
              >
                <span class="pv-tab__g" aria-hidden="true">⠿</span>{{ item.moduleName }}
                <span v-if="item.dirty || item.isNew" class="pv-tab__dot" title="未保存"></span>
              </button>
            </div>
            <div class="pv-tpbody">
              <b>{{ selected?.moduleName || "—" }}</b>
              <p>{{ selected?.moduleDesc || "选中一个页签查看说明" }}</p>
            </div>
            <p v-if="keyword && !filteredShown.length" class="pm-filter-empty">
              没有匹配「{{ keyword }}」的启用页签
            </p>
            <p class="pv-tip">教师端页签由系统内置，只支持启停与排序；停用后对应能力从门户隐藏。</p>
          </div>
        </template>

        <!-- 已停用 -->
        <div class="pm-hidden">
          <div class="pm-hidden__hd">
            已停用 <b>{{ filteredHidden.length }}</b> · 点击启用
          </div>
          <div v-if="!filteredHidden.length" class="pm-hidden__none">
            {{ keyword ? "没有匹配的已停用入口" : "全部入口都在启用中" }}
          </div>
          <button
            v-for="item in filteredHidden"
            :key="item.key"
            type="button"
            class="pm-chip"
            @click="enable(item)"
          >
            <span class="pm-chip__ic">{{ item.moduleIcon || "✨" }}</span>
            {{ item.moduleName }}
            <span class="pm-chip__add">＋</span>
          </button>
        </div>
      </section>

      <!-- 右：当前项的设置 -->
      <aside class="pm-insp">
        <template v-if="selected">
          <div class="pm-insp__hd">
            <b>{{ isTeacher ? "页签设置" : isGeneric ? "模块设置" : "卡片设置" }}</b>
            <el-tag :type="selected.enabled === 1 ? 'success' : 'info'" size="small">
              {{ selected.enabled === 1 ? "启用中" : "已停用" }}
            </el-tag>
          </div>

          <div class="pm-f pm-f--switch">
            <div>
              <label class="pm-f__label">启用</label>
              <p class="pm-f__hint">
                {{
                  isFixedCapability(selected.moduleCode)
                    ? "固定能力：始终显示，不可停用"
                    : "停用只隐藏入口，配置与学习数据都保留"
                }}
              </p>
            </div>
            <el-switch
              v-model="selected.enabled"
              :active-value="1"
              :inactive-value="0"
              :disabled="isFixedCapability(selected.moduleCode)"
              @change="markDirty(selected)"
            />
          </div>

          <div class="pm-f">
            <label class="pm-f__label">名称</label>
            <el-input v-model="selected.moduleName" maxlength="20" @input="markDirty(selected)" />
          </div>

          <div class="pm-f">
            <label class="pm-f__label">{{ isTeacher ? "说明" : "副标题" }}</label>
            <el-input
              v-model="selected.funConfigSubtitle"
              maxlength="30"
              :placeholder="isTeacher ? '页签下的一句话说明' : '卡片上的一句话，如 拼成语·练思维'"
              @input="markDirty(selected)"
            />
          </div>

          <div class="pm-f">
            <label class="pm-f__label">图标</label>
            <div class="pm-f__row">
              <span class="pm-emoji" :style="iconStyle(selected)">{{ selected.moduleIcon || "✨" }}</span>
              <el-input
                v-model="selected.moduleIcon"
                maxlength="12"
                placeholder="emoji，如 🀄"
                @input="markDirty(selected)"
              />
            </div>
          </div>

          <div v-if="!isTeacher && !isGeneric" class="pm-f">
            <label class="pm-f__label">配色</label>
            <div class="pm-f__row">
              <el-color-picker v-model="selected.funConfigColor" @change="markDirty(selected)" />
              <span class="pm-arrow">→</span>
              <el-color-picker v-model="selected.funConfigColorTo" @change="markDirty(selected)" />
              <span class="pm-grad" :style="iconStyle(selected)"></span>
            </div>
            <p class="pm-f__hint">图标底色渐变，只影响学生端卡片</p>
          </div>

          <div v-if="!isTeacher && !isGeneric" class="pm-f pm-f--switch">
            <div>
              <label class="pm-f__label">未完成角标</label>
              <p class="pm-f__hint">小学端卡片右上角显示待完成数</p>
            </div>
            <el-switch
              v-model="selected.funConfigShowBadge"
              :active-value="1"
              :inactive-value="0"
              @change="markDirty(selected)"
            />
          </div>

          <details class="pm-adv">
            <summary>高级</summary>
            <div class="pm-f">
              <label class="pm-f__label">路径</label>
              <el-input v-model="selected.modulePath" @input="markDirty(selected)" />
              <p class="pm-f__hint">仅记录用：门户按模块编码渲染，不按路径跳转</p>
            </div>
            <div class="pm-f">
              <label class="pm-f__label">模块编码（稳定键，改后学习进度会对不上）</label>
              <el-input v-model="selected.moduleCode" :disabled="!selected.isNew" @input="markDirty(selected)" />
            </div>
            <div class="pm-f">
              <label class="pm-f__label">描述</label>
              <el-input v-model="selected.moduleDesc" type="textarea" :rows="2" @input="markDirty(selected)" />
            </div>
            <div class="pm-f">
              <label class="pm-f__label">扩展 JSON</label>
              <el-input v-model="selected.configJson" type="textarea" :rows="2" placeholder='{"url":"..."}' @input="markDirty(selected)" />
            </div>
          </details>

          <div class="pm-insp__ft">
            <div class="pm-insp__row">
              <el-button link :disabled="!canMove(selected, -1)" @click="moveItem(selected, -1)">
                ↑ 上移
              </el-button>
              <el-button link :disabled="!canMove(selected, 1)" @click="moveItem(selected, 1)">
                ↓ 下移
              </el-button>
            </div>
            <div class="pm-insp__row">
              <el-button
                v-if="!isFixedCapability(selected.moduleCode) && selected.enabled === 1"
                link
                type="warning"
                @click="disable(selected)"
              >
                停用
              </el-button>
              <el-button
                v-else-if="!isFixedCapability(selected.moduleCode)"
                link
                type="primary"
                @click="enable(selected)"
              >
                启用
              </el-button>
              <el-button v-if="!isTeacher" link @click="duplicateItem(selected)">复制</el-button>
              <el-button v-if="selected.dirty || selected.isNew" link @click="revertItem(selected)">
                撤销修改
              </el-button>
              <el-button
                v-if="!isTeacher && !isBuiltin(selected.moduleCode)"
                link
                type="danger"
                @click="removeItem(selected)"
              >
                删除
              </el-button>
            </div>
          </div>
        </template>
        <div v-else class="pm-insp__empty">左侧选中一个入口后，在这里修改</div>
      </aside>
    </div>

    <!-- 从其他学段复制 -->
    <el-dialog v-model="copyVisible" title="从其他学段复制" width="min(420px, 92vw)" append-to-body>
      <p class="pm-copy__tip">只追加目标学段没有的编码；已存在的会跳过，不会覆盖。</p>
      <el-select v-model="copyFrom" style="width: 100%">
        <el-option v-for="s in copySources" :key="s.key" :label="s.label" :value="s.key" />
      </el-select>
      <p class="pm-copy__count">可追加 {{ copyCandidates.length }} 个入口</p>
      <template #footer>
        <el-button @click="copyVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!copyCandidates.length" @click="applyCopy">追加</el-button>
      </template>
    </el-dialog>

    <!-- 全屏预览（草稿态） -->
    <el-dialog v-model="previewVisible" title="门户预览（草稿）" width="min(900px, 94vw)" top="5vh" append-to-body>
      <PortalMenuPreview
        :mode="previewMode"
        :stage="isTeacher || isGeneric ? '' : stageLabel(scope)"
        :items="previewItems"
      />
      <p class="pm-preview__tip">
        {{ dirty ? "当前是草稿预览，保存后才对学生 / 老师生效。" : "当前配置已保存，与门户实际展示一致。" }}
      </p>
      <template #footer>
        <el-button type="primary" @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 门户菜单配置
 *
 * <p>把原来「一张平表 + 12 字段弹窗」的模块配置，改成按端/学段切开的所见即所配：
 * 左边就是学生端卡片网格（或老师端页签条），右边只放当前选中项常用的几项设置。
 * 学段与教师端复用同一张 edu_fun_config：教师端的 fun_config_grade_level 写 TEACHER。</p>
 *
 * <p>启停用 enabled 表达：停用只是不进 preview，配置与学习进度全部保留，随时能再启用。
 * 排序用 sortOrder，拖动时重排成 10/20/30…，保存时随行一起提交，不需要额外的排序接口。</p>
 */
import { computed, onActivated, onMounted, onUnmounted, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { ElMessageBox } from "element-plus";
import { RefreshLeft, Search } from "@element-plus/icons-vue";
import { message } from "@repo/core";
import { errText } from "../api/errorText";
import { eduaiApi } from "../api/eduaiApi";
import type { FunConfig } from "../api/types";
import { BUILTIN_MODULE_CODES, FIXED_CAPABILITY_CODES, modulesOf, stageLabel, type Stage } from "./portal/modules";
import PortalMenuPreview from "../components/PortalMenuPreview.vue";

/** 配置范围：三个学生学段 + 教师端 + 通用（学段为空的遗留管理端模块） */
const SCOPES = [
  { key: "PRIMARY", label: "小学" },
  { key: "JUNIOR", label: "初中" },
  { key: "SENIOR", label: "高中" },
  { key: "TEACHER", label: "教师端" },
  { key: "GENERIC", label: "通用" },
] as const;

/** 学生端固定能力由 `portal/modules` 统一维护（配置页只负责锁成不可停用） */

/** 教师端页签是系统内置能力，只能启停/排序，不能新增或删除 */
const TEACHER_DEFAULTS = [
  { code: "class", name: "我的班级", desc: "学生 / 班级 / 重置口令", icon: "👥", path: "#class" },
  { code: "paper", name: "组卷", desc: "我的试卷 / AI 组卷 / 布置", icon: "📄", path: "#paper" },
  { code: "mark", name: "阅卷", desc: "上传答卷 / AI 判分 / 复核", icon: "📝", path: "#mark" },
];

/**
 * 页面内的菜单项。
 *
 * <p>不直接用 FunConfig：新建行还没有 configId，而列表要能先渲染未保存的行。
 * dirty/isNew/key 都是本地状态，提交时剥掉。</p>
 */
interface MenuRow {
  /** 本地稳定键：configId 或 new-xxx */
  key: string;
  configId?: number;
  moduleCode: string;
  funConfigGradeLevel: string | null;
  moduleName: string;
  moduleDesc: string;
  funConfigSubtitle: string;
  moduleIcon: string;
  modulePath: string;
  funConfigColor: string;
  funConfigColorTo: string;
  funConfigShowBadge: number;
  enabled: number;
  sortOrder: number;
  configJson: string;
  dirty: boolean;
  isNew: boolean;
}

const rows = ref<MenuRow[]>([]);
const scope = ref<string>("PRIMARY");
const selectedKey = ref<string | null>(null);
const loading = ref(false);
const saving = ref(false);
const seeding = ref(false);
const dirty = ref(false);

/** 搜索关键字：只影响预览与已停用托盘的展示，不改变排序 */
const keyword = ref("");

/** 从其他学段复制：弹框开关与来源学段 */
const copyVisible = ref(false);
const copyFrom = ref<string>("PRIMARY");

/** 全屏预览弹层 */
const previewVisible = ref(false);

/** 保存/加载时的快照：key → 可编辑字段 JSON，用于「撤销修改」 */
const snapshot = new Map<string, string>();

/** 拖拽起点（当前 preview 内的下标） */
const dragFrom = ref<number | null>(null);

const isTeacher = computed(() => scope.value === "TEACHER");
/** 通用作用域：学段为 NULL 的遗留管理端模块 */
const isGeneric = computed(() => scope.value === "GENERIC");

/** 作用域对应的学段值（通用 = 空串，对应库里 NULL） */
const scopeLevel = computed(() => (isGeneric.value ? "" : scope.value));

/**
 * 行所属的学段值（NULL 归一成空串）。
 *
 * @param row 菜单行
 * @returns 学段值
 */
function levelOf(row: MenuRow): string {
  return row.funConfigGradeLevel ?? "";
}

/** 当前作用域的行，按 sortOrder 升序 */
const scopeRows = computed(() =>
  rows.value.filter((r) => levelOf(r) === scopeLevel.value).sort((a, b) => a.sortOrder - b.sortOrder),
);

/** 启用中的入口（preview 只渲染这些） */
const shown = computed(() => scopeRows.value.filter((r) => r.enabled === 1));

/** 已停用的入口 */
const hidden = computed(() => scopeRows.value.filter((r) => r.enabled !== 1));

/** 当前选中项：优先手选的，否则第一张可用的 */
const selected = computed<MenuRow | null>(() => {
  const hit = scopeRows.value.find((r) => r.key === selectedKey.value);
  return hit ?? shown.value[0] ?? hidden.value[0] ?? null;
});

/**
 * 搜索过滤后的启用项。
 *
 * <p>搜索时禁用拖动（drop 下标会按过滤后的数组算，和真实顺序对不上），
 * 排序仍可用右侧的「上移/下移」。</p>
 */
const filteredShown = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) {
    return shown.value;
  }
  return shown.value.filter(
    (r) => r.moduleName.toLowerCase().includes(kw) || r.moduleCode.toLowerCase().includes(kw),
  );
});

/** 搜索过滤后的已停用项 */
const filteredHidden = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) {
    return hidden.value;
  }
  return hidden.value.filter(
    (r) => r.moduleName.toLowerCase().includes(kw) || r.moduleCode.toLowerCase().includes(kw),
  );
});

/** 当前作用域概览：启用 / 停用 / 自定义 */
const summary = computed(() => ({
  enabled: shown.value.length,
  disabled: hidden.value.length,
  custom: scopeRows.value.filter((r) => !isBuiltin(r.moduleCode)).length,
}));

/** 可作为复制来源的学段（只支持学生学段之间复制） */
const copySources = computed(() =>
  SCOPES.filter((s) => s.key !== scope.value && s.key !== "TEACHER" && s.key !== "GENERIC"),
);

/** 可追加的入口：来源学段启用中、目标学段没有的编码 */
const copyCandidates = computed(() => {
  if (!copyVisible.value) {
    return [] as MenuRow[];
  }
  const target = new Set(scopeRows.value.map((r) => r.moduleCode));
  return rows.value.filter(
    (r) => levelOf(r) === copyFrom.value && r.enabled === 1 && !target.has(r.moduleCode),
  );
});

/** 全屏预览形态 */
const previewMode = computed<"student" | "teacher" | "generic">(() =>
  isTeacher.value ? "teacher" : isGeneric.value ? "generic" : "student",
);

/** 全屏预览的入口（当前草稿的启用项，按显示顺序） */
const previewItems = computed(() =>
  shown.value.map((r) => ({
    code: r.moduleCode,
    title: r.moduleName,
    subtitle: r.funConfigSubtitle,
    icon: r.moduleIcon,
    color: r.funConfigColor,
    colorTo: r.funConfigColorTo,
  })),
);

const scopeTitle = computed(() => {
  if (isTeacher.value) {
    return "教师端";
  }
  if (isGeneric.value) {
    return "通用模块（管理端）";
  }
  return `学生端 · ${stageLabel(scope.value as Stage)}`;
});

/**
 * 每个作用域启用中的数量（页签角标）。
 *
 * @param key 作用域
 * @returns 启用数量
 */
function countOf(key: string): number {
  const level = key === "GENERIC" ? "" : key;
  return rows.value.filter((r) => levelOf(r) === level && r.enabled === 1).length;
}

/**
 * FunConfig → 页面行。
 *
 * @param c 接口返回的配置
 * @returns 页面行
 */
function toRow(c: FunConfig): MenuRow {
  const code = c.moduleCode ?? "";
  const level = c.funConfigGradeLevel ?? null;
  // 固定能力始终按启用显示：门户会强制补回，配置页不能显示成“已停用”。
  // 库里如果残留 enabled=0，标记为脏，保存一次即可把 1 写回。
  const fixed = level !== null && level !== "TEACHER" && FIXED_CAPABILITY_CODES.has(code);
  const fixedDisabled = fixed && Number(c.enabled ?? 1) !== 1;
  return {
    key: `id-${c.configId}`,
    configId: c.configId,
    moduleCode: code,
    funConfigGradeLevel: level,
    moduleName: c.moduleName ?? "",
    moduleDesc: c.moduleDesc ?? "",
    funConfigSubtitle: c.funConfigSubtitle ?? "",
    moduleIcon: c.moduleIcon ?? "",
    modulePath: c.modulePath ?? "",
    funConfigColor: c.funConfigColor ?? "#409eff",
    funConfigColorTo: c.funConfigColorTo ?? "#79bbff",
    funConfigShowBadge: Number(c.funConfigShowBadge ?? 0),
    enabled: fixed ? 1 : Number(c.enabled ?? 1),
    sortOrder: Number(c.sortOrder ?? 0),
    configJson: c.configJson ?? "{}",
    dirty: fixedDisabled,
    isNew: false,
  };
}

/** 加载全部配置 */
async function load(): Promise<void> {
  loading.value = true;
  try {
    const list = await eduaiApi.listAllFunConfigs();
    rows.value = (list ?? []).map(toRow);
    // 记录快照：撤销修改恢复到「最近一次加载/保存」的状态
    snapshot.clear();
    rows.value.forEach((r) => snapshot.set(r.key, toSnapshot(r)));
    // 固定能力库里残留 enabled=0 时会标记为脏，这里如实反映，避免保存按钮不可用
    dirty.value = rows.value.some((r) => r.dirty || r.isNew);
  } catch {
    message.error("加载菜单配置失败");
  } finally {
    loading.value = false;
  }
}

/**
 * 重新加载并尽量保持当前选中项。
 *
 * @param key 需要恢复的本地键（可省略）
 */
async function reload(key?: string): Promise<void> {
  if (dirty.value) {
    try {
      await ElMessageBox.confirm("有未保存的修改，刷新会丢失，确定继续？", "提示", { type: "warning" });
    } catch {
      return;
    }
  }
  const keep = key ?? selectedKey.value;
  const keepCode = rows.value.find((r) => r.key === keep)?.moduleCode;
  await load();
  const hit = keepCode
    ? rows.value.find((r) => r.moduleCode === keepCode && levelOf(r) === scopeLevel.value)
    : null;
  selectedKey.value = hit?.key ?? null;
}

/**
 * 切换作用域：选中项跟着切到该作用域的第一项。
 *
 * @param key 作用域
 */
function switchScope(key: string): void {
  scope.value = key;
  selectedKey.value = null;
}

/**
 * 选中一个入口。
 *
 * @param row 菜单行
 */
function select(row: MenuRow): void {
  selectedKey.value = row.key;
}

/**
 * 标记某行已改。
 *
 * @param row 菜单行
 */
function markDirty(row: MenuRow): void {
  row.dirty = true;
  dirty.value = true;
}

/** 卡片图标底色（无配色时退回主题蓝） */
function iconStyle(row: Pick<MenuRow, "funConfigColor" | "funConfigColorTo">): Record<string, string> {
  const from = row.funConfigColor || "#409eff";
  const to = row.funConfigColorTo || from;
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}

/**
 * 是否当前选中。
 *
 * @param row 菜单行
 * @returns 选中返回 true
 */
function isSelected(row: MenuRow): boolean {
  return selected.value?.key === row.key;
}

/**
 * 开始拖动。
 *
 * @param index preview 中的下标
 */
function onDragStart(index: number): void {
  dragFrom.value = index;
}

/**
 * 拖到某个位置：重排 preview 顺序并重写 sortOrder。
 *
 * @param index 落点下标
 */
function onDrop(index: number): void {
  const from = dragFrom.value;
  dragFrom.value = null;
  if (from === null || from === index || keyword.value) {
    return;
  }
  const list = [...shown.value];
  const [moved] = list.splice(from, 1);
  if (!moved) {
    return;
  }
  list.splice(index, 0, moved);
  renumber(list);
}

/**
 * 按数组顺序重写 sortOrder（10/20/30…），只给真正变化的行打脏标记。
 *
 * @param list 已按目标顺序排好的行
 */
function renumber(list: MenuRow[]): void {
  list.forEach((row, idx) => {
    const next = (idx + 1) * 10;
    if (row.sortOrder !== next) {
      row.sortOrder = next;
      markDirty(row);
    }
  });
}

/**
 * 能否向某个方向移动（按启用项全集判断）。
 *
 * @param row   菜单行
 * @param delta -1 上移 / 1 下移
 * @returns 可移动返回 true
 */
function canMove(row: MenuRow, delta: number): boolean {
  const list = shown.value;
  const index = list.findIndex((r) => r.key === row.key);
  const target = index + delta;
  return index >= 0 && target >= 0 && target < list.length;
}

/**
 * 上移 / 下移一位：与拖动共用同一套 sortOrder 重排。
 *
 * <p>给触屏与键盘用户一个不依赖 HTML5 拖拽的排序入口。</p>
 *
 * @param row   菜单行
 * @param delta -1 上移 / 1 下移
 */
function moveItem(row: MenuRow, delta: number): void {
  if (!canMove(row, delta)) {
    return;
  }
  const list = [...shown.value];
  const index = list.findIndex((r) => r.key === row.key);
  const [moved] = list.splice(index, 1);
  list.splice(index + delta, 0, moved);
  renumber(list);
}

/**
 * 启用一个入口。
 *
 * @param row 菜单行
 */
function enable(row: MenuRow): void {
  row.enabled = 1;
  row.sortOrder = (Math.max(0, ...shown.value.map((r) => r.sortOrder)) || 0) + 10;
  markDirty(row);
  selectedKey.value = row.key;
}

/**
 * 停用一个入口（保留配置与学习数据）。
 *
 * @param row 菜单行
 */
function disable(row: MenuRow): void {
  if (isFixedCapability(row.moduleCode)) {
    message.info("这是学生端的固定能力，始终显示，不能停用");
    return;
  }
  row.enabled = 0;
  markDirty(row);
}

/**
 * 是否学生端固定能力（我的试卷 / 我的答题 / 错题本）。
 *
 * <p>门户会强制补回这三项，所以配置页把它们锁成“始终启用”，
 * 避免出现「这里显示已停用、学生端仍然有」的错位。</p>
 *
 * @param code 模块编码
 * @returns 固定能力返回 true
 */
function isFixedCapability(code: string): boolean {
  return !isTeacher.value && !isGeneric.value && FIXED_CAPABILITY_CODES.has((code ?? "").trim());
}

/**
 * 复制一个菜单项（未保存，可先改编码/名称）。
 *
 * @param row 菜单行
 */
function duplicateItem(row: MenuRow): void {
  if (isTeacher.value) {
    message.info("教师端页签由系统内置，不能复制");
    return;
  }
  const stamp = Date.now().toString(36).slice(-5);
  const copy: MenuRow = {
    ...row,
    key: `new-${stamp}`,
    configId: undefined,
    moduleCode: `${row.moduleCode}-c${stamp}`.slice(0, 64),
    moduleName: `${row.moduleName}副本`.slice(0, 20),
    sortOrder: Math.max(0, ...scopeRows.value.map((r) => r.sortOrder)) + 10,
    dirty: true,
    isNew: true,
  };
  rows.value.push(copy);
  selectedKey.value = copy.key;
  dirty.value = true;
}

/**
 * 可编辑字段快照（撤销修改用）。
 *
 * @param row 菜单行
 * @returns 序列化后的字段
 */
function toSnapshot(row: MenuRow): string {
  return JSON.stringify({
    moduleCode: row.moduleCode,
    moduleName: row.moduleName,
    moduleDesc: row.moduleDesc,
    funConfigSubtitle: row.funConfigSubtitle,
    moduleIcon: row.moduleIcon,
    modulePath: row.modulePath,
    funConfigColor: row.funConfigColor,
    funConfigColorTo: row.funConfigColorTo,
    funConfigShowBadge: row.funConfigShowBadge,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    configJson: row.configJson,
  });
}

/** 重新计算「是否有未保存改动」 */
function refreshDirty(): void {
  dirty.value = rows.value.some((r) => r.dirty || r.isNew);
}

/**
 * 撤销某行的修改：有快照就恢复字段，未保存的新行直接移除。
 *
 * @param row 菜单行
 */
function revertItem(row: MenuRow): void {
  const raw = snapshot.get(row.key);
  if (!raw) {
    rows.value = rows.value.filter((r) => r.key !== row.key);
    selectedKey.value = null;
    refreshDirty();
    return;
  }
  Object.assign(row, JSON.parse(raw) as Partial<MenuRow>, { dirty: false, isNew: false });
  refreshDirty();
}

/** 默认目录：学生端取内置模块目录，教师端取三项内置页签 */
function defaultCatalog(): {
  code: string;
  name: string;
  sub: string;
  icon: string;
  c1: string;
  c2: string;
  badge: number;
  path: string;
}[] {
  if (isTeacher.value) {
    return TEACHER_DEFAULTS.map((d) => ({
      code: d.code,
      name: d.name,
      sub: d.desc,
      icon: d.icon,
      c1: "#409eff",
      c2: "#79bbff",
      badge: 0,
      path: d.path,
    }));
  }
  return modulesOf(scope.value).map((m) => ({
    code: m.moduleCode,
    name: m.title,
    sub: m.subtitle,
    icon: m.icon,
    c1: m.color,
    c2: m.colorTo,
    badge: m.badgeFromIncomplete ? 1 : 0,
    path: m.route ?? "",
  }));
}

/**
 * 按默认目录造一条未保存的新行。
 *
 * @param d 目录项
 * @returns 新行
 */
function rowFromCatalog(d: ReturnType<typeof defaultCatalog>[number]): MenuRow {
  const stamp = Date.now().toString(36).slice(-5);
  return {
    key: `new-${d.code}-${stamp}`,
    moduleCode: d.code,
    funConfigGradeLevel: isTeacher.value ? "TEACHER" : scope.value,
    moduleName: d.name,
    moduleDesc: isTeacher.value ? d.sub : "",
    funConfigSubtitle: d.sub,
    moduleIcon: d.icon,
    modulePath: d.path,
    funConfigColor: d.c1,
    funConfigColorTo: d.c2,
    funConfigShowBadge: d.badge,
    enabled: 1,
    sortOrder: 0,
    configJson: "{}",
    dirty: true,
    isNew: true,
  };
}

/**
 * 恢复默认：把内置入口的名称/图标/配色/顺序重置，自定义入口保留在末尾。
 */
async function restoreDefaults(): Promise<void> {
  if (isGeneric.value) {
    message.info("通用模块没有默认目录");
    return;
  }
  try {
    await ElMessageBox.confirm(
      "将内置入口的名称 / 图标 / 配色 / 顺序恢复为默认，并重新启用？自定义入口不受影响。",
      "恢复默认",
      { type: "warning" },
    );
  } catch {
    return;
  }
  const catalog = defaultCatalog();
  const existing = new Map(scopeRows.value.map((r) => [r.moduleCode, r]));
  const ordered: MenuRow[] = [];
  const created: MenuRow[] = [];
  catalog.forEach((d) => {
    let row = existing.get(d.code);
    if (!row) {
      row = rowFromCatalog(d);
      created.push(row);
    }
    row.moduleName = d.name;
    row.funConfigSubtitle = d.sub;
    row.moduleIcon = d.icon;
    if (!isTeacher.value) {
      row.funConfigColor = d.c1;
      row.funConfigColorTo = d.c2;
      row.funConfigShowBadge = d.badge;
    }
    row.enabled = 1;
    markDirty(row);
    ordered.push(row);
  });
  const codes = new Set(catalog.map((d) => d.code));
  scopeRows.value.filter((r) => !codes.has(r.moduleCode)).forEach((r) => ordered.push(r));
  renumber(ordered);
  if (created.length) {
    rows.value.push(...created);
  }
  dirty.value = true;
  message.info("已套用默认配置，点「保存」生效");
}

/** 打开「从其他学段复制」弹框 */
function openCopy(): void {
  if (isTeacher.value || isGeneric.value) {
    return;
  }
  const first = copySources.value[0];
  if (!first) {
    message.info("没有可用的来源学段");
    return;
  }
  copyFrom.value = first.key;
  copyVisible.value = true;
}

/** 把来源学段里目标没有的启用项追加到当前学段（未保存） */
function applyCopy(): void {
  const list = copyCandidates.value;
  if (!list.length) {
    message.info("没有可追加的入口");
    return;
  }
  let order = Math.max(0, ...scopeRows.value.map((r) => r.sortOrder));
  const seq = Date.now().toString(36).slice(-4);
  list.forEach((src, index) => {
    order += 10;
    rows.value.push({
      ...src,
      key: `new-copy-${seq}-${index}`,
      configId: undefined,
      funConfigGradeLevel: scope.value,
      sortOrder: order,
      dirty: true,
      isNew: true,
    });
  });
  copyVisible.value = false;
  dirty.value = true;
  message.success(`已追加 ${list.length} 个入口，保存后生效`);
}

/** 新增一个菜单项（未保存，先在右侧编辑）；教师端页签固定，不允许新增 */
function addItem(): void {
  if (isTeacher.value) {
    message.info("教师端页签由系统内置，只能启停或排序");
    return;
  }
  const stamp = Date.now().toString(36).slice(-5);
  const row: MenuRow = {
    key: `new-${stamp}`,
    moduleCode: `custom-${stamp}`,
    funConfigGradeLevel: isGeneric.value ? null : scope.value,
    moduleName: isGeneric.value ? "新通用模块" : "新菜单项",
    moduleDesc: "",
    funConfigSubtitle: "一句话说明",
    moduleIcon: "✨",
    modulePath: "",
    funConfigColor: "#409eff",
    funConfigColorTo: "#79bbff",
    funConfigShowBadge: 0,
    enabled: 1,
    sortOrder: Math.max(0, ...scopeRows.value.map((r) => r.sortOrder)) + 10,
    configJson: "{}",
    dirty: true,
    isNew: true,
  };
  rows.value.push(row);
  selectedKey.value = row.key;
  dirty.value = true;
}

/**
 * 是否系统内置编码。
 *
 * <p>内置项不提供「删除」，只提供「停用」：删掉后学生端「全部功能」会按
 * 内置目录把它补回来，删除与停用语义会打架。自定义模块不受此限。</p>
 *
 * @param code 模块编码
 * @returns 内置返回 true
 */
function isBuiltin(code: string): boolean {
  if (isTeacher.value) {
    return true;
  }
  if (isGeneric.value) {
    return false;
  }
  return BUILTIN_MODULE_CODES.has((code ?? "").trim());
}

/**
 * 空作用域一键铺默认项。
 *
 * <p>学生端取内置模块目录；教师端取三项内置页签。已存在的编码跳过，
 * 避免唯一键（module_code + grade_level）冲突。</p>
 */
async function seedDefaults(): Promise<void> {
  if (isGeneric.value) {
    message.info("通用模块请手动添加");
    return;
  }
  const exist = new Set(scopeRows.value.map((r) => r.moduleCode));
  const seeds: MenuRow[] = [];
  let order = 0;
  if (isTeacher.value) {
    for (const d of TEACHER_DEFAULTS) {
      if (exist.has(d.code)) {
        continue;
      }
      order += 10;
      seeds.push({
        key: `new-${d.code}`,
        moduleCode: d.code,
        funConfigGradeLevel: "TEACHER",
        moduleName: d.name,
        moduleDesc: d.desc,
        funConfigSubtitle: d.desc,
        moduleIcon: d.icon,
        modulePath: d.path,
        funConfigColor: "#409eff",
        funConfigColorTo: "#79bbff",
        funConfigShowBadge: 0,
        enabled: 1,
        sortOrder: order,
        configJson: "{}",
        dirty: true,
        isNew: true,
      });
    }
  } else {
    for (const m of modulesOf(scope.value)) {
      if (exist.has(m.moduleCode)) {
        continue;
      }
      order += 10;
      seeds.push({
        key: `new-${m.moduleCode}`,
        moduleCode: m.moduleCode,
        funConfigGradeLevel: scope.value,
        moduleName: m.title,
        moduleDesc: "",
        funConfigSubtitle: m.subtitle,
        moduleIcon: m.icon,
        modulePath: m.route ?? "",
        funConfigColor: m.color,
        funConfigColorTo: m.colorTo,
        funConfigShowBadge: m.badgeFromIncomplete ? 1 : 0,
        enabled: 1,
        sortOrder: order,
        configJson: "{}",
        dirty: true,
        isNew: true,
      });
    }
  }
  if (!seeds.length) {
    message.info("该范围的默认项都已存在");
    return;
  }
  seeding.value = true;
  try {
    await eduaiApi.batchSaveFunConfigs(seeds.map(toPayload));
    message.success(`已生成 ${seeds.length} 个默认入口`);
    await load();
    selectedKey.value = null;
  } catch (e) {
    const text = errText(e);
    message.error(text ? `生成默认菜单失败：${text}` : "生成默认菜单失败");
  } finally {
    seeding.value = false;
  }
}

/**
 * 页面行 → 保存接口载荷（剥掉本地字段）。
 *
 * @param row 菜单行
 * @returns 配置载荷
 */
function toPayload(row: MenuRow): Partial<FunConfig> {
  const payload: Partial<FunConfig> = {
    moduleCode: row.moduleCode.trim(),
    funConfigGradeLevel: row.funConfigGradeLevel,
    moduleName: row.moduleName.trim(),
    moduleDesc: row.moduleDesc.trim(),
    funConfigSubtitle: row.funConfigSubtitle.trim(),
    moduleIcon: row.moduleIcon.trim(),
    modulePath: row.modulePath.trim(),
    funConfigColor: row.funConfigColor || null,
    funConfigColorTo: row.funConfigColorTo || null,
    funConfigShowBadge: row.funConfigShowBadge,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    configJson: row.configJson || "{}",
  };
  if (row.configId != null) {
    payload.configId = row.configId;
  }
  return payload;
}

/**
 * 保存所有改动行：字段与排序一起提交。
 *
 * <p>走后端批量接口（同一事务，全成或全败）：失败时不刷新、不清 dirty，
 * 本地编辑原样保留，用户可以直接重试，不会出现「一半已存、一半没了」。</p>
 */
async function saveAll(): Promise<void> {
  const changed = rows.value.filter((r) => r.dirty || r.isNew);
  if (!changed.length) {
    dirty.value = false;
    return;
  }
  // 先就地 trim：后端按 trim 后的编码入库，本地也要一致，否则保存后按编码回填 id 会匹配不上
  changed.forEach((r) => {
    r.moduleCode = r.moduleCode.trim();
    r.moduleName = r.moduleName.trim();
  });
  const bad = changed.find((r) => !r.moduleName);
  if (bad) {
    message.warning("菜单项缺少名称");
    selectedKey.value = bad.key;
    return;
  }
  const missingCode = changed.find((r) => !r.moduleCode);
  if (missingCode) {
    message.warning(`「${missingCode.moduleName}」缺少模块编码（在「高级」里填写）`);
    selectedKey.value = missingCode.key;
    return;
  }
  // 同作用域内编码必须唯一：库里的唯一键只到 module_code + grade_level，
  // 学段为 NULL 的通用行在 MySQL 里不参与唯一性，前端必须自己拦。
  const clash = changed.find((r) => {
    const code = r.moduleCode.toLowerCase();
    return rows.value.some(
      (o) =>
        o.key !== r.key &&
        levelOf(o) === levelOf(r) &&
        o.moduleCode.trim().toLowerCase() === code,
    );
  });
  if (clash) {
    message.warning(`模块编码「${clash.moduleCode}」在当前范围已存在`);
    selectedKey.value = clash.key;
    return;
  }
  const badJson = changed.find((r) => {
    try {
      JSON.parse(r.configJson || "{}");
      return false;
    } catch {
      return true;
    }
  });
  if (badJson) {
    message.warning(`「${badJson.moduleName}」的扩展 JSON 格式不正确`);
    selectedKey.value = badJson.key;
    return;
  }

  const keepCode = selected.value?.moduleCode;
  const keepLevel = selected.value?.funConfigGradeLevel ?? "";
  saving.value = true;
  try {
    const saved = await eduaiApi.batchSaveFunConfigs(changed.map(toPayload));
    // 用接口返回的行回填 configId：即使接下来 load() 失败，重试也是 UPDATE 而不是再 INSERT
    (saved ?? []).forEach((s) => {
      const level = s.funConfigGradeLevel ?? "";
      const hit = rows.value.find((r) => r.moduleCode === s.moduleCode && levelOf(r) === level);
      if (hit) {
        hit.configId = s.configId;
        hit.isNew = false;
        hit.dirty = false;
      }
    });
    dirty.value = false;
    message.success("已保存");
    await load();
    if (keepCode) {
      const hit = rows.value.find((r) => r.moduleCode === keepCode && levelOf(r) === keepLevel);
      selectedKey.value = hit?.key ?? null;
    } else {
      selectedKey.value = null;
    }
  } catch (e) {
    const text = errText(e);
    message.error(text ? `保存失败：${text}` : "保存失败，请重试");
  } finally {
    saving.value = false;
  }
}

/**
 * 删除菜单项。
 *
 * @param row 菜单行
 */
async function removeItem(row: MenuRow): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.moduleName}」吗？停用只是隐藏入口，删除后需要重新添加。`,
      "删除菜单项",
      { type: "warning" },
    );
  } catch {
    return;
  }
  if (row.configId == null) {
    rows.value = rows.value.filter((r) => r.key !== row.key);
    selectedKey.value = null;
    return;
  }
  try {
    await eduaiApi.deleteFunConfig(row.configId);
    message.success("已删除");
    await load();
    selectedKey.value = null;
  } catch {
    message.error("删除失败");
  }
}

/**
 * 离开页面时拦截未保存修改。
 *
 * <p>本页是「批量保存」语义：改了多行但没点保存就切菜单，编辑会静默丢失。
 * 路由离开走确认框，关标签页走浏览器原生提示。</p>
 */
onBeforeRouteLeave(async () => {
  if (!dirty.value) {
    return true;
  }
  try {
    await ElMessageBox.confirm("有未保存的修改，确定离开？返回本页后仍可继续保存。", "提示", {
      type: "warning",
    });
    return true;
  } catch {
    return false;
  }
});

/** 关标签/刷新前提示未保存 */
function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (!dirty.value) {
    return;
  }
  event.preventDefault();
  event.returnValue = "";
}

/** 首次挂载后跳过第一次 activated（避免和 onMounted 重复请求） */
let activatedOnce = false;

onMounted(() => {
  void load();
  window.addEventListener("beforeunload", onBeforeUnload);
});

onActivated(() => {
  if (!activatedOnce) {
    activatedOnce = true;
    return;
  }
  // keepAlive 回页时刷新一次：别的管理员改过配置，旧数据会误导保存
  if (!dirty.value) {
    void load();
  }
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
});
</script>

<style scoped>
/* ---------- 页面 ---------- */
.pm {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--el-bg-color-page);
}
.pm-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.pm-hd__title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--el-text-color-primary);
}
.pm-hd__sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pm-hd__act {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pm-saved {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pm-saved.is-dirty {
  color: var(--el-color-warning);
}

/* ---------- 作用域 ---------- */
.pm-scopes {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow-x: auto;
}
.pm-scope {
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.pm-scope:hover {
  color: var(--el-color-primary);
}
.pm-scope.is-on {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.pm-scope__n {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
.pm-scope.is-on .pm-scope__n {
  color: var(--el-color-primary);
}

/* ---------- 主体两栏 ---------- */
.pm-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 12px;
  align-items: start;
}
.pm-stage,
.pm-insp {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}
.pm-stage {
  padding: 12px;
  min-width: 0;
}
.pm-insp {
  padding: 12px;
  position: sticky;
  top: 8px;
}
.pm-stage__hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.pm-stage__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.pm-stage__title b {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.pm-stage__sum {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pm-stage__act {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.pm-search {
  width: 180px;
}
.pm-filter-empty {
  margin: 0;
  padding: 0 12px 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---------- 空态 ---------- */
.pm-empty {
  padding: 36px 16px;
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
  color: var(--el-text-color-secondary);
}
.pm-empty__t {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.pm-empty__s {
  margin: 6px 0 14px;
  font-size: 12px;
}

/* ---------- 学生端预览 ---------- */
.pv {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}
.pv-head {
  padding: 12px 14px;
  background: linear-gradient(135deg, #43b9f7, #1b8ce2);
  color: #fff;
}
.pv-head b {
  display: block;
  font-size: 15px;
  letter-spacing: 1px;
}
.pv-head--plain {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.pv-head--plain i {
  color: var(--el-text-color-secondary);
  opacity: 1;
}
.pv-head i {
  display: block;
  font-style: normal;
  font-size: 11px;
  opacity: 0.85;
  margin-top: 2px;
}
.pv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  padding: 10px;
  background: var(--el-bg-color);
}
.pvc {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 9px;
  background: var(--el-bg-color);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pvc:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}
.pvc.is-sel {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.16);
}
.pvc-ic {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex: 0 0 auto;
}
.pvc-tx {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.pvc-tx b {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}
.pvc-tx i {
  font-style: normal;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pvc-grip {
  position: absolute;
  right: 6px;
  top: 4px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  letter-spacing: -1px;
  opacity: 0;
  transition: opacity 0.15s;
}
.pvc:hover .pvc-grip {
  opacity: 1;
}
/* 未保存标记：卡片右上角一个小圆点，拖动手柄只在悬停时出现，两者不抢位置 */
.pvc-dot {
  position: absolute;
  left: 5px;
  bottom: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-warning);
}
.pvc--add {
  border-style: dashed;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  gap: 5px;
}
.pvc--add:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pv-tip {
  margin: 0;
  padding: 0 12px 10px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* ---------- 教师端预览 ---------- */
.pv-tabs {
  display: flex;
  gap: 2px;
  padding: 8px 10px 0;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
}
.pv-tab {
  padding: 7px 12px;
  border: 0;
  border-radius: 8px 8px 0 0;
  background: transparent;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
}
.pv-tab.is-on {
  color: var(--el-color-primary);
  font-weight: 700;
  background: var(--el-color-primary-light-9);
}
.pv-tab__g {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  margin-right: 4px;
  letter-spacing: -1px;
}
.pv-tab__dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-left: 5px;
  border-radius: 50%;
  background: var(--el-color-warning);
  vertical-align: middle;
}
.pv-tpbody {
  padding: 14px;
  background: var(--el-bg-color);
  min-height: 66px;
}
.pv-tpbody b {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.pv-tpbody p {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

/* ---------- 已停用 ---------- */
.pm-hidden {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.pm-hidden__hd {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.pm-hidden__hd b {
  color: var(--el-text-color-primary);
}
.pm-hidden__none {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.pm-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  margin: 0 6px 6px 0;
  border: 1px dashed var(--el-border-color);
  border-radius: 20px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}
.pm-chip:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.pm-chip__add {
  color: var(--el-text-color-placeholder);
}

/* ---------- 右侧设置 ---------- */
.pm-insp__hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
.pm-insp__hd b {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.pm-insp__empty {
  padding: 24px 8px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.pm-f {
  margin-bottom: 12px;
}
.pm-f--switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.pm-f__label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 5px;
}
.pm-f__hint {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
}
.pm-f__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pm-emoji {
  width: 38px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 16px;
  flex: 0 0 auto;
  color: #fff;
}
.pm-arrow {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}
.pm-grad {
  flex: 1;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}
.pm-adv {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.pm-adv summary {
  cursor: pointer;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  list-style: none;
}
.pm-adv summary::-webkit-details-marker {
  display: none;
}
.pm-adv summary::after {
  content: "▾";
  font-size: 10px;
  margin-left: 4px;
}
.pm-adv[open] summary::after {
  content: "▴";
}
.pm-adv .pm-f {
  margin-top: 10px;
  margin-bottom: 0;
}
.pm-insp__ft {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pm-insp__row {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}
.pm-copy__tip {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.pm-copy__count {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pm-preview__tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---------- 窄屏 ---------- */
@media (max-width: 900px) {
  .pm-body {
    grid-template-columns: 1fr;
  }
  .pm-insp {
    position: static;
  }
}
@media (max-width: 640px) {
  .pv-grid {
    grid-template-columns: 1fr;
  }
}
</style>
