//#region ../../node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/es/languages/diff.js
/** @type LanguageFn */
function diff(hljs) {
	const regex = hljs.regex;
	return {
		name: "Diff",
		aliases: ["patch"],
		contains: [
			{
				className: "meta",
				relevance: 10,
				match: regex.either(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/, /^@@ +-\d+ +\+\d+,\d+ +@@/, /^@@ +-\d+,\d+ +\+\d+ +@@/, /^@@ +-\d+ +\+\d+ +@@/, /^\*\*\* +\d+,\d+ +\*\*\*\*$/, /^--- +\d+,\d+ +----$/)
			},
			{
				className: "comment",
				variants: [{
					begin: regex.either(/Index: /, /^index/, /={3,}/, /^-{3}/, /^\*{3} /, /^\+{3}/, /^diff --git/),
					end: /$/
				}, { match: /^\*{15}$/ }]
			},
			{
				className: "addition",
				begin: /^\+/,
				end: /$/
			},
			{
				className: "deletion",
				begin: /^-/,
				end: /$/
			},
			{
				className: "addition",
				begin: /^!/,
				end: /$/
			}
		]
	};
}
//#endregion
export { diff as default };
