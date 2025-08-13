/**
 * 从常见的后端分页/树接口响应中提取数组
 * 兼容 records/nodes/children/list 或直接数组
 */
export function extractArrayFromApi(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  // 兼容多种常见字段
  return payload.records || payload.nodes || payload.children || payload.list || payload.data || [];
}

/**
 * 标准化树节点为 { name, path, children, leaf }
 * - 根据 hasChildren 推断 leaf（Element Plus 使用 isLeaf/leaf 控制展开图标）
 */
export function normalizeTreeNode(node: any): any {
  const name = node?.name ?? node?.label ?? node?.title ?? node?.path ?? node?.id ?? "节点";
  const path = node?.path ?? node?.id ?? name;
  const hasChildren = Boolean(node?.hasChildren);
  const childrenRaw = node?.children;
  const children = Array.isArray(childrenRaw) ? childrenRaw.map(normalizeTreeNode) : [];
  const leaf = hasChildren ? false : children.length === 0;
  return { ...node, name, path, children, leaf };
}

/**
 * 将接口返回的列表统一转换为标准树节点数组
 */
export function normalizeTreeList(payloadOrList: any): any[] {
  const list = extractArrayFromApi(payloadOrList);
  return list.map(normalizeTreeNode);
}
 


