<script setup lang="ts">
/**
 * 数据源中心（@pages/datasource）
 *
 * 左右两栏布局：
 *   左栏 —— 状态过滤 + 关键词搜索 + 数据源卡片列表 + 添加入口；
 *   右栏 —— 页头（面包屑 + 搜索 / 刷新 / 新增）+ 详情头 + 页签
 *           （概览 / 连接配置 / 监控指标 / 操作日志）。
 * 支持 JDBC/Redis/InfluxDB/Neo4j/Nacos/ZooKeeper/Nginx：
 * 列表 + 新增/编辑/删除 + 连通性测试 + 表结构浏览 + 按类型跳转对应管理页。
 * 数据来源：后端 spring-support-datasource-hub-starter 的 /ms/datasource/*。
 *
 * 视觉：koi 变量（--el-* / --metric-* / --status-*），颜色全部走令牌，暗色自动适配。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { CircleCheck, Clock, Timer } from "@element-plus/icons-vue";
// 组件全部显式引入：本页被采集台与监控台共用，两个应用都不保证全局注册 Re*，
// 只靠全局注册会出现「卡片能显示但按钮/表格不渲染」的问题。
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
import ReForm from "@repo/ui/re-form";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReStatCard from "@repo/ui/re-stat-card";
import ReSwitch from "@repo/ui/re-switch";
import ReTab from "@repo/ui/re-tab";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import { ReFormItem } from "@repo/ui/re-kit";
import { formatDuration } from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
// 左栏右键菜单：同包内组件，采集台/监控台都能用（不能 import 宿主应用的东西）
import DsmContextMenu from "../components/console/DsmContextMenu.vue";
import DatasourceMetricPanel from "../metrics/DatasourceMetricPanel.vue";
import DatasourceOperLogPanel from "../metrics/DatasourceOperLogPanel.vue";
import {
  fetchDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSource,
  fetchDataSourceTypes,
  type CollectColumn,
  type CollectTable,
  type DataSourceInfo,
  type DataSourceTestResult,
} from "../api";
// 表 / 字段选择与取数走共享件：这里不再自己拉表拉列，
// 顺带把「表有注释显示中文、副标题给表名」这条口径也一起接过来
import { TableSelect, ColumnSelect } from "../components/selectors";
import {
  deleteJdbcDriverJar,
  fetchJdbcDriverJars,
  uploadJdbcDriverJar,
} from "../api";
import {
  deleteDatasourceTunnel,
  fetchDatasourceTunnel,
  saveDatasourceTunnel,
} from "../api";
import type { DataSourceTunnel, JdbcDriverJar } from "../api";

import type { ReTableColumn } from "@repo/ui/re-table";
import type { ReTabItem } from "@repo/ui/re-tab";
// 状态口径与左栏筛选抽成纯函数模块：原先内联在本文件里，「异常」档没有判定分支
// 也无人能测出来。纯函数可被 node --test 直接覆盖（tests/datasourceStatus.test.mjs）。
import {
  filterDataSources,
  isAbnormal,
  isEnabled,
  statusCounts,
  type DataSourceStatusKey
} from "../datasourceStatus";
import { hasRoutePath, nearbyRoutePaths } from "../managerRoutes";
import { managerRouteFor } from "../routes";

/**
 * 宿主应用注入的额外页签（如监控台的「数据表」= 数据库管理器内嵌）。
 *
 * <p>本页位于共享包 @pages/datasource，采集台与监控台都在用，
 * 因此**不能**在这里 import 任何宿主应用自己的 view —— 采集台构建时会直接失败。
 * 需要把应用级页面并入数据源中心时，由宿主通过 extraTabs + 同名插槽注入：
 * 页签名即插槽名，插槽会收到当前选中的数据源。</p>
 */
const props = withDefaults(
  defineProps<{
    /** 追加到内置页签之后的宿主页签；插槽名 = name，插槽参数 = { datasource } */
    extraTabs?: ReTabItem[];
  }>(),
  { extraTabs: () => [] },
);

/** 左栏状态过滤键：all 全部 / online 在线 / abnormal 异常 / offline 离线 */
type StatusFilterKey = DataSourceStatusKey;

/** 左栏状态过滤项 */
interface StatusFilterItem {
  /** 过滤键 */
  key: StatusFilterKey;
  /** 展示文案 */
  label: string;
  /** 圆点颜色（应用层语义色，带令牌兜底） */
  color: string;
  /** 数量徽标；null 表示该口径无判定来源、不展示徽标（当前四个内置项都有值） */
  count: number | null;
}

const router = useRouter();

const list = ref<DataSourceInfo[]>([]);
const loading = ref(false);
const types = ref<string[]>([]);

// 新增/编辑弹窗
const dialogVisible = ref(false);
const editing = ref<DataSourceInfo | null>(null);
const form = ref<Partial<DataSourceInfo>>({});
const saving = ref(false);

/** JDBC 驱动 jar 库（后端管理的目录，本页只上传与选用） */
const driverJars = ref<JdbcDriverJar[]>([]);
/** 隐藏的文件选择 input 的 ref */
const driverJarInput = ref<HTMLInputElement | null>(null);
/** 正在上传的 jar 文件名，用于按钮上的等待态 */
const driverJarUploading = ref(false);

/** 驱动 jar 下拉项：显示「文件名 + 驱动类」，两者都要能看到 */
const driverJarOptions = computed(() =>
  driverJars.value.map((jar) => ({
    label: `${jar.jarName} · ${jar.driverClassName}`,
    value: jar.id,
  })),
);

/**
 * 拉取驱动 jar 列表。
 *
 * <p>失败只提示不打断表单：驱动 jar 是可选增强，拉不到列表不该让人连普通
 * MySQL 数据源都保存不了。</p>
 */
const loadDriverJars = async () => {
  try {
    driverJars.value = await fetchJdbcDriverJars();
  } catch (error) {
    message.warning(`读取驱动 jar 列表失败: ${String((error as Error)?.message ?? error)}`);
  }
};

/**
 * 选了 jar 文件就上传，并自动选中它、把它登记的驱动类名填进表单。
 *
 * <p>自动填驱动类名是因为上传时后端已经校验过这个类能加载，
 * 让用户再手输一遍同一个字符串只会引入不一致。</p>
 *
 * @param event 文件选择事件
 */
const onPickDriverJar = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  // 允许重复上传同一个文件
  input.value = "";
  if (!file) return;
  const driverClass = (form.value.driverClassName ?? "").trim();
  if (!driverClass) {
    message.warning("先填驱动类名，再上传 jar（后端要当场验证这个类能不能加载）");
    return;
  }
  driverJarUploading.value = true;
  try {
    const saved = await uploadJdbcDriverJar(file, driverClass, file.name);
    await loadDriverJars();
    form.value.driverJarId = saved.id;
    form.value.driverClassName = saved.driverClassName;
    message.success(`已上传并选中驱动 ${saved.jarName}`);
  } catch (error) {
    message.error(`上传驱动 jar 失败: ${String((error as Error)?.message ?? error)}`);
  } finally {
    driverJarUploading.value = false;
  }
};

// ------------------------------ JDBC 额外连接参数 ------------------------------
// JDBC 数据源建连串允许两种形态：库名（三段式，后端按 MySQL 模板拼）或整串 URL。
// 这里给「额外参数」一个结构化编辑器：一行 = ReSelect 参数名 + 值输入框。
// 保存时并入连接串的 query：整串 URL 形态原地合并；三段式按后端同款模板补默认参数
// 再叠加自定义行（同名覆盖）。这样 MySQL 的 useSSL / serverTimezone /
// allowPublicKeyRetrieval 之类不用整串手抄。

/** 额外参数行：键为空的行在保存时忽略 */
const extraParams = ref<Array<{ key: string; value: string }>>([]);

/** 常用 JDBC 连接参数预置（MySQL 系为主，兼顾各库高频项） */
/**
 * JDBC 连接参数白名单。
 *
 * <p>下拉里的每一项都是**任意 JDBC 驱动都可能认的参数名**，而不是某一个
 * 数据库的专属参数 —— 选驱动与填参数是两件独立的事：同一个 `connectTimeout`
 * MySQL / PostgreSQL / H2 都认，`ssl` 三家都有各自的实现。这里按「通用 / 各家专属」
 * 分组标注，只为让用户知道从哪来，不做按驱动类型过滤（过滤会让换驱动后
 * 之前配好的参数凭空消失，代价大于收益）。</p>
 *
 * <p><b>白名单列不全，所以下拉必须允许自定义</b>：各驱动有大量私有参数
 * （{@code oracle.jdbc.*}、{@code sqlserver.*}、{@code h2.*} 之类），
 * 靠枚举维护既不完整也易过时。故下拉开了 {@code allow-create}，
 * 敲什么就是什么，保存时原样进连接串。</p>
 */
