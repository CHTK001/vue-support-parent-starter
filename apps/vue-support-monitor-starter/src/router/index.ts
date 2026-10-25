/**
 * 监控应用路由入口。
 *
 * 路由树只在 ../routes.ts 维护。本文件历史上是一份整表拷贝，
 * 搬到 src/router/ 之后里面的 `./views/...` 相对路径全部失效
 * （会按 src/router/views/ 解析），导致构建报 UNRESOLVED_IMPORT。
 * 这里只做转出，避免两份路由树继续漂移。
 */
export { monitorRoutes, default } from "../routes";
