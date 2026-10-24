/**
 * Hotsport APM API — 薄转发层。
 *
 * <p><b>为什么是转发</b>：本应用（独立部署形态）与平台集成共用同一套观测页面，
 * 实现在 {@code @pages/hotsport} 包里（含可配置接口源 {@code apiUrl}/{@code wsUrl}）。
 * 这里只做 re-export，保持视图现有的 {@code ../api/apmApi} 相对导入不破，
 * 同时消除与包内副本的双份维护 —— 改接口只需改包，本应用自动跟随。</p>
 *
 * @since 2.0.0
 */
export * from "@pages/hotsport/src/api/apmApi";
