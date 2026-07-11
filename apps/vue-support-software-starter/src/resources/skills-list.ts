export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export const BUILTIN_SKILLS: SkillInfo[] = [
  { id: "code-review", name: "Code Review", description: "自动审查代码变更并提供改进建议", category: "code", enabled: true },
  { id: "unit-test", name: "Unit Test Generator", description: "根据代码自动生成单元测试用例", category: "code", enabled: true },
  { id: "api-doc", name: "API Documenter", description: "从代码注释和路由定义生成 API 文档", category: "code", enabled: false },
  { id: "db-query", name: "Database Query", description: "用自然语言编写和优化 SQL 查询", category: "database", enabled: true },
  { id: "db-schema", name: "Schema Designer", description: "分析和设计数据库表结构", category: "database", enabled: false },
  { id: "commit-msg", name: "Commit Message", description: "根据代码变更生成规范的提交信息", category: "devtools", enabled: true },
  { id: "git-blame", name: "Git Blame Analysis", description: "分析代码行历史和责任归属", category: "devtools", enabled: false },
  { id: "refactor", name: "Code Refactor", description: "检测代码异味并提供重构方案", category: "code", enabled: true },
  { id: "security-scan", name: "Security Scanner", description: "检测代码中的安全漏洞和风险", category: "security", enabled: false },
  { id: "performance", name: "Performance Audit", description: "分析代码性能瓶颈并提供优化建议", category: "code", enabled: false },
  { id: "dependency", name: "Dependency Check", description: "检查项目依赖的版本和安全性", category: "devtools", enabled: true },
  { id: "i18n-helper", name: "i18n Helper", description: "帮助提取和管理国际化翻译字符串", category: "code", enabled: false },
]
