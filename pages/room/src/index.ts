/**
 * @pages/room —— P2P 房间包
 *
 * <p>页面入口 {@link RoomView}，页内按工作空间拆成聊天 / 文件 / 视频 / 语音 /
 * 观看 / 协作 / 画板 / 状态八个空间。</p>
 *
 * <p><b>两种用法</b>：</p>
 * <ul>
 *   <li>{@code embedded}：嵌进宿主页面（monitor 的「服务管理」工作区页签），
 *       房间号由 {@code roomId} prop 传入，离开只发 {@code leave} 事件，
 *       页签关闭即卸载并断开 WebSocket——这是本仓库的默认用法；</li>
 *   <li>独立路由：{@link createRoomRoutes} 产出 {@code /room}，读路由 query 的
 *       roomId，离开回首页。只有要把房间做成独立页面的宿主才用。</li>
 * </ul>
 *
 * <p>样式 {@code styles/room.css} 自带 {@code rm-} 前缀，不依赖
 * {@code @pages/server} 的 lab kit，因此本包可以单独挂到任意宿主。</p>
 *
 * <p>对外导出：页面组件（嵌入或自挂路由都用它）、路由工厂与类型、
 * API 与 store。API 一并导出，避免调用方再拼一遍路径。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import "./styles/room.css";

export { default as RoomView } from "./views/RoomView.vue";
export { useRoomStore } from "./stores/room";

export { createRoomRoutes } from "./routes";
export type { RoomRoutesOptions } from "./routes";

export * from "./api";
