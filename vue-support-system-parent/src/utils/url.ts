/**
 * 获取url参数
 * @param name
 * @returns
 */
export function getParameter(name: string) {
  const search = window.location.search;
  const pattern = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)");
  const matches = search.match(pattern);
  const searchParam = matches ? decodeURIComponent(matches[1]) : null;
  return searchParam;
}
