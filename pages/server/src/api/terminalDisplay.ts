/**
 * 平台级 RDP 显示参数（分辨率 / 色深 / 画质取向）。
 *
 * <p>后端读 {@code ms_server_config} 的 {@code rdp.*}，并做范围与枚举校验
 * （越界/非法回落默认）。前端**不再重复实现**这套规则：两份校验迟早会不一致，
 * 而这类参数写错的后果是「连不上」而不是「画质差一点」。</p>
 *
 * <p>guacd 中转那条链路由 {@code GuacdConnectionFactory} 在服务端直接读取同一套值，
 * 前后端看到的永远是同一份生效结果。</p>
 *
 * @author CH
 * @since 4.0.0.57
 */
import { http, unwrapResult } from "@repo/utils";

/** 生效的 RDP 显示参数 */
export interface RdpDisplay {
  /** 分辨率宽（像素） */
  width: number;
  /** 分辨率高（像素） */
  height: number;
  /** 色深：8 / 16 / 24 / 32 */
  colorDepth: number;
  /** 画质优先：true 表示关闭有损压缩 */
  forceLossless: boolean;
}

/**
 * 读取平台级 RDP 显示参数。
 *
 * @returns 生效值（后端已校验）
 */
export const getRdpDisplay = () =>
  http()
    .get("/ms/server/terminal/display/rdp")
    .then(r => unwrapResult<RdpDisplay>(r));
