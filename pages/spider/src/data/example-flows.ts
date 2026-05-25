import type { SpiderFlowSchema } from "../types/orchestration";

export const giteeExploreExampleFlow: SpiderFlowSchema = {
  spiderDefinitionCode: "gitee-explore-1000-projects",
  spiderFlowVersion: 1,
  spiderFlowName: "Gitee Explore 1000 项目采集",
  spiderFlowScope: "PRIVATE",
  nodes: [
    { id: "start", type: "START", title: "开始", position: { x: 80, y: 220 }, config: { entryUrl: "https://gitee.com/search?type=repository&q=" } },
    { id: "access-explore", type: "AI_PAGE_ACCESS", title: "浏览搜索结果", position: { x: 320, y: 220 }, config: { accessMode: "PLAYWRIGHT" } },
    { id: "parse-projects", type: "DATA_PARSE", title: "解析项目字段", position: { x: 620, y: 220 }, config: { parseMode: "AI", nlpMapping: "提取每个项目的名称(name)、所属组织(owner)、星标数(stars)、编程语言(language)和描述(description)", fieldMapping: "name,owner,stars,language,description" } },
    { id: "save-result", type: "SAVE_RESULT", title: "保存中间结果", position: { x: 920, y: 220 }, config: { schemaCode: "gitee.explore.project", dataRecord: true, outputTableName: "gitee_explore_project", dataSourceCode: "default", dataSourceName: "当前数据库", resultMappings: [{ contextField: "name", columnName: "name" }, { contextField: "owner", columnName: "owner" }, { contextField: "stars", columnName: "stars" }, { contextField: "language", columnName: "language" }, { contextField: "description", columnName: "description" }] } },
    { id: "condition-target", type: "CONDITION", title: "是否达 1000", position: { x: 1220, y: 220 }, config: { expression: "collectedCount >= 1000" } },
    { id: "page-next", type: "AI_PAGE_ACCESS", title: "翻页", position: { x: 1080, y: 400 }, config: { accessMode: "PLAYWRIGHT", targetUrl: "https://gitee.com/search?type=repository&page={page}", incrementPage: true } },
    { id: "end", type: "END", title: "结束", position: { x: 1600, y: 220 }, config: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "access-explore" },
    { id: "e2", source: "access-explore", target: "parse-projects" },
    { id: "e3", source: "parse-projects", target: "save-result" },
    { id: "e4", source: "save-result", target: "condition-target" },
    { id: "e5", source: "condition-target", sourceOutput: "false", target: "page-next", label: "未达标" },
    { id: "e6", source: "page-next", target: "parse-projects", label: "继续翻页" },
    { id: "e7", source: "condition-target", sourceOutput: "true", target: "end", label: "已达标" },
  ],
};
