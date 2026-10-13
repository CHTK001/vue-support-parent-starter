// 临时占位：file-viewer 可选能力装配模块在当前工作区缺失，导致构建失败。
// 这里放一个最小占位，导出 iworkRenderer（空渲染器），待用户补齐真实实现后删除本文件。
export const iworkRenderer = {
  id: "iwork",
  render: () => null,
};

export default iworkRenderer;
