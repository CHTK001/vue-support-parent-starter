/**
 * 数据源「浏览表结构」表结构提供者 —— 监控侧实现（@pages/datasource 内）。
 *
 * <p><strong>为什么放这里</strong>：{@code setDatasourceSchemaProvider} / 浏览表结构链路
 * （fetchDbDatabases / fetchDbTables / fetchTableColumns）本就属于本包；把提供者实现也收敛进
 * 本包，宿主（app）不需要在 app shell 里维护一份 schema 逻辑——与「功能归 pages/xx、
 * app 只是壳」的约定一致。</p>
 *
 * <p><strong>监控侧差异</strong>：共享包 {@code @pages/datasource} 的「浏览表结构」默认走数据源中心
 * （hub）的 {@code /ms/datasource/tables|columns}，监控台后端不含采集模块、也不走 hub 控制器。
 * 监控侧改用监控后端自带的 {@code /ms/monitor/db/*}，让该功能在监控台同样可用，
 * 且不产生对采集平台的运行期依赖。</p>
 *
 * <p><strong>注册时机</strong>：提供者实现与它依赖的接口同处
 * {@code ../api/manageConsoles}（监控后端 {@code /ms/monitor/db/*} 那一套），由该模块
 * 在导入时自动注册 —— 宿主用到数据源控制台页面即意味着「浏览表结构」该走监控侧接口，
 * 不必再在 {@code main.ts} 里手写一次注册调用。</p>
 *
 * <p>本文件保留 {@link registerMonitorDatasourceSchema} 作为显式入口，供需要提前注册
 * （如首屏就打开「浏览表结构」弹窗）的宿主显式调用；它与自动注册等价，重复调用无副作用。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
export { registerMonitorDatasourceSchema } from "./monitorSchemaProviderImpl";
