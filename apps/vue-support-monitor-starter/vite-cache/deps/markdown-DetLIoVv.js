//#region ../../node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/es/languages/markdown.js
function markdown(hljs) {
	const regex = hljs.regex;
	const INLINE_HTML = {
		begin: /<\/?[A-Za-z_]/,
		end: ">",
		subLanguage: "xml",
		relevance: 0
	};
	const HORIZONTAL_RULE = { match: /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/ };
	const CODE = {
		className: "code",
		variants: [
			{ begin: "(`{3,})[^`](.|\\n)*?\\1`*[ ]*" },
			{ begin: "(~{3,})[^~](.|\\n)*?\\1~*[ ]*" },
			{
				begin: "```",
				end: "```+[ ]*$"
			},
			{
				begin: "~~~",
				end: "~~~+[ ]*$"
			},
			{ begin: "`.+?`" },
			{
				begin: "(?=^( {4}|\\t))",
				contains: [{
					begin: "^( {4}|\\t)",
					end: "(\\n)$"
				}],
				relevance: 0
			}
		]
	};
	const LIST = {
		className: "bullet",
		begin: "^[ 	]*([*+-]|(\\d+\\.))(?=\\s+)",
		end: "\\s+",
		excludeEnd: true
	};
	const LINK_REFERENCE = {
		begin: /^\[[^\n]+\]:/,
		returnBegin: true,
		contains: [{
			className: "symbol",
			begin: /\[/,
			end: /\]/,
			excludeBegin: true,
			excludeEnd: true
		}, {
			className: "link",
			begin: /:\s*/,
			end: /$/,
			excludeBegin: true
		}]
	};
	const LINK = {
		variants: [
			{
				begin: /\[.+?\]\[.*?\]/,
				relevance: 0
			},
			{
				begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
				relevance: 2
			},
			{
				begin: regex.concat(/\[.+?\]\(/, /[A-Za-z][A-Za-z0-9+.-]*/, /:\/\/.*?\)/),
				relevance: 2
			},
			{
				begin: /\[.+?\]\([./?&#].*?\)/,
				relevance: 1
			},
			{
				begin: /\[.*?\]\(.*?\)/,
				relevance: 0
			}
		],
		returnBegin: true,
		contains: [
			{ match: /\[(?=\])/ },
			{
				className: "string",
				relevance: 0,
				begin: "\\[",
				end: "\\]",
				excludeBegin: true,
				returnEnd: true
			},
			{
				className: "link",
				relevance: 0,
				begin: "\\]\\(",
				end: "\\)",
				excludeBegin: true,
				excludeEnd: true
			},
			{
				className: "symbol",
				relevance: 0,
				begin: "\\]\\[",
				end: "\\]",
				excludeBegin: true,
				excludeEnd: true
			}
		]
	};
	const BOLD = {
		className: "strong",
		contains: [],
		variants: [{
			begin: /_{2}(?!\s)/,
			end: /_{2}/
		}, {
			begin: /\*{2}(?!\s)/,
			end: /\*{2}/
		}]
	};
	const ITALIC = {
		className: "emphasis",
		contains: [],
		variants: [{
			begin: /\*(?![*\s])/,
			end: /\*/
		}, {
			begin: /_(?![_\s])/,
			end: /_/,
			relevance: 0
		}]
	};
	const BOLD_WITHOUT_ITALIC = hljs.inherit(BOLD, { contains: [] });
	const ITALIC_WITHOUT_BOLD = hljs.inherit(ITALIC, { contains: [] });
	BOLD.contains.push(ITALIC_WITHOUT_BOLD);
	ITALIC.contains.push(BOLD_WITHOUT_ITALIC);
	let CONTAINABLE = [INLINE_HTML, LINK];
	[
		BOLD,
		ITALIC,
		BOLD_WITHOUT_ITALIC,
		ITALIC_WITHOUT_BOLD
	].forEach((m) => {
		m.contains = m.contains.concat(CONTAINABLE);
	});
	CONTAINABLE = CONTAINABLE.concat(BOLD, ITALIC);
	return {
		name: "Markdown",
		aliases: [
			"md",
			"mkdown",
			"mkd"
		],
		contains: [
			{
				className: "section",
				variants: [{
					begin: "^#{1,6}",
					end: "$",
					contains: CONTAINABLE
				}, {
					begin: "(?=^.+?\\n[=-]{2,}$)",
					contains: [{ begin: "^[=-]*$" }, {
						begin: "^",
						end: "\\n",
						contains: CONTAINABLE
					}]
				}]
			},
			INLINE_HTML,
			LIST,
			HORIZONTAL_RULE,
			BOLD,
			ITALIC,
			{
				className: "quote",
				begin: "^>\\s+",
				contains: CONTAINABLE,
				end: "$"
			},
			CODE,
			LINK,
			LINK_REFERENCE,
			{
				scope: "literal",
				match: /&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/
			}
		]
	};
}
//#endregion
export { markdown as default };
