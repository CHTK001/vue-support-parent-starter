//#region ../../node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/es/languages/graphql.js
/** @type LanguageFn */
function graphql(hljs) {
	const regex = hljs.regex;
	return {
		name: "GraphQL",
		aliases: ["gql"],
		case_insensitive: true,
		disableAutodetect: false,
		keywords: {
			keyword: [
				"query",
				"mutation",
				"subscription",
				"type",
				"input",
				"schema",
				"directive",
				"interface",
				"union",
				"scalar",
				"fragment",
				"enum",
				"on"
			],
			literal: [
				"true",
				"false",
				"null"
			]
		},
		contains: [
			hljs.HASH_COMMENT_MODE,
			hljs.QUOTE_STRING_MODE,
			hljs.NUMBER_MODE,
			{
				scope: "punctuation",
				match: /[.]{3}/,
				relevance: 0
			},
			{
				scope: "punctuation",
				begin: /[\!\(\)\:\=\[\]\{\|\}]{1}/,
				relevance: 0
			},
			{
				scope: "variable",
				begin: /\$/,
				end: /\W/,
				excludeEnd: true,
				relevance: 0
			},
			{
				scope: "meta",
				match: /@\w+/,
				excludeEnd: true
			},
			{
				scope: "symbol",
				begin: regex.concat(/[_A-Za-z][_0-9A-Za-z]*/, regex.lookahead(/\s*:/)),
				relevance: 0
			}
		],
		illegal: [/[;<']/, /BEGIN/]
	};
}
//#endregion
export { graphql as default };
