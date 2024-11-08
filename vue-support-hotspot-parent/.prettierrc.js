// @ts-check

/** @type {import("prettier").Config} */
export default {
  bracketSpacing: true,// 对象字面量中的括号是否有空格，默认为 true
  singleQuote: false,// 是否使用单引号，默认为 false
  arrowParens: "avoid",// 箭头函数参数是否使用圆括号，默认为 "always"
  trailingComma: "none",// 是否使用尾随逗号（末尾的逗号），可以是 "none"、"es5"、"all" 三个选项
  endOfLine: "auto", // 指定换行符的风格，可以是 "auto"、"lf"、"crlf"、"cr" 四个选项
  tabWidth: 2,// 指定缩进的空格数
  printWidth: 200,
  jsxBracketSameLine: false,
  htmlWhitespaceSensitivity: "ignore", // //html存在空格是不敏感的
  semi: true // 行末是否添加分号，默认为 true

};