const COMMON_JDBC_PARAMS: Array<{ label: string; value: string }> = [
  // ---- 通用（多数驱动都认） ----
  { label: "connectTimeout（连接超时，毫秒）", value: "connectTimeout" },
  { label: "socketTimeout（读超时，毫秒）", value: "socketTimeout" },
  { label: "loginTimeout（登录超时，秒）", value: "loginTimeout" },
  { label: "ssl（是否启用 SSL）", value: "ssl" },
  { label: "sslMode（PG/PG 风格：disable/require/verify-full）", value: "sslMode" },
  { label: "tcpKeepAlive（TCP 保活）", value: "tcpKeepAlive" },
  { label: "applicationName（驱动上报的应用名）", value: "ApplicationName" },
  { label: "currentSchema（当前 schema）", value: "currentSchema" },
  { label: "catalog（默认库）", value: "catalog" },
  { label: "properties（驱动自定义属性容器）", value: "properties" },
  { label: "user（用户名，部分驱动认）", value: "user" },
  { label: "password（密码，部分驱动认）", value: "password" },

  // ---- MySQL / MariaDB ----
  { label: "useSSL（MySQL，常配 false）", value: "useSSL" },
  { label: "serverTimezone（MySQL，如 Asia/Shanghai）", value: "serverTimezone" },
  { label: "characterEncoding（如 utf8 / utf8mb4）", value: "characterEncoding" },
  { label: "useUnicode（常配 true）", value: "useUnicode" },
  { label: "allowPublicKeyRetrieval（常配 true）", value: "allowPublicKeyRetrieval" },
  { label: "rewriteBatchedStatements（批处理重写）", value: "rewriteBatchedStatements" },
  { label: "zeroDateTimeBehavior（如 convertToNull）", value: "zeroDateTimeBehavior" },
  { label: "useInformationSchema（元数据走 information_schema）", value: "useInformationSchema" },
  { label: "useServerPrepStmts（服务端预编译）", value: "useServerPrepStmts" },
  { label: "cachePrepStmts（预编译缓存）", value: "cachePrepStmts" },
  { label: "prepStmtCacheSize（预编译缓存条数）", value: "prepStmtCacheSize" },
  { label: "prepStmtCacheSqlLimit（预编译 SQL 长度上限）", value: "prepStmtCacheSqlLimit" },
  { label: "useLocalSessionState（本地会话状态）", value: "useLocalSessionState" },
  { label: "useLocalTransactionState（本地事务状态）", value: "useLocalTransactionState" },
  { label: "elideSetAutoCommits（省略 setAutoCommit）", value: "elideSetAutoCommits" },
  { label: "autoReconnect（断线重连）", value: "autoReconnect" },
  { label: "tinyInt1isBit（tinyint(1) 映射为布尔）", value: "tinyInt1isBit" },
  { label: "nullCatalogMeansCurrent（常配 true）", value: "nullCatalogMeansCurrent" },
  { label: "allowMultiQueries（多语句）", value: "allowMultiQueries" },
  { label: "useAffectedRows（受影响行数语义）", value: "useAffectedRows" },
  { label: "useCursorFetch（游标分批拉取）", value: "useCursorFetch" },
  { label: "netTimeoutForStreamingResults（大结果集超时）", value: "netTimeoutForStreamingResults" },
  { label: "maxAllowedPacket（单包上限）", value: "maxAllowedPacket" },
  { label: "disableColumnStats（关统计）", value: "disableColumnStats" },
  { label: "cacheServerConfiguration（缓存服务器变量）", value: "cacheServerConfiguration" },
  { label: "maintainTimeStats（不统计维护时间）", value: "maintainTimeStats" },
  { label: "useOldAliasMetadataBehavior（旧别名元数据）", value: "useOldAliasMetadataBehavior" },
  { label: "useConfigs（按 profile 覆盖参数）", value: "useConfigs" },

  // ---- PostgreSQL ----
  { label: "sslmode（PG：disable/allow/prefer/require/verify-ca/verify-full）", value: "sslmode" },
  { label: "sslfactory（PG：org.postgresql.ssl.NonValidatingFactory）", value: "sslfactory" },
  { label: "sslrootcert（PG：CA 证书路径）", value: "sslrootcert" },
  { label: "sslcert（PG：客户端证书）", value: "sslcert" },
  { label: "sslkey（PG：客户端私钥）", value: "sslkey" },
  { label: "sslpassword（PG：私钥口令）", value: "sslpassword" },
  { label: "targetServerType（primary/any）", value: "targetServerType" },
  { label: "loadBalanceHosts（多主机轮询）", value: "loadBalanceHosts" },
  { label: "hostRecheckSeconds（主机存活复查间隔）", value: "hostRecheckSeconds" },
  { label: "connect_timeout（PG 连接超时，秒）", value: "connect_timeout" },
  { label: "options（PG 启动选项）", value: "options" },
  { label: "ApplicationName（PG 侧应用名）", value: "pgAppName" },
  { label: "loggerLevel（驱动日志级别）", value: "loggerLevel" },
  { label: "assumeMinServerVersion（假设的最低服务端版本）", value: "assumeMinServerVersion" },
  { label: "reWriteBatchedInserts（批量插入重写）", value: "reWriteBatchedInserts" },
  { label: "preferQueryMode（simple/extended）", value: "preferQueryMode" },
  { label: "stringtype（string 映射类型）", value: "stringtype" },
  { label: "DateStyle（日期字面量风格）", value: "DateStyle" },
  { label: "TimeZone（会话时区）", value: "TimeZone" },

  // ---- Oracle ----
  { label: "oracle.jdbc.ReadTimeout（Oracle 读超时，毫秒）", value: "oracle.jdbc.ReadTimeout" },
  { label: "oracle.net.CONNECT_TIMEOUT（Oracle 连接超时，毫秒）", value: "oracle.net.CONNECT_TIMEOUT" },
  { label: "oracle.jdbc.defaultNChar（默认 NCHAR）", value: "oracle.jdbc.defaultNChar" },
  { label: "oracle.jdbc.convertNCHARsToNvarchar（NCHAR 转换）", value: "oracle.jdbc.convertNCHARsToNvarchar" },
  { label: "oracle.jdbc.translationVariant（字符集变体）", value: "oracle.jdbc.translationVariant" },
  { label: "oracle.net.encryption_client（Oracle 加密）", value: "oracle.net.encryption_client" },
  { label: "oracle.net.crypto_checksum_client（校验和）", value: "oracle.net.crypto_checksum_client" },
  { label: "oracle.jdbc.fanEnabled（TAF 故障转移）", value: "oracle.jdbc.fanEnabled" },
  { label: "oracle.jdbc.implicitStatementCacheSize（隐式语句缓存）", value: "oracle.jdbc.implicitStatementCacheSize" },

  // ---- SQL Server ----
  { label: "encrypt（SQL Server 加密）", value: "encrypt" },
  { label: "trustServerCertificate（信任服务端证书）", value: "trustServerCertificate" },
  { label: "instanceName（命名实例）", value: "instanceName" },
  { label: "databaseName（默认库）", value: "databaseName" },
  { label: "sendTimeAsDatetime（时间按 datetime 发送）", value: "sendTimeAsDatetime" },
  { label: "responseBuffering（响应缓冲）", value: "responseBuffering" },
  { label: "selectMethod（游标/直接）", value: "selectMethod" },
  { label: "failoverPartner（故障转移伙伴）", value: "failoverPartner" },

  // ---- DB2 ----
  { label: "currentSchema（DB2 当前 schema）", value: "currentSchemaDB2" },
  { label: "retrieveMessagesFromServerOnGetMessage（DB2 取服务端消息）", value: "retrieveMessagesFromServerOnGetMessage" },
  { label: "progressiveStreaming（DB2 渐进流式）", value: "progressiveStreaming" },
  { label: "sslConnection（DB2 SSL）", value: "sslConnection" },

  // ---- H2 / 文件库 ----
  { label: "MODE（H2 兼容模式，如 MySQL/PostgreSQL）", value: "MODE" },
  { label: "DB_CLOSE_DELAY（H2 常开库，-1）", value: "DB_CLOSE_DELAY" },
  { label: "AUTO_SERVER（H2 多进程共享）", value: "AUTO_SERVER" },
  { label: "DATABASE_TO_UPPER（H2 标识符大小写）", value: "DATABASE_TO_UPPER" },
  { label: "CASE_INSENSITIVE_IDENTIFIERS（H2 不敏感标识）", value: "CASE_INSENSITIVE_IDENTIFIERS" },
  { label: "NON_KEYWORDS（H2 非关键字）", value: "NON_KEYWORDS" },
  { label: "IFEXISTS（H2 建表前判存在）", value: "IFEXISTS" },
  { label: "ACCESS_MODE_DATA（H2 内存表模式）", value: "ACCESS_MODE_DATA" },

  // ---- SQLite ----
  { label: "journal_mode（SQLite：WAL/MEMORY）", value: "journal_mode" },
  { label: "synchronous（SQLite 同步级别）", value: "synchronous" },
  { label: "busy_timeout（SQLite 忙等毫秒）", value: "busy_timeout" },
  { label: "cache_size（SQLite 页缓存，KB）", value: "cache_size" },
  { label: "foreign_keys（SQLite 外键开关）", value: "foreign_keys" },
];

/** 下拉选项 = 预置项 + 当前行里未预置的自定义键（编辑整串 URL 时让旧参数可见可选） */
const extraParamOptions = computed(() => {
  const seen = new Set(COMMON_JDBC_PARAMS.map((p) => p.value));
  const extra = extraParams.value
    .filter((r) => r.key && !seen.has(r.key))
    .map((r) => ({ label: `${r.key}（当前）`, value: r.key }));
  return [...COMMON_JDBC_PARAMS, ...extra];
});

/** 追加一行额外参数 */
const addExtraParam = () => {
  extraParams.value.push({ key: "", value: "" });
};

/** 删除一行额外参数 */
const removeExtraParam = (index: number) => {
  extraParams.value.splice(index, 1);
};

/** 解析整串 JDBC URL 的 query 为编辑行（保持原始文本，不做百分号解码/编码，往返不丢字节） */
const parseJdbcExtraParams = (url: string): Array<{ key: string; value: string }> => {
  const qIndex = url.indexOf("?");
  if (qIndex < 0) return [];
  const rows: Array<{ key: string; value: string }> = [];
  for (const seg of url.slice(qIndex + 1).split("&")) {
    if (!seg) continue;
    const eq = seg.indexOf("=");
    const key = (eq >= 0 ? seg.slice(0, eq) : seg).trim();
    if (!key) continue;
    rows.push({ key, value: eq >= 0 ? seg.slice(eq + 1).trim() : "" });
  }
  return rows;
};

/** 后端三段式拼装用的默认参数（与 DatasourceServiceImpl.resolveJdbcUrl 同款，并入时不丢） */
const MYSQL_URL_DEFAULTS: Array<[string, string]> = [
  ["useUnicode", "true"],
  ["characterEncoding", "utf8"],
  ["serverTimezone", "Asia/Shanghai"],
];

/**
 * 保存前把额外参数并入 form.database（仅 jdbc 类型）。
 *
 * @returns 值非法时为 false，调用方应中止保存
 */
