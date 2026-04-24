import type { SpiderFlowSchema } from "../types/orchestration";

export const baiduPanExampleFlow: SpiderFlowSchema = {
  spiderDefinitionCode: "baidu-pan-all-files",
  spiderFlowVersion: 1,
  spiderFlowName: "百度网盘全量文件采集",
  spiderFlowScope: "PRIVATE",
  nodes: [
    { id: "start", type: "START", title: "开始", position: { x: 60, y: 180 }, config: { entryUrl: "https://pan.baidu.com" } },
    { id: "access-login", type: "PAGE_ACCESS", title: "访问登录页", position: { x: 260, y: 180 }, config: { accessMode: "PLAYWRIGHT", loginRequired: true } },
    { id: "human-code", type: "HUMAN_INTERVENE", title: "验证码/短信", position: { x: 500, y: 180 }, config: { taskType: "SMS_CODE" } },
    { id: "access-home", type: "PAGE_ACCESS", title: "进入文件列表", position: { x: 740, y: 180 }, config: { accessMode: "PLAYWRIGHT", loginRequired: true } },
    { id: "parse-files", type: "DATA_PARSE", title: "解析文件树", position: { x: 980, y: 180 }, config: { parseMode: "AI", fieldMapping: "name,type,path,size,updatedAt" } },
    { id: "save-result", type: "SAVE_RESULT", title: "保存中间结果", position: { x: 1220, y: 180 }, config: { schemaCode: "baidu.pan.file.tree" } },
    { id: "end", type: "END", title: "结束", position: { x: 1440, y: 180 }, config: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "access-login" },
    { id: "e2", source: "access-login", target: "human-code", label: "需要人工验证码" },
    { id: "e3", source: "human-code", target: "access-home" },
    { id: "e4", source: "access-home", target: "parse-files" },
    { id: "e5", source: "parse-files", target: "save-result" },
    { id: "e6", source: "save-result", target: "end" },
  ],
};

export const giteeExploreExampleFlow: SpiderFlowSchema = {
  spiderDefinitionCode: "gitee-explore-1000-projects",
  spiderFlowVersion: 1,
  spiderFlowName: "Gitee Explore 1000 项目采集",
  spiderFlowScope: "PRIVATE",
  nodes: [
    { id: "start", type: "START", title: "开始", position: { x: 60, y: 160 }, config: { entryUrl: "https://gitee.com/explore" } },
    { id: "access-explore", type: "PAGE_ACCESS", title: "访问 Explore", position: { x: 260, y: 160 }, config: { accessMode: "HTTP", loginRequired: false } },
    { id: "parse-project-urls", type: "URL_PARSE", title: "解析项目 URL", position: { x: 500, y: 160 }, config: { selector: "a[href*='/explore/'], a[href*='/projects/']", aiPrompt: "提取项目详情页地址" } },
    { id: "condition-target", type: "CONDITION", title: "数量是否达标", position: { x: 740, y: 160 }, config: { expression: "collectedCount >= 1000" } },
    { id: "parse-project-detail", type: "DATA_PARSE", title: "解析项目字段", position: { x: 980, y: 90 }, config: { parseMode: "AI", fieldMapping: "name,owner,stars,forks,language,repoUrl" } },
    { id: "save-result", type: "SAVE_RESULT", title: "保存中间结果", position: { x: 1220, y: 90 }, config: { schemaCode: "gitee.explore.project" } },
    { id: "end", type: "END", title: "结束", position: { x: 1460, y: 90 }, config: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "access-explore" },
    { id: "e2", source: "access-explore", target: "parse-project-urls" },
    { id: "e3", source: "parse-project-urls", target: "condition-target" },
    { id: "e4", source: "condition-target", target: "parse-project-detail", label: "已达 1000" },
    { id: "e5", source: "parse-project-detail", target: "save-result" },
    { id: "e6", source: "save-result", target: "end" },
  ],
};

export const giteeMineExampleFlow: SpiderFlowSchema = {
  spiderDefinitionCode: "gitee-my-projects",
  spiderFlowVersion: 1,
  spiderFlowName: "Gitee 我的项目采集",
  spiderFlowScope: "PRIVATE",
  nodes: [
    { id: "start", type: "START", title: "开始", position: { x: 60, y: 180 }, config: { entryUrl: "https://gitee.com" } },
    { id: "login", type: "PAGE_ACCESS", title: "登录 Gitee", position: { x: 260, y: 180 }, config: { accessMode: "PLAYWRIGHT", loginRequired: true } },
    { id: "human-code", type: "HUMAN_INTERVENE", title: "登录人工介入", position: { x: 500, y: 180 }, config: { taskType: "CAPTCHA" } },
    { id: "access-mine", type: "PAGE_ACCESS", title: "进入我的项目", position: { x: 740, y: 180 }, config: { accessMode: "PLAYWRIGHT", loginRequired: true } },
    { id: "parse-projects", type: "DATA_PARSE", title: "解析项目列表", position: { x: 980, y: 180 }, config: { parseMode: "VISUAL", fieldMapping: "name,path,visibility,updatedAt" } },
    { id: "save-result", type: "SAVE_RESULT", title: "保存中间结果", position: { x: 1220, y: 180 }, config: { schemaCode: "gitee.mine.project" } },
    { id: "end", type: "END", title: "结束", position: { x: 1440, y: 180 }, config: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "login" },
    { id: "e2", source: "login", target: "human-code", label: "触发验证码" },
    { id: "e3", source: "human-code", target: "access-mine" },
    { id: "e4", source: "access-mine", target: "parse-projects" },
    { id: "e5", source: "parse-projects", target: "save-result" },
    { id: "e6", source: "save-result", target: "end" },
  ],
};
