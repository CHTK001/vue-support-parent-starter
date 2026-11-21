# Web 浏览器推理模型脚本（/web-chat/）

本目录下的脚本由前端 `webChatClient.ts` 动态 `import` 加载，**全部在浏览器端推理**，
不经服务端转发。后端只维护模型目录（模型行 `capabilities[0].js_path` 指向这里的脚本）。

## 脚本契约

每个脚本是一个 ES Module，默认导出工厂函数：

```js
export default function createClient(modelInfo) {
  return {
    load?:    async () => {},                       // 可选：预热 / 加载权重
    chat:     async (messages, opts) => '全文',      // 必选：推理并流式回吐
    dispose?: () => {},                             // 可选：释放资源
  }
}
```

`chat(messages, opts)` 参数：

| 参数 | 说明 |
| --- | --- |
| `messages` | `[{ role, content }]`，当前只含本轮用户输入 |
| `opts.onDelta(chunk)` | 流式增量回调，逐块吐给会话正文 |
| `opts.signal` | `AbortSignal`，用户中止流时置位，脚本应尽快返回 |
| `opts.files` | 会话附件（后端落盘绝对路径数组），图片输入脚本经 `POST /api/fs/image-base64` 读回 |

## 内置脚本清单

| 脚本 | 能力 | 依赖 | 说明 |
| --- | --- | --- | --- |
| `echo-demo.js` | 对话（演示） | 无 | 逐字回显输入，验证 Web 推理链路 |
| `chat-local.js` | 对话（真实本地模型） | transformers.js（CDN）+ 按需下载权重 | WebGPU 优先、WASM 兜底 |
| `ocr.js` | 图片文字识别 | Tesseract.js（CDN）+ 语言包 | 支持中英文，需上传图片附件 |
| `face-detect.js` | 人脸检测 | face-api.js（CDN）+ tiny 权重（约 190KB） | 输出人脸数、置信度与位置 |
| `image-gen.js` | 文生图 | 无（Canvas 2D） | 提示词作种子程序化渲染，输出 Markdown 图片 |
| `colorize.js` | 图片上色 | onnxruntime-web（CDN）+ DDColor fp16 权重（约 108MB） | 黑白照片本地还原成彩色，WebGPU 优先、WASM 兜底 |

公共工具在 `_shared.js`：CDN 多源加载（`importFirst`）、附件图片解析
（`resolveInputImages`）、流式输出（`streamOut`）等。

## 模型行配置（js_path 查询参数）

模型目录里把模型行的 JS 路径带上查询参数即可覆盖默认配置，例如：

- `/web-chat/chat-local.js?model=onnx-community/Qwen2.5-0.5B-Instruct&max_new_tokens=512&endpoint=https://你的权重镜像/`
- `/web-chat/ocr.js?langs=chi_sim+eng&lang_path=https://你的 tessdata 镜像/`
- `/web-chat/face-detect.js?threshold=0.5&input_size=320`
- `/web-chat/image-gen.js?w=960&h=640`
- `/web-chat/colorize.js?model=https://你的权重镜像/ddcolor-fp16.onnx&fmt=jpeg&max=2048&ep=webgpu`

## 网络与权重源

- `chat-local.js` 权重默认走 `hf-mirror.com`（HuggingFace 大陆镜像）；自托管权重用
  `endpoint` 参数覆盖。
- `colorize.js` 权重（DDColor fp16 ONNX，Apache-2.0）默认走
  `hf-mirror.com/wavespeed/image-colorizer`；自托管权重用 `model` 参数指向同源 URL。
- `ocr.js` 语言包默认探测 `tessdata.projectnaptha.com`，失败换 jsdelivr 镜像；
  可用 `lang_path` 指定自托管目录。
- `face-detect.js` 权重走 jsdelivr 的 GitHub 镜像（`justadudewhohacks/face-api.js`）。
- 所有 CDN 依赖都是多候选依次尝试（jsdelivr → unpkg → esm.sh），全部失败时抛出
  汇总错误明示网络问题，**不伪造模型输出**。

## 新增脚本须知

1. 纯浏览器 ESM：`public/` 不经 vite 处理，动态 import 必须写完整 URL（不能裸包名）。
2. 加载失败要给出可读错误；识别/生成结果经 `onDelta` 流式吐出，返回值为全文。
3. 长任务（权重下载、识别）用 `opts.signal.aborted` 及时退出。
