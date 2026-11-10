//#region ../../node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/es/languages/ini.js
function ini(hljs) {
	const regex = hljs.regex;
	const NUMBERS = {
		className: "number",
		relevance: 0,
		variants: [{ begin: /([+-]+)?[\d]+_[\d_]+/ }, { begin: hljs.NUMBER_RE }]
	};
	const COMMENTS = hljs.COMMENT();
	COMMENTS.variants = [{
		begin: /;/,
		end: /$/
	}, {
		begin: /#/,
		end: /$/
	}];
	const VARIABLES = {
		className: "variable",
		variants: [{ begin: /\$[\w\d"][\w\d_]*/ }, { begin: /\$\{(.*?)\}/ }]
	};
	const LITERALS = {
		className: "literal",
		begin: /\bon|off|true|false|yes|no\b/
	};
	const STRINGS = {
		className: "string",
		contains: [hljs.BACKSLASH_ESCAPE],
		variants: [
			{
				begin: "'''",
				end: "'''",
				relevance: 10
			},
			{
				begin: "\"\"\"",
				end: "\"\"\"",
				relevance: 10
			},
			{
				begin: "\"",
				end: "\""
			},
			{
				begin: "'",
				end: "'"
			}
		]
	};
	const ARRAY = {
		begin: /\[/,
		end: /\]/,
		contains: [
			COMMENTS,
			LITERALS,
			VARIABLES,
			STRINGS,
			NUMBERS,
			"self"
		],
		relevance: 0
	};
	const ANY_KEY = regex.either(/[A-Za-z0-9_-]+/, /"(\\"|[^"])*"/, /'[^']*'/);
	return {
		name: "TOML, also INI",
		aliases: ["toml"],
		case_insensitive: true,
		illegal: /\S/,
		contains: [
			COMMENTS,
			{
				className: "section",
				begin: /\[+/,
				end: /\]+/
			},
			{
				begin: regex.concat(ANY_KEY, "(\\s*\\.\\s*", ANY_KEY, ")*", regex.lookahead(/\s*=\s*[^#\s]/)),
				className: "attr",
				starts: {
					end: /$/,
					contains: [
						COMMENTS,
						ARRAY,
						LITERALS,
						VARIABLES,
						STRINGS,
						NUMBERS
					]
				}
			}
		]
	};
}
//#endregion
export { ini as default };
