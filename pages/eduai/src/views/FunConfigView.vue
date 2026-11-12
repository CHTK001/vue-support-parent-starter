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
          <b>{{ scopeTitle }}</b>
          <span>{{ isTeacher ? "拖动页签调整顺序；停用的页签不出现" : "拖动卡片调整顺序；停用的入口进下方「已停用」" }}</span>
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
                  : "可以从内置模块目录一次性导入，之后自由增删改。"
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
                v-for="(item, idx) in shown"
                :key="item.key"
                type="button"
                class="pvc"
                :class="{ 'is-sel': isSelected(item) }"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent
                @drop.prevent="onDrop(idx)"
                @click="select(item)"
              >
                <span class="pvc-ic" :style="iconStyle(item)">{{ item.moduleIcon || "✨" }}</span>
                <span class="pvc-tx">
                  <b>{{ item.moduleName }}</b>
                  <i>{{ item.funConfigSubtitle || "—" }}</i>
                </span>
                <span class="pvc-grip" aria-hidden="true">⠿</span>
              </button>
              <button type="button" class="pvc pvc--add" @click="addItem">＋ 添加菜单项</button>
            </div>
            <p class="pv-tip">
              {{ isGeneric ? "通用模块按编码供管理端读取，不参与门户渲染。" : "这里只预览入口；卡片上的学习统计取学生实时数据。" }}
            </p>
          </div>

          <!-- 教师端：页签预览 -->
          <div v-else class="pv">
            <div class="pv-head"><b>教师工作台</b><i>老师端顶部页签</i></div>
            <div class="pv-tabs">
              <button
                v-for="(item, idx) in shown"
                :key="item.key"
                type="button"
                class="pv-tab"
                :class="{ 'is-on': isSelected(item) }"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent
                @drop.prevent="onDrop(idx)"
                @click="select(item)"
              >
                <span class="pv-tab__g" aria-hidden="true">⠿</span>{{ item.moduleName }}
              </button>
            </div>
            <div class="pv-tpbody">
              <b>{{ selected?.moduleName || "—" }}</b>
              <p>{{ selected?.moduleDesc || "选中一个页签查看说明" }}</p>
            </div>
            <p class="pv-tip">教师端页签由系统内置，只支持启停与排序；停用后对应能力从门户隐藏。</p>
          </div>
        </template>

        <!-- 已停用 -->
        <div class="pm-hidden">
          <div class="pm-hidden__hd">
            已停用 <b>{{ hidden.length }}</b> · 点击启用
          </div>
          <div v-if="!hidden.length" class="pm-hidden__none">全部入口都在启用中</div>
          <button
            v-for="item in hidden"
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
            <b>{{ isTeacher ? "页签设置" : "卡片设置" }}</b>
            <el-tag :type="selected.enabled === 1 ? 'success' : 'info'" size="small">
              {{ selected.enabled === 1 ? "启用中" : "已停用" }}
            </el-tag>
          </div>

          <div class="pm-f pm-f--switch">
            <div>
              <label class="pm-f__label">启用</label>
              <p class="pm-f__hint">停用只隐藏入口，配置与学习数据都保留</p>
            </div>
            <el-switch
              v-model="selected.enabled"
              :active-value="1"
              :inactive-value="0"
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
                maxlength="4"
                placeholder="emoji，如 🀄"
                @input="markDirty(selected)"
              />
            </div>
          </div>

          <div v-if="!isTeacher" class="pm-f">
            <label class="pm-f__label">配色</label>
            <div class="pm-f__row">
              <el-color-picker v-model="selected.funConfigColor" @change="markDirty(selected)" />
              <span class="pm-arrow">→</span>
              <el-color-picker v-model="selected.funConfigColorTo" @change="markDirty(selected)" />
              <span class="pm-grad" :style="iconStyle(selected)"></span>
            </div>
            <p class="pm-f__hint">图标底色渐变，只影响学生端卡片</p>
          </div>

          <div v-if="!isTeacher" class="pm-f pm-f--switch">
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
            <el-button v-if="selected.enabled === 1" link type="warning" @click="disable(selected)">
              停用
            </el-button>
            <el-button v-else link type="primary" @click="enable(selected)">启用</el-button>
            <el-button
              v-if="!isTeacher && !isBuiltin(selected.moduleCode)"
              link
              type="danger"
              @click="removeItem(selected)"
            >
              删除
            </el-button>
          </div>
        </template>
        <div v-else class="pm-insp__empty">左侧选中一个入口后，在这里修改</div>
      </aside>
    </div>
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
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { RefreshLeft } from "@element-plus/icons-vue";
import { message } from "@repo/core";
import { eduaiApi } from "../api/eduaiApi";
import type { FunConfig } from "../api/types";
import { modulesOf, stageLabel, type Stage } from "./portal/modules";

/** 配置范围：三个学生学段 + 教师端 + 通用（学段为空的遗留管理端模块） */
const SCOPES = [
  { key: "PRIMARY", label: "小学" },
  { key: "JUNIOR", label: "初中" },
  { key: "SENIOR", label: "高中" },
  { key: "TEACHER", label: "教师端" },
  { key: "GENERIC", label: "通用" },
] as const;

