//#region ../../pages/filesystem/src/utils/officeRenderer.ts
/**
* 客户端 Office 直渲染能力映射（@file-viewer / preset-office 版）。
*
* <p>渲染底座已从 {@code @vue-office/*} 换成 {@code @file-viewer/vue3} +
* {@code @file-viewer/preset-office}：preset-office 内置 OOXML / OLE2 /
* RTF / OpenDocument / iWork / WordPerfect / Hangul 解析器，传统二进制
* （.doc / .xls / .ppt）可在浏览器内直接渲染，不再需要服务端转换。</p>
*
* <p>与后端 {@code com.chua.filestorage.support.preview.ClientPreviewSupport}
* 的关系：后端清单决定 {@code ?preview=true} 是否直吐原始字节
* （channel=client）。即便后端未把某扩展名判为 client（返回 channel=spi
* 的服务端 HTML），前端面板也会自行嗅探原始字节，在可直渲染时改走客户端
* 渲染（见 PreviewOfficePanel#load）。</p>
*
* <p>渲染器选择由 file-viewer 按<b>文件名扩展名</b>完成；扩展名说谎的文件
* （如扩展名 .doc、内容是 OOXML）由 {@link resolveViewerFileName} 按内容
* 魔数校正后传入。</p>
*
* @author CH
* @since 2026/09/26（@file-viewer 迁移：2026/10/09）
*/
/**
* 可客户端直渲染的扩展名（preset-office 覆盖范围）。
*
* <p>不含 {@code ofd}：它有专用 PreviewOfdPanel 路由，混入本清单会抢走
* 原有链路。</p>
*
* <p><b>口径</b>：preset-office 3.1.2 各 renderer 包根目录
* {@code file-viewer.capability.json} 的 {@code formats} 并集（2026/10/10
* 逐包核对：word / spreadsheet / pptx / ppt / pdf / ofd / iwork /
* wordperfect / hangul；rtf 由 renderer-word 的 sanitizeRtf 支持，未进
* manifest 但 preset README 明示）。上次核对补齐了 odp / xla / xlam /
* dbf / wp / wp5 / wp6 —— 漏一个格式，它就会从客户端 Office 面板掉进
* iframe 服务端通道或「暂不支持预览」兜底。</p>
*/
var CLIENT_RENDERABLE_EXTS = /* @__PURE__ */ new Set([
	"docx",
	"docm",
	"dotx",
	"dotm",
	"doc",
	"dot",
	"rtf",
	"odt",
	"odp",
	"xlsx",
	"xlsm",
	"xlsb",
	"xltx",
	"xltm",
	"xlt",
	"xls",
	"ods",
	"fods",
	"csv",
	"tsv",
	"xla",
	"xlam",
	"dbf",
	"pptx",
	"pptm",
	"potx",
	"potm",
	"ppsx",
	"ppsm",
	"ppt",
	"pot",
	"pdf",
	"ofd",
	"pages",
	"numbers",
	"key",
	"wpd",
	"wp",
	"wp5",
	"wp6",
	"hwp",
	"hwpx"
]);
/**
* 传统二进制扩展名（OLE2 容器）
*
* <p>这些扩展名与 OOXML 同名系列（{@code .doc} vs {@code .docx}）在扩展名
* 层面无法区分，必须结合内容魔数判断：preset-office 能直接渲染 OLE2 本体，
* 但「扩展名是 .doc、内容其实是 .docx」的文件若按原名交给 file-viewer，
* 会按扩展名选 OLE2 解析器、在 ZIP 字节上失败 —— 由
* {@link resolveViewerFileName} 校正。</p>
*/
var LEGACY_BINARY_EXTS = /* @__PURE__ */ new Set([
	"doc",
	"xls",
	"ppt"
]);
/** OLE2 / CFB 复合文档文件头（传统 .doc / .xls / .ppt） */
var OLE2_MAGIC = [
	208,
	207,
	17,
	224,
	161,
	177,
	26,
	225
];
/** ZIP 本地文件头（OOXML 家族） */
var ZIP_MAGIC = [
	80,
	75,
	3,
	4
];
/** PDF 文件头（file-viewer 按扩展名选 renderer-pdf） */
var PDF_MAGIC = [
	37,
	80,
	68,
	70
];
/**
* 文档防泄密软件（实测 360 防泄密）透明加密后的密文文件头
*
* <p><b>判据来源</b>：3 个 .dwg 与 1 个 .doc 的**前 18 字节完全相同**，
* 且熵 7.99 bit/byte（8.0 = 完全随机）、不含 AC10xx / AcDb / PK / OLE2
* 任何特征串。不同类型文件共用同一文件头，只能是同一个加密容器，
* 不是各自「坏掉」——随机损坏不可能产生这个。</p>
*
* <p>这类文件只有装了客户端并获授权的终端才能解密；服务端与浏览器读到的是密文，
* 任何解析器都打不开，**重新上传也没用**。</p>
*/
var CIPHER_MAGIC = [
	64,
	33,
	40,
	21,
	42,
	45,
	27,
	32,
	35,
	48,
	30,
	25,
	47,
	34,
	22,
	64,
	1,
	0
];
/**
* 判断字节是否带防泄密软件的密文头
*
* @param bytes 文件字节
* @returns 是密文返回 true
*/
function isEncryptedDoc(bytes) {
	if (!bytes || bytes.length < CIPHER_MAGIC.length) return false;
	return CIPHER_MAGIC.every((b, i) => bytes[i] === b);
}
/**
* 必须以 ZIP 容器为前提的 OOXML 扩展名
*
* <p>这些格式按规范一定是 ZIP 容器，取到字节后若魔数不是 {@link ZIP_MAGIC}
* 即可判定文件本身已损坏（或上传时被写入了非预期内容）。此时必须拒绝直渲染，
* 否则解析器会抛出 {@code Can't find end of central directory} 这类原始英文
* 异常直达界面。不含 pdf：PDF 不是 ZIP 容器，单独放行。</p>
*/
var OOXML_EXTS = /* @__PURE__ */ new Set([
	"docx",
	"xlsx",
	"pptx"
]);
/** 嗅探 OOXML 内部部件路径的最大扫描字节数 */
var OOXML_SNIFF_LIMIT = 65536;
/** 已知会伪装成传统扩展名的 OOXML 部件标记（与后端 ClientPreviewSupport 保持一致） */
var OOXML_PART_MARKERS = [
	["word/document.xml", "docx"],
	["xl/workbook.xml", "excel"],
	["ppt/presentation.xml", "pptx"]
];
/**
* 判断字节数组是否以指定前缀开头
*
* @param data   数据
* @param prefix 前缀
* @returns true 表示匹配
*/
function startsWith(data, prefix) {
	if (data.length < prefix.length) return false;
	for (let i = 0; i < prefix.length; i++) if (data[i] !== prefix[i]) return false;
	return true;
}
/**
* 在字节数组中按 ASCII 查找字符串首次出现的位置
*
* @param data   数据
* @param needle 待查找的 ASCII 串
* @returns 首次出现下标；未找到返回 -1
*/
function indexOfAscii(data, needle) {
	const target = new TextEncoder().encode(needle);
	const max = Math.min(data.length, OOXML_SNIFF_LIMIT) - target.length;
	outer: for (let i = 0; i <= max; i++) {
		for (let j = 0; j < target.length; j++) if (data[i + j] !== target[j]) continue outer;
		return i;
	}
	return -1;
}
/**
* 扫描 ZIP 容器内的部件路径，识别真实 OOXML 类型
*
* @param data ZIP 字节
* @returns OOXML 家族标识（docx / excel / pptx）；非已知 OOXML 返回空串
*/
function sniffOoxmlRenderer(data) {
	for (const [marker, family] of OOXML_PART_MARKERS) if (indexOfAscii(data, marker) >= 0) return family;
	return "";
}
/**
* 判断文件内容是否已损坏（扩展名与实际格式不符）
*
* <p>用于把「浏览器不支持该格式」和「文件本身坏了」区分开：前者换浏览器有用，
* 后者只能重传。</p>
*
* @param fileName 文件名或对象键
* @param bytes    文件字节
* @returns 内容与扩展名不符时返回 {@code true}
*/
function isCorruptOfficeFile(fileName, bytes) {
	if (isEncryptedDoc(bytes)) return true;
	const ext = extensionOf(fileName);
	if (!OOXML_EXTS.has(ext) || !bytes || bytes.length < 4) return false;
	return !startsWith(bytes, ZIP_MAGIC) && !startsWith(bytes, OLE2_MAGIC);
}
/**
* 提取文件名的小写扩展名（不含点）
*
* @param fileName 文件名或对象键
* @return 小写扩展名；无扩展名时返回空串
*/
function extensionOf(fileName) {
	if (!fileName || !fileName.includes(".")) return "";
	return fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
}
/**
* 判断文件是否可能走客户端直渲染
*
* <p>命中即由 PreviewOfficePanel（file-viewer + preset-office）接管；
* 内容级拒载（密文 / 损坏 OOXML）由面板取到字节后另行判定。</p>
*
* @param fileName 文件名或对象键
* @returns true 表示可能走客户端直渲染
*/
function isClientRenderable(fileName) {
	return CLIENT_RENDERABLE_EXTS.has(extensionOf(fileName));
}
/**
* 按内容魔数校正交给 file-viewer 的文件名（处理「扩展名说谎」的文件）
*
* <p>两类说谎文件需要改名：①传统二进制扩展名（.doc/.xls/.ppt）里实际是
* OOXML ZIP 容器时改回真实家族；②服务端 {@code ?format=pdf} 转换出的
* PDF 字节扩展名仍是源文档（如 .wps）时改回 .pdf —— 否则 file-viewer
* 会按源扩展名选渲染器并在 PDF 字节上失败。</p>
*
* <p>真 OLE2 的 .doc / .xls / .ppt（preset-office 原生可渲染）与其它
* 内容与原名一致的扩展名一律原样返回。</p>
*
* @param fileName 原文件名
* @param bytes    文件字节（未取到时传 undefined，退化为原名）
* @returns 校正后的文件名（仅当内容魔数与扩展名明显不符时改写）
*/
function resolveViewerFileName(fileName, bytes) {
	if (!bytes || bytes.length < 4) return fileName;
	const ext = extensionOf(fileName);
	const dot = fileName.lastIndexOf(".");
	const base = dot > 0 ? fileName.slice(0, dot) : fileName;
	if (ext !== "pdf" && startsWith(bytes, PDF_MAGIC)) return `${base}.pdf`;
	if (!LEGACY_BINARY_EXTS.has(ext)) return fileName;
	if (!startsWith(bytes, ZIP_MAGIC)) return fileName;
	switch (sniffOoxmlRenderer(bytes)) {
		case "docx": return `${base}.docx`;
		case "excel": return `${base}.xlsx`;
		case "pptx": return `${base}.pptx`;
		default: return fileName;
	}
}
/**
* 渲染通道取值：服务端渲染（SPI 提供者 / 转换链路）
*/
var RENDER_SERVER = "server";
//#endregion
export { isEncryptedDoc as a, isCorruptOfficeFile as i, extensionOf as n, resolveViewerFileName as o, isClientRenderable as r, RENDER_SERVER as t };
