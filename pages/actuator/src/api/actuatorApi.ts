/**
 * Actuator 端点直读出口（本包自己的数据通道）
 *
 * <p>只做一件事：把宿主应用的 {@code /actuator/**} JSON 取回来。
 * Actuator 本身是裸 JSON，但宿主后端的统一响应 advice 会把它再包一层
 * {@code {code,data,msg,success,ok}} 信封（实测 2026-11-19 本机 8082 实例如此，
 * 连 health 的 503/OUT_OF_SERVICE 都被包成 success:true 的「假成功信封」）。
 * 因此出口处用 {@link unwrapEnvelope} 兼容两种形态：像信封就取内层 {@code data}，
 * 否则原样透传。依然不做 {@code ApiResult<T>} 类型断言——视图拿到的
 * 始终是 actuator 原生结构。</p>
 *
 * <p>为什么不复用 {@code @pages/system} 里的同名函数：本包被设计成
 * 「只要宿主开了 actuator 就能用」的独立模块，不应该为了一个 GET 把整个系统管理包
 * 的 API 层拖进来。保持各自独立反而更稳。</p>
 */
import { http } from "@repo/utils";

/**
 * 解开统一响应 advice 包的 {@code {code,data,msg,success,ok}} 信封。
 *
 * <p>判定收紧到「长得像信封」才解包：必须是对象、带 {@code data} 键，且带
 * {@code code}/{@code msg}/{@code success}/{@code ok} 任意一个信封特征。
 * actuator 原生结构（health/metrics/mappings…）顶层都没有 {@code data} 键，
 * 不会被误伤；裸 JSON 后端（无 advice）原样透传，两种部署形态都成立。</p>
 *
 * @param body HTTP 响应体
 * @returns actuator 原生 JSON（信封则取内层 data）
 */
export function unwrapEnvelope(body: unknown): unknown {
  if (body && typeof body === "object" && "data" in (body as Record<string, unknown>)) {
    const envelope = body as Record<string, unknown>;
    const looksLikeEnvelope =
      envelope.code !== undefined ||
      typeof envelope.msg === "string" ||
      envelope.success === true ||
      envelope.ok === true;
    if (looksLikeEnvelope) {
      return envelope.data;
    }
  }
  return body;
}

/**
 * 读取一个 Actuator 端点。
 *
 * <p>路径写法与 Actuator 原生一致：{@code health}、{@code metrics/jvm.memory.used}、
 * 也可以带前导斜杠。空串表示 actuator 根目录（{@code /actuator}）。</p>
 *
 * @param path 端点路径（相对 {@code /actuator}）
 * @returns 端点原生 JSON（已解信封）
 */
export function getActuatorEndpoint(path: string): Promise<unknown> {
  const p = path.startsWith("/") ? path : `/${path}`;
  return http()
    .get(`/actuator${p === "/" ? "" : p}`)
    .then((r) => unwrapEnvelope(r.data));
}
