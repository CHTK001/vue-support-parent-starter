import type { SpiderFlowSchema } from "../types/orchestration";

export const baiduPanExampleFlow: SpiderFlowSchema = {
  spiderDefinitionCode: "baidu-pan-all-files",
  spiderFlowVersion: 1,
  spiderFlowName: "百度网盘全量文件采集",
  spiderFlowScope: "PRIVATE",
  nodes: [
    { id: "start", type: "START", title: "开始", position: { x: 60, y: 180 }, config: { entryUrl: "https://pan.baidu.com" } },
    { id: "access-login", type: "PAGE_ACCESS", title: "访问登录页", position: { x: 260, y: 180 }, config: { accessMode: "PLAYWRIGHT" } },
    { id: "access-home", type: "PAGE_ACCESS", title: "进入文件列表", position: { x: 500, y: 180 }, config: { accessMode: "PLAYWRIGHT" } },
    { id: "parse-files", type: "DATA_PARSE", title: "解析文件树", position: { x: 740, y: 180 }, config: { parseMode: "AI", fieldMapping: "name,type,path,size,updatedAt" } },
    { id: "save-result", type: "SAVE_RESULT", title: "保存中间结果", position: { x: 980, y: 180 }, config: { schemaCode: "baidu.pan.file.tree" } },
    { id: "end", type: "END", title: "结束", position: { x: 1200, y: 180 }, config: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "access-login" },
    { id: "e2", source: "access-login", target: "access-home" },
    { id: "e3", source: "access-home", target: "parse-files" },
    { id: "e4", source: "parse-files", target: "save-result" },
    { id: "e5", source: "save-result", target: "end" },
  ],
};

export const giteeExploreExampleFlow: SpiderFlowSchema = {
  spiderDefinitionCode: "gitee-explore-1000-projects",
  spiderFlowVersion: 1,
  spiderFlowName: "Gitee Explore 1000 项目采集",
  spiderFlowScope: "PRIVATE",
  nodes: [
    { id: "start", type: "START", title: "开始", position: { x: 60, y: 160 }, config: { entryUrl: "https://gitee.com/explore" } },
    { id: "access-explore", type: "PAGE_ACCESS", title: "访问 Explore", position: { x: 260, y: 160 }, config: { accessMode: "HTTP" } },
    { id: "parse-project-urls", type: "URL_PARSE", title: "解析项目 URL", position: { x: 500, y: 160 }, config: { selector: "a[href*='/explore/'], a[href*='/projects/']", aiPrompt: "提取项目详情页地址" } },
    { id: "condition-target", type: "CONDITION", title: "数量是否达标", position: { x: 740, y: 160 }, config: { expression: "collectedCount >= 1000" } },
    { id: "sub-detail", type: "SUB_FLOW", title: "项目详情采集", position: { x: 980, y: 90 }, config: { subFlowCode: "gitee-explore-detail-subflow" } },
    { id: "save-result", type: "SAVE_RESULT", title: "保存中间结果", position: { x: 1220, y: 90 }, config: { schemaCode: "gitee.explore.project" } },
    { id: "end", type: "END", title: "结束", position: { x: 1460, y: 90 }, config: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "access-explore" },
    { id: "e2", source: "access-explore", target: "parse-project-urls" },
    { id: "e3", source: "parse-project-urls", target: "condition-target" },
    { id: "e4", source: "condition-target", sourceOutput: "pass", target: "sub-detail", label: "已达 1000" },
    { id: "e4-reject", source: "condition-target", sourceOutput: "reject", target: "end", label: "未达标" },
    { id: "e5", source: "sub-detail", target: "save-result" },
    { id: "e6", source: "save-result", target: "end" },
  ],
};

export const giteeExploreDetailSubFlow: SpiderFlowSchema = {
  spiderDefinitionCode: "gitee-explore-1000-projects",
  spiderFlowVersion: 1,
  spiderFlowName: "项目详情采集",
  spiderFlowScope: "SUB_FLOW",
  nodes: [
    { id: "sub-start", type: "START", title: "开始", position: { x: 60, y: 120 }, config: {} },
    { id: "parse-project-detail", type: "DATA_PARSE", title: "解析项目字段", position: { x: 260, y: 120 }, config: { parseMode: "AI", fieldMapping: "name,owner,stars,forks,language,repoUrl" } },
    { id: "sub-end", type: "END", title: "结束", position: { x: 480, y: 120 }, config: {} },
  ],
  edges: [
    { id: "se1", source: "sub-start", target: "parse-project-detail" },
    { id: "se2", source: "parse-project-detail", target: "sub-end" },
  ],
};

export const agentBrowserSmokeTaskFlow: SpiderFlowSchema = {
  spiderDefinitionCode: "agent-browser-smoke-task",
  spiderFlowVersion: 1,
  spiderFlowName: "Agent Browser Smoke 全链路测试",
  spiderFlowScope: "PRIVATE",
  nodes: [
    { id: "start", type: "START", title: "开始", position: { x: 60, y: 180 }, config: { entryUrl: "https://httpbin.org/get" } },
    { id: "smoke-access", type: "PAGE_ACCESS", title: "HTTP 请求测试", position: { x: 260, y: 180 }, config: { accessMode: "HTTP" } },
    { id: "smoke-parse", type: "DATA_PARSE", title: "解析响应数据", position: { x: 500, y: 180 }, config: { parseMode: "AI", fieldMapping: "url,headers,origin" } },
    { id: "smoke-save", type: "SAVE_RESULT", title: "保存 Smoke 结果", position: { x: 740, y: 180 }, config: { schemaCode: "spider_agent_browser_smoke_result" } },
    { id: "smoke-end", type: "END", title: "结束", position: { x: 960, y: 180 }, config: {} },
  ],
  edges: [
    { id: "se1", source: "start", target: "smoke-access" },
    { id: "se2", source: "smoke-access", target: "smoke-parse" },
    { id: "se3", source: "smoke-parse", target: "smoke-save" },
    { id: "se4", source: "smoke-save", target: "smoke-end" },
  ],
};

export const giteeMineExampleFlow: SpiderFlowSchema = {
  spiderDefinitionCode: "gitee-my-projects",
  spiderFlowVersion: 1,
  spiderFlowName: "Gitee 我的项目采集",
  spiderFlowScope: "PRIVATE",
  nodes: [
    { id: "start", type: "START", title: "开始", position: { x: 60, y: 180 }, config: { entryUrl: "https://gitee.com" } },
    { id: "login", type: "PAGE_ACCESS", title: "登录 Gitee", position: { x: 260, y: 180 }, config: { accessMode: "PLAYWRIGHT" } },
    { id: "access-mine", type: "PAGE_ACCESS", title: "进入我的项目", position: { x: 500, y: 180 }, config: { accessMode: "PLAYWRIGHT" } },
    { id: "parse-projects", type: "DATA_PARSE", title: "解析项目列表", position: { x: 740, y: 180 }, config: { parseMode: "VISUAL", fieldMapping: "name,path,visibility,updatedAt" } },
    { id: "save-result", type: "SAVE_RESULT", title: "保存中间结果", position: { x: 980, y: 180 }, config: { schemaCode: "gitee.mine.project" } },
    { id: "end", type: "END", title: "结束", position: { x: 1200, y: 180 }, config: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "login" },
    { id: "e2", source: "login", target: "access-mine" },
    { id: "e3", source: "access-mine", target: "parse-projects" },
    { id: "e4", source: "parse-projects", target: "save-result" },
    { id: "e5", source: "save-result", target: "end" },
  ],
};
