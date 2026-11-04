/**
 * Actuator 端点直读出口（本包自己的数据通道）
 *
 * <p>只做一件事：把宿主应用的 {@code /actuator/**} 原始 JSON 取回来。
 * 这条路径**不经过后端的 {@code ApiResult} 包装**（Actuator 自己就是裸 JSON），
 * 因此不能用 {@code ApiResult<T>} 的类型断言，直接透传 {@code response.data}。</p>
 *
 * <p>为什么不复用 {@code @pages/system} 里的同名函数：本包被设计成
 * 「只要宿主开了 actuator 就能用」的独立模块，不应该为了一个 GET 把整个系统管理包
 * 的 API 层拖进来。两个实现都只有三行，保持各自独立反而更稳。</p>
 */
import { http } from "@repo/utils";

/**
 * 读取一个 Actuator 端点。
 *
 * <p>路径写法与 Actuator 原生一致：{@code health}、{@code metrics/jvm.memory.used}、
 * 也可以带前导斜杠。空串表示 actuator 根目录（{@code /actuator}）。</p>
 *
 * @param path 端点路径（相对 {@code /actuator}）
 * @returns 端点原始 JSON
 */
export function getActuatorEndpoint(path: string): Promise<unknown> {
  const p = path.startsWith("/") ? path : `/${path}`;
  return http()
    .get(`/actuator${p === "/" ? "" : p}`)
    .then((r) => r.data as unknown);
}
