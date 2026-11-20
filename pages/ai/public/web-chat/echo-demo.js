/**
 * Web 浏览器推理 · 演示模型（echo）
 *
 * 「浏览器推理（Web）」供应商的内置演示脚本：逐字回显用户输入，用于验证
 * 「模型脚本由前端动态加载、浏览器端推理」的完整链路
 * （模型管理 → 会话分流 → 动态 import → 流式渲染）。
 *
 * 契约：ES Module 默认导出 createClient(modelInfo)，返回
 * { load?, chat(messages, { onDelta, signal }), dispose? }。
 */

export default function createClient(modelInfo) {
  const name = (modelInfo && (modelInfo.name || modelInfo.id)) || 'echo'
  return {
    async load() {
      /* 演示模型无权重可加载；真实脚本在这里初始化 WASM / WebGPU 等运行时 */
    },

    /**
     * 逐字回显：把最后一条用户输入按小块分片，经 onDelta 流式回调。
     *
     * @param messages 消息数组（演示只取最后一条用户输入）
     * @param opts onDelta 增量回调 / signal 取消信号
     * @returns {Promise<string>} 全文
     */
    async chat(messages, opts = {}) {
      const last = Array.isArray(messages) && messages.length ? messages[messages.length - 1] : null
      const text = String((last && (last.content ?? last.text)) ?? '')
      const reply = text ? `[${name}] ${text}` : `[${name}]（没有可回显的输入）`
      const onDelta = typeof opts.onDelta === 'function' ? opts.onDelta : null
      if (!onDelta) return reply
      // 按小块流式吐出：演示分片节奏（真实脚本这里换成推理 token 流）
      const step = 4
      for (let i = 0; i < reply.length; i += step) {
        if (opts.signal && opts.signal.aborted) throw new Error('aborted')
        onDelta(reply.slice(i, i + step))
        await new Promise((resolve) => setTimeout(resolve, 16))
      }
      return reply
    },

    dispose() {
      /* 演示模型无资源可释放 */
    },
  }
}
