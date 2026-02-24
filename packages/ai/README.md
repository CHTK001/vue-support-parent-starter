# @repo/ai

基于 `@xenova/transformers` 和 Web Worker 的 AI 工具包。

## 特性

- 使用 Web Worker 在后台处理 AI 任务，不阻塞主线程
- 支持多种 AI 任务：文本分类、情感分析、问答、文本生成、翻译、摘要、嵌入向量等
- 自动管理模型加载和缓存
- TypeScript 类型支持

## 安装

```bash
pnpm add @repo/ai
```

## 使用示例

### 基础用法

```typescript
import { getAIClient } from '@repo/ai';

const ai = getAIClient();

// 文本分类
const classification = await ai.classify('这是一个很好的产品');
console.log(classification);

// 情感分析
const sentiment = await ai.sentiment('今天天气真好！');
console.log(sentiment);

// 问答
const answer = await ai.questionAnswering(
  '什么是人工智能？',
  '人工智能是计算机科学的一个分支...'
);
console.log(answer);

// 文本生成
const generated = await ai.generate('写一首关于春天的诗');
console.log(generated);

// 翻译
const translated = await ai.translate('Hello, world!');
console.log(translated);

// 摘要
const summary = await ai.summarize('这是一段很长的文本...');
console.log(summary);

// 嵌入向量
const embedding = await ai.embed('文本内容');
console.log(embedding);

// 零样本分类
const zeroShot = await ai.zeroShotClassify(
  '这是一篇关于技术的文章',
  ['技术', '体育', '娱乐']
);
console.log(zeroShot);
```

### 自定义配置

```typescript
import { createAIClient } from '@repo/ai';

const ai = createAIClient();

// 使用指定模型
const result = await ai.classify('文本内容', {
  model: 'distilbert-base-uncased-finetuned-sst-2-english',
  options: {
    top_k: 3
  }
});
```

### 清理资源

```typescript
import { getAIClient } from '@repo/ai';

const ai = getAIClient();

// 使用完毕后销毁 Worker
ai.destroy();
```

## API

### AIClient

#### 方法

- `classify(text: string, config?: AITaskConfig): Promise<ClassificationResult[]>`
- `sentiment(text: string, config?: AITaskConfig): Promise<ClassificationResult[]>`
- `questionAnswering(question: string, context: string, config?: AITaskConfig): Promise<{ answer: string; score: number }>`
- `generate(prompt: string, config?: AITaskConfig): Promise<string>`
- `translate(text: string, config?: AITaskConfig): Promise<string>`
- `summarize(text: string, config?: AITaskConfig): Promise<string>`
- `embed(text: string | string[], config?: AITaskConfig): Promise<EmbeddingResult>`
- `zeroShotClassify(text: string, candidateLabels: string[], config?: AITaskConfig): Promise<ClassificationResult[]>`
- `destroy(): void` - 销毁 Worker 并清理资源

## 注意事项

- 首次加载模型可能需要一些时间，模型会被缓存
- 确保在使用完毕后调用 `destroy()` 清理资源
- Web Worker 需要浏览器支持

