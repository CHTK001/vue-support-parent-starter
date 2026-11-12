/**
 * 「指令 / 附件」条目的图标口径。
 *
 * <p>原来这套映射只写在 CommandPicker.vue 里，本轮输入区弹层（+ 打开的面板）
 * 需要渲染同一批条目。两处各抄一份迟早会漂——同一项在斜杠弹层是「知识库」图标、
 * 在 + 弹层变成「技能」图标。统一收到这里，两个组件都从这里取。</p>
 *
 * <p>图标用内联 path 而不是图标包：@vicons/fluent 的导出并非全集，
 * 缺项时会渲染成空白（历史上「输入库图标不对」就是这个原因）。</p>
 */
export type CommandIconKind = 'file' | 'image' | 'knowledge' | 'model' | 'skill' | 'session' | 'compress';

export const COMMAND_ICON_PATHS: Record<CommandIconKind, string> = {
  file: 'M5 2.5h6.2L15.5 6.8V17.5H5z M11 2.5v4.5h4.5',
  image: 'M3 4.5h14v11H3z M3 12.5l3.6-3.4 3 2.7 2.4-2.2 5 4.6 M12.8 7.6h.01',
  knowledge: 'M3.5 4.2c2.6-.8 4.6-.5 6.5.6v11c-1.9-1.1-3.9-1.4-6.5-.6z M16.5 4.2c-2.6-.8-4.6-.5-6.5.6v11c1.9-1.1 3.9-1.4 6.5-.6z',
  model: 'M10 2.2l1.9 4.5 4.9.4-3.7 3.2 1.1 4.8L10 12.6l-4.2 2.5 1.1-4.8-3.7-3.2 4.9-.4z',
  skill: 'M10 2.6l6.2 3.6v7.6L10 17.4 3.8 13.8V6.2z M10 7.2v5.6 M7.2 8.8l5.6 2.4',
  session: 'M3.5 5.5h13v9h-8l-3.2 2.6v-2.6h-1.8z M7 9h6 M7 11.6h3.6',
  compress: 'M4 6h12 M4 10h12 M4 14h12 M8 3.2 10 5.4 8 7.6 M12 12.4l-2 2.2 2 2.2',
};

/**
 * 从 builtin 标记 / 名称推断条目类型；后端下发的技能统一落到 skill。
 *
 * @param item 指令条目（builtin / name / label）
 * @returns 图标类型
 */
export function resolveCommandIconKind(item: any): CommandIconKind {
  const builtin = String(item?.builtin || '');
  if (builtin === 'attach-image') return 'image';
  if (builtin === 'attach-file') return 'file';
  if (builtin === 'knowledge-base') return 'knowledge';
  if (builtin === 'model') return 'model';
  if (builtin === 'compress') return 'compress';
  if (builtin === 'new-session') return 'session';
  if (builtin === 'create-skill') return 'skill';
  const name = `${item?.name || ''} ${item?.label || ''}`.toLowerCase();
  if (/image|图片/.test(name)) return 'image';
  if (/file|upload|文件|附件/.test(name)) return 'file';
  if (/kb|knowledge|知识库/.test(name)) return 'knowledge';
  if (/model|模型/.test(name)) return 'model';
  return 'skill';
}
