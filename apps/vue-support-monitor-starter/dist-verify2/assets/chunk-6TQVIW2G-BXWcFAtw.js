import { C as createDefaultSharedCoreModule, S as createDefaultCoreModule, a as CynefinGrammarGeneratedModule, i as CommonValueConverter, o as EmptyFileSystem, t as AbstractMermaidTokenBuilder, u as MermaidGeneratedSharedModule, w as inject, x as __name } from "./chunk-FOHPRMQF-Dhjc4rSR.js";
//#region ../../node_modules/.pnpm/@mermaid-js+parser@1.2.1/node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-6TQVIW2G.mjs
var CynefinTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "CynefinTokenBuilder");
	}
	constructor() {
		super(["cynefin-beta"]);
	}
};
var CynefinModule = { parser: {
	TokenBuilder: /* @__PURE__ */ __name(() => new CynefinTokenBuilder(), "TokenBuilder"),
	ValueConverter: /* @__PURE__ */ __name(() => new CommonValueConverter(), "ValueConverter")
} };
function createCynefinServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const Cynefin = inject(createDefaultCoreModule({ shared }), CynefinGrammarGeneratedModule, CynefinModule);
	shared.ServiceRegistry.register(Cynefin);
	return {
		shared,
		Cynefin
	};
}
__name(createCynefinServices, "createCynefinServices");
//#endregion
export { createCynefinServices as n, CynefinModule as t };
