//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/output/printLayout.js
var CSS_PIXELS_PER_INCH = 96;
var normalizeCssPixels = (value) => {
	if (!Number.isFinite(value) || value <= 0) return 0;
	return Number(value.toFixed(3));
};
var formatCssPixels = (value) => `${normalizeCssPixels(value)}px`;
var formatCssInches = (value) => `${Number((normalizeCssPixels(value) / CSS_PIXELS_PER_INCH).toFixed(4))}in`;
var readPositiveCssNumber = (value) => {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
/**
* Browser print helper. DOM measurement belongs in the core browser layer
* because it depends on CSS layout and HTMLElement.
*/
var getElementPrintPageSize = (element, fallback = {}) => {
	const style = window.getComputedStyle(element);
	const width = readPositiveCssNumber(style.width) || element.offsetWidth || fallback.width || element.getBoundingClientRect().width;
	const height = readPositiveCssNumber(style.height) || readPositiveCssNumber(style.minHeight) || element.offsetHeight || fallback.height || element.getBoundingClientRect().height;
	return {
		width: normalizeCssPixels(width),
		height: normalizeCssPixels(height)
	};
};
var applyPrintPageSize = (element, size, options = {}) => {
	const width = formatCssPixels(size.width);
	const height = formatCssPixels(size.height);
	const heightMode = options.heightMode || "fixed";
	element.classList.add("viewer-print-page");
	element.style.setProperty("--viewer-print-page-width", width);
	element.style.setProperty("--viewer-print-page-height", height);
	element.style.width = width;
	element.style.maxWidth = "none";
	element.style.minHeight = height;
	if (heightMode === "fixed") {
		element.style.height = height;
		element.style.overflow = "hidden";
	} else {
		element.style.height = "auto";
		element.style.overflow = "visible";
	}
};
var buildPrintPageStyle = ({ selector, width, height, heightMode = "fixed" }) => {
	const pageWidth = formatCssPixels(width);
	const pageHeight = formatCssPixels(height);
	const heightRule = heightMode === "fixed" ? `height:${pageHeight}!important;min-height:${pageHeight}!important;overflow:hidden!important;` : `height:auto!important;min-height:${pageHeight}!important;overflow:visible!important;`;
	return `
    @page { size: ${formatCssInches(width)} ${formatCssInches(height)}; margin: 0; }
    @media print {
      html, body {
        width: ${pageWidth};
        min-width: ${pageWidth};
        margin: 0 !important;
        padding: 0 !important;
        min-height: 0 !important;
        background: #ffffff !important;
      }
      .viewer-export-shell,
      .viewer-export-content {
        width: ${pageWidth} !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      ${selector} {
        width: ${pageWidth}!important;
        max-width: none!important;
        ${heightRule}
        margin: 0!important;
        box-shadow: none!important;
        border: 0!important;
        break-after: page;
        page-break-after: always;
      }
      ${selector}:last-child {
        break-after: auto;
        page-break-after: auto;
      }
    }
  `;
};
//#endregion
export { getElementPrintPageSize as i, buildPrintPageStyle as n, formatCssPixels as r, applyPrintPageSize as t };
