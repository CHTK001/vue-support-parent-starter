import type { SpiderNodeDefinition } from "../types/orchestration";

export const spiderNodePalette: SpiderNodeDefinition[] = [
  {
    type: "START",
    title: "开始节点",
    detail: "定义入口 URL、上下文和执行起点。",
    color: "#0f766e",
    icon: "ri:play-circle-line",
    ports: [{ id: "out", label: "输出", side: "right" }],
    schema: [
      { field: "entryUrl", label: "入口 URL", component: "input", required: true },
    ],
  },
  {
    type: "PAGE_ACCESS",
    title: "页面访问",
    detail: "支持 HTTP 与 Playwright，两类页面访问方式共用一个节点。",
    color: "#1d4ed8",
    icon: "ri:global-line",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "out", label: "输出", side: "right" },
    ],
    schema: [
      {
        field: "accessMode",
        label: "访问模式",
        component: "select",
        options: [
          { label: "HTTP", value: "HTTP" },
          { label: "Playwright", value: "PLAYWRIGHT" },
        ],
      },
    ],
  },
  {
    type: "URL_PARSE",
    title: "URL 解析",
    detail: "默认提取 a 标签，并支持规则解析与 AI 参与解析。",
    color: "#7c3aed",
    icon: "ri:links-line",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "out", label: "输出", side: "right" },
    ],
    schema: [
      { field: "selector", label: "选择器", component: "input" },
      { field: "aiPrompt", label: "AI 解析提示", component: "textarea" },
    ],
  },
  {
    type: "DATA_PARSE",
    title: "数据解析",
    detail: "支持 XPath、CSS、AI、可视化四种模式。",
    color: "#b45309",
    icon: "ri:file-search-line",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "out", label: "输出", side: "right" },
    ],
    schema: [
      {
        field: "parseMode",
        label: "解析模式",
        component: "select",
        options: [
          { label: "XPath", value: "XPATH" },
          { label: "CSS", value: "CSS" },
          { label: "AI", value: "AI" },
          { label: "可视化", value: "VISUAL" },
        ],
      },
      {
        field: "parseSource",
        label: "解析来源",
        component: "select",
        options: [
          { label: "页面 HTML", value: "PAGE_HTML" },
          { label: "页面文本", value: "PAGE_TEXT" },
          { label: "指定元素", value: "ELEMENT" },
        ],
      },
      { field: "parseSelector", label: "元素选择器", component: "input" },
      { field: "fieldMapping", label: "字段映射", component: "textarea", required: true },
    ],
  },
  {
    type: "SAVE_RESULT",
    title: "结构化",
    detail: "定义结果结构标识、目标表与字段模板，供结果保存节点引用。",
    color: "#0f766e",
    icon: "ri:database-2-line",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "out", label: "输出", side: "right" },
    ],
    schema: [
      { field: "schemaCode", label: "结构化标识", component: "input", required: true },
      { field: "tableName", label: "目标表名", component: "input" },
      { field: "fieldTemplate", label: "字段模板", component: "textarea" },
    ],
  },
  {
    type: "DOWNLOADER",
    title: "文档下载器",
    detail: "下载文件，并把结果继续交给后续节点处理。",
    color: "#475569",
    icon: "ri:download-cloud-line",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "out", label: "输出", side: "right" },
    ],
    schema: [
      { field: "downloadMode", label: "下载模式", component: "select", options: [
        { label: "普通下载", value: "NORMAL" },
        { label: "AI 辅助", value: "AI" },
      ] },
    ],
  },
  {
    type: "SUB_FLOW",
    title: "子流程",
    detail: "引用当前爬虫内部私有子流程。",
    color: "#0369a1",
    icon: "ri:node-tree",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "out", label: "输出", side: "right" },
    ],
    schema: [
      { field: "subFlowCode", label: "子流程编码", component: "input", required: true },
    ],
  },
  {
    type: "HUMAN_INTERVENE",
    title: "人工介入",
    detail: "用于验证码、短信、扫码等人工接管场景，运行时可派生步骤。",
    color: "#ca8a04",
    icon: "ri:user-heart-line",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "out", label: "输出", side: "right" },
    ],
    schema: [
      { field: "taskType", label: "任务类型", component: "input", required: true },
    ],
  },
  {
    type: "CONDITION",
    title: "条件判断",
    detail: "基于状态、字段或页面内容进行分支。",
    color: "#be123c",
    icon: "ri:git-branch-line",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "pass", label: "满足", side: "right" },
      { id: "reject", label: "不满足", side: "right" },
    ],
    schema: [
      { field: "condition", label: "条件表达式", component: "textarea", required: true },
    ],
  },
  {
    type: "SAVE_RESULT",
    title: "结果保存",
    detail: "统一结果先落中间表，再决定是否同步业务表。",
    color: "#15803d",
    icon: "ri:database-2-line",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "out", label: "输出", side: "right" },
    ],
    schema: [
      { field: "schemaCode", label: "结果结构编码", component: "input", required: true },
    ],
  },
  {
    type: "ASYNC_SAVE",
    title: "异步保存",
    detail: "每次执行时增量保存中间结果，不阻塞流程。",
    color: "#0891b2",
    icon: "ri:save-line",
    ports: [
      { id: "in", label: "输入", side: "left" },
      { id: "out", label: "输出", side: "right" },
    ],
    schema: [
      { field: "schemaCode", label: "结果结构编码", component: "input", required: true },
    ],
  },
  {
    type: "END",
    title: "结束节点",
    detail: "收束执行并记录最终状态。",
    color: "#111827",
    icon: "ri:stop-circle-line",
    ports: [{ id: "in", label: "输入", side: "left" }],
    schema: [],
  },
];
