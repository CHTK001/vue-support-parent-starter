export const PermissionList = [
  { label: "全部可见", value: 1 },
  { label: "本人可见", value: 2 },
  { label: "所在部门可见", value: 3 },
  { label: "所在部门及子级可见", value: 4 },
  { label: "选择的部门可见", value: 5 },
];
/**
 * 根据value获取label
 * @param value
 * @returns
 */
export function getPermissionLabel(value: number): string {
  const permission = PermissionList.find((item) => item.value === value);
  return permission?.label;
}
