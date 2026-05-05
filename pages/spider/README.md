# 可视化编排爬虫模块

爬虫可视化编排前端模块，支持节点拖拽、流程配置和运行监控。

## 开发环境

### 前端 dev server（端口 8868）

```bash
cd test/vue-support-spider-test-starter
pnpm dev
```

访问地址：http://localhost:8868/#/spider/orchestration

### 后端（端口 19091）

Spring Boot 应用，位于 `spring-support-api-parent/test/spring-api-support-spider-test-starter`。

```bash
cd spring-support-api-parent/test/spring-api-support-spider-test-starter
mvn spring-boot:run
```

## 代理配置

前端 dev server（8868）将 `/spider-api` 代理到后端 19091。

## 后端依赖

- MySQL（172.16.0.40:3306）
- Redis（172.16.0.40:16379）
