//#region ../../node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/es/languages/yaml.js
function yaml(hljs) {
	const LITERALS = "true false yes no null";
	const KEY = {
		className: "attr",
		variants: [
			{ begin: /[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/ },
			{ begin: /"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/ },
			{ begin: /'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/ }
		]
	};
	const TEMPLATE_VARIABLES = {
		className: "template-variable",
		variants: [{
			begin: /\{\{/,
			end: /\}\}/
		}, {
			begin: /%\{/,
			end: /\}/
		}]
	};
	const SINGLE_QUOTE_STRING = {
		className: "string",
		relevance: 0,
		begin: /'/,
		end: /'/,
		contains: [{
			match: /''/,
			scope: "char.escape",
			relevance: 0
		}]
	};
	const STRING = {
		className: "string",
		relevance: 0,
		variants: [{
			begin: /"/,
			end: /"/
		}, { begin: /\S+/ }],
		contains: [hljs.BACKSLASH_ESCAPE, TEMPLATE_VARIABLES]
	};
	const CONTAINER_STRING = hljs.inherit(STRING, { variants: [
		{
			begin: /'/,
			end: /'/,
			contains: [{
				begin: /''/,
				relevance: 0
			}]
		},
		{
			begin: /"/,
			end: /"/
		},
		{ begin: /[^\s,{}[\]]+/ }
	] });
	const TIMESTAMP = {
		className: "number",
		begin: "\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"
	};
	const VALUE_CONTAINER = {
		end: ",",
		endsWithParent: true,
		excludeEnd: true,
		keywords: LITERALS,
		relevance: 0
	};
	const OBJECT = {
		begin: /\{/,
		end: /\}/,
		contains: [VALUE_CONTAINER],
		illegal: "\\n",
		relevance: 0
	};
	const ARRAY = {
		begin: "\\[",
		end: "\\]",
		contains: [VALUE_CONTAINER],
		illegal: "\\n",
		relevance: 0
	};
	const MODES = [
		KEY,
		{
			className: "meta",
			begin: "^---\\s*$",
			relevance: 10
		},
		{
			className: "string",
			begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
		},
		{
			begin: "<%[%=-]?",
			end: "[%-]?%>",
			subLanguage: "ruby",
			excludeBegin: true,
			excludeEnd: true,
			relevance: 0
		},
		{
			className: "type",
			begin: "!\\w+![\\w#;/?:@&=+$,.~*'()[\\]]+"
		},
		{
			className: "type",
			begin: "!<[\\w#;/?:@&=+$,.~*'()[\\]]+>"
		},
		{
			className: "type",
			begin: "![\\w#;/?:@&=+$,.~*'()[\\]]+"
		},
		{
			className: "type",
			begin: "!![\\w#;/?:@&=+$,.~*'()[\\]]+"
		},
		{
			className: "meta",
			begin: "&" + hljs.UNDERSCORE_IDENT_RE + "$"
		},
		{
			className: "meta",
			begin: "\\*" + hljs.UNDERSCORE_IDENT_RE + "$"
		},
		{
			className: "bullet",
			begin: "-(?=[ ]|$)",
			relevance: 0
		},
		hljs.HASH_COMMENT_MODE,
		{
			beginKeywords: LITERALS,
			keywords: { literal: LITERALS }
		},
		TIMESTAMP,
		{
			className: "number",
			begin: hljs.C_NUMBER_RE + "\\b",
			relevance: 0
		},
		OBJECT,
		ARRAY,
		SINGLE_QUOTE_STRING,
		STRING
	];
	const VALUE_MODES = [...MODES];
	VALUE_MODES.pop();
	VALUE_MODES.push(CONTAINER_STRING);
	VALUE_CONTAINER.contains = VALUE_MODES;
	return {
		name: "YAML",
		case_insensitive: true,
		aliases: ["yml"],
		contains: MODES
	};
}
//#endregion
export { yaml as default };
