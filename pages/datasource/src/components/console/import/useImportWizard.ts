/**
 * 导入向导的全部状态与请求逻辑。
 *
 * <p><b>为什么单独抽成 composable</b>：外壳（弹窗 / 页面）只负责布局，七个步骤体
 * 只负责画自己那一段。把逻辑留在这里，两种外壳用的是同一份状态，不会出现
 * 「页面里配好的映射，弹窗里看不见」这类双份实现的分叉。</p>
 *
 * <p><b>为什么上传只做一次</b>：第 2 步上传后后端返回 {@code token}，第 3 步改分隔符
 * 重解析、第 5 步换目标表、第 7 步执行，全都带着这个 token 走后端暂存文件。
 * 否则每改一个选项就要把几十 MB 的 Excel 重新跨网传一遍，界面会卡到无法操作。</p>
 *
 * <p><b>为什么第 7 步走 SSE</b>：导入几十万行时普通请求既看不到进度也无法中途了解
 * 失败原因。后端逐条失败推 {@code log}、每 200 行推 {@code progress}，前端只做追加渲染。</p>
 */
import { computed, ref, watch, type UnwrapNestedRefs } from "vue";
import { message } from "@repo/core";
import {
  DB_IMPORT_ADVANCED_DEFAULTS,
  DB_IMPORT_MODES,
  uploadDbImportFile,
  parseDbImport,
  planDbImportTable,
  runDbImport,
  type DbImportAdvanced,
  type DbImportMode,
  type DbImportPreview,
  type DbImportSourceOptions,
} from "../../../api/dbManageApi";
import { fetchDbDatabases, fetchDbTables, fetchTableColumns, type DbColumnInfo } from "../../../api/manageConsoles";
import type {
  ImportKind,
  ImportLogLine,
  ImportMappingRow,
  ImportRunState,
  ImportStepDef,
  ImportTargetRow,
} from "./types";

/** 六种导入模式（步骤体也要用） */
export { DB_IMPORT_MODES };

/** 导入类型（需求只保留 CSV 与 Excel 两类） */
export const IMPORT_TYPES: { value: ImportKind; label: string; hint: string }[] = [
  {
    value: "csv",
    label: "CSV 文件（*.csv）",
    hint: "逗号 / 分号 / 制表符分隔的文本，支持自定义记录分隔符与引号",
  },
  {
    value: "excel",
    label: "Excel 文件（*.xls; *.xlsx）",
    hint: "可直接选工作表；单元格按显示值读取",
  },
];

/** 字段分隔符候选（value 是真正参与解析的字符，别写成 "\\t"） */
export const DELIMITERS = [
  { value: ",", label: "逗号 (,)" },
  { value: ";", label: "分号 (;)" },
  { value: "\t", label: "制表符 (Tab)" },
  { value: "|", label: "竖线 (|)" },
  { value: " ", label: "空格" },
];

/** 日期顺序候选 */
export const DATE_ORDERS = [
  { value: "YMD", label: "年 / 月 / 日（YMD）" },
  { value: "DMY", label: "日 / 月 / 年（DMY）" },
  { value: "MDY", label: "月 / 日 / 年（MDY）" },
];

/** 日期分隔符候选 */
export const DATE_SEPARATORS = [
  { value: "/", label: "斜杠 (/)" },
  { value: "-", label: "短横 (-)" },
  { value: ".", label: "点 (.)" },
  { value: " ", label: "空格" },
];

/** 7 步定义 */
export const IMPORT_STEPS: ImportStepDef[] = [
  { title: "导入类型", desc: "CSV 或 Excel" },
  { title: "选择文件", desc: "文件与编码" },
  { title: "附加选项", desc: "分隔符与行区间" },
  { title: "目标表", desc: "现有表或新建表" },
  { title: "字段映射", desc: "源字段到目标字段" },
  { title: "导入模式", desc: "追加 / 更新 / 复制" },
  { title: "执行", desc: "开始导入并查看日志" },
];

/** 第 4 步表格的列 */
export const TARGET_COLUMNS = [
  { prop: "source", label: "源", minWidth: 180, showOverflowTooltip: true },
  { prop: "targetTable", label: "目标表", minWidth: 240, slot: "col-target" },
  { prop: "createTable", label: "新建表", width: 100, slot: "col-create", align: "center" as const },
];

/** 第 5 步表格的列 */
export const MAPPING_COLUMNS = [
  { prop: "source", label: "源字段", minWidth: 200, slot: "col-source" },
  { prop: "target", label: "目标字段", minWidth: 240, slot: "col-target" },
  { prop: "key", label: "主键", width: 90, slot: "col-key", align: "center" as const },
];

/** 上传区接受的扩展名 */
const CSV_ACCEPT = ".csv,.tsv,.tab,.txt";
const EXCEL_ACCEPT = ".xls,.xlsx,.xlsm";

/** 向导的外部依赖：宿主 props 与成功事件 */
export interface ImportWizardHost {
  /** 数据源 ID */
  datasourceId?: number;
  /** 初始库（从某张表右键进来时带上） */
  database?: string;
  /** 初始目标表 */
  tableName?: string;
}

/** 空运行统计 */
function emptyRun(): ImportRunState {
  return {
    done: 0,
    total: 0,
    baseDone: 0,
    baseTotal: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
    errors: 0,
    elapsedMs: 0,
    finished: false,
    failed: false,
    errorText: "",
  };
}

/**
 * 导入向导控制器。
 *
 * @param host 宿主 props（响应式对象）
 * @param emit 成功事件
 * @returns 模板需要的全部状态与动作
 */
