# Bugfix Requirements Document

## Introduction

当前项目使用 `@huggingface/transformers` 库来实现浏览器端的 AI 文本生成功能。该实现存在两个关键问题：

1. 需要手动编写模型下载逻辑，且模型无法成功下载
2. 模型加载和推理在主线程执行，导致 UI 冻结和用户界面无响应

本次修复将使用 `@xenova/transformers` 替换 `@huggingface/transformers`，并通过 Web Worker 将计算密集型任务移至后台线程，确保主线程保持响应。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN 使用 `@huggingface/transformers` 时 THEN 系统需要手动编写模型下载逻辑且模型无法成功下载

1.2 WHEN 调用 `generateByTransformersJs` 进行模型加载时 THEN 主线程被阻塞，UI 冻结无响应

1.3 WHEN 调用 `generateByTransformersJs` 进行文本推理时 THEN 主线程被阻塞，UI 冻结无响应

### Expected Behavior (Correct)

2.1 WHEN 使用 `@xenova/transformers` 时 THEN 系统应自动处理模型下载，无需手动编写下载逻辑

2.2 WHEN 调用文本生成功能进行模型加载时 THEN 加载过程应在 Web Worker 后台线程执行，主线程保持响应，UI 不冻结

2.3 WHEN 调用文本生成功能进行文本推理时 THEN 推理过程应在 Web Worker 后台线程执行，主线程保持响应，UI 不冻结

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 调用文本生成功能时 THEN 系统应继续返回有效的生成文本结果

3.2 WHEN 使用 Xenova/Qwen2.5-0.5B-Instruct 模型时 THEN 系统应继续支持该模型的加载和推理

3.3 WHEN 模型加载过程中 THEN 系统应继续提供加载进度信息（如果技术上可行）
