/**
 * @pages/room —— P2P 房间独立页面包
 *
 * <p>页面唯一入口 {@link RoomView}（路由 {@code /room}），页内按工作空间拆成
 * 聊天 / 文件 / 视频 / 语音 / 观看 / 协作 / 画板 / 状态八个空间。</p>
 *
 * <p>样式 {@code styles/room.css} 自带 {@code rm-} 前缀，不依赖
 * {@code @pages/server} 的 lab kit，因此本包可以单独挂到任意宿主。</p>
 *
 * <p>对外导出：路由工厂 {@link createRoomRoutes}（宿主装配用）与页面组件
 * （需要直接嵌入时用）。API 与类型一并导出，避免调用方再拼一遍路径。</p>
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
