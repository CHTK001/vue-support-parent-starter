import request from "@repo/utils/request";

/**
 * Spring Bean 热点数据 API
 * @author CH
 * @version 1.0.0
 * @since 2025-09-26
 */

// 获取 Spring Bean 数据
export function getSpringBeanData() {
  return request({
    url: (window.agentPath || "/agent") + "/spring-bean-data",
    method: "get"
  });
}

export default {
  getSpringBeanData
};