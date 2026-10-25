/**
 * 监控侧表结构提供者的显式注册入口。
 *
 * <p>实现本身在 {@code ../api/manageConsoles}（监控后端 {@code /ms/monitor/db/*} 那一套
 * 接口所在处），由该模块在导入时自动注册。本文件只提供显式、幂等的调用入口，
 * 供需要提前注册的首屏场景使用。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { registerMonitorSchemaProvider } from "../api/manageConsoles";

/**
 * 注册监控侧的数据源表结构提供者。
 *
 * <p>注册后，数据源中心的「浏览表结构」即走 {@code /ms/monitor/db/*} 链路。</p>
 *
 * <p><strong>幂等</strong>：{@code ../api/manageConsoles} 导入时已自动注册过一次，
 * 此处再调只是重复设置同构实现，无副作用。</p>
 */
export function registerMonitorDatasourceSchema(): void {
  registerMonitorSchemaProvider();
}