/** 学生端固定能力：这些编码不提供删除，只能停用（删除后门户会按内置目录补回） */
const FIXED_CAPABILITY_CODES = new Set(["my-papers", "my-records", "wrongbook"]);

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
  return {
    key: `id-${c.configId}`,
    configId: c.configId,
    moduleCode: c.moduleCode ?? "",
    funConfigGradeLevel: c.funConfigGradeLevel ?? null,
    moduleName: c.moduleName ?? "",
    moduleDesc: c.moduleDesc ?? "",
    funConfigSubtitle: c.funConfigSubtitle ?? "",
    moduleIcon: c.moduleIcon ?? "",
    modulePath: c.modulePath ?? "",
    funConfigColor: c.funConfigColor ?? "#409eff",
    funConfigColorTo: c.funConfigColorTo ?? "#79bbff",
    funConfigShowBadge: Number(c.funConfigShowBadge ?? 0),
    enabled: Number(c.enabled ?? 1),
    sortOrder: Number(c.sortOrder ?? 0),
    configJson: c.configJson ?? "{}",
    dirty: false,
    isNew: false,
  };
}

/** 加载全部配置 */
async function load(): Promise<void> {
  loading.value = true;
  try {
    const list = await eduaiApi.listAllFunConfigs();
    rows.value = (list ?? []).map(toRow);
    dirty.value = false;
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
  if (from === null || from === index) {
    return;
  }
  const list = [...shown.value];
  const [moved] = list.splice(from, 1);
  if (!moved) {
    return;
  }
  list.splice(index, 0, moved);
  // 只重排启用项；停用项保留原 sortOrder，启用时按当前顺序插回末尾
  list.forEach((row, idx) => {
    const next = (idx + 1) * 10;
    if (row.sortOrder !== next) {
      row.sortOrder = next;
      markDirty(row);
    }
  });
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
  row.enabled = 0;
  markDirty(row);
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
  const normalized = (code ?? "").trim();
  return (
    FIXED_CAPABILITY_CODES.has(normalized) ||
    modulesOf(scope.value).some((m) => m.moduleCode === normalized)
  );
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
    const failed = await saveRows(seeds);
    if (failed.length) {
      message.error(`有 ${failed.length} 项生成失败：${failed.join("、")}`);
    } else {
      message.success(`已生成 ${seeds.length} 个默认入口`);
    }
    await load();
    selectedKey.value = null;
  } finally {
    seeding.value = false;
  }
}

/**
 * 顺序保存一批行，返回失败项名称。
 *
 * <p>用顺序而不是 Promise.all：并发时一条失败会留下「一半已写、一半没写」
 * 且无法点名哪条失败；顺序循环能收集失败项并在页面上说清楚。</p>
 *
 * @param list 待保存的行
 * @returns 失败项名称列表（空数组表示全部成功）
 */
async function saveRows(list: MenuRow[]): Promise<string[]> {
  const failed: string[] = [];
  for (const row of list) {
    try {
      await eduaiApi.saveFunConfig(toPayload(row));
    } catch {
      failed.push(row.moduleName || row.moduleCode || "未命名");
    }
  }
  return failed;
}

/**
 * 页面行 → 保存接口载荷（剥掉本地字段）。
 *
 * @param row 菜单行
 * @returns 配置载荷
 */
function toPayload(row: MenuRow): Partial<FunConfig> {
  const payload: Partial<FunConfig> = {
    moduleCode: row.moduleCode,
    funConfigGradeLevel: row.funConfigGradeLevel,
    moduleName: row.moduleName,
    moduleDesc: row.moduleDesc,
    funConfigSubtitle: row.funConfigSubtitle,
    moduleIcon: row.moduleIcon,
    modulePath: row.modulePath,
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
 * 保存所有改动行：字段与排序一起提交，避免多出一个排序接口。
 *
 * <p>逐条顺序提交；任意一条失败时重新拉取真实状态并点名失败项 ——
 * 保留未保存的本地编辑再重试会重复插入已经成功的新行（接口只回 boolean，拿不到新 id）。</p>
 */
async function saveAll(): Promise<void> {
  const changed = rows.value.filter((r) => r.dirty || r.isNew);
  if (!changed.length) {
    dirty.value = false;
    return;
  }
  const bad = changed.find((r) => !r.moduleName.trim());
  if (bad) {
    message.warning(`「${bad.moduleName || "未命名"}」缺少名称`);
    selectedKey.value = bad.key;
    return;
  }
  const missingCode = changed.find((r) => !r.moduleCode.trim());
  if (missingCode) {
    message.warning(`「${missingCode.moduleName}」缺少模块编码（在「高级」里填写）`);
    selectedKey.value = missingCode.key;
    return;
  }
  // 同作用域内编码必须唯一：库里的唯一键只到 module_code + grade_level，
  // 学段为 NULL 的通用行在 MySQL 里不参与唯一性，前端必须自己拦。
  const clash = changed.find((r) => {
    const code = r.moduleCode.trim().toLowerCase();
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

  saving.value = true;
  try {
    const failed = await saveRows(changed);
    if (failed.length) {
      message.error(`保存失败：${failed.join("、")}；其余已保存，列表已刷新`);
      await load();
      return;
    }
    message.success("已保存");
    await load();
    selectedKey.value = null;
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

onMounted(() => {
  void load();
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
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.pm-stage__hd b {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.pm-stage__hd span {
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
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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
