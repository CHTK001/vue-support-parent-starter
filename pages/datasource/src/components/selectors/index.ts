/**
 * 数据源选择 + 建表（共享组件）。
 *
 * <p>他模块要「选个数据源落库」或「帮用户建张表」时从这儿拿，不再各自实现一份取数与联动：
 *   - {@link DatasourceSelect} 数据源下拉（首项固定「应用主库」）
 *   - {@link TableSelect} 表下拉（有表注释显示中文，副标题给表名）
 *   - {@link ColumnSelect} 字段下拉（有列注释显示中文，副标题给字段名·类型）
 *   - {@link DatasourceTableSelect} 三者串好的组合件，带联动清空规则
 *   - {@link DdlPreviewDialog} 建表 / 补列对话框（打开即预览 DDL，逐列类型由后端按规则补齐）
 *
 * <p><b>这里没有「设计表」</b>：逐列编辑 类型 / 长度 / 小数位 / 可空 / 主键 / 自增 的那个对话框是
 * {@code components/console/CreateTableDialog.vue}（与数据库管理器的表结构视图共用同一份列网格），
 * 由 {@code @pages/datasource} 以 {@code DesignTableDialog} 名字导出。两者不是同一个东西，
 * 曾经同名 {@code CreateTableDialog} 而互相误拿过，故此处刻意不复用那个名字。</p>
 *
 * <p>中文来自数据库里的表/列注释（REMARKS），没有注释时直接显示真实表名/字段名，
 * 不编造也不留空。</p>
 */
import DatasourceSelect from "./DatasourceSelect.vue";
import TableSelect from "./TableSelect.vue";
import ColumnSelect from "./ColumnSelect.vue";
import DatasourceTableSelect from "./DatasourceTableSelect.vue";
import DdlPreviewDialog from "./DdlPreviewDialog.vue";

export {
  DatasourceSelect,
  TableSelect,
  ColumnSelect,
  DatasourceTableSelect,
  DdlPreviewDialog,
};

/** 默认导出组合件：三件套中最常用的那一个 */
export default DatasourceTableSelect;