//#region ../../packages/assets/src/images/login/science.png
var science_default = "/assets/science-BMHLGnO3.png";
//#endregion
//#region ../../packages/assets/src/images/logo/logo.svg
var logo_default = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20128%20128'%20fill='none'%3e%3c!--%20扁平化几何抽象%20Logo%20--%3e%3cdefs%3e%3clinearGradient%20id='grad1'%20x1='0%25'%20y1='0%25'%20x2='100%25'%20y2='100%25'%3e%3cstop%20offset='0%25'%20stop-color='%234A9BD9'/%3e%3cstop%20offset='100%25'%20stop-color='%235AC8A0'/%3e%3c/linearGradient%3e%3c/defs%3e%3c!--%20主圆形背景%20--%3e%3ccircle%20cx='64'%20cy='64'%20r='56'%20fill='url(%23grad1)'/%3e%3c!--%20抽象几何图形%20-%20代表AI/连接%20--%3e%3cpath%20d='M40%2052%20L56%2044%20L72%2052%20L72%2068%20L56%2076%20L40%2068%20Z'%20fill='white'%20opacity='0.95'/%3e%3cpath%20d='M56%2060%20L72%2052%20L88%2060%20L88%2076%20L72%2084%20L56%2076%20Z'%20fill='white'%20opacity='0.7'/%3e%3c!--%20中心点%20--%3e%3ccircle%20cx='64'%20cy='64'%20r='6'%20fill='white'/%3e%3c/svg%3e";
//#endregion
//#region ../../packages/assets/src/resolveAssetUrl.ts
var loginImages = /* #__PURE__ */ Object.assign({ "./images/login/science.png": science_default });
var logoImages = /* #__PURE__ */ Object.assign({ "./images/logo/logo.svg": logo_default });
/** 取路径最后一段文件名（science.png） */
function basename(url) {
	const parts = (url.split(/[?#]/)[0] ?? "").split("/");
	return parts[parts.length - 1] ?? "";
}
/**
* 解析配置中的图片地址为可加载 URL。
* @param url 配置值（本地资源路径 / 外部 URL / data: URI）
*/
function resolveAssetUrl(url) {
	if (!url) return "";
	if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;
	const name = basename(url);
	for (const [key, value] of Object.entries(loginImages)) if (key.endsWith(name)) return value;
	for (const [key, value] of Object.entries(logoImages)) if (key.endsWith(name)) return value;
	return url;
}
//#endregion
export { logo_default as n, resolveAssetUrl as t };
