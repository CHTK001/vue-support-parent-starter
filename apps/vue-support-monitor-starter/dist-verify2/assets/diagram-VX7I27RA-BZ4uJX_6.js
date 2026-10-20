import { t as ordinal } from "./ordinal-Dly9IO_-.js";
import { a as format } from "./src-gHE2rRQW.js";
import { n as select_default } from "./pointer-CUzP0kn2.js";
import { i as cleanAndMerge } from "./chunk-75Z2AOVW-tyQLi-d5.js";
import { s as hierarchy, t as treemap_default } from "./treemap-D9tV7X7y.js";
import { n as __name } from "./chunk-Y2CYZVJY-Cs0fowS7.js";
import { t as log } from "./src-D5h6GpYO.js";
import { D as getThemeVariables3, H as setAccDescription, K as setDiagramTitle, U as setAccTitle, a as clear, b as getConfig, c as configureSvgSize, f as defaultConfig_default, v as getAccDescription, w as getDiagramTitle, y as getAccTitle } from "./chunk-DU6HZSFF-BqXTkcmT.js";
import { t as selectSvgElement } from "./chunk-CLGD4ZFX-CX7aaA01.js";
import { t as populateCommonDb } from "./chunk-JWPE2WC7-qj81hAf6.js";
import { n as parse } from "./mermaid-parser.core-BJcyKb9t.js";
import { i as styles2String, n as isLabelStyle } from "./chunk-P2QGCYS3-CGIfvHGB.js";
import { t as setupViewPortForSVG } from "./chunk-POPQ4Y6H-7d4Y3em_.js";
//#region ../../node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/diagram-VX7I27RA.mjs
var TreeMapDB = class {
	constructor() {
		this.nodes = [];
		this.levels = /* @__PURE__ */ new Map();
		this.outerNodes = [];
		this.classes = /* @__PURE__ */ new Map();
		this.setAccTitle = setAccTitle;
		this.getAccTitle = getAccTitle;
		this.setDiagramTitle = setDiagramTitle;
		this.getDiagramTitle = getDiagramTitle;
		this.getAccDescription = getAccDescription;
		this.setAccDescription = setAccDescription;
	}
	static {
		__name(this, "TreeMapDB");
	}
	getNodes() {
		return this.nodes;
	}
	getConfig() {
		const defaultConfig = defaultConfig_default;
		const userConfig = getConfig();
		return cleanAndMerge({
			...defaultConfig.treemap,
			...userConfig.treemap ?? {}
		});
	}
	addNode(node, level) {
		this.nodes.push(node);
		this.levels.set(node, level);
		if (level === 0) {
			this.outerNodes.push(node);
			this.root ??= node;
		}
	}
	getRoot() {
		return {
			name: "",
			children: this.outerNodes
		};
	}
	addClass(id, _style) {
		const styleClass = this.classes.get(id) ?? {
			id,
			styles: [],
			textStyles: []
		};
		const styles = _style.replace(/\\,/g, "§§§").replace(/,/g, ";").replace(/§§§/g, ",").split(";");
		if (styles) styles.forEach((s) => {
			if (isLabelStyle(s)) if (styleClass?.textStyles) styleClass.textStyles.push(s);
			else styleClass.textStyles = [s];
			if (styleClass?.styles) styleClass.styles.push(s);
			else styleClass.styles = [s];
		});
		this.classes.set(id, styleClass);
	}
	getClasses() {
		return this.classes;
	}
	getStylesForClass(classSelector) {
		return this.classes.get(classSelector)?.styles ?? [];
	}
	clear() {
		clear();
		this.nodes = [];
		this.levels = /* @__PURE__ */ new Map();
		this.outerNodes = [];
		this.classes = /* @__PURE__ */ new Map();
		this.root = void 0;
	}
};
function buildHierarchy(items) {
	if (!items.length) return [];
	const root = [];
	const stack = [];
	items.forEach((item) => {
		const node = {
			name: item.name,
			children: item.type === "Leaf" ? void 0 : []
		};
		node.classSelector = item?.classSelector;
		if (item?.cssCompiledStyles) node.cssCompiledStyles = item.cssCompiledStyles;
		if (item.type === "Leaf" && item.value !== void 0) node.value = item.value;
		while (stack.length > 0 && stack[stack.length - 1].level >= item.level) stack.pop();
		if (stack.length === 0) root.push(node);
		else {
			const parent = stack[stack.length - 1].node;
			if (parent.children) parent.children.push(node);
			else parent.children = [node];
		}
		if (item.type !== "Leaf") stack.push({
			node,
			level: item.level
		});
	});
	return root;
}
__name(buildHierarchy, "buildHierarchy");
var populate = /* @__PURE__ */ __name((ast, db) => {
	populateCommonDb(ast, db);
	const items = [];
	for (const row of ast.TreemapRows ?? []) if (row.$type === "ClassDefStatement") db.addClass(row.className ?? "", row.styleText ?? "");
	for (const row of ast.TreemapRows ?? []) {
		const item = row.item;
		if (!item) continue;
		const level = row.indent ? parseInt(row.indent) : 0;
		const name = getItemName(item);
		const styles = item.classSelector ? db.getStylesForClass(item.classSelector) : [];
		const cssCompiledStyles = styles.length > 0 ? styles : void 0;
		const itemData = {
			level,
			name,
			type: item.$type,
			value: item.value,
			classSelector: item.classSelector,
			cssCompiledStyles
		};
		items.push(itemData);
	}
	const hierarchyNodes = buildHierarchy(items);
	const addNodesRecursively = /* @__PURE__ */ __name((nodes, level) => {
		for (const node of nodes) {
			db.addNode(node, level);
			if (node.children && node.children.length > 0) addNodesRecursively(node.children, level + 1);
		}
	}, "addNodesRecursively");
	addNodesRecursively(hierarchyNodes, 0);
}, "populate");
var getItemName = /* @__PURE__ */ __name((item) => {
	return item.name ? String(item.name) : "";
}, "getItemName");
var parser = {
	parser: { yy: void 0 },
	parse: /* @__PURE__ */ __name(async (text) => {
		try {
			const ast = await parse("treemap", text);
			log.debug("Treemap AST:", ast);
			const db = parser.parser?.yy;
			if (!(db instanceof TreeMapDB)) throw new Error("parser.parser?.yy was not a TreemapDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");
			populate(ast, db);
		} catch (error) {
			log.error("Error parsing treemap:", error);
			throw error;
		}
	}, "parse")
};
var DEFAULT_INNER_PADDING = 10;
var SECTION_INNER_PADDING = 10;
var SECTION_HEADER_HEIGHT = 25;
var renderer = {
	draw: /* @__PURE__ */ __name((_text, id, _version, diagram2) => {
		const treemapDb = diagram2.db;
		const config = treemapDb.getConfig();
		const treemapInnerPadding = config.padding ?? DEFAULT_INNER_PADDING;
		const title = treemapDb.getDiagramTitle();
		const root = treemapDb.getRoot();
		const { themeVariables } = getConfig();
		if (!root) return;
		const titleHeight = title ? 30 : 0;
		const svg = selectSvgElement(id);
		const width = config.nodeWidth ? config.nodeWidth * SECTION_INNER_PADDING : 960;
		const height = config.nodeHeight ? config.nodeHeight * SECTION_INNER_PADDING : 500;
		const svgWidth = width;
		const svgHeight = height + titleHeight;
		svg.attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
		configureSvgSize(svg, svgHeight, svgWidth, config.useMaxWidth);
		let valueFormat;
		try {
			const formatStr = config.valueFormat || ",";
			if (formatStr === "$0,0") valueFormat = /* @__PURE__ */ __name((value) => "$" + format(",")(value), "valueFormat");
			else if (formatStr.startsWith("$") && formatStr.includes(",")) {
				const precision = /\.\d+/.exec(formatStr);
				const precisionStr = precision ? precision[0] : "";
				valueFormat = /* @__PURE__ */ __name((value) => "$" + format("," + precisionStr)(value), "valueFormat");
			} else if (formatStr.startsWith("$")) {
				const restOfFormat = formatStr.substring(1);
				valueFormat = /* @__PURE__ */ __name((value) => "$" + format(restOfFormat || "")(value), "valueFormat");
			} else valueFormat = format(formatStr);
		} catch (error) {
			log.error("Error creating format function:", error);
			valueFormat = format(",");
		}
		const colorScale = ordinal().range([
			"transparent",
			themeVariables.cScale0,
			themeVariables.cScale1,
			themeVariables.cScale2,
			themeVariables.cScale3,
			themeVariables.cScale4,
			themeVariables.cScale5,
			themeVariables.cScale6,
			themeVariables.cScale7,
			themeVariables.cScale8,
			themeVariables.cScale9,
			themeVariables.cScale10,
			themeVariables.cScale11
		]);
		const colorScalePeer = ordinal().range([
			"transparent",
			themeVariables.cScalePeer0,
			themeVariables.cScalePeer1,
			themeVariables.cScalePeer2,
			themeVariables.cScalePeer3,
			themeVariables.cScalePeer4,
			themeVariables.cScalePeer5,
			themeVariables.cScalePeer6,
			themeVariables.cScalePeer7,
			themeVariables.cScalePeer8,
			themeVariables.cScalePeer9,
			themeVariables.cScalePeer10,
			themeVariables.cScalePeer11
		]);
		const colorScaleLabel = ordinal().range([
			themeVariables.cScaleLabel0,
			themeVariables.cScaleLabel1,
			themeVariables.cScaleLabel2,
			themeVariables.cScaleLabel3,
			themeVariables.cScaleLabel4,
			themeVariables.cScaleLabel5,
			themeVariables.cScaleLabel6,
			themeVariables.cScaleLabel7,
			themeVariables.cScaleLabel8,
			themeVariables.cScaleLabel9,
			themeVariables.cScaleLabel10,
			themeVariables.cScaleLabel11
		]);
		if (title) svg.append("text").attr("x", svgWidth / 2).attr("y", titleHeight / 2).attr("class", "treemapTitle").attr("text-anchor", "middle").attr("dominant-baseline", "middle").text(title);
		const g = svg.append("g").attr("transform", `translate(0, ${titleHeight})`).attr("class", "treemapContainer");
		const hierarchyRoot = hierarchy(root).sum((d) => d.value ?? 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
		const treemapData = treemap_default().size([width, height]).paddingTop((d) => d.children && d.children.length > 0 ? SECTION_HEADER_HEIGHT + SECTION_INNER_PADDING : 0).paddingInner(treemapInnerPadding).paddingLeft((d) => d.children && d.children.length > 0 ? SECTION_INNER_PADDING : 0).paddingRight((d) => d.children && d.children.length > 0 ? SECTION_INNER_PADDING : 0).paddingBottom((d) => d.children && d.children.length > 0 ? SECTION_INNER_PADDING : 0).round(true)(hierarchyRoot);
		const branchNodes = treemapData.descendants().filter((d) => d.children && d.children.length > 0);
		const sections = g.selectAll(".treemapSection").data(branchNodes).enter().append("g").attr("class", "treemapSection").attr("transform", (d) => `translate(${d.x0},${d.y0})`);
		sections.append("rect").attr("width", (d) => d.x1 - d.x0).attr("height", SECTION_HEADER_HEIGHT).attr("class", "treemapSectionHeader").attr("fill", "none").attr("fill-opacity", .6).attr("stroke-width", .6).attr("style", (d) => {
			if (d.depth === 0) return "display: none;";
			return "";
		});
		sections.append("clipPath").attr("id", (_d, i) => `clip-section-${id}-${i}`).append("rect").attr("width", (d) => Math.max(0, d.x1 - d.x0 - 12)).attr("height", SECTION_HEADER_HEIGHT);
		sections.append("rect").attr("width", (d) => d.x1 - d.x0).attr("height", (d) => d.y1 - d.y0).attr("class", (_d, i) => {
			return `treemapSection section${i}`;
		}).attr("fill", (d) => colorScale(d.data.name)).attr("fill-opacity", .6).attr("stroke", (d) => colorScalePeer(d.data.name)).attr("stroke-width", 2).attr("stroke-opacity", .4).attr("style", (d) => {
			if (d.depth === 0) return "display: none;";
			const styles = styles2String({ cssCompiledStyles: d.data.cssCompiledStyles });
			return styles.nodeStyles + ";" + styles.borderStyles.join(";");
		});
		sections.append("text").attr("class", "treemapSectionLabel").attr("x", 6).attr("y", SECTION_HEADER_HEIGHT / 2).attr("dominant-baseline", "middle").text((d) => d.depth === 0 ? "" : d.data.name).attr("font-weight", "bold").attr("clip-path", (_d, i) => `url(#clip-section-${id}-${i})`).attr("style", (d) => {
			if (d.depth === 0) return "display: none;";
			return "dominant-baseline: middle; font-size: 12px; fill:" + colorScaleLabel(d.data.name) + "; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" + styles2String({ cssCompiledStyles: d.data.cssCompiledStyles }).labelStyles.replace("color:", "fill:");
		}).each(function(d) {
			if (d.depth === 0) return;
			const self = select_default(this);
			const originalText = d.data.name;
			self.text(originalText);
			const totalHeaderWidth = d.x1 - d.x0;
			const labelXPosition = 6;
			let spaceForTextContent;
			if (config.showValues !== false && d.value) spaceForTextContent = totalHeaderWidth - 10 - 30 - 10 - labelXPosition;
			else spaceForTextContent = totalHeaderWidth - labelXPosition - 6;
			const actualAvailableWidth = Math.max(15, spaceForTextContent);
			const textNode = self.node();
			if (textNode.getComputedTextLength() > actualAvailableWidth) {
				const ellipsis = "...";
				let currentTruncatedText = originalText;
				while (currentTruncatedText.length > 0) {
					currentTruncatedText = originalText.substring(0, currentTruncatedText.length - 1);
					if (currentTruncatedText.length === 0) {
						self.text(ellipsis);
						if (textNode.getComputedTextLength() > actualAvailableWidth) self.text("");
						break;
					}
					self.text(currentTruncatedText + ellipsis);
					if (textNode.getComputedTextLength() <= actualAvailableWidth) break;
				}
			}
		});
		if (config.showValues !== false) sections.append("text").attr("class", "treemapSectionValue").attr("x", (d) => d.x1 - d.x0 - 10).attr("y", SECTION_HEADER_HEIGHT / 2).attr("text-anchor", "end").attr("dominant-baseline", "middle").text((d) => d.value ? valueFormat(d.value) : "").attr("font-style", "italic").attr("style", (d) => {
			if (d.depth === 0) return "display: none;";
			return "text-anchor: end; dominant-baseline: middle; font-size: 10px; fill:" + colorScaleLabel(d.data.name) + "; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" + styles2String({ cssCompiledStyles: d.data.cssCompiledStyles }).labelStyles.replace("color:", "fill:");
		});
		const leafNodes = treemapData.leaves();
		const isComplexTreemap = leafNodes.length > 20;
		const baseLabelFontSize = isComplexTreemap ? 16 : 38;
		const baseValueFontSize = isComplexTreemap ? 14 : 28;
		const minLabelFontSize = isComplexTreemap ? 4 : 8;
		const minValueFontSize = isComplexTreemap ? 4 : 6;
		const labelPadding = isComplexTreemap ? 2 : 4;
		const minDisplayThreshold = isComplexTreemap ? 8 : 10;
		const spacingBetweenLabelAndValue = isComplexTreemap ? 1 : 2;
		const cell = g.selectAll(".treemapLeafGroup").data(leafNodes).enter().append("g").attr("class", (d, i) => {
			return `treemapNode treemapLeafGroup leaf${i}${d.data.classSelector ? ` ${d.data.classSelector}` : ""}x`;
		}).attr("transform", (d) => `translate(${d.x0},${d.y0})`);
		cell.append("rect").attr("width", (d) => d.x1 - d.x0).attr("height", (d) => d.y1 - d.y0).attr("class", "treemapLeaf").attr("fill", (d) => {
			return d.parent ? colorScale(d.parent.data.name) : colorScale(d.data.name);
		}).attr("style", (d) => {
			return styles2String({ cssCompiledStyles: d.data.cssCompiledStyles }).nodeStyles;
		}).attr("fill-opacity", .3).attr("stroke", (d) => {
			return d.parent ? colorScale(d.parent.data.name) : colorScale(d.data.name);
		}).attr("stroke-width", 3);
		cell.append("clipPath").attr("id", (_d, i) => `clip-${id}-${i}`).append("rect").attr("width", (d) => Math.max(0, d.x1 - d.x0 - 4)).attr("height", (d) => Math.max(0, d.y1 - d.y0 - 4));
		cell.append("text").attr("class", "treemapLabel").attr("x", (d) => (d.x1 - d.x0) / 2).attr("y", (d) => (d.y1 - d.y0) / 2).attr("style", (d) => {
			return `text-anchor: middle; dominant-baseline: middle; font-size: ${baseLabelFontSize}px;fill:` + colorScaleLabel(d.data.name) + ";" + styles2String({ cssCompiledStyles: d.data.cssCompiledStyles }).labelStyles.replace("color:", "fill:");
		}).attr("clip-path", (_d, i) => `url(#clip-${id}-${i})`).text((d) => d.data.name).each(function(d) {
			const self = select_default(this);
			const nodeWidth = d.x1 - d.x0;
			const nodeHeight = d.y1 - d.y0;
			const textNode = self.node();
			const availableWidth = nodeWidth - 2 * labelPadding;
			const availableHeight = nodeHeight - 2 * labelPadding;
			if (availableWidth < minDisplayThreshold || availableHeight < minDisplayThreshold) {
				self.style("display", "none");
				return;
			}
			let currentLabelFontSize = parseInt(self.style("font-size"), 10);
			const valueScaleFactor = .6;
			while (textNode.getComputedTextLength() > availableWidth && currentLabelFontSize > minLabelFontSize) {
				currentLabelFontSize--;
				self.style("font-size", `${currentLabelFontSize}px`);
			}
			let prospectiveValueFontSize = Math.max(minValueFontSize, Math.min(baseValueFontSize, Math.round(currentLabelFontSize * valueScaleFactor)));
			let combinedHeight = currentLabelFontSize + spacingBetweenLabelAndValue + prospectiveValueFontSize;
			while (combinedHeight > availableHeight && currentLabelFontSize > minLabelFontSize) {
				currentLabelFontSize--;
				prospectiveValueFontSize = Math.max(minValueFontSize, Math.min(baseValueFontSize, Math.round(currentLabelFontSize * valueScaleFactor)));
				if (prospectiveValueFontSize < minValueFontSize && currentLabelFontSize === minLabelFontSize) break;
				self.style("font-size", `${currentLabelFontSize}px`);
				combinedHeight = currentLabelFontSize + spacingBetweenLabelAndValue + prospectiveValueFontSize;
				if (prospectiveValueFontSize <= minValueFontSize && combinedHeight > availableHeight) {}
			}
			self.style("font-size", `${currentLabelFontSize}px`);
			if (isComplexTreemap) {
				if (currentLabelFontSize < minLabelFontSize || availableHeight < minLabelFontSize) self.style("display", "none");
			} else if (textNode.getComputedTextLength() > availableWidth || currentLabelFontSize < minLabelFontSize || availableHeight < currentLabelFontSize) self.style("display", "none");
		});
		if (config.showValues !== false) cell.append("text").attr("class", "treemapValue").attr("x", (d) => (d.x1 - d.x0) / 2).attr("y", function(d) {
			return (d.y1 - d.y0) / 2;
		}).attr("style", (d) => {
			return `text-anchor: middle; dominant-baseline: hanging; font-size: ${baseValueFontSize}px;fill:` + colorScaleLabel(d.data.name) + ";" + styles2String({ cssCompiledStyles: d.data.cssCompiledStyles }).labelStyles.replace("color:", "fill:");
		}).attr("clip-path", (_d, i) => `url(#clip-${id}-${i})`).text((d) => d.value ? valueFormat(d.value) : "").each(function(d) {
			const valueTextElement = select_default(this);
			const parentCellNode = this.parentNode;
			if (!parentCellNode) {
				valueTextElement.style("display", "none");
				return;
			}
			const labelElement = select_default(parentCellNode).select(".treemapLabel");
			if (labelElement.empty() || labelElement.style("display") === "none") {
				valueTextElement.style("display", "none");
				return;
			}
			const finalLabelFontSize = parseFloat(labelElement.style("font-size"));
			const actualValueFontSize = Math.max(minValueFontSize, Math.min(baseValueFontSize, Math.round(finalLabelFontSize * .6)));
			valueTextElement.style("font-size", `${actualValueFontSize}px`);
			const valueTopActualY = (d.y1 - d.y0) / 2 + finalLabelFontSize / 2 + spacingBetweenLabelAndValue;
			valueTextElement.attr("y", valueTopActualY);
			const nodeWidth = d.x1 - d.x0;
			const maxValueBottomY = d.y1 - d.y0 - 4;
			const availableWidthForValue = nodeWidth - 2 * labelPadding;
			if (valueTextElement.node().getComputedTextLength() > availableWidthForValue || valueTopActualY + actualValueFontSize > maxValueBottomY || actualValueFontSize < minValueFontSize) valueTextElement.style("display", "none");
			else valueTextElement.style("display", null);
		});
		const diagramPadding = config.diagramPadding ?? 8;
		setupViewPortForSVG(svg, diagramPadding, "flowchart", config?.useMaxWidth || false);
	}, "draw"),
	getClasses: /* @__PURE__ */ __name(function(_text, diagramObj) {
		return diagramObj.db.getClasses();
	}, "getClasses")
};
var defaultTreemapStyleOptions = {
	sectionStrokeColor: "black",
	sectionStrokeWidth: "1",
	sectionFillColor: "#efefef",
	leafStrokeColor: "black",
	leafStrokeWidth: "1",
	leafFillColor: "#efefef",
	labelFontSize: "12px",
	valueFontSize: "10px",
	titleFontSize: "14px"
};
var diagram = {
	parser,
	get db() {
		return new TreeMapDB();
	},
	renderer,
	styles: /* @__PURE__ */ __name(({ treemap: treemap2 } = {}) => {
		const defaultThemeVariables = getThemeVariables3();
		const currentConfig = getConfig();
		const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);
		const options = cleanAndMerge(defaultTreemapStyleOptions, treemap2);
		const titleColor = options.titleColor ?? themeVariables.titleColor;
		const labelColor = options.labelColor ?? themeVariables.textColor;
		const valueColor = options.valueColor ?? themeVariables.textColor;
		return `
  .treemapNode.section {
    stroke: ${options.sectionStrokeColor};
    stroke-width: ${options.sectionStrokeWidth};
    fill: ${options.sectionFillColor};
  }
  .treemapNode.leaf {
    stroke: ${options.leafStrokeColor};
    stroke-width: ${options.leafStrokeWidth};
    fill: ${options.leafFillColor};
  }
  .treemapLabel {
    fill: ${labelColor};
    font-size: ${options.labelFontSize};
  }
  .treemapValue {
    fill: ${valueColor};
    font-size: ${options.valueFontSize};
  }
  .treemapTitle {
    fill: ${titleColor};
    font-size: ${options.titleFontSize};
  }
  `;
	}, "getStyles")
};
//#endregion
export { diagram };
