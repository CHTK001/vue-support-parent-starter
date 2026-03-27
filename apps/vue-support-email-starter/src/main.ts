/**
 * Email 邮箱管理系统入口文件
 * @author CH
 * @version 1.0.0
 * @since 2026-03-18
 */
import { createStandardApp } from "@repo/core";

createStandardApp().then((bootstrap) => bootstrap.mount("#app"));