const applyJdbcExtraParams = (): boolean => {
  if (form.value.type !== "jdbc") return true;
  const rows = extraParams.value
    .map((r) => ({ key: (r.key ?? "").trim(), value: (r.value ?? "").trim() }))
    .filter((r) => r.key !== "");
  const blankKeyWithValue = extraParams.value.some(
    (r) => !(r.key ?? "").trim() && (r.value ?? "").trim() !== ""
  );
  if (blankKeyWithValue) {
    message.warning("有一行额外参数只填了值、没选参数名");
    return false;
  }
  const badValue = rows.find((r) => /[&#?\s]/.test(r.value));
  if (badValue) {
    message.warning(`参数 ${badValue.key} 的值里不能有空格或 & ? # 分隔符`);
    return false;
  }
  /* 参数名同样要拦分隔符：下拉开了 allow-create，用户能敲任意文本。
     key 里混进 & 会凭空多出一个参数、混进 = 会把 key 和值错位，
     而后端 resolveJdbcUrl 对整串 URL 是原样透传的（只做文件库路径白名单），
     不会替我们兜住 query 结构的破坏。 */
  const badKey = rows.find((r) => /[&#?=\s]/.test(r.key));
  if (badKey) {
    message.warning(`参数名「${badKey.key}」里不能有空格或 & ? # = 分隔符`);
    return false;
  }
  const db = (form.value.database ?? "").trim();
  if (rows.length === 0 && !db.toLowerCase().startsWith("jdbc:")) return true;
  const query = new Map<string, string>();
  let base: string;
  if (db.toLowerCase().startsWith("jdbc:")) {
    // 整串 URL：保留 URL 本体（host/port/库名以 URL 为准），query 完全由行决定
    const qIndex = db.indexOf("?");
    base = qIndex >= 0 ? db.slice(0, qIndex) : db;
  } else {
    // 三段式：与后端同模板拼 mysql 串，再叠加行（同名覆盖默认）
    const host = (form.value.host ?? "").trim();
    if (!host || !db) {
      message.warning("填额外参数时需要主机地址与库名（或直接把完整 JDBC URL 粘进库名）");
      return false;
    }
    const port = form.value.port ?? 3306;
    base = `jdbc:mysql://${host}:${port}/${db}`;
    for (const [k, v] of MYSQL_URL_DEFAULTS) query.set(k, v);
  }
  // 同名参数会被 Map 覆盖、只留最后一条，用户却看不出哪条被吞了 —— 先拦下来说清楚
  const seenKeys = new Set<string>();
  const dupKey = rows.find((r) => (seenKeys.has(r.key) ? true : (seenKeys.add(r.key), false)));
  if (dupKey) {
    message.warning(`参数「${dupKey.key}」重复填写了，只会保留最后一条`);
    return false;
  }
  for (const r of rows) query.set(r.key, r.value);
  const qs = [...query.entries()].map(([k, v]) => `${k}=${v}`).join("&");
  form.value.database = qs ? `${base}?${qs}` : base;
  return true;
};

// 测试连接
const testing = ref<number | null>(null);

// 左栏筛选 / 右栏选中（纯前端交互状态）
/** 左栏与页头共享的搜索关键词 */
const keyword = ref("");
/** 左栏当前状态过滤键 */
const statusKey = ref<StatusFilterKey>("all");
/** 右栏当前页签 */
const activeTab = ref("overview");
/** 当前选中的数据源 ID；未选中时详情回落到列表第一条 */
const currentId = ref<number | null>(null);

/** 数据源类型图标和语义色（统一走 koi 变量） */
const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  jdbc: { icon: "Coin", color: "var(--metric-cpu, var(--el-color-primary))", label: "JDBC 数据库" },
  redis: { icon: "Coin", color: "var(--metric-redis, var(--el-color-danger))", label: "Redis" },
  influxdb: { icon: "Coin", color: "var(--el-color-success)", label: "InfluxDB" },
  neo4j: { icon: "Coin", color: "var(--metric-mem, var(--el-color-primary))", label: "Neo4j 图数据库" },
  nacos: { icon: "Coin", color: "var(--metric-disk, var(--el-color-warning))", label: "Nacos 配置中心" },
  zookeeper: { icon: "Coin", color: "var(--el-color-warning)", label: "ZooKeeper" },
  nginx: { icon: "Connection", color: "var(--metric-net, var(--el-color-info))", label: "Nginx" },
  etcd: { icon: "Coin", color: "var(--metric-net, var(--el-color-info))", label: "etcd 配置中心" },
  prometheus: { icon: "DataLine", color: "#e6522c", label: "Prometheus" },
};

const typeMeta = (type: string) => TYPE_META[type] || { icon: "Coin", color: "var(--el-text-color-placeholder)", label: type };

/** 新增/编辑弹窗左侧类型搜索关键词 */
const typeKeyword = ref("");

/**
 * 左侧类型面板：按关键词过滤（匹配类型键或中文标签）。
 *
 * <p>搜索框为空时原样返回全部类型，保持与历史下拉一致的完整清单。</p>
 */
const filteredTypes = computed(() => {
  const kw = typeKeyword.value.trim().toLowerCase();
  if (!kw) {
    return types.value;
  }
  return types.value.filter((t) => {
    const meta = typeMeta(t);
    return t.toLowerCase().includes(kw) || meta.label.toLowerCase().includes(kw);
  });
});

/**
 * 各类型的一句话连接说明（右侧表单头部展示）。
 *
 * @param type 数据源类型键
 * @return 说明文案
 */
const typeDesc = (type: string): string => {
  const desc: Record<string, string> = {
    jdbc: "通过 JDBC 驱动连接关系型数据库（MySQL / PostgreSQL / Oracle / SQL Server / H2 / SQLite 等）",
    redis: "连接 Redis 缓存服务，用于键值读写与监控",
    influxdb: "连接 InfluxDB 时序数据库，用于指标存储",
    neo4j: "连接 Neo4j 图数据库（HTTP 接口），用于图查询",
    nacos: "连接 Nacos 配置中心，用于配置与服务发现",
    zookeeper: "连接 ZooKeeper 协调服务，用于节点与配置管理",
    nginx: "连接 Nginx 服务器，可查看状态并控制进程启停",
    etcd: "连接 etcd 配置中心，用于键值存储",
    prometheus: "连接 Prometheus 监控服务，用于指标查询",
  };
  return desc[type] ?? "填写连接信息以接入该类型的数据源";
};

/**
 * 左侧类型面板点选：切换类型并同步默认端口。
 *
 * <p>与历史下拉 @change 口径一致：新建时重置默认端口，编辑时保留原端口。</p>
 *
 * @param t 目标类型键
 */
const selectType = (t: string) => {
  if (form.value.type === t) {
    return;
  }
  form.value.type = t;
  onTypeChange(t);
};

/** 弹窗内「测试连接」：仅编辑态（已有 id）可用，新建态需先保存 */
const dialogTesting = ref(false);
const dialogTestResult = ref<DataSourceTestResult | null>(null);
/** 弹窗内「高级设置」折叠态（备注等可选字段） */
const advancedOpen = ref(false);

/**
 * 弹窗内测试连接。
 *
 * <p>后端连通性测试按已落库的 id 进行（{@code testDataSource(id)}），
 * 新建态还没有 id，故先提示保存；编辑态直接调用并内联展示结果。</p>
 */
const testInDialog = async () => {
  const id = editing.value?.id;
  if (id == null) {
    message.info("请先保存数据源，再测试连接");
    return;
  }
  dialogTesting.value = true;
  try {
    const result = await testDataSource(id);
    dialogTestResult.value = result;
    if (result?.success) {
      message.success(result.message || "连接成功");
    } else {
      message.error(result?.message || "连接失败");
    }
    // 后端在测试时回写连接延迟，重新拉一次让其它视图同步最新值
    await load();
  } catch (e) {
    message.error(`测试失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    dialogTesting.value = false;
  }
};

/** 加载数据源列表 */
const load = async () => {
  loading.value = true;
  try {
    const [data, typeList] = await Promise.all([fetchDataSources(), fetchDataSourceTypes()]);
    list.value = data ?? [];
    types.value = typeList ?? ["jdbc", "redis", "influxdb", "neo4j", "nacos", "zookeeper"];
  } catch (e) {
    message.error(`加载失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
};

/** 打开新增弹窗 */
const openCreate = () => {
  editing.value = null;
  // controlMode/controlTarget 显式给空串而不是不写：
  // 不写的话字段在 form 里缺失，编辑弹窗里的选择器拿不到当前值
  form.value = {
    type: "jdbc",
    name: "",
    host: "127.0.0.1",
    port: 3306,
    username: "",
    password: "",
    database: "",
    remark: "",
    controlMode: "",
    controlTarget: ""
  };
  extraParams.value = [];
  advancedOpen.value = false;
  dialogTestResult.value = null;
  // 新建弹窗也要能选**已登记**的 jar：不加载的话下拉是空的，
  // 同一个驱动每次建数据源都得重传一遍（编辑弹窗 openEdit 已加载）
  void loadDriverJars();
  dialogVisible.value = true;
};

/** 打开编辑弹窗 */
const openEdit = (item: DataSourceInfo) => {
  editing.value = item;
  form.value = { ...item };
  // 整串 URL 形态的数据源：把已有 query 参数回显成可编辑行
  const dbText = typeof item.database === "string" ? item.database.trim() : "";
  extraParams.value = item.type === "jdbc" && dbText.toLowerCase().startsWith("jdbc:")
    ? parseJdbcExtraParams(dbText)
    : [];
  // 编辑既有数据源时也要能选 jar：老数据源没有这个字段，
  // 但用户可能正想给它换一个上传的驱动
  void loadDriverJars();
  advancedOpen.value = false;
  dialogTestResult.value = null;
  dialogVisible.value = true;
};

/** 保存 */
const save = async () => {
  if (!form.value.name?.trim()) {
    message.warning("请输入数据源名称");
    return;
  }
  if (!form.value.type) {
    message.warning("请选择数据源类型");
    return;
  }
  if (!applyJdbcExtraParams()) return;
  saving.value = true;
  try {
    if (editing.value) {
      // id 声明为可选（新建时无 id），但更新必须落到某条既有记录
      if (editing.value.id == null) {
        message.warning("数据源缺少 ID，无法更新");
        return;
      }
      await updateDataSource(editing.value.id, form.value);
      message.success("更新成功");
    } else {
      await createDataSource(form.value);
      message.success("创建成功");
    }
    dialogVisible.value = false;
    await load();
  } catch (e) {
    message.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    saving.value = false;
  }
};

/** 删除 */
const remove = async (item: DataSourceInfo) => {
  try {
    await ElMessageBox.confirm(`确定删除数据源 "${item.name}" 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    if (item.id == null) {
      message.warning("数据源缺少 ID，无法删除");
      return;
    }
    await deleteDataSource(item.id);
    message.success("删除成功");
    await load();
  } catch (e) {
    message.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

/** 卡片「更多」命令分发（收敛次要操作：浏览表结构 / 编辑 / 删除） */
const runCardCommand = (cmd: string, item: DataSourceInfo) => {
  if (cmd === "schema") {
    void openSchema(item);
    return;
  }
  if (cmd === "edit") {
    openEdit(item);
    return;
  }
  if (cmd === "delete") {
    void remove(item);
  }
};

// ------------------------------ 左栏右键菜单 ------------------------------
/** 左栏项右侧状态点：口径与上面状态过滤完全一致（../datasourceStatus 纯函数） */
const datasourceStatusKeyOf = (item: DataSourceInfo): Exclude<DataSourceStatusKey, "all"> =>
  isAbnormal(item) ? "abnormal" : isEnabled(item) ? "online" : "offline";

const STATUS_TEXT: Record<string, string> = { online: "在线", abnormal: "异常", offline: "离线" };
const datasourceStatusTextOf = (item: DataSourceInfo): string => STATUS_TEXT[datasourceStatusKeyOf(item)] ?? "-";

/** 右键菜单挂的目标项：菜单项闭包都基于它，弹出期间不换目标 */
const ctxMenu = reactive({ visible: false, x: 0, y: 0, item: null as DataSourceInfo | null });
const ctxMenuItems = [
  { key: "manage", label: "打开管理", icon: "View" },
  { key: "edit", label: "编辑数据源", icon: "EditPen" },
  { key: "delete", label: "删除数据源", icon: "Delete", danger: true, divided: true },
];

/**
 * 在数据源项上右键。
 * 顺手选中该项：菜单操作的是「被右键的那一项」，若右击 A 却作用在当前选中的 B 上，
 * 删除类操作会直接删错对象 —— 这是列表右键最常见的事故。
 */
const onItemContextMenu = (e: MouseEvent, item: DataSourceInfo) => {
  e.stopPropagation();
  selectSource(item);
  Object.assign(ctxMenu, { visible: true, x: e.clientX, y: e.clientY, item });
};

const onItemMenuSelect = (key: string) => {
  const item = ctxMenu.item;
  ctxMenu.item = null;
  if (!item) return;
  if (key === "manage") {
    openManager(item);
    return;
  }
  if (key === "edit") {
    openEdit(item);
    return;
  }
  if (key === "delete") {
    void remove(item);
  }
};

// ------------------------------ 表结构浏览 ------------------------------
// 入库节点要按真实列配字段映射，这里给同一个能力一个可见入口。
// 表清单与列元数据都交给共享的 TableSelect / ColumnSelect 取，
// 本页只保留「当前看哪张表、这些列怎么展示」两件事。

const schemaVisible = ref(false);
const schemaError = ref<string | null>(null);
const schemaSourceId = ref<number | null>(null);
const schemaSourceName = ref("");
const schemaTable = ref("");
/** 当前聚焦的字段：只用于在列结构里定位到某一个字段，不参与建表 */
const schemaColumn = ref("");
const schemaTables = ref<CollectTable[]>([]);
const schemaColumns = ref<CollectColumn[]>([]);

/** 表下拉实例：刷新按钮靠它重拉表清单 */
const schemaTablePicker = ref<InstanceType<typeof TableSelect> | null>(null);

/** 打开某数据源的表结构浏览 */
const openSchema = async (item: DataSourceInfo) => {
  if (item.id == null) {
    message.warning("数据源缺少 ID，无法浏览表结构");
    return;
  }
  schemaSourceId.value = item.id;
  schemaSourceName.value = item.name;
  schemaTable.value = "";
  schemaTables.value = [];
  schemaColumns.value = [];
  schemaError.value = null;
  schemaVisible.value = true;
};

/**
 * 表清单到达：默认选第一张表，省掉用户先点一次下拉才能看到列。
 *
 * <p>只在「还没选过」时自动选；用户主动清空后再回调不应该又替他选回来。</p>
 */
const onSchemaTables = (rows: CollectTable[]) => {
  schemaTables.value = rows;
  if (!schemaTable.value && rows.length) {
    schemaTable.value = rows[0].name;
  }
};

/** 列元数据到达 */
const onSchemaColumns = (rows: CollectColumn[]) => {
  schemaColumns.value = rows;
};

/** 取数失败：说清楚原因，别让空表格被当成「这张表没有列」 */
const onSchemaError = (message: string) => {
  schemaError.value = message;
  schemaTables.value = [];
  schemaColumns.value = [];
};

/** 手动刷新表清单 */
const refreshSchemaTables = () => {
  schemaError.value = null;
  schemaTablePicker.value?.reload();
};

/** 列元数据表格列定义 */
const schemaColumnDefs = computed<ReTableColumn[]>(() => [
  { prop: "position", label: "#", width: 60, align: "center" },
  { prop: "name", label: "列名", minWidth: 160 },
  { prop: "typeName", label: "类型", width: 140 },
  { prop: "size", label: "长度", width: 80, align: "center" },
  { prop: "nullable", label: "可空", width: 90, slot: "nullable", align: "center" },
  { prop: "primaryKey", label: "主键", width: 80, slot: "primaryKey", align: "center" },
]);

/** 测试连接 */
const test = async (item: DataSourceInfo) => {
  if (item.id == null) {
    message.warning("数据源缺少 ID，无法测试");
    return;
  }
  testing.value = item.id;
  try {
    const result = await testDataSource(item.id);
    // 后端在测试时把连接延迟/会话延迟回写台账，这里重新拉一次，让概览卡片显示最新值
    await load();
    if (result?.success) {
      const detail = describeLatency(result);
      message.success(detail ? `${result.message || "连接成功"}（${detail}）` : result.message || "连接成功");
    } else {
      message.error(result?.message || "连接失败");
    }
  } catch (e) {
    message.error(`测试失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    testing.value = null;
  }
};

/** 把测试结果里的两个延迟拼成一句可读文本 */
function describeLatency(result: DataSourceTestResult): string {
  const parts: string[] = [];
  // 延迟是真耗时，格式与全站其它耗时展示同源（ReTime 的 formatDuration）
  if (typeof result?.connectLatencyMs === "number") {
    parts.push(`连接 ${formatDuration(costMs(result.connectLatencyMs))}`);
  }
  if (typeof result?.sessionLatencyMs === "number") {
    parts.push(`会话 ${formatDuration(costMs(result.sessionLatencyMs))}`);
  }
  return parts.join(" / ");
}

/**
 * 打开对应类型的管理页面。
 *
 * <p>类型→路径的映射（{@code managerRouteFor}）与这些路径的路由声明（{@code routes.ts}）
 * 同出一处：映射写在本包、路由也由本包的 {@code createDatasourceManageRoutes} 产出，
 * 宿主只做合并。两处一旦分开声明就会漂 —— 历史上正是宿主各抄一份、漏了 Prometheus，
 * 导致「打开管理」对 Prometheus 稳定报「未注册」。</p>
 *
 * <p>宿主**不一定**注册了全部管理页（单宿主应用只 merge 自己需要的那些），
 * 没注册时**不能硬跳** —— 2026-10-05 实测落 /404?datasourceId=1。
 * 这里先查当前路由表，没有就给提示，不产生 404。</p>
 *
 * <p><strong>提示必须自带定位信息</strong>：只说「未注册 /prometheus 管理页」，
 * 这句话在「路由真的没有」和「路由有但路径写法不一致」两种情况下长得一模一样，
 * 而两者的修法完全不同。失败时把同前缀的已注册路径一并报出来（见 {@link managerRoutes}）。</p>
 */
const openManager = (item: DataSourceInfo) => {
  const route = managerRouteFor(item.type);
  if (!route) {
    message.warning(`类型 ${item.type} 的管理页面开发中`);
    return;
  }
  if (!hasRoutePath(router, route)) {
    const near = nearbyRoutePaths(router, route);
    message.warning(
      `当前应用未注册 ${route} 管理页，无法打开「${item.type}」管理界面`
      + (near.length ? `（已注册的同前缀路由：${near.join("、")}）` : ""),
    );
    return;
  }
  void router.push({ path: route, query: { datasourceId: item.id } });
};

/**
 * nginx 进程控制方式选项。
 *
 * <p>空串代表「自动探测」，与后端 {@code datasource_control_mode} 为空时的语义一致
 * （即本字段引入前的行为）。刻意不叫「自动」两个字：它是缺省值而非一个独立能力，
 * 叫「自动」会让人以为存在一个会主动猜测的实现。</p>
 */
const controlModeOptions = [
  { label: "自动探测", value: "" },
  { label: "systemd 托管（systemctl 启停）", value: "systemd" },
  { label: "本地目录（nginx -s 与裸启动）", value: "local" }
];

/** 根据类型显示默认端口 */
const defaultPort = (type: string): number => {
  const ports: Record<string, number> = {
    jdbc: 3306,
    redis: 6379,
    influxdb: 8086,
    neo4j: 7474,
    nacos: 8848,
    zookeeper: 2181,
    nginx: 80,
    etcd: 2379,
    prometheus: 9090,
  };
  return ports[type] ?? 3306;
};

/** 类型变化时更新默认端口 */
const onTypeChange = (type: string) => {
  if (!editing.value) {
    form.value.port = defaultPort(type);
  }
  // 控制方式只对 nginx 有意义。这里切走时不清空：清掉会让用户切回 nginx 时丢掉刚填的单元名，
  // 留着也不脏——后端 copy() 有类型闸门，非 nginx 的请求这两个字段一律置空（实测踩过：
  // 原先后端只校验取值在不在白名单、没看 type，直调 PUT 把 nginx 改成 jdbc 后
  // controlMode=systemd 被照单全收地留在库里）。
};

// ------------------------------ 视图派生数据 ------------------------------

/*
 * 启用口径与 API 层保持一致（见 api/index.ts 的 fetchDatasourceOptions）：
 * status 为 0 表示停用，其余（含 null 未标注）视为启用。
 *
 * <p>口径与筛选已抽到 ../datasourceStatus（纯函数、有单元测试）。
 * 此前这里写着「现有数据模型没有『异常』的判定来源」，实际 api/index.ts 早有
 * lastTestOk 字段（0 失败 / 1 连通 / null 未测试），于是「异常」页签被渲染、
 * 可点击，却因缺少筛选分支而永远为空——注释的错误前提掩盖了缺陷。</p>
 */

/** 当前选中的数据源；未显式选择或所选项已不存在时回落到第一条 */
const current = computed<DataSourceInfo | null>(() => {
  if (!list.value.length) {
    return null;
  }
  return list.value.find(item => item.id === currentId.value) ?? list.value[0];
});

/** 左栏数据源列表：状态过滤 + 关键词过滤（口径见 ../datasourceStatus） */
const filteredList = computed<DataSourceInfo[]>(() =>
  filterDataSources(list.value, statusKey.value, keyword.value),
);

/** 左栏状态过滤项与计数；三类互斥可加（online + abnormal + offline === all） */
const statusFilters = computed<StatusFilterItem[]>(() => {
  const counts = statusCounts(list.value);
  return [
    { key: "all", label: "全部", color: "var(--brand-500, var(--el-color-primary))", count: counts.all },
    { key: "online", label: "在线", color: "var(--status-success, var(--el-color-success))", count: counts.online },
    { key: "abnormal", label: "异常", color: "var(--status-warning, var(--el-color-warning))", count: counts.abnormal },
    { key: "offline", label: "离线", color: "var(--status-error, var(--el-color-danger))", count: counts.offline },
  ];
});

/**
 * 「操作日志」页签入口开关。
 *
 * <p>操作日志的落库与查询链路（后端 DatasourceOperLogController + 前端面板）已就位，
 * 但还没在验收环境端到端跑通，按约定**先做功能、不露入口**：置 false 时页签条上
 * 不出现该项，概览里的「查看操作日志」按钮一并隐藏，避免留下一个点了没反应的入口。
 * 验收通过后把这里改成 true 即两处一起放开。</p>
 */
const OPER_LOG_ENTRY_VISIBLE = false;

/** 右栏页签定义：内置页签 + 宿主注入页签（extraTabs 追加在后面） */
const tabItems = computed<ReTabItem[]>(() => [
  { name: "overview", label: "概览" },
  { name: "connection", label: "连接配置" },
  { name: "tunnel", label: "SSH 隧道" },
  { name: "metrics", label: "监控指标" },
  ...(OPER_LOG_ENTRY_VISIBLE ? [{ name: "logs", label: "操作日志" }] : []),
  ...props.extraTabs,
]);

/** 概览「运行状态」卡片文案：与左栏三态口径同源（正常 / 异常 / 已停用） */
const runtimeText = computed<string>(() => {
  const item = current.value;
  if (!item) {
    return "—";
  }
  if (isAbnormal(item)) {
    return "异常";
  }
  return isEnabled(item) ? "正常" : "已停用";
});

/** 详情头状态徽标文案：与左栏三态口径同源（在线 / 异常 / 已停用） */
const detailBadgeText = computed<string>(() => {
  const item = current.value;
  if (!item) {
    return "—";
  }
  if (isAbnormal(item)) {
    return "异常";
  }
  return isEnabled(item) ? "在线" : "已停用";
});

/** 详情头状态徽标样式：is-on 在线 / is-warn 异常 / is-off 已停用 */
const detailBadgeClass = computed<string>(() => {
  const item = current.value;
  if (!item) {
    return "is-off";
  }
  if (isAbnormal(item)) {
    return "is-warn";
  }
  return isEnabled(item) ? "is-on" : "is-off";
});

/** 毫秒数转卡片文案；无值时统一显示占位符，避免出现 0ms 误导 */
function formatLatency(value?: number | null): string {
  const cost = costMs(value);
  return cost == null ? "—" : formatDuration(cost);
}

/** 连接延迟卡片值：后端点「测试连接」时回写台账 */
const connectLatencyText = computed<string>(() => formatLatency(current.value?.connectLatencyMs));

/** 会话延迟卡片值 */
const sessionLatencyText = computed<string>(() => formatLatency(current.value?.sessionLatencyMs));

/** 趋势面板图例里的「平均 xx ms」：目前后端只回写最近一次探测值，平均即当前值 */
const latencyLegendText = computed<string>(() => {
  const v = current.value?.connectLatencyMs;
  return typeof v === "number" ? `${v}ms` : "-";
});

/** 最后检测时间卡片文案：取后端回写的测试时间，而不是前端硬编码「刚刚」 */
const lastTestText = computed<string>(() => {
  const raw = current.value?.lastTestTime;
  if (!raw) {
    return "未测试";
  }
  const at = new Date(raw);
  if (Number.isNaN(at.getTime())) {
    return "未测试";
  }
  return at.toLocaleString("zh-CN", { hour12: false });
});

/** 地址展示：host(:port)；缺省时回落占位符 */
const formatAddress = (item: DataSourceInfo): string => {
  if (!item.host) {
    return "—";
  }
  return item.port != null ? `${item.host}:${item.port}` : item.host;
};

/** 概览「连接配置」键值行（地址 / 配置路径 / 用户 / 备注 / 来源类型） */
const configRows = computed(() => {
  const item = current.value;
  if (!item) {
    return [];
  }
  return [
    { label: "地址", value: formatAddress(item), mono: true },
    { label: "配置路径", value: item.database || "—", mono: true },
    { label: "用户", value: item.username || "—", mono: false },
    { label: "备注", value: item.remark || "—", mono: false },
    { label: "来源类型", value: typeMeta(item.type).label, mono: false },
  ];
});

/** 「连接配置」页签的完整参数行（只用现有字段，不新造接口） */
const connectionRows = computed(() => {
  const item = current.value;
  if (!item) {
    return [];
  }
  return [
    { label: "数据源 ID", value: item.id != null ? String(item.id) : "—", mono: true },
    { label: "地址", value: formatAddress(item), mono: true },
    { label: "配置路径", value: item.database || "—", mono: true },
    { label: "用户", value: item.username || "—", mono: false },
    { label: "驱动类", value: item.driverClassName || "—", mono: true },
    { label: "状态", value: item.status === 0 ? "已停用" : "启用", mono: false },
    { label: "备注", value: item.remark || "—", mono: false },
    { label: "创建时间", value: item.createTime || "—", mono: true },
    { label: "更新时间", value: item.updateTime || "—", mono: true },
  ];
});

/** 左栏选中数据源（按 id 定位，列表刷新后仍能保持选中） */
const selectSource = (item: DataSourceInfo) => {
  currentId.value = item.id ?? null;
};

/**
 * 头部「更多」命令分发。
 *
 * 头部合并了原先的「面包屑行」与「详情头卡」，两处的操作都收进这一个下拉：
 * - refresh：页面级（刷新列表），未选中数据源时也要可用
 * - schema / edit / delete：依赖选中项，交给既有的 runCardCommand 复用
 */
const runHeadCommand = (cmd: string) => {
  if (cmd === "refresh") {
    void load();
    return;
  }
  if (!current.value) {
    return;
  }
  runCardCommand(cmd, current.value);
};

/* ==================== SSH 隧道（高级配置） ==================== */

/** 隧道表单：字段与后端 DataSourceTunnelDTO 一一对应 */
interface TunnelForm {
  /** 已存在的隧道 ID；null 表示还没配过隧道 */
  id: number | null;
  name: string;
  /** LOCAL 本地转发(-L) / REMOTE 反向转发(-R) / DYNAMIC 动态 SOCKS5 */
  type: string;
  sshHost: string;
  sshPort: number | null;
  sshUsername: string;
  /** PASSWORD 口令 / KEY 私钥 */
  sshAuthType: string;
  /** 口令：查询接口不回显，留空表示沿用库里已存的值 */
  sshPassword: string;
  /** 私钥：PEM 文本或私钥文件路径（查询接口会回显） */
  sshPrivateKey: string;
  /** 私钥口令：同样不回显，留空即不改 */
  sshPassphrase: string;
  /** 本地端口；null = 由后端自动分配 */
  localPort: number | null;
  remoteHost: string;
  remotePort: number | null;
  bindAddress: string;
  /** 1 启用 / 0 停用 */
  status: number;
}

/** 空表单：默认值与后端一致（LOCAL + 口令认证 + 停用） */
const emptyTunnel = (): TunnelForm => ({
  id: null,
  name: "",
  type: "LOCAL",
  sshHost: "",
  sshPort: 22,
  sshUsername: "",
  sshAuthType: "PASSWORD",
  sshPassword: "",
  sshPrivateKey: "",
  sshPassphrase: "",
  localPort: null,
  remoteHost: "",
  remotePort: null,
  bindAddress: "",
  status: 0,
});

const tunnel = ref<TunnelForm>(emptyTunnel());
const tunnelLoading = ref(false);
const tunnelSaving = ref(false);

const TUNNEL_TYPES = [
  { label: "本地转发 (-L)", value: "LOCAL" },
  { label: "反向转发 (-R)", value: "REMOTE" },
  { label: "动态 SOCKS5 (-D)", value: "DYNAMIC" }
];
const TUNNEL_AUTHS = [
  { label: "口令", value: "PASSWORD" },
  { label: "私钥", value: "KEY" }
];
/** DYNAMIC 走 SOCKS5 代理，不指定远端目标 */
const tunnelIsDynamic = computed(() => tunnel.value.type === "DYNAMIC");
const tunnelIsKeyAuth = computed(() => tunnel.value.sshAuthType === "KEY");

/**
 * 读当前数据源的隧道配置。
 *
 * <p>后端未配置时 data 为 null，表单落到空表单而不是报错：一个数据源
 * 允许没有隧道，未配置是正常状态而非异常。</p>
 *
 * @param id 数据源 ID
 */
const loadTunnel = async (id: number) => {
  tunnelLoading.value = true;
  try {
    const data = await fetchDatasourceTunnel(id);
    if (!data) {
      tunnel.value = emptyTunnel();
      return;
    }
    tunnel.value = {
      id: data.id ?? null,
      name: data.name ?? "",
      type: data.type || "LOCAL",
      sshHost: data.sshHost ?? "",
      sshPort: data.sshPort ?? 22,
      sshUsername: data.sshUsername ?? "",
      sshAuthType: data.sshAuthType || "PASSWORD",
      // 口令类字段查询接口不回显，这里留空，保存时后端按「空=不改」处理
      sshPassword: "",
      sshPrivateKey: data.sshPrivateKey ?? "",
      sshPassphrase: "",
      localPort: data.localPort ?? null,
      remoteHost: data.remoteHost ?? "",
      remotePort: data.remotePort ?? null,
      bindAddress: data.bindAddress ?? "",
      status: data.status ?? 0
    };
  } catch (e) {
    message.error(`读取隧道配置失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    tunnelLoading.value = false;
  }
};

/** 保存隧道；校验口径与后端 validate 保持一致（后端拒绝的这里先拦下） */
const saveTunnel = async () => {
  const id = current.value?.id;
  if (id == null) {
    return;
  }
  const f = tunnel.value;
  if (!f.sshHost.trim()) {
    message.warning("请填写 SSH 服务器地址");
    return;
  }
  if (!f.sshUsername.trim()) {
    message.warning("请填写 SSH 用户名");
    return;
  }
  if (!tunnelIsDynamic.value) {
    if (!f.remoteHost.trim()) {
      message.warning("请填写远端目标主机（数据库地址）");
      return;
    }
    if (!f.remotePort || f.remotePort <= 0) {
      message.warning("请填写远端目标端口");
      return;
    }
  }
  if (tunnelIsKeyAuth.value && !f.sshPrivateKey.trim()) {
    message.warning("私钥认证请填写私钥（PEM 文本或私钥文件路径）");
    return;
  }
  tunnelSaving.value = true;
  try {
    await saveDatasourceTunnel(id, { ...f } as Partial<DataSourceTunnel>);
    message.success("隧道配置已保存");
    await loadTunnel(id);
  } catch (e) {
    message.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    tunnelSaving.value = false;
  }
};

/** 删除隧道：删除后该数据源的连接测试改为直连 */
const removeTunnel = async () => {
  const id = current.value?.id;
  if (id == null) {
    return;
  }
  try {
    await ElMessageBox.confirm("删除后该数据源的连接测试将直连目标库（内网不可达时会失败），确定删除？", "删除隧道", {
      type: "warning"
    });
  } catch {
    return;
  }
  tunnelSaving.value = true;
  try {
    await deleteDatasourceTunnel(id);
    message.success("隧道已删除");
    await loadTunnel(id);
  } catch (e) {
    message.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    tunnelSaving.value = false;
  }
};

// 只有选中数据源变化才读隧道：右栏整体在 <template v-if="current"> 内，
// 没选中时页签不渲染，此时不该发请求
watch(
  () => current.value?.id ?? null,
  (id) => {
    if (id == null) {
      tunnel.value = emptyTunnel();
      return;
    }
    void loadTunnel(id);
  },
  { immediate: true }
);

onMounted(load);
</script>

<template>
  <div class="ds">
    <div class="ds-layout">
      <!-- 左栏：状态过滤 / 搜索 / 数据源列表 / 添加入口 -->
      <aside class="ds-side">
        <div class="ds-side-card">
          <!-- 状态过滤列表 -->
          <ul class="ds-status">
            <li
              v-for="item in statusFilters"
              :key="item.key"
              class="ds-status__item"
              :class="{ 'is-active': statusKey === item.key }"
              @click="statusKey = item.key"
            >
              <span class="ds-status__dot" :style="{ background: item.color }" />
              <span class="ds-status__label">{{ item.label }}</span>
              <span v-if="item.count !== null" class="ds-status__count">{{ item.count }}</span>
            </li>
          </ul>

          <div class="ds-side__divider" />

          <!-- 关键词搜索（与页头搜索框共享关键词） -->
          <ReInput
            v-model="keyword"
            class="ds-side__search"
            prefix-icon="Search"
            placeholder="搜索数据源"
            clearable
          />

          <!-- 数据源卡片列表 -->
          <div class="ds-side__list">
            <p v-if="loading && !list.length" class="ds-side__hint">加载中…</p>
            <ReEmpty v-else-if="!filteredList.length" description="暂无匹配的数据源" :image-size="60" />
            <template v-else>
              <button
                v-for="item in filteredList"
                :key="item.id ?? item.name"
                type="button"
                class="ds-item"
                :class="{ 'is-active': current === item }"
                @click="selectSource(item)"
                @contextmenu.prevent="onItemContextMenu($event, item)"
              >
                <span class="ds-item__icon" :style="{ '--tile': typeMeta(item.type).color }">
                  <ReIcon :name="typeMeta(item.type).icon" :size="16" />
                </span>
                <span class="ds-item__body">
                  <span class="ds-item__row">
                    <b class="ds-item__name" :title="item.name">{{ item.name }}</b>
                    <span class="ds-item__chip" :style="{ '--tile': typeMeta(item.type).color }">{{ item.type.toUpperCase() }}</span>
                  </span>
                  <span class="ds-item__addr mono">{{ item.host }}:{{ item.port }}</span>
                </span>
                <i
                  class="ds-item__dot"
                  :class="`is-${datasourceStatusKeyOf(item)}`"
                  :title="datasourceStatusTextOf(item)"
                  aria-hidden="true"
                />
              </button>
            </template>
          </div>

          <!-- 底部新增入口（虚线边框） -->
          <button type="button" class="ds-side__add" @click="openCreate">
            <ReIcon name="Plus" :size="14" />
            <span>添加数据源</span>
          </button>
        </div>

        <!-- 左栏数据源右键菜单（打开管理 / 编辑 / 删除）。
             右键时同步选中该项：不选中却对另一项做操作，是最容易让人误删的交互。 -->
        <DsmContextMenu
          v-model:visible="ctxMenu.visible"
          :x="ctxMenu.x"
          :y="ctxMenu.y"
          :items="ctxMenuItems"
          @select="onItemMenuSelect"
        />
      </aside>

      <!-- 右栏：头部 + 页签 + 内容合成一整张卡（白卡片落在浅灰画布上，边界一眼可分）。
           头部两行：上行面包屑、下行「图标块 + 名称 + 类型徽标 + 状态胶囊」，右侧操作区。 -->
      <div class="ds-main">
        <div class="ds-main-card">
          <div class="ds-head">
            <div class="ds-head__top">
              <span class="ds-crumb">
                <ReIcon name="DataBoard" :size="15" class="ds-crumb__icon" />
                <span>基础设施</span>
                <ReIcon name="ArrowRight" :size="12" class="ds-crumb__arrow" />
                <span>数据源中心</span>
              </span>
            </div>
            <div class="ds-head__row">
              <div class="ds-head__main">
                <span
                  v-if="current"
                  class="ds-head__tile"
                  :style="{ '--tile': typeMeta(current.type).color }"
                  aria-hidden="true"
                >
                  <ReIcon :name="typeMeta(current.type).icon" :size="20" />
                </span>
                <h2 class="ds-detail__name" :title="current?.name">{{ current?.name ?? "数据源中心" }}</h2>
                <template v-if="current">
                  <span class="ds-detail__chip" :style="{ '--tile': typeMeta(current.type).color }">
                    {{ current.type.toUpperCase() }}
                  </span>
                  <span class="ds-detail__badge" :class="detailBadgeClass">
                    <span class="ds-detail__badge-dot" />
                    {{ detailBadgeText }}
                  </span>
                </template>
              </div>
              <div class="ds-head__actions">
                <ReInput
                  v-model="keyword"
                  class="ds-head__search"
                  prefix-icon="Search"
                  placeholder="搜索数据源"
                  clearable
                />
                <!-- 页头动作一律方形图标钮（文字进 tooltip / aria-label）：
                     文字按钮会把标题行撑高，长名称一换行头卡就跟着跳。 -->
                <ReButton icon="Plus" :show-text="false" layout="square" @click="openCreate">新增数据源</ReButton>
                <template v-if="current">
                  <ReButton icon="Lightning" :show-text="false" layout="square" :loading="testing === current.id" @click="test(current)">测试连接</ReButton>
                  <ReButton icon="View" :show-text="false" type="primary" layout="square" @click="openManager(current)">打开管理</ReButton>
                </template>
                <ElDropdown trigger="click" placement="bottom-end" @command="(cmd: string | number | object) => runHeadCommand(cmd as string)">
                  <!-- 触发器刻意用裸 el-button 而非 ReButton：
                       ReButton 在 icon + show-text=false 时内部再包一层 ElTooltip，
                       而 ElDropdown 自身也用 ElOnlyChild 克隆子节点挂 click 监听，
                       两层 OnlyChild 嵌套会互相干扰，导致下拉点不开。 -->
                  <el-button class="ds-head__more" text aria-label="更多">
                    <ReIcon name="MoreFilled" :size="16" />
                  </el-button>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="refresh"><ReIcon name="RefreshRight" />刷新列表</ElDropdownItem>
                    <template v-if="current">
                      <ElDropdownItem v-if="current.type === 'jdbc'" command="schema" divided><ReIcon name="Grid" />浏览表结构</ElDropdownItem>
                      <ElDropdownItem command="edit"><ReIcon name="EditPen" />编辑数据源</ElDropdownItem>
                      <ElDropdownItem command="delete" divided style="color: var(--el-color-danger)"><ReIcon name="Delete" />删除数据源</ElDropdownItem>
                    </template>
                  </ElDropdownMenu>
                </template>
            </ElDropdown>
            </div>
          </div>
        </div>

        <template v-if="current">
          <!-- 页签：下划线式（UI 稿：页签条自带一条贯通的底线，激活项压主色下划线） -->
          <ReTab v-model="activeTab" variant="underline" :tabs="tabItems" stretch>
            <!-- 概览：统计卡 + （趋势 | 连接配置）双栏 -->
            <template #overview>
              <div class="ds-overview">
                <div class="ds-stats">
                  <ReStatCard size="compact" title="连接延迟" :value="connectLatencyText" :icon="Timer" icon-color="var(--metric-cpu, var(--el-color-primary))" />
                  <ReStatCard size="compact" title="会话延迟" :value="sessionLatencyText" :icon="Timer" icon-color="var(--status-success)" />
                  <ReStatCard size="compact" title="最后检测" :value="lastTestText" :icon="Clock" icon-color="var(--metric-jvm)" />
                  <ReStatCard size="compact" title="运行状态" :value="runtimeText" :icon="CircleCheck" icon-color="var(--brand-500)" />
                </div>

                <div class="ds-overview-grid">
                  <!-- 左：连接延迟趋势（指标 SSE 打通后由图表替换空态） -->
                  <section class="ds-panel ds-panel--trend">
                    <header class="ds-panel__head">
                      <h3 class="ds-panel__title">连接延迟趋势</h3>
                      <div class="ds-panel__legend">
                        <span class="ds-legend"><i class="ds-legend__dot" />连接延迟</span>
                        <span class="ds-legend ds-legend--muted"><i class="ds-legend__dot" />平均 {{ latencyLegendText }}</span>
                      </div>
                    </header>
                    <div class="ds-trend">
                      <ReEmpty description="暂无监控指标数据" :image-size="60" />
                    </div>
                  </section>

                  <!-- 右：连接配置 + 常用动作 -->
                  <section class="ds-panel">
                    <h3 class="ds-panel__title">连接配置</h3>
                    <dl class="ds-kv">
                      <div v-for="row in configRows" :key="row.label" class="ds-kv__row">
                        <dt class="ds-kv__label">{{ row.label }}</dt>
                        <dd class="ds-kv__value" :class="{ mono: row.mono }">{{ row.value }}</dd>
                      </div>
                    </dl>
                    <div class="ds-panel__actions">
                      <ReButton
                        class="ds-panel__primary"
                        type="primary"
                        icon="RefreshRight"
                        :show-text="true"
                        :loading="testing === current.id"
                        @click="test(current)"
                      >立即检测</ReButton>
                      <ReButton class="ds-pill" icon="EditPen" :show-text="true" @click="openEdit(current)">编辑连接配置</ReButton>
                      <ReButton class="ds-pill" icon="Connection" :show-text="true" @click="activeTab = 'tunnel'">SSH 隧道</ReButton>
                      <!-- 入口开关与页签条同源：页签藏了，这里也不能留一个跳不到的面包屑 -->
                      <ReButton v-if="OPER_LOG_ENTRY_VISIBLE" class="ds-pill" icon="Document" :show-text="true" @click="activeTab = 'logs'">查看操作日志</ReButton>
                    </div>
                  </section>
                </div>
              </div>
            </template>

            <!-- 连接配置：完整参数表（只用现有字段） -->
            <template #connection>
              <section class="ds-panel">
                <h3 class="ds-panel__title">连接配置</h3>
                <dl class="ds-kv">
                  <div v-for="row in connectionRows" :key="row.label" class="ds-kv__row">
                    <dt class="ds-kv__label">{{ row.label }}</dt>
                    <dd class="ds-kv__value" :class="{ mono: row.mono }">{{ row.value }}</dd>
                  </div>
                </dl>
              </section>
            </template>

            <!-- SSH 隧道：目标库内网不可直连时的中转配置（一条数据源至多一条） -->
            <template #tunnel>
              <section class="ds-panel">
                <h3 class="ds-panel__title">SSH 隧道</h3>
                <p class="ds-panel__hint">
                  目标库只能从内网访问时，配置隧道后连接测试会先打开隧道、再经隧道本地端口去连目标库。
                  SSH 口令与私钥口令保存后不再回显，留空即保持原值。
                </p>
                <div v-if="tunnelLoading" class="ds-placeholder-text">正在读取隧道配置…</div>
                <ReForm v-else label-position="top" class="ds-form ds-tunnel-form">
                  <div class="ds-tunnel-row">
                    <ReFormItem label="启用" class="is-full">
                      <ReSwitch
                        v-model="tunnel.status"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="启用"
                        inactive-text="停用"
                      />
                    </ReFormItem>
                    <ReFormItem label="隧道名称" class="is-full">
                      <ReInput v-model="tunnel.name" placeholder="如 生产 MySQL 跳板" />
                    </ReFormItem>
                    <ReFormItem label="隧道类型" required>
                      <ReSelect v-model="tunnel.type" :options="TUNNEL_TYPES" />
                    </ReFormItem>
                    <ReFormItem label="认证方式">
                      <ReSelect v-model="tunnel.sshAuthType" :options="TUNNEL_AUTHS" />
                    </ReFormItem>
                  </div>

                  <h4 class="ds-sub-title">SSH 服务器</h4>
                  <div class="ds-tunnel-row">
                    <ReFormItem label="地址" required>
                      <ReInput v-model="tunnel.sshHost" placeholder="跳板机地址，如 10.0.0.9" />
                    </ReFormItem>
                    <ReFormItem label="端口">
                      <ReInputNumber
                        :model-value="tunnel.sshPort ?? undefined"
                        :min="1"
                        :max="65535"
                        style="width: 100%"
                        @update:model-value="tunnel.sshPort = $event ?? null"
                      />
                    </ReFormItem>
                    <ReFormItem label="用户名" required>
                      <ReInput v-model="tunnel.sshUsername" placeholder="如 tunnel" />
                    </ReFormItem>
                  </div>

                  <template v-if="tunnelIsKeyAuth">
                    <ReFormItem label="私钥" required class="is-full">
                      <ReInput
                        v-model="tunnel.sshPrivateKey"
                        type="textarea"
                        :rows="4"
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY----- 全文，或本机私钥文件路径"
                      />
                    </ReFormItem>
                    <ReFormItem label="私钥口令" class="is-full">
                      <ReInput v-model="tunnel.sshPassphrase" type="password" show-password placeholder="留空表示不修改" />
                    </ReFormItem>
                  </template>
                  <ReFormItem v-else label="SSH 口令" class="is-full">
                    <ReInput v-model="tunnel.sshPassword" type="password" show-password placeholder="留空表示不修改" />
                  </ReFormItem>

                  <h4 class="ds-sub-title">转发</h4>
                  <div class="ds-tunnel-row">
                    <ReFormItem label="本地端口">
                      <ReInputNumber
                        :model-value="tunnel.localPort ?? undefined"
                        :min="1"
                        :max="65535"
                        placeholder="留空自动分配"
                        style="width: 100%"
                        @update:model-value="tunnel.localPort = $event ?? null"
                      />
                    </ReFormItem>
                    <ReFormItem label="绑定地址">
                      <ReInput v-model="tunnel.bindAddress" placeholder="留空用 127.0.0.1" />
                    </ReFormItem>
                    <template v-if="!tunnelIsDynamic">
                      <ReFormItem label="远端目标主机" required>
                        <ReInput v-model="tunnel.remoteHost" placeholder="数据库地址，如 10.0.0.20" />
                      </ReFormItem>
                      <ReFormItem label="远端目标端口" required>
                        <ReInputNumber
                          :model-value="tunnel.remotePort ?? undefined"
                          :min="1"
                          :max="65535"
                          style="width: 100%"
                          @update:model-value="tunnel.remotePort = $event ?? null"
                        />
                      </ReFormItem>
                    </template>
                  </div>

                  <div class="ds-tunnel-actions">
                    <ReButton type="primary" icon="Check" :loading="tunnelSaving" @click="saveTunnel">保存隧道</ReButton>
                    <ReButton
                      v-if="tunnel.id"
                      type="danger"
                      icon="Delete"
                      :loading="tunnelSaving"
                      @click="removeTunnel"
                    >删除隧道</ReButton>
                    <span v-if="tunnel.id" class="ds-tunnel-id mono">已配置隧道 #{{ tunnel.id }}</span>
                  </div>
                </ReForm>
              </section>
            </template>

            <!-- 监控指标：SSE 实时推送 + 首屏趋势 -->
            <template #metrics>
              <DatasourceMetricPanel :datasource-id="current?.id" />
            </template>

            <!-- 操作日志：功能已通（GET /ms/datasource/oper-log/{id} + 表格见
                 DatasourceOperLogPanel），入口按需求先不露出。
                 重新露出只需把下面注释掉的一行加回 tabItems。 -->
            <template #logs>
              <DatasourceOperLogPanel :datasource-id="current?.id" />
            </template>

            <!-- 宿注入页签：插槽名与 extraTabs[].name 一致。
                 ReTab 的 capsule 布局不透传插槽参数，所以这里不接 ReTab 给的参数，
                 而是直接闭包引用本页的 current —— 它是本页自己的 ref，天然跟着左栏选中项变。

                 这里必须写 props.extraTabs：defineProps 的返回值赋给 props 之后，
                 各个 prop 不会单独暴露给模板；写裸 extraTabs 拿到的是 undefined，
                 v-for 遍历 undefined 会让宿主页签整个不渲染，而且不报错，
                 只表现为「页签莫名其妙不出现」，极难定位。 -->
            <template v-for="t in props.extraTabs" #[t.name]>
              <slot :name="t.name" :datasource="current" />
            </template>
          </ReTab>
        </template>

        <ReEmpty v-else description="暂无数据源，点击「新增数据源」创建" :image-size="80" class="ds-main__empty" />
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="dialogVisible" :title="editing ? '编辑数据源' : '新增数据源'" width="860px" class="ds-create-dialog">
      <div class="ds-create">
        <!-- 左栏：数据源类型选择（搜索 + 类型列表） -->
        <aside class="ds-create__side">
          <div class="ds-create__search">
            <ReInput v-model="typeKeyword" placeholder="搜索类型" clearable size="small">
              <template #prefix><ReIcon name="Search" :size="14" /></template>
            </ReInput>
          </div>
          <div class="ds-create__types">
            <button
              v-for="t in filteredTypes"
              :key="t"
              type="button"
              class="ds-type-item"
              :class="{ 'is-active': form.type === t }"
              :data-testid="`ds-type-${t}`"
              @click="selectType(t)"
            >
              <span class="ds-type-item__tile" :style="{ '--tile': typeMeta(t).color }">
                <ReIcon :name="typeMeta(t).icon" :size="16" />
              </span>
              <span class="ds-type-item__label">{{ typeMeta(t).label }}</span>
            </button>
            <p v-if="!filteredTypes.length" class="ds-create__none">无匹配类型</p>
          </div>
        </aside>

        <!-- 右栏：连接表单 -->
        <section class="ds-create__main">
          <header class="ds-create__head">
            <span class="ds-create__tile" :style="{ '--tile': typeMeta(form.type || '').color }">
              <ReIcon :name="typeMeta(form.type || '').icon" :size="18" />
            </span>
            <div class="ds-create__heading">
              <div class="ds-create__name">{{ typeMeta(form.type || '').label }}</div>
              <div class="ds-create__desc">{{ typeDesc(form.type || '') }}</div>
            </div>
            <span class="ds-create__badge">{{ (form.type || "").toUpperCase() }}</span>
          </header>

          <ReForm label-position="top" class="ds-form ds-create__form">
            <ReFormItem label="名称" required class="is-full">
              <ReInput v-model="form.name" placeholder="例如：生产 MySQL" />
            </ReFormItem>
            <ReFormItem label="主机地址" required>
              <ReInput v-model="form.host" placeholder="127.0.0.1" />
            </ReFormItem>
            <ReFormItem :label="form.type === 'neo4j' ? '端口 (HTTP)' : '端口'" required>
              <ReInputNumber
                :model-value="form.port ?? undefined"
                :min="1"
                :max="65535"
                style="width: 100%"
                @update:model-value="form.port = $event"
              />
            </ReFormItem>
            <ReFormItem label="用户名" required>
              <ReInput v-model="form.username" placeholder="数据库用户名" />
            </ReFormItem>
            <ReFormItem label="密码" required>
              <ReInput v-model="form.password" type="password" show-password placeholder="数据库密码" />
            </ReFormItem>
            <ReFormItem :label="form.type === 'neo4j' ? '图数据库名' : '数据库/库名'" class="is-full">
              <ReInput
                v-model="form.database"
                :placeholder="form.type === 'neo4j' ? '留空按 neo4j；填完整 http(s):// 地址时按反向代理前缀处理' : '数据库名 / Redis DB 编号'"
              />
            </ReFormItem>
            <!-- JDBC 驱动：本机不可能备齐所有数据库的驱动包（ojdbc / mssql-jdbc /
                 各类国产库驱动体积都在数 MB、许可各异），所以允许按数据源上传 jar。
                 上传时后端会**当场加载一次驱动类**，失败就连文件带台账一起回滚，
                 不会留下「传上去了、一连就报 ClassNotFound」的半成品。 -->
            <template v-if="form.type === 'jdbc'">
              <ReFormItem label="驱动类名" class="is-full">
                <ReInput v-model="form.driverClassName" placeholder="org.h2.Driver（留空则用所选 jar 上登记的类名）" />
              </ReFormItem>
              <ReFormItem label="驱动 jar" class="is-full">
                <div class="ds-driver-jar">
                  <ReSelect
                    v-model="form.driverJarId"
                    :options="driverJarOptions"
                    placeholder="用内置驱动（应用 classpath 上的）"
                    clearable
                    class="ds-driver-jar-select"
                  />
                  <input ref="driverJarInput" class="ds-driver-jar-file" type="file" accept=".jar" @change="onPickDriverJar" />
                  <ReButton size="small" @click="driverJarInput?.click()">上传 jar</ReButton>
                </div>
                <div class="ds-form-hint">
                  文件库（H2 / SQLite）也要在这里选驱动：它们不在应用 classpath 上。
                </div>
              </ReFormItem>
              <!-- 额外连接参数：MySQL 等的扩展参数（useSSL / serverTimezone / …）。
                   左 ReSelect 选常用参数名，右填值；保存时并入 JDBC 连接串：
                   整串 URL 原地合并 query，三段式按后端同款模板补默认参数后再叠加。 -->
              <ReFormItem label="额外参数" class="is-full">
                <div class="ds-xparam">
                  <div v-for="(row, i) in extraParams" :key="i" class="ds-xparam__row">
                    <ReSelect
                      v-model="row.key"
                      class="ds-xparam__key"
                      :options="extraParamOptions"
                      placeholder="选择或输入参数名"
                      filterable
                      allow-create
                      clearable
                      :data-testid="`dsm-xparam-key-${i}`"
                    />
                    <ReInput
                      v-model="row.value"
                      class="ds-xparam__value"
                      placeholder="参数值，如 false / Asia/Shanghai"
                      :data-testid="`dsm-xparam-value-${i}`"
                    />
                    <ReButton
                      layout="square"
                      icon="Delete"
                      type="danger"
                      tip="删除此参数"
                      :data-testid="`dsm-xparam-del-${i}`"
                      @click="removeExtraParam(i)"
                    />
                  </div>
                  <div class="ds-xparam__foot">
                    <ReButton size="small" data-testid="dsm-xparam-add" @click="addExtraParam">
                      <template #icon><ReIcon name="Plus" :size="12" /></template>
                      添加参数
                    </ReButton>
                    <span class="ds-form-hint">
                      追加到 JDBC 连接串；同名参数覆盖后端默认值。值里不要带空格或 &amp; ? #
                    </span>
                  </div>
                </div>
              </ReFormItem>
            </template>
            <!-- 进程控制方式：只对 nginx 有意义。
                 留空 = 自动探测（后端认得出托管单元且当前用户有免密 systemctl 权限才走 systemd），
                 这是本字段引入前的行为，老数据源保持留空即可保持不变。 -->
            <template v-if="form.type === 'nginx'">
              <ReFormItem label="控制方式" class="is-full">
                <ReSelect
                  v-model="form.controlMode"
                  :options="controlModeOptions"
                  placeholder="自动探测"
                />
              </ReFormItem>
              <ReFormItem
                v-if="form.controlMode === 'systemd'"
                label="托管单元名"
                class="is-full"
              >
                <ReInput
                  v-model="form.controlTarget"
                  placeholder="例如 nginx.service；留空则由后端自动探测"
                />
              </ReFormItem>
              <p v-if="form.controlMode === 'local'" class="ds-control-hint">
                直接在本机执行 <code>nginx -s stop</code> 与裸启动，不经过 systemctl。
                停止后进程不再受任何进程管理器托管，机器重启不会自动拉起。
              </p>
              <p v-else-if="form.controlMode === 'systemd'" class="ds-control-hint">
                启停交给 <code>systemctl</code>。仍要求 SSH 用户对该单元有免密 sudo 权限，没有时自动退回本地目录方式。
              </p>
              <p v-else class="ds-control-hint">
                由后端自动判断：认得出托管单元且 SSH 用户有该单元的免密 sudo 权限才走 systemd，否则用本地目录方式。
              </p>
            </template>
            <!-- 连接测试：编辑态直接测已落库数据源；新建态需先保存（后端按 id 测试） -->
            <div class="ds-create__test">
              <ReButton size="small" :loading="dialogTesting" :disabled="!editing" @click="testInDialog">
                <template #icon><ReIcon name="Connection" :size="12" /></template>
                测试连接
              </ReButton>
              <span v-if="dialogTestResult" class="ds-create__test-result" :class="dialogTestResult.success ? 'is-ok' : 'is-fail'">
                <ReIcon :name="dialogTestResult.success ? 'CircleCheck' : 'CircleClose'" :size="13" />
                {{ dialogTestResult.success ? (dialogTestResult.message || "连接成功") : (dialogTestResult.message || "连接失败") }}
              </span>
              <span v-else-if="!editing" class="ds-create__test-hint">保存数据源后即可测试连接</span>
            </div>
            <!-- 高级设置：备注等可选字段 -->
            <div class="ds-create__advanced">
              <button type="button" class="ds-create__advanced-toggle" @click="advancedOpen = !advancedOpen">
                <ReIcon :name="advancedOpen ? 'ArrowDown' : 'ArrowRight'" :size="12" />
                高级设置
              </button>
              <ReForm v-if="advancedOpen" label-position="top" class="ds-form ds-create__advanced-form">
                <ReFormItem label="备注" class="is-full">
                  <ReInput v-model="form.remark" placeholder="可选备注信息" />
                </ReFormItem>
              </ReForm>
            </div>
          </ReForm>
        </section>
      </div>
      <template #footer>
        <ReButton class="ds-pill" @click="dialogVisible = false"><template #icon><ReIcon name="Close" :size="12" /></template>取消</ReButton>
        <ReButton type="primary" class="ds-pill" :loading="saving" @click="save"><template #icon><ReIcon name="Check" :size="12" /></template>保存</ReButton>
      </template>
    </ReDialog>

    <!-- 表结构浏览：入库节点按这里的真实列配字段映射 -->
    <ReDialog v-model="schemaVisible" :title="`${schemaSourceName} · 表结构`" width="820px">
      <div class="ds-schema">
        <div class="ds-schema__bar">
          <span class="ds-schema__label">表</span>
          <!-- 共享表选择器：自取表清单，有表注释时显示中文、副标题给真实表名 -->
          <TableSelect
            ref="schemaTablePicker"
            class="ds-schema__select"
            :datasource="schemaSourceId ? String(schemaSourceId) : ''"
            v-model="schemaTable"
            @loaded="onSchemaTables"
            @error="onSchemaError"
          />
          <ReButton  class="ds-pill" icon="RefreshRight" :show-text="true" @click="refreshSchemaTables">刷新</ReButton>
          <span class="ds-schema__count">共 {{ schemaTables.length }} 张表</span>
        </div>

        <p v-if="schemaError" class="ds-schema__error">{{ schemaError }}</p>

        <!-- 共享字段选择器：与表下拉联动，换表自动重取列并清空已选字段 -->
        <ColumnSelect
          v-else
          class="ds-schema__select ds-schema__column"
          :datasource="schemaSourceId ? String(schemaSourceId) : ''"
          v-model="schemaColumn"
          :table="schemaTable"
          @loaded="onSchemaColumns"
          @error="onSchemaError"
        />

        <ReTable
          v-if="!schemaError"
          :columns="schemaColumnDefs"
          :data="schemaColumns"
          row-key="name"
          empty-text="选择一张表查看列结构"
        >
          <template #nullable="{ row }">
            <ReTag  effect="plain" :type="row.nullable ? 'info' : 'warning'">
              {{ row.nullable ? "可空" : "NOT NULL" }}
            </ReTag>
          </template>
          <template #primaryKey="{ row }">
            <ReTag v-if="row.primaryKey"  effect="plain" type="danger">主键</ReTag>
          </template>
        </ReTable>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* ============================================================
   数据源中心（独立页面包）—— 全部使用 koi / Element 令牌
   左右两栏：左栏状态过滤 + 列表，右栏详情 + 页签
   ============================================================ */
.ds {
  /* 浅灰画布：卡片用 --bg-container 浮在上面（UI 稿的层次感来源）。
     颜色全部走 koi 令牌（packages/theme tokens.css），亮暗色自动跟随。 */
  padding: 16px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-page, #f6f7fb);
  border-radius: var(--radius-xl, 16px);
}

/* ---------------- 左右两栏布局 ---------------- */
/* align-items 用默认的 stretch：两栏等高，左栏吃满右栏撑出来的高度。
   写 flex-start 会让左栏按自身内容收尾，右栏很长时下方留一大片空白。 */
.ds-layout {
  display: flex;
  align-items: stretch;
  gap: 12px;
  /* 吃掉 .ds 的剩余高度，左栏才有机会落到底 */
  flex: 1 1 auto;
  min-height: 0;
}
.ds-side {
  /* clamp 而非固定 340px：视口 1400px 时给 340，两侧留白均衡；
     视口收到 1200px 时跟着缩到 260，右栏详情不会被挤成一条缝。
     260px 是「状态过滤四行 + 数据源名不换行」的实测下限，再窄名字就折行了。 */
  flex: 0 0 clamp(260px, 24vw, 340px);
  max-width: clamp(260px, 24vw, 340px);
  min-width: 0;
  /* 与右栏 .ds-main 同理：这一环不断，.ds-side-card 的 min-height:0 就传不下去，
     右栏内容一长，左栏卡片会被一起顶高而不是自己内部滚动。 */
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.ds-main {
  flex: 1 1 auto;
  min-width: 0;
  /* 必须显式写 0：flex 子项默认 min-height:auto，会拒绝收缩到内容高度以下。
     缺这一行时，页签面板里嵌入的「数据库管理器」有 100+ 张表时会把本栏顶到
     视口之外，整页跟着长出滚动条，左栏数据源列表被顶出可视区。
     写了 0 之后，ReTab 的 flex:1 + min-height:0 钳位链才真正生效，
     超出部分由内层面板自己滚动。 */
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ---------------- 左栏 ---------------- */
/* 白卡片落在浅灰画布上：卡片壳只写一次，左右两栏共用同一套规格 */
.ds-side-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  /* 撑满左栏高度；min-height:0 让内部列表能真正收缩并滚动，而不是把卡片顶高 */
  flex: 1 1 auto;
  min-height: 0;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 18, 33, 0.06));
  transition: background-color var(--el-transition-duration, 0.2s);
}

/* 状态过滤列表 */
.ds-status {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ds-status__item {
  display: flex;
  align-items: center;
  gap: 10px;
  /* UI 稿里过滤行是「整行一条」的胶囊，26px 边距让选中态有呼吸感 */
  padding: 9px 12px;
  border-radius: var(--radius-lg, 12px);
  font-size: 13px;
  color: var(--text-secondary, #5c6270);
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);
}
.ds-status__item:hover {
  background: var(--bg-hover, #f1f2f8);
}
.ds-status__item.is-active {
  /* 主色淡染而不是 --el-color-primary-light-*：后者是 Element 的固定梯度，
     换主题时会和 koi 主色对不上。 */
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  font-weight: 600;
}
.ds-status__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.ds-status__label {
  flex: 1 1 auto;
  min-width: 0;
}
.ds-status__count {
  flex: none;
  font-size: 12px;
  color: var(--text-tertiary, #6b7280);
  font-variant-numeric: tabular-nums;
}

/* 分隔线 */
.ds-side__divider {
  height: 1px;
  background: var(--border-subtle, #eef0f6);
}

/* 左栏列表：吃掉卡片剩余高度，超出独立滚动，
   这样「添加数据源」按钮始终贴在卡片底部，不会被长列表顶走 */
.ds-side__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.ds-side__hint {
  margin: 0;
  padding: 16px 0;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 数据源卡片：图标块 + 名称/徽标 + 地址 + 右侧状态点 */
.ds-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  color: var(--text-primary, #1f2430);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-lg, 12px);
  cursor: pointer;
  transition:
    background-color var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}
.ds-item:hover {
  background: var(--bg-hover, #f1f2f8);
}
.ds-item.is-active {
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 32%, transparent);
}
.ds-item__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  --tile: var(--el-color-primary);
  color: var(--tile);
  border-radius: var(--radius-md, 8px);
  background: color-mix(in srgb, var(--tile) 12%, transparent);
}
.ds-item__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
}
.ds-item__row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.ds-item__name {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ds-item__chip {
  flex: none;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  --tile: var(--el-color-primary);
  color: var(--tile);
  background: color-mix(in srgb, var(--tile) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--tile) 40%, transparent);
  border-radius: var(--el-border-radius-round, 9999px);
}
.ds-item__addr {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-tertiary, #6b7280);
}
/* 右侧在线状态点：名称过长时先压缩名字，状态点永远可见 */
.ds-item__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pulse-offline, #9aa3b2);
}
.ds-item__dot.is-online {
  background: var(--pulse-online, #2fbf71);
}
.ds-item__dot.is-abnormal {
  background: var(--pulse-alarm, #f04a5d);
}
.ds-item__dot.is-offline {
  background: var(--pulse-offline, #9aa3b2);
}

/* 底部新增按钮（虚线边框） */
.ds-side__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px 10px;
  /* 不参与列表的伸缩：列表吃掉剩余高度后，本按钮自然停在卡片底部 */
  flex: none;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-secondary, #5c6270);
  background: transparent;
  border: 1px dashed var(--border-default, #e3e6ef);
  border-radius: var(--radius-lg, 12px);
  cursor: pointer;
  transition:
    color var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s),
    background-color var(--el-transition-duration, 0.2s);
}
.ds-side__add:hover {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 7%, transparent);
}

/* ReInput 内部为元素透传，搜索框宽度需用 :deep 命中 el-input 根 */
.ds-side :deep(.ds-side__search) {
  width: 100%;
}

/* ---------------- 右栏整卡（头部 + 页签 + 内容） ---------------- */
/* 头部、页签条、内容合成一张卡：页签条的底线要贯通整卡宽度，
   所以内距分别挂在 .ds-head 与页签面板上，不能挂在整卡上。 */
.ds-main-card {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 18, 33, 0.06));
  overflow: hidden;
}
/* 页签面板：库内默认只有 padding-top，左右下内距在这里补齐 */
.ds-main-card :deep(.re-tab-underline__panel) {
  padding: 16px 20px 20px;
}

.ds-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid var(--border-subtle, #eef0f6);
}
.ds-head__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.ds-head__main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
/* 头部左侧的类型图标块：36px 圆角方块，底色由类型色淡染 */
.ds-head__tile {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  --tile: var(--el-color-primary);
  color: var(--tile);
  border-radius: var(--radius-lg, 12px);
  background: color-mix(in srgb, var(--tile) 14%, transparent);
}
.ds-crumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-tertiary, #6b7280);
}
.ds-crumb__icon {
  color: var(--el-color-primary);
}
.ds-crumb__arrow {
  color: var(--text-tertiary, #6b7280);
  opacity: 0.7;
}
.ds-head__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ds-head :deep(.ds-head__search) {
  width: 220px;
}

/* 「更多」触发器：与相邻按钮同规格（32px 高、无内边距） */
.ds-head__more {
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  color: var(--el-text-color-regular);
}
.ds-head__more:hover {
  color: var(--el-color-primary);
}
.ds-detail__name {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 20px：UI 稿的标题是一行紧凑字号；28px 会把长数据源名挤成两行，头卡高度跟着跳 */
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--text-primary, #1f2430);
}
.ds-detail__chip {
  flex: none;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  --tile: var(--el-color-primary);
  color: var(--tile);
  background: color-mix(in srgb, var(--tile) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--tile) 40%, transparent);
  border-radius: var(--el-border-radius-round, 9999px);
}
.ds-detail__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  --badge: var(--el-text-color-secondary);
  color: var(--badge);
  background: color-mix(in srgb, var(--badge) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--badge) 45%, transparent);
  border-radius: var(--el-border-radius-round, 9999px);
}
.ds-detail__badge.is-on {
  --badge: var(--status-success, var(--el-color-success));
}
.ds-detail__badge.is-warn {
  --badge: var(--status-warning, var(--el-color-warning));
}
.ds-detail__badge.is-off {
  --badge: var(--status-error, var(--el-color-danger));
}
.ds-detail__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ---------------- 概览：统计卡 + 双栏面板 ---------------- */
/* 概览页的「连接配置」区块要吃掉统计卡以下的剩余高度，否则切页签时整页高度跳变 */
.ds-overview {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
}
.ds-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
/* 统一卡片规格：白底 + 1px 边框 + 12px 圆角（内部排版由 ReStatCard 决定） */
.ds-stats :deep(.re-stat-card) {
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-lg, 12px);
}

/* 概览双栏：左趋势（可撑宽）+ 右配置（定宽）。窄屏回落单列。 */
.ds-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 1fr);
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
}
@media (max-width: 1180px) {
  .ds-overview-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ---------------- 面板 / 键值表 ---------------- */
.ds-panel {
  padding: 16px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-lg, 12px);
  /* 吃满页签面板的可用高度（ReTab stretch → .re-tab-underline__panel）。
     转纵向 flex 是为了让标题与键值表成为两行可控子项；
     键值行按内容自然排、不加滚动，字段更多时面板会被内容顶高而不是压缩行距。 */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
.ds-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.ds-panel__title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
  flex-shrink: 0;
}
.ds-panel__head .ds-panel__title {
  margin-bottom: 0;
}
/* 图例：色点 + 文案，弱化项用三级文字色 */
.ds-panel__legend {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  color: var(--text-secondary, #5c6270);
}
.ds-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ds-legend--muted {
  color: var(--text-tertiary, #6b7280);
}
.ds-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--metric-cpu, var(--el-color-primary));
}
.ds-legend--muted .ds-legend__dot {
  background: var(--border-default, #e3e6ef);
}
/* 趋势画布：图表落地前先占住高度，避免空态把双栏压扁 */
.ds-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 220px;
  margin-top: 12px;
}
/* 面板底部动作：主按钮整行，下方三个次级动作纵向排布 */
.ds-panel__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  flex-shrink: 0;
}
.ds-panel__actions :deep(.rs-btn),
.ds-panel__actions :deep(.el-button) {
  width: 100%;
  margin-left: 0;
}
.ds-kv {
  margin: 0;
}
.ds-kv__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
}
.ds-kv__row + .ds-kv__row {
  border-top: 1px solid var(--border-subtle, #eef0f6);
}
.ds-kv__label {
  flex: 0 0 96px;
  margin: 0;
  font-size: 13px;
  color: var(--text-tertiary, #6b7280);
}
.ds-kv__value {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 13px;
  color: var(--text-primary, #1f2430);
  /* dd 在部分全局重置里是右对齐，这里显式拉回左对齐：
     标签列定宽后，值紧跟标签才是 UI 稿的样子，贴到卡片右边会读成另一列 */
  text-align: left;
  word-break: break-all;
}

/* 页签占位（监控指标 / 操作日志暂无数据来源）：同样吃满可用高度并居中，
   否则四个页签高度不一致，切页签时内容区会跳 */
.ds-placeholder {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
.ds-main__empty {
  padding: 48px 0;
}

/* ---------------- SSH 隧道表单 ---------------- */
/* .ds-form 本身是两列栅格：分组容器、子标题、操作条都必须跨满整行，
   否则只会占掉第一格，把下面的字段挤到第二列去 */
.ds-tunnel-form > .ds-tunnel-row,
.ds-tunnel-form > .ds-sub-title,
.ds-tunnel-form > .ds-tunnel-actions {
  grid-column: 1 / -1;
}
.ds-tunnel-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 18px;
}
.ds-sub-title {
  margin: 4px 0 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
}
.ds-panel__hint {
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
.ds-placeholder-text {
  padding: 18px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ds-tunnel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}
.ds-tunnel-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---------------- 新增/编辑弹窗：左右两栏 ----------------
   左侧类型面板（搜索 + 类型列表）+ 右侧连接表单。整体贴满弹窗 body
   （去掉 koi ReDialog 默认 8px 内边距），左栏淡色底 + 右边框分隔，右栏白底表单。
   固定高度让左右两栏各自内部滚动，而不是把整弹窗撑出滚动条。 */
.ds-create-dialog :deep(.el-dialog__body) { padding: 0 !important; }
.ds-create-dialog :deep(.dialog-content-wrapper) { padding-right: 0; overflow: hidden; }
.ds-create-dialog :deep(.dialog-content-wrapper > *) { padding-right: 0; }

.ds-create {
  display: flex;
  align-items: stretch;
  height: min(540px, calc(92vh - 150px));
  min-height: 420px;
}

/* 左栏：类型选择 */
.ds-create__side {
  flex: 0 0 232px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 12px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-right: 1px solid var(--el-border-color-lighter);
  min-width: 0;
}
.ds-create__search { flex: 0 0 auto; }
.ds-create__types {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 2px;
}
.ds-create__none {
  margin: 10px 0;
  font-size: 12px;
  text-align: center;
  color: var(--el-text-color-placeholder);
}
.ds-type-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: var(--el-border-radius-base, 6px);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
}
.ds-type-item:hover { background: var(--el-fill-color, #f0f2f5); }
.ds-type-item.is-active {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary-light-7, #d9ecff);
}
.ds-type-item__tile {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--el-border-radius-base, 6px);
  color: #fff;
  background: var(--tile, var(--el-color-primary));
}
.ds-type-item__label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ds-type-item.is-active .ds-type-item__label {
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 右栏：连接表单 */
.ds-create__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px 20px 8px;
}
.ds-create__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ds-create__tile {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--el-border-radius-base, 8px);
  color: #fff;
  background: var(--tile, var(--el-color-primary));
}
.ds-create__heading { flex: 1 1 auto; min-width: 0; }
.ds-create__name {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}
.ds-create__desc {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.ds-create__badge {
  flex: 0 0 auto;
  padding: 2px 8px;
  border-radius: var(--el-border-radius-base, 4px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9, #ecf5ff);
  border: 1px solid var(--el-color-primary-light-8, #e0efff);
}
.ds-create__form { margin-top: 8px; }

/* 测试连接行 + 高级设置行：跨满两列 */
.ds-create__test,
.ds-create__advanced { grid-column: 1 / -1; }
.ds-create__test {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2px 0 12px;
}
.ds-create__test-result {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.ds-create__test-result.is-ok { color: var(--el-color-success); }
.ds-create__test-result.is-fail { color: var(--el-color-danger); }
.ds-create__test-hint { font-size: 12px; color: var(--el-text-color-placeholder); }
.ds-create__advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.ds-create__advanced-toggle:hover { color: var(--el-color-primary); }
.ds-create__advanced-form { margin-top: 4px; }

/* 窄屏：左右两栏改为上下堆叠，类型面板限高避免占满整屏 */
@media (max-width: 720px) {
  .ds-create { flex-direction: column; height: auto; min-height: 0; }
  .ds-create__side {
    flex: 0 0 auto;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  .ds-create__types { max-height: 180px; }
  .ds-create__main { overflow: visible; }
}

/* ---------------- 弹窗表单 ---------------- */
.ds-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
}
.ds-form :deep(.el-form-item) { margin-bottom: 16px; }
.ds-form :deep(.is-full) { grid-column: 1 / -1; }

/* 控制方式下方的说明：与 ReFormItem 的 label 同字号弱化一档，
   整行占满（.is-full 的 grid-column 会传染给相邻兄弟，这里显式复位） */
.ds-control-hint {
  grid-column: 1 / -1;
  margin: -8px 0 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.ds-control-hint code {
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
  font-family: Consolas, Monaco, monospace;
  font-size: 11px;
}
.ds-form :deep(.el-form-item__label) {
  width: auto !important;
  height: auto;
  margin-bottom: 6px;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--el-text-color-regular);
}
.ds-form :deep(.el-form-item__content) { margin-left: 0 !important; }

/* ---------------- 表结构浏览 ---------------- */
.ds-schema { display: flex; flex-direction: column; gap: 10px; }
.ds-schema__bar { display: flex; align-items: center; gap: 8px; }
.ds-schema__label { font-size: 13px; color: var(--el-text-color-regular); flex: 0 0 auto; }
.ds-schema__select { flex: 0 0 300px; }
/* 字段栏单独一行：表名与字段名都较长，并排会把两张下拉都压窄 */
.ds-schema__column { flex: 1 1 auto; margin-bottom: 8px; }
.ds-schema__count { margin-left: auto; font-size: 12px; color: var(--el-text-color-secondary); }
.ds-schema__error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

/* ---------------- 通用 ---------------- */
.ds-pill { border-radius: var(--el-radius-full, 9999px) !important; }

.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}

/* ---------------- 响应式 ---------------- */
/*
 * 断点从 992px 提到 1180px。
 *
 * <p>为什么不能只看视口：左栏固定 340px，且布局外面还压着左侧菜单（约 220px），
 * 两者都要从视口宽度里扣掉。992px 断点下窗口宽 1200px 时内容区只剩 980px，
 * 却仍按「够宽」处理、把两栏并排放 —— 340 + 12 + 628，右侧详情被压得读不下去。
 * 用户看到的「变成上下堆叠」和「应该左右」来回跳，根因就是这个断点定早了。</p>
 *
 * <p>改成 1180px 后：窗口 ≥1180px 一定放得下两栏；<1180px 拆成上下，
 * 此时左栏卡片不再死撑满高（见下），避免上下堆叠时左栏下面拖出一大段空白。</p>
 */
@media (max-width: 1180px) {
  .ds-layout {
    flex-direction: column;
  }
  .ds-side {
    flex: none;
    width: 100%;
    max-width: none;
  }
  /* 上下堆叠时两栏各自按内容高度收尾：左栏再 flex:1 就会把
     「添加数据源」按钮顶到屏幕底部，中间留一大段空白。 */
  .ds-side-card {
    flex: 0 0 auto;
  }
  .ds-head__actions {
    flex: 1 1 auto;
    justify-content: flex-end;
  }
}
@media (max-width: 640px) {
  .ds-head__actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .ds-head :deep(.ds-head__search) {
    width: 100%;
  }
  .ds-kv__label {
    flex-basis: 96px;
  }
}
/* KPI 四卡降级成两列。
   断点同样后移到 1280px：左栏占了 340、菜单占了约 220，
   视口 1280 时右栏只剩约 720，四张 KPI 卡各 165px，
   「连接延迟 6.16 秒」这类值会折行，所以在这之前就该降成两列。 */
@media (max-width: 1280px) {
  .ds-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .ds-stats {
    grid-template-columns: 1fr;
  }
  .ds-form {
    grid-template-columns: 1fr;
  }
}

/* ---------------- 动效降级（prefers-reduced-motion） ----------------
   逐个列出本文件自带 transition 的选择器，不写 `*` / `.ds *` 通配：
   通配会把卡片里 ReStatCard / ReInput / el-dropdown 内部的合法过渡一起掐掉。
   本文件这些选择器都只带 transition（无 animation），故只关 transition。 */
@media (prefers-reduced-motion: reduce) {
  .ds-side-card,
  .ds-status__item,
  .ds-item,
  .ds-side__add {
    transition: none;
  }
}

/* ---------------- 键盘焦点可见性 ----------------
   .ds-status__item 是带 @click 的 li（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，这里不重复写。 */
.ds-status__item {
  outline: none;
}

.ds-status__item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
/* ---------------- JDBC 驱动 jar 上传 ---------------- */
.ds-driver-jar {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.ds-driver-jar-select {
  flex: 1;
  min-width: 0;
}

/* 文件 input 只作为「点击上传」的触发点，不直接暴露给用户：
   各浏览器的 file input 很难一致地藏起来，而它又是唯一可靠的取文件方式 */
.ds-driver-jar-file {
  display: none;
}

/* ---------------- JDBC 额外连接参数编辑器 ---------------- */
.ds-xparam {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.ds-xparam__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ds-xparam__key {
  width: 230px;
  flex: 0 0 auto;
}

.ds-xparam__value {
  flex: 1;
  min-width: 0;
}

.ds-xparam__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
