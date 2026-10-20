import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { t as require_dayjs_min } from "./dayjs.min-DeZMAZuH.js";
import "./src-Df4bFYz8.js";
import { n as __name } from "./chunk-Y2CYZVJY-Cs0fowS7.js";
//#region ../../node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/chunk-X3CZISLH.mjs
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min(), 1);
var LEVELS = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
	fatal: 5
};
var log = {
	trace: /* @__PURE__ */ __name((..._args) => {}, "trace"),
	debug: /* @__PURE__ */ __name((..._args) => {}, "debug"),
	info: /* @__PURE__ */ __name((..._args) => {}, "info"),
	warn: /* @__PURE__ */ __name((..._args) => {}, "warn"),
	error: /* @__PURE__ */ __name((..._args) => {}, "error"),
	fatal: /* @__PURE__ */ __name((..._args) => {}, "fatal")
};
var setLogLevel = /* @__PURE__ */ __name(function(level = "fatal") {
	let numericLevel = LEVELS.fatal;
	if (typeof level === "string") {
		if (level.toLowerCase() in LEVELS) numericLevel = LEVELS[level];
	} else if (typeof level === "number") numericLevel = level;
	log.trace = () => {};
	log.debug = () => {};
	log.info = () => {};
	log.warn = () => {};
	log.error = () => {};
	log.fatal = () => {};
	if (numericLevel <= LEVELS.fatal) log.fatal = console.error ? console.error.bind(console, format("FATAL"), "color: orange") : console.log.bind(console, "\x1B[35m", format("FATAL"));
	if (numericLevel <= LEVELS.error) log.error = console.error ? console.error.bind(console, format("ERROR"), "color: orange") : console.log.bind(console, "\x1B[31m", format("ERROR"));
	if (numericLevel <= LEVELS.warn) log.warn = console.warn ? console.warn.bind(console, format("WARN"), "color: orange") : console.log.bind(console, `\x1B[33m`, format("WARN"));
	if (numericLevel <= LEVELS.info) log.info = console.info ? console.info.bind(console, format("INFO"), "color: lightblue") : console.log.bind(console, "\x1B[34m", format("INFO"));
	if (numericLevel <= LEVELS.debug) log.debug = console.debug ? console.debug.bind(console, format("DEBUG"), "color: lightgreen") : console.log.bind(console, "\x1B[32m", format("DEBUG"));
	if (numericLevel <= LEVELS.trace) log.trace = console.debug ? console.debug.bind(console, format("TRACE"), "color: lightgreen") : console.log.bind(console, "\x1B[32m", format("TRACE"));
}, "setLogLevel");
var format = /* @__PURE__ */ __name((level) => {
	return `%c${(0, import_dayjs_min.default)().format("ss.SSS")} : ${level} : `;
}, "format");
//#endregion
export { setLogLevel as n, log as t };
