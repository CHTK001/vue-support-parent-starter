/**
 * @pages/room —— P2P 房间包
 *
 * <p>页面入口 {@link RoomView}，页内按工作空间拆成聊天 / 文件 / 视频 / 语音 /
 * 观看 / 协作 / 画板 / 状态八个空间。</p>
 *
 * <p><b>用法只有一种</b>：房间是 Server 接口的 ROOM 协议子类，属于「服务管理」
 * 的能力，由宿主把它嵌进工作区以页签打开（monitor 的 {@code ScServiceManage.vue}），
 * 房间号与信令地址由 {@code roomId} / {@code serverUrl} prop 传入，离开只发
 * {@code leave} 事件。本包不提供独立路由，也不进任何侧边栏菜单。</p>
 *
 * <p>样式 {@code styles/room.css} 自带 {@code rm-} 前缀，不依赖
 * {@code @pages/server} 的 lab kit，因此本包可以单独挂到任意宿主。</p>
 *
 * <p>对外导出：页面组件与类型、API 与 store。API 一并导出，避免调用方再拼一遍路径。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import "./styles/room.css";

export { default as RoomView } from "./views/RoomView.vue";
export { useRoomStore } from "./stores/room";

export * from "./api";