export function useImportWizard(
  host: ImportWizardHost,
  emit: (event: "done", payload: { table: string; database: string }) => void,
) {
  /** 当前步骤下标 */
  const step = ref(0);
  /** 导入类型 */
  const type = ref<ImportKind>("csv");
  /** 文件与上传状态 */
  const fileName = ref("");
  const fileSize = ref(0);
  /** 当前编码选择；AUTO 表示交给后端按内容探测 */
  const encoding = ref("AUTO");
  const parsing = ref(false);
  /** 后端解析结果（含 token） */
  const preview = ref<DbImportPreview | null>(null);
  /** Excel 工作表多选 */
  const sheets = ref<string[]>([]);
  const selectedSheets = ref<string[]>([]);
  const activeSheet = ref("");
  /** 后端是否装配了 Excel 能力（首屏探测失败时保守认为可用，交给后端报错） */
  const excelAvailable = ref(true);
  /** 源选项（第 3 步） */
  const recordDelimiter = ref("CRLF");
  const delimiter = ref(",");

  /**
   * 字段分隔符的读写代理（支持自定义输入）。
   *
   * <p>下拉候选只有逗号/分号/制表符等常用值，但真实文件里还会出现 {@code #}、{@code ~}、
   * {@code :} 这类单字符分隔符，所以下拉开了 {@code allow-create} 让用户直接输入。</p>
   *
   * <p><b>必须卡死单字符</b>：后端 {@code DbImportDTO.delimiterChar()} 用
   * {@code delimiter.charAt(0)} 取首字符解析，多字符（如 {@code ||}）会被静默截成
   * {@code |} —— 界面上写着 {@code ||}、实际按 {@code |} 切分，属于最难排查的一类错。
   * 因此在写入前拦截并提示，而不是让它悄悄生效。</p>
   *
   * <p>清空是合法状态（{@code ""}）：表示不指定，由后端按内容自动探测。</p>
   */
  const delimiterModel = computed<string>({
    get: () => delimiter.value,
    set: (value: string) => {
      const text = value ?? "";
      if (text.length > 1) {
        message.warning("字段分隔符只能是单个字符");
        // 不写入：让下拉回弹到上一次的合法值，避免半截输入留下来
        delimiter.value = delimiter.value;
        return;
      }
      delimiter.value = text;
    },
  });
  const textQualifier = ref('"');
  const decimalSymbol = ref(".");
  const fieldNamesLine = ref(1);
  const firstDataLine = ref(2);
  const lastDataLine = ref(0);
  /** 日期解读规则（Excel 分支） */
  const dateOrder = ref("YMD");
  const dateTimeOrder = ref("YMD");
  const dateSeparator = ref("/");
  const yearSeparator = ref("/");
  const timeSeparator = ref(":");
  /** 目标库 / 表 */
  const database = ref("");
  const databases = ref<string[]>([]);
  const tableNames = ref<string[]>([]);
  /** 第 4 步的一行：一张源表（CSV 文件 / Excel 工作表）→ 一张目标表 */
  const targetRows = ref<ImportTargetRow[]>([]);
  /** 目标表列结构 */
  const targetColumns = ref<DbColumnInfo[]>([]);
  /** 第 5 步映射行 */
  const mappingRows = ref<ImportMappingRow[]>([]);
  /** 第 6 步 */
  const mode = ref<DbImportMode>("append");
  const batchSize = ref(500);
  const advanced = ref<DbImportAdvanced>({ ...DB_IMPORT_ADVANCED_DEFAULTS });
  const advancedVisible = ref(false);
  /** 第 7 步运行状态 */
  const running = ref(false);
  const logLines = ref<ImportLogLine[]>([]);
  const run = ref<ImportRunState>(emptyRun());
  /** 中断句柄（关闭弹窗时用） */
  let abortRun: (() => void) | null = null;
  /** 当前这张表的 Promise 收尾函数（关闭弹窗时用它解除串行循环） */
  let currentResolve: (() => void) | null = null;

  const title = computed(() => "导入向导");
  const subtitle = computed(() => `第 ${step.value + 1} / ${IMPORT_STEPS.length} 步 · ${IMPORT_STEPS[step.value].title}`);
  const acceptAttr = computed(() => (type.value === "excel" ? EXCEL_ACCEPT : CSV_ACCEPT));

  /** 当前目标表（只放表名：要当接口参数用，不能带库前缀） */
  const currentTarget = computed(() => targetRows.value[0]?.targetTable ?? host.tableName ?? "");

  /**
   * KPI 上显示的目标表。
   *
   * <p>带库名才看得出写到哪；多行时补「等 N 张」。注意别拿它去请求表结构 ——
   * {@code fetchTableColumns} 要的是纯表名，带 {@code 库.} 前缀会查不到列。</p>
   */
  const targetDisplay = computed(() => {
    const table = currentTarget.value;
    if (!table) return "";
    const full = database.value ? `${database.value}.${table}` : table;
    const total = targetRows.value.filter(row => row.targetTable.trim()).length;
    return total > 1 ? `${full} 等 ${total} 张` : full;
  });

  /**
   * 预览表的行。
   *
   * <p>统一改写成 {@code __c0..__cN} 的索引键再交给表格：CSV 表头里出现 {@code .}
   * （如 {@code user.name}）时，vxe 会把 {@code prop} 当成嵌套路径去取值，整表空白。</p>
   */
  const previewRows = computed(() =>
    (preview.value?.rows ?? []).slice(0, 50).map(row => {
      const flat: Record<string, string> = {};
      (preview.value?.columns ?? []).forEach((column, index) => {
        const value = row[column];
        flat[`__c${index}`] =
          value === null || value === undefined
            ? ""
            : typeof value === "object"
              ? JSON.stringify(value)
              : String(value);
      });
      return flat;
    }),
  );

  /** 预览表的列：按解析出的列名动态生成（prop 用索引，label 用真实列名） */
  const previewColumns = computed(() =>
    (preview.value?.columns ?? []).map((column, index) => ({
      prop: `__c${index}`,
      label: String(column),
      minWidth: 120,
      showOverflowTooltip: true,
    })),
  );

  /** 映射冲突（两个源列指向同一目标列） */
  const mappingConflict = computed(() => {
    const used = new Map<string, string>();
    for (const row of mappingRows.value) {
      if (!row.target) continue;
      const prev = used.get(row.target);
      if (prev) return `${prev} 与 ${row.source} 都映射到 ${row.target}`;
      used.set(row.target, row.source);
    }
    return "";
  });

  /** 是否有勾选的主键列 */
  const hasKeyColumns = computed(() => mappingRows.value.some(r => r.key && r.target));

  /** 目标表自身是否已有主键（有的话后端会按主键匹配，用户不必再勾） */
  const targetHasPrimaryKey = computed(() => targetColumns.value.some(c => c.isPrimaryKey));

  /** 当前模式是否需要键列 */
  const modeNeedsKey = computed(() => ["update", "upsert", "insert-ignore", "delete"].includes(mode.value));

  /** 当前模式中文名 */
  const modeLabel = computed(() => DB_IMPORT_MODES.find(m => m.value === mode.value)?.label ?? mode.value);

  /** 运行错误数 */
  const runErrors = computed(() => run.value.errors);

  /** 进度百分比 */
  const progressPercent = computed(() => {
    const total = run.value.total || preview.value?.rowCount || 0;
    if (!total) return 0;
    return Math.min(100, Math.round((run.value.done / total) * 100));
  });

  /** 耗时文本 */
  const elapsedText = computed(() => {
    const ms = run.value.elapsedMs || 0;
    if (ms < 1000) return `${ms} ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
    return `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s`;
  });

  /** 多行指向同一张表时的表名（空串表示没有冲突） */
  const duplicatedTargets = computed(() => {
    const seen = new Set<string>();
    for (const row of targetRows.value) {
      const name = row.targetTable.trim().toLowerCase();
      if (!name) continue;
      if (seen.has(name)) return row.targetTable.trim();
      seen.add(name);
    }
    return "";
  });

  /** 已映射列数 */
  const mappedCount = computed(() => mappingRows.value.filter(r => r.target).length);

  /** 每批行数够不够撑起「批次砖」：执行步用它算已完成的批次数 */
  const batchTotal = computed(() => {
    const total = run.value.total || preview.value?.rowCount || 0;
    if (!total) return 0;
    return Math.max(1, Math.ceil(total / Math.max(1, batchSize.value)));
  });

  /**
   * 每一步已完成时的摘要。
   *
   * @param index 步骤下标
   * @returns 摘要文本
   */
  function summaryOf(index: number): string {
    switch (index) {
      case 0:
        return type.value === "excel" ? "Excel" : "CSV";
      case 1:
        return fileName.value || "未选择";
      case 2:
        return type.value === "excel"
          ? `表头行 ${fieldNamesLine.value}`
          : `${delimiterLabel(delimiter.value)} · 表头行 ${fieldNamesLine.value}`;
      case 3:
        return currentTarget.value || "未选择";
      case 4:
        return `${mappedCount.value} / ${mappingRows.value.length} 列`;
      case 5:
        return modeLabel.value;
      default:
        return "";
    }
  }

  /**
   * 分隔符的中文名。
   *
   * @param value 分隔符
   * @returns 展示名
   */
  function delimiterLabel(value: string): string {
    return DELIMITERS.find(d => d.value === value)?.label ?? value;
  }

  /**
   * 列标签：带类型与主键标记。
   *
   * @param column 列定义
   * @returns 展示文本
   */
  function columnLabel(column: DbColumnInfo): string {
    // 主键标记用文字而不是 🔑：沙箱与部分 Windows 客户端没有 emoji 字体，
    // emoji 会渲染成一个方框，看起来像乱码
    const pk = column.isPrimaryKey ? " 主键" : "";
    return `${column.name}${pk}（${column.type}）`;
  }

  /**
   * 文件大小展示。
   *
   * @param bytes 字节数
   * @returns 形如 1.2 MB
   */
  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  /** 运行中关窗：先解除串行循环里的 await，再断开 SSE */
  function interrupt(): void {
    if (!running.value) return;
    // 只断连接的话那个 Promise 永远不落定，循环会一直挂在后台，
    // 下一次打开向导时 running 仍是 true，按钮永远转圈
    currentResolve?.();
    abortRun?.();
    running.value = false;
  }

  /** 上一步 */
  function prev(): void {
    if (step.value <= 0) return;
    step.value -= 1;
    // 回到前面的步骤说明用户要改参数重跑：把上一轮的执行结果清掉，
    // 否则「开始」按钮会一直停在「已完成」的禁用态，用户以为导入坏了
    if (run.value.finished && !running.value) {
      run.value.finished = false;
      run.value.failed = false;
      run.value.errorText = "";
    }
  }

  /**
   * 跳到某一步（页面态的步骤轨可回点）。
   *
   * @param index 目标下标
   */
  async function goTo(index: number): Promise<void> {
    if (running.value) return;
    if (index < 0 || index >= IMPORT_STEPS.length || index === step.value) return;
    // 只许往回跳：往前跳必须先满足当前步的校验，否则映射会拿不到列
    if (index > step.value) return;
    step.value = index;
    await onEnterStep(index);
  }

  /** 下一步：进入某步时按需加载该步数据 */
  async function next(): Promise<void> {
    if (!canGoNext.value) {
      return;
    }
    // 离开「附加选项」前一定按当前选项重解析一次：用户可能改了分隔符却没点
    // 「重新解析」，直接拿旧预览进映射会让写库用错列（预览与写入不一致最难排查）。
    // 文件已在服务端暂存，重解析只走一次 token，不重传。
    if (step.value === 2 && preview.value?.token) {
      await reparse();
    }
    step.value += 1;
    await onEnterStep(step.value);
  }

  /**
   * 进入某一步时的准备工作。
   *
   * <p>把「进这一步才需要的数据」放在这里，而不是一次性开弹窗全拉：
   * 用户可能只导一张表就关掉，提前拉全部库的表结构是白费。</p>
   *
   * @param index 步骤下标
   */
  async function onEnterStep(index: number): Promise<void> {
    if (index === 3) {
      await loadTargets();
    } else if (index === 4) {
      // 多行时按第一行的表结构配映射，且不覆盖用户在第 4 步已改的表名
      await loadTargetColumns();
      prefillMapping();
    }
  }

  /** 当前步是否可以继续 */
  const canGoNext = computed(() => {
    if (step.value === 0) {
      return type.value === "csv" || excelAvailable.value;
    }
    if (step.value === 1) {
      return !!preview.value && preview.value.columns.length > 0;
    }
    if (step.value === 2) {
      return !!preview.value && preview.value.columns.length > 0;
    }
    if (step.value === 3) {
      return (
        targetRows.value.length > 0 &&
        targetRows.value.every(r => !!r.targetTable.trim()) &&
        !!database.value &&
        !duplicatedTargets.value
      );
    }
    if (step.value === 4) {
      return !mappingConflict.value && mappedCount.value > 0;
    }
    if (step.value === 5) {
      // 目标表自带主键时后端会按主键匹配，不必强制用户再勾一次
      return !modeNeedsKey.value || hasKeyColumns.value || targetHasPrimaryKey.value;
    }
    return true;
  });

  /**
   * 组装源选项。
   *
   * @returns 后端解析所需选项
   */
  function sourceOptions(): DbImportSourceOptions {
    return {
      token: preview.value?.token,
      fileName: fileName.value,
      format: type.value === "excel" ? "excel" : "csv",
      // AUTO 是前端概念，后端不认识：不传就等于让它自己探测
      encoding: encoding.value && encoding.value !== "AUTO" ? encoding.value : undefined,
      sheetName: type.value === "excel" ? activeSheet.value || undefined : undefined,
      delimiter: type.value === "excel" ? undefined : delimiter.value,
      recordDelimiter: type.value === "excel" ? undefined : recordDelimiter.value,
      textQualifier: type.value === "excel" ? undefined : textQualifier.value,
      fieldNamesLine: fieldNamesLine.value,
      firstDataLine: firstDataLine.value,
      lastDataLine: lastDataLine.value,
      decimalSymbol: decimalSymbol.value,
      // 日期选项只对 Excel 有意义（CSV 的日期就是文本，按原样写）
      dateOrder: type.value === "excel" ? dateOrder.value : undefined,
      dateTimeOrder: type.value === "excel" ? dateTimeOrder.value : undefined,
      dateSeparator: type.value === "excel" ? dateSeparator.value : undefined,
      yearSeparator: type.value === "excel" ? yearSeparator.value : undefined,
      timeSeparator: type.value === "excel" ? timeSeparator.value : undefined,
    };
  }

  /**
   * 选中文件后立刻上传解析。
   *
   * @param event input change 事件
   */
  async function onFilePicked(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    fileName.value = file.name;
    fileSize.value = file.size;
    preview.value = null;
    sheets.value = [];
    selectedSheets.value = [];
    activeSheet.value = "";
    parsing.value = true;
    try {
      const result = await uploadDbImportFile(file, {
        format: type.value === "excel" ? "excel" : "csv",
        encoding: encoding.value && encoding.value !== "AUTO" ? encoding.value : undefined,
      });
      applyPreview(result);
    } catch (e) {
      message.error(`解析失败: ${String((e as Error)?.message ?? e)}`);
    } finally {
      parsing.value = false;
      // 清空 value，否则同名文件再选一次不触发 change
      input.value = "";
    }
  }

  /**
   * 应用一次解析结果。
   *
   * @param result 后端解析结果
   */
  function applyPreview(result: DbImportPreview): void {
    preview.value = result;
    excelAvailable.value = result.excelAvailable !== false;
    // 先收窄成局部常量：`result.sheets?.length` 的判定不会保留到回调里，
    // 直接写 `result.sheets.includes` 会被 TS 判成 possibly undefined
    const sheetNames = result.sheets ?? [];
    if (sheetNames.length) {
      sheets.value = sheetNames;
      // 已勾选的保持不变（重解析不该把用户的选择清掉），只保证至少勾一张
      const kept = selectedSheets.value.filter(s => sheetNames.includes(s));
      selectedSheets.value = kept.length ? kept : [result.activeSheet ?? sheetNames[0]];
      activeSheet.value = result.activeSheet ?? selectedSheets.value[0] ?? "";
    }
  }

  /** 带当前选项重新解析 */
  async function reparse(): Promise<void> {
    if (!preview.value?.token) {
      message.warning("请先在第 2 步选择文件");
      return;
    }
    parsing.value = true;
    try {
      applyPreview(await parseDbImport(sourceOptions()));
    } catch (e) {
      message.error(`解析失败: ${String((e as Error)?.message ?? e)}`);
    } finally {
      parsing.value = false;
    }
  }

  /** 清掉已选文件 */
  function clearFile(): void {
    fileName.value = "";
    fileSize.value = 0;
    preview.value = null;
    sheets.value = [];
    selectedSheets.value = [];
    activeSheet.value = "";
  }

  /** 工作表全选 / 取消全选 */
  function selectAllSheets(checked: boolean): void {
    selectedSheets.value = checked ? [...sheets.value] : [];
    if (!checked) {
      // 全不选时保留一张做预览：0 张工作表进不了第 4 步（没东西可导）
      return;
    }
    if (!selectedSheets.value.includes(activeSheet.value)) {
      activeSheet.value = selectedSheets.value[0] ?? "";
    }
  }

  /** 勾选 / 取消某个工作表 */
  function toggleSheet(sheet: string, checked: boolean): void {
    const set = new Set(selectedSheets.value);
    if (checked) set.add(sheet);
    else set.delete(sheet);
    selectedSheets.value = [...set];
    // 第一张决定预览与映射：取消掉它时必须顺移到还选着的第一张，
    // 否则第 3 步显示的是「已取消」的那张表，用户看到的行数与实际要导的不一致
    if (!selectedSheets.value.includes(activeSheet.value)) {
      const nextSheet = selectedSheets.value[0];
      if (nextSheet) {
        activeSheet.value = nextSheet;
        void reparse();
      }
    }
  }

  /** 第 5 步切换源工作表：重新解析该工作表并刷新映射 */
  async function onSheetChange(): Promise<void> {
    await reparse();
    await loadTargetColumns();
    prefillMapping();
  }

  /**
   * 加载目标库与表清单（第 4 步）。
   *
   * <p>库清单必须真的去问后端：只按「进来的那个库」兜底的话，用户想换库时
   * 下拉里一个别的选项都没有。</p>
   */
  async function loadTargets(): Promise<void> {
    if (!databases.value.length) {
      try {
        databases.value = (await fetchDbDatabases(host.datasourceId)) ?? [];
      } catch (e) {
        databases.value = [];
        message.warning(`读取库清单失败：${String((e as Error)?.message ?? e)}`);
      }
    }
    if (!databases.value.length && host.database) {
      databases.value = [host.database];
    }
    database.value = database.value || host.database || databases.value[0] || "";
    await loadTables();

    // 一张源表一行：CSV 是一行，Excel 是「选中的每张工作表各一行」。
    // 这与 Navicat 一致——「全选工作表」不是为了好看，它决定第 4 步出现几行目标表。
    const sources = type.value === "excel" && selectedSheets.value.length ? selectedSheets.value : [activeSheet.value || ""];
    // 默认名只能来自「用户明确指定的表」或「文件名 / 工作表名」。
    // 绝不能拿库里第一张表兜底：那会把数据静默追加进一张毫不相干的表。
    const named = host.tableName?.trim() ?? "";
    const previous = new Map(targetRows.value.map(row => [row.source, row]));
    targetRows.value = sources.map((sheet, index) => {
      const source = sheet || fileName.value || "源文件";
      // 用户在第 4 步改过的表名要保住：来回翻步骤不该把输入清空
      const prev = previous.get(source);
      if (prev) {
        return { ...prev, source, sheet };
      }
      const suggested =
        index === 0 && named ? named : sanitizeTableName(sheet || stripExtension(fileName.value) || "import_table");
      return {
        source,
        sheet,
        targetTable: suggested,
        // 目标表在清单里找不到 = 用户要新建它，直接把勾打上，省一次点击
        createTable: !!suggested && !tableNames.value.includes(suggested),
      };
    });
  }

  /**
   * 去掉文件名的扩展名。
   *
   * @param name 文件名
   * @returns 不含扩展名的名字
   */
  function stripExtension(name: string): string {
    return String(name ?? "").replace(/\.[^.]+$/, "");
  }

  /**
   * 工作表名转表名（前端只做「看起来像表名」的建议）。
   *
   * <p>真正的清洗在后端 {@code DbImportDdl.sanitize}，这里只避免把
   * 「订单 明细」这种名字原样塞进输入框——中文表名会被后端直接拒绝。</p>
   *
   * @param raw 工作表名
   * @returns 建议表名
   */
  function sanitizeTableName(raw: string): string {
    const cleaned = String(raw ?? "")
      .trim()
      .replace(/[^A-Za-z0-9_]/g, "_");
    // 清洗后只剩下划线或为空：与后端一致，退回序号名而不是一串 ____
    if (!/[A-Za-z0-9]/.test(cleaned)) {
      return "import_table";
    }
    return /^[0-9]/.test(cleaned) ? `t_${cleaned}` : cleaned;
  }

  /** 加载当前库的表清单 */
  async function loadTables(): Promise<void> {
    if (!database.value) {
      tableNames.value = [];
      return;
    }
    try {
      const list = await fetchDbTables(host.datasourceId, database.value);
      tableNames.value = (list ?? []).map(t => t.name);
    } catch (e) {
      tableNames.value = [];
      message.warning(`读取表清单失败：${String((e as Error)?.message ?? e)}`);
    }
  }

  /** 换库：重载表清单与列结构 */
  async function onDatabaseChange(): Promise<void> {
    await loadTables();
    targetColumns.value = [];
    // 换库后原表名基本都不存在了：逐行重算「新建表」标记，别让上一库的勾留在这里。
    // 刻意不自动填「新库的第一张表」——那等于替用户选了一张无关的表。
    for (const row of targetRows.value) {
      row.createTable = !!row.targetTable && !tableNames.value.includes(row.targetTable);
    }
  }

  /**
   * 目标表切换：重新拉列结构。
   *
   * <p>只有第一行的表结构进第 5 步的映射候选 —— 多工作表时映射是共用的一份，
   * 跟着后面那几行变会让用户刚配好的映射凭空消失。</p>
   *
   * @param row 被改动的那一行
   */
  async function onTargetTableChange(row?: ImportTargetRow): Promise<void> {
    if (row) {
      // 手输的表名不在清单里 → 自动视为新建，省掉「先勾新建表」这一步
      row.createTable = !!row.targetTable && !tableNames.value.includes(row.targetTable);
    }
    if (row && targetRows.value[0] !== row) {
      return;
    }
    await loadTargetColumns();
    prefillMapping();
  }

  /** 「新建表」勾选框：勾上时按源列建议表名与列 */
  async function onCreateTableToggle(row: ImportTargetRow, checked: boolean): Promise<void> {
    row.createTable = checked;
    if (!checked) {
      return;
    }
    try {
      const plan = await planDbImportTable(preview.value?.columns ?? [], fileName.value);
      if (!row.targetTable || tableNames.value.includes(row.targetTable)) {
        row.targetTable = plan.tableName;
      }
    } catch (e) {
      message.warning(`生成建表建议失败：${String((e as Error)?.message ?? e)}`);
    }
  }

  /**
   * 加载目标表列结构。
   *
   * <p>「新建表」时目标表还不存在，列结构必然是空的，此时列候选改用源列名 ——
   * 否则第 5 步的下拉里一个选项都没有，用户无法配置映射。</p>
   */
  async function loadTargetColumns(): Promise<void> {
    const table = currentTarget.value;
    if (!table || !database.value) {
      targetColumns.value = [];
      return;
    }
    if (targetRows.value[0]?.createTable) {
      targetColumns.value = (preview.value?.columns ?? []).map(name => ({
        name,
        type: "待建",
        size: 0,
        nullable: true,
        isPrimaryKey: false,
      }));
      return;
    }
    try {
      targetColumns.value = (await fetchTableColumns(table, host.datasourceId, database.value)) || [];
    } catch (e) {
      targetColumns.value = [];
      message.warning(`读取目标表结构失败：${String((e as Error)?.message ?? e)}`);
    }
  }

  /**
   * 按同名规则预填映射（已配置的不覆盖）。
   *
   * <p>整体替换数组而不是逐项赋值：{@code ReSelect} 的当前值在数组元素被就地改写时
   * 不会重算，表现为「下拉里有目标列、显示却仍是（不导入）」。</p>
   */
  function prefillMapping(): void {
    const sources = preview.value?.columns ?? [];
    const targets = targetColumns.value.map(c => c.name);
    const previous = new Map(mappingRows.value.map(r => [r.source, r]));
    mappingRows.value = sources.map(source => {
      const prev = previous.get(source);
      if (prev) return prev;
      const hit = targets.find(c => c.toLowerCase() === String(source).trim().toLowerCase());
      const column = targetColumns.value.find(c => c.name === hit);
      return { source: String(source), target: hit ?? "", key: column?.isPrimaryKey ?? false };
    });
  }

  /** 勾选 / 取消主键列 */
  function onKeyToggle(row: ImportMappingRow, checked: boolean): void {
    row.key = checked;
  }

  /**
   * 执行导入（第 7 步）。
   *
   * <p>第 4 步可能有 N 行（Excel 多工作表），而 {@code import/run} 一次只吃一张表，
   * 所以这里按行串行发起，把统计累加到同一个 {@code run} 上。串行而不是并发：
   * 后端一个数据源只复用一条物理连接（TTL 内 close 是空操作），并发写会互相踩。</p>
   */
  async function startImport(): Promise<void> {
    if (running.value) return;
    const jobs = targetRows.value.filter(r => r.targetTable.trim());
    if (!jobs.length) {
      message.warning("请在第 4 步选择或输入目标表");
      return;
    }
    const missing = targetRows.value.filter(r => !r.targetTable.trim());
    if (missing.length) {
      message.warning(`还有 ${missing.length} 行没有填目标表名`);
      return;
    }
    // 多张源表进同一张表是合法用法（追加/更新），只有「复制」会先清表——
    // 那时第 2 张会把第 1 张刚写进去的数据整表清掉，必须拦住
    if (mode.value === "copy" && duplicatedTargets.value) {
      message.warning(
        `「复制」会先清空目标表，多行指向同一张表 ${duplicatedTargets.value} 会让后面的表覆盖前面的结果，请改成不同的表名`,
      );
      return;
    }
    const mapping: Record<string, string> = {};
    for (const row of mappingRows.value) {
      if (row.target) mapping[row.source] = row.target;
    }
    if (!Object.keys(mapping).length) {
      message.warning("请在第 5 步至少配置一个字段映射");
      return;
    }
    if (mappingConflict.value) {
      message.warning(`字段映射有冲突：${mappingConflict.value}`);
      return;
    }
    const keyColumns = mappingRows.value.filter(r => r.key && r.target).map(r => r.target);
    if (modeNeedsKey.value && !keyColumns.length && !targetHasPrimaryKey.value) {
      message.warning(`「${modeLabel.value}」需要在第 5 步勾选主键，或先在目标表上设置主键`);
      return;
    }

    running.value = true;
    run.value = { ...emptyRun(), total: preview.value?.rowCount ?? 0 };
    logLines.value = [];
    let succeeded = 0;
    let aborted = false;
    for (let index = 0; index < jobs.length; index += 1) {
      const job = jobs[index];
      if (jobs.length > 1) {
        appendLog(`—— 第 ${index + 1}/${jobs.length} 张：${job.source} → ${job.targetTable} ——`, "info");
      }
      const outcome = await runOne(job, mapping, keyColumns);
      if (outcome === "ok") {
        succeeded += 1;
      }
      if (outcome === "aborted") {
        // 用户关窗 / 中断：后面的表不再发起
        appendLog("导入已中断", "warn");
        aborted = true;
        break;
      }
      if (run.value.failed) {
        // 某张表整体失败（解析失败、建表失败等）：继续下一张没有意义
        break;
      }
    }
    running.value = false;
    abortRun = null;
    currentResolve = null;
    // 中断不算「跑完」：按钮要能再点一次，否则用户以为流程已经结束
    run.value.finished = !aborted;
    if (aborted) {
      return;
    }
    if (succeeded === jobs.length && run.value.errors === 0) {
      message.success(`导入完成：新增 ${run.value.inserted} 行`);
      emit("done", { table: jobs[0].targetTable, database: database.value });
    } else if (succeeded > 0) {
      message.warning(`导入完成 ${succeeded}/${jobs.length} 张表，错误 ${run.value.errors} 行，见日志`);
    }
  }

  /**
   * 导入一张表，返回结果。
   *
   * <p>用 Promise 把 SSE 回调包起来，串行循环才能「等这张跑完再跑下一张」。</p>
   *
   * @param job        第 4 步的一行
   * @param mapping    字段映射
   * @param keyColumns 键列
   * @returns ok=成功；failed=整体失败；aborted=被中断
   */
  function runOne(
    job: ImportTargetRow,
    mapping: Record<string, string>,
    keyColumns: string[],
  ): Promise<"ok" | "failed" | "aborted"> {
    return new Promise(resolve => {
      const table = job.targetTable.trim();
      const sheetName = type.value === "excel" ? job.sheet || undefined : undefined;
      let settled = false;
      const settle = (result: "ok" | "failed" | "aborted") => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      currentResolve = () => settle("aborted");
      appendLog(`开始导入 ${database.value}.${table}`, "info");
      const options = {
        ...sourceOptions(),
        sheetName,
        database: database.value,
        tableName: table,
        columnMapping: mapping,
        mode: mode.value,
        keyColumns,
        createTable: job.createTable,
        truncateFirst: mode.value === "copy",
        batchSize: batchSize.value,
        datasourceId: host.datasourceId,
        extendedInsert: advanced.value.extendedInsert,
        maxStatementKb: advanced.value.maxStatementKb,
        nullForEmpty: advanced.value.nullForEmpty,
        ignoreForeignKey: advanced.value.ignoreForeignKey,
        continueOnError: advanced.value.continueOnError,
      };
      const client = runDbImport(options, {
        onEvent: event => {
          switch (event.type) {
            case "phase":
              appendLog(event.message, "info");
              break;
            case "progress":
              // 进度是「当前这张表」的，跨表时累加已完成的量
              run.value.done = run.value.baseDone + (event.done ?? 0);
              run.value.total = run.value.baseTotal + (event.total || 0);
              break;
            case "log":
              // 逐行错误只在日志里留痕，计数统一用 done 事件里的 errors：
              // 两边都加会让「错误」列的数值翻倍
              appendLog(`第 ${event.no} 行失败：${event.error}`, "error");
              break;
            case "error":
              run.value.failed = true;
              run.value.errorText = event.message || "导入失败";
              appendLog(`导入失败：${event.message}`, "error");
              message.error(event.message || "导入失败");
              settle("failed");
              break;
            case "done":
              run.value.inserted += event.inserted ?? 0;
              run.value.updated += event.updated ?? 0;
              run.value.skipped += event.skipped ?? 0;
              run.value.deleted += event.deleted ?? 0;
              run.value.errors += event.errors ?? 0;
              run.value.elapsedMs += event.elapsedMs ?? 0;
              run.value.baseDone += event.total || 0;
              run.value.baseTotal += event.total || 0;
              run.value.done = run.value.baseDone;
              run.value.total = run.value.baseTotal;
              appendLog(
                `完成 ${table}：新增 ${event.inserted}，更新 ${event.updated}，删除 ${event.deleted}，` +
                  `跳过 ${event.skipped}，错误 ${event.errors}，耗时 ${event.elapsedMs} ms`,
                (event.errors ?? 0) > 0 || event.failed ? "warn" : "ok",
              );
              for (const detail of event.errorDetails ?? []) {
                appendLog(detail, "error");
              }
              if (event.failed) {
                run.value.failed = true;
                run.value.errorText = `错误 ${event.errors} 行，见日志`;
                settle("failed");
              } else {
                settle("ok");
              }
              break;
            default:
              break;
          }
        },
        onError: msg => {
          run.value.failed = true;
          run.value.errorText = msg;
          appendLog(msg, "error");
          message.error(msg);
          settle("failed");
        },
      });
      // runDbImport 返回的是 SSE 客户端，不是关闭函数：
      // 包一层再存，中断时调 close() 即可，避免把客户端实例当函数调用
      abortRun = () => client.close();
    });
  }

  /**
   * 追加一行日志。
   *
   * <p>不在这里滚到底：滚动要拿到 DOM，而日志框住在第 7 步的组件里，
   * 由它监听 {@code logLines} 自己滚。</p>
   *
   * @param text 日志文本
   * @param tone 语气：ok / warn / error / info
   */
  function appendLog(text: string, tone: string): void {
    const now = new Date();
    const at = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds(),
    ).padStart(2, "0")}`;
    logLines.value = [...logLines.value, { at, text, tone }];
  }

  /** 保存日志到本地文件 */
  function saveLog(): void {
    const content = logLines.value.map(l => `[${l.at}] ${l.text}`).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-${currentTarget.value || "log"}-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** 复制日志到剪贴板 */
  async function copyLog(): Promise<void> {
    const content = logLines.value.map(l => `[${l.at}] ${l.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(content);
      message.success("日志已复制");
    } catch {
      message.warning("复制失败，请用「保存日志」");
    }
  }

  /**
   * 打开向导时重置全部状态。
   *
   * <p>不能只重置 {@code step}：上一次导入的文件名、映射、日志都会残留，
   * 用户会看到「新向导里已经有上次的 40 行日志」。</p>
   */
  function reset(): void {
    step.value = 0;
    type.value = "csv";
    fileName.value = "";
    fileSize.value = 0;
    encoding.value = "AUTO";
    preview.value = null;
    sheets.value = [];
    selectedSheets.value = [];
    activeSheet.value = "";
    recordDelimiter.value = "CRLF";
    delimiter.value = ",";
    textQualifier.value = '"';
    decimalSymbol.value = ".";
    fieldNamesLine.value = 1;
    firstDataLine.value = 2;
    lastDataLine.value = 0;
    dateOrder.value = "YMD";
    dateTimeOrder.value = "YMD";
    dateSeparator.value = "/";
    yearSeparator.value = "/";
    timeSeparator.value = ":";
    database.value = host.database ?? "";
    targetRows.value = [];
    targetColumns.value = [];
    mappingRows.value = [];
    mode.value = "append";
    batchSize.value = 500;
    advanced.value = { ...DB_IMPORT_ADVANCED_DEFAULTS };
    logLines.value = [];
    run.value = emptyRun();
  }

  /** 切换类型时清空已解析结果（列结构完全不同） */
  watch(type, () => {
    clearFile();
    fieldNamesLine.value = 1;
    firstDataLine.value = 2;
    lastDataLine.value = 0;
  });

  /**
   * 表头行改成 0（没有表头）时，第一个数据行必须回到 1。
   *
   * <p>两者独立可编辑，但默认值是「表头 1 / 数据 2」。用户把表头关掉却不动数据行，
   * 第 1 行就会被静默丢掉——这是最难被发现的一类导入错误。</p>
   */
  watch(fieldNamesLine, value => {
    if (value <= 0) {
      firstDataLine.value = 1;
    } else if (firstDataLine.value <= value) {
      firstDataLine.value = value + 1;
    }
  });

  /**
   * 改编码后立刻按新编码重解析。
   *
   * <p>编码错了看到的预览就是一屏乱码，用户不会去点「重新解析」——
   * 他们只会认定「这个导入坏了」。选择框变化本身不频繁，一次请求可以接受。</p>
   */
  watch(encoding, () => {
    if (preview.value?.token) {
      void reparse();
    }
  });

  return {
    // 步骤
    step,
    steps: IMPORT_STEPS,
    type,
    title,
    subtitle,
    canGoNext,
    summaryOf,
    prev,
    next,
    goTo,
    onEnterStep,
    reset,
    interrupt,
    // 文件
    fileName,
    fileSize,
    encoding,
    parsing,
    preview,
    sheets,
    selectedSheets,
    activeSheet,
    excelAvailable,
    acceptAttr,
    onFilePicked,
    reparse,
    clearFile,
    selectAllSheets,
    toggleSheet,
    // 源选项
    recordDelimiter,
    delimiterModel,
    textQualifier,
    decimalSymbol,
    fieldNamesLine,
    firstDataLine,
    lastDataLine,
    dateOrder,
    dateTimeOrder,
    dateSeparator,
    yearSeparator,
    timeSeparator,
    // 目标表
    database,
    databases,
    tableNames,
    targetRows,
    targetColumns,
    currentTarget,
    targetDisplay,
    duplicatedTargets,
    onDatabaseChange,
    onTargetTableChange,
    onCreateTableToggle,
    // 映射
    mappingRows,
    mappingConflict,
    mappedCount,
    hasKeyColumns,
    targetHasPrimaryKey,
    onKeyToggle,
    onSheetChange,
    // 模式
    mode,
    modeLabel,
    modeNeedsKey,
    batchSize,
    advanced,
    advancedVisible,
    // 执行
    running,
    run,
    runErrors,
    logLines,
    progressPercent,
    elapsedText,
    batchTotal,
    startImport,
    saveLog,
    copyLog,
    // 展示
    previewRows,
    previewColumns,
    columnLabel,
    delimiterLabel,
    formatSize,
    TARGET_COLUMNS,
    MAPPING_COLUMNS,
  };
}

/**
 * 控制器类型：步骤体统一用这个类型接收上下文。
 *
 * <p>外壳用 {@code reactive(useImportWizard(...))} 包一层，ref 会被自动解包，
 * 模板里就能直接写 {@code ctx.targetRows}、{@code v-model="ctx.mode"}；
 * 这个类型与之对应，否则步骤体拿到的是一个个 ref 壳子。</p>
 */
export type ImportWizardCtx = UnwrapNestedRefs<ReturnType<typeof useImportWizard>>;
