/**
 * 数据源选择 + 建表（共享组件）。
 *
 * <p>他模块要「选个数据源落库」或「帮用户建张表」时从这儿拿，不再各自实现一份取数与联动：
 *   - {@link DatasourceSelect} 数据源下拉（首项固定「应用主库」）
 *   - {@link TableSelect} 表下拉（有表注释显示中文，副标题给表名）
 *   - {@link ColumnSelect} 字段下拉（有列注释显示中文，副标题给字段名·类型）
 *   - {@link DatasourceTableSelect} 三者串好的组合件，带联动清空规则
 *   - {@link CreateTableDialog} 建表 / 补列对话框（打开即预览 DDL）
 *
 * <p>中文来自数据库里的表/列注释（REMARKS），没有注释时直接显示真实表名/字段名，
 * 不编造也不留空。</p>
 */
import DatasourceSelect from "./DatasourceSelect.vue";
import TableSelect from "./TableSelect.vue";
import ColumnSelect from "./ColumnSelect.vue";
import DatasourceTableSelect from "./DatasourceTableSelect.vue";
import CreateTableDialog from "./CreateTableDialog.vue";

export {
  DatasourceSelect,
  TableSelect,
  ColumnSelect,
  DatasourceTableSelect,
  CreateTableDialog,
};

/** 默认导出组合件：三件套中最常用的那一个 */
export default DatasourceTableSelect;