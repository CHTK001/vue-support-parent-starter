//#region ../../pages/datasource/src/utils/clipboard.ts
/**
* Clipboard helper with a legacy fallback for plain HTTP LAN access.
*
* navigator.clipboard only exists in secure contexts (HTTPS or localhost),
* while the datasource console is commonly opened via http://192.168.x.x.
* Keep the fallback in one place so every console page behaves the same.
*/
async function copyToClipboard(text) {
	if (navigator.clipboard?.writeText) try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {}
	return legacyCopy(text);
}
function legacyCopy(text) {
	const area = document.createElement("textarea");
	area.value = text;
	area.setAttribute("readonly", "true");
	area.style.position = "fixed";
	area.style.top = "0";
	area.style.left = "0";
	area.style.width = "1px";
	area.style.height = "1px";
	area.style.padding = "0";
	area.style.border = "none";
	area.style.outline = "none";
	area.style.boxShadow = "none";
	area.style.background = "transparent";
	area.style.opacity = "0";
	document.body.appendChild(area);
	try {
		area.select();
		area.setSelectionRange(0, area.value.length);
		return document.execCommand("copy");
	} catch {
		return false;
	} finally {
		document.body.removeChild(area);
	}
}
//#endregion
export { copyToClipboard as t };
