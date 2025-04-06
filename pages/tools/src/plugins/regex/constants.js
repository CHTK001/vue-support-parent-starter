/**
 * 正则表达式工具常量配置文件
 */

// 示例正则表达式
export const REGEX_EXAMPLES = [
  {
    name: "邮箱地址",
    pattern: "[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+",
    flags: "g",
    testText: "联系我们: admin@example.com 或 support@company.co.uk",
    description: "匹配常见的电子邮件地址格式"
  },
  {
    name: "URL",
    pattern: "https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-.,@?^=%&:/~+#]*[\\w\\-@?^=%&/~+#])?",
    flags: "g",
    testText: "访问 https://www.example.com 或 http://github.com/repo 获取更多信息",
    description: "匹配HTTP和HTTPS的URL地址"
  },
  {
    name: "手机号码",
    pattern: "1[3-9]\\d{9}",
    flags: "g",
    testText: "联系电话: 13812345678 或 17698765432",
    description: "匹配中国大陆手机号码"
  },
  {
    name: "日期格式",
    pattern: "\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])",
    flags: "g",
    testText: "活动将在 2023-05-15 至 2023-06-30 期间举行",
    description: "匹配YYYY-MM-DD格式的日期"
  },
  {
    name: "中文字符",
    pattern: "[\\u4e00-\\u9fa5]+",
    flags: "g",
    testText: "Hello 世界，这是一个测试 Text.",
    description: "匹配中文汉字"
  },
  {
    name: "IP地址",
    pattern: "(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)",
    flags: "g",
    testText: "服务器IP: 192.168.1.1 和 10.0.0.1 和 255.255.255.0",
    description: "匹配IPv4地址"
  }
];

// 常用正则表达式
export const COMMON_PATTERNS = [
  {
    name: "邮箱地址",
    pattern: "[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+",
    description: "匹配常见的电子邮件地址格式"
  },
  {
    name: "URL",
    pattern: "https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-.,@?^=%&:/~+#]*[\\w\\-@?^=%&/~+#])?",
    description: "匹配HTTP和HTTPS的URL地址"
  },
  {
    name: "中国手机号",
    pattern: "1[3-9]\\d{9}",
    description: "匹配中国大陆手机号码"
  },
  {
    name: "身份证号",
    pattern: "(^\\d{15}$)|(^\\d{18}$)|(^\\d{17}(\\d|X|x)$)",
    description: "匹配中国身份证号码(15位或18位)"
  },
  {
    name: "日期(YYYY-MM-DD)",
    pattern: "\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])",
    description: "匹配YYYY-MM-DD格式的日期"
  },
  {
    name: "时间(HH:MM:SS)",
    pattern: "([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)",
    description: "匹配24小时制时间格式"
  },
  {
    name: "IPv4地址",
    pattern: "(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)",
    description: "匹配IPv4地址"
  },
  {
    name: "MAC地址",
    pattern: "([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})",
    description: "匹配MAC地址"
  },
  {
    name: "中文字符",
    pattern: "[\\u4e00-\\u9fa5]+",
    description: "匹配中文汉字"
  },
  {
    name: "HTML标签",
    pattern: "<[^>]+>",
    description: "匹配HTML标签"
  },
  {
    name: "数字",
    pattern: "-?\\d+(\\.\\d+)?",
    description: "匹配整数和小数"
  },
  {
    name: "正整数",
    pattern: "^[1-9]\\d*$",
    description: "匹配大于0的整数"
  },
  {
    name: "密码强度",
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    description: "至少8位，包含大小写字母、数字和特殊字符"
  },
  {
    name: "用户名",
    pattern: "^[a-zA-Z0-9_-]{3,16}$",
    description: "3-16位字母、数字、下划线或连字符"
  },
  {
    name: "十六进制颜色",
    pattern: "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})",
    description: "匹配CSS十六进制颜色值"
  }
];

// 正则表达式语法帮助
export const REGEX_HELP = {
  character: [
    { symbol: ".", description: "匹配任意单个字符（除了换行符）" },
    { symbol: "\\d", description: "匹配任意数字，等价于 [0-9]" },
    { symbol: "\\D", description: "匹配任意非数字，等价于 [^0-9]" },
    { symbol: "\\w", description: "匹配任意字母、数字或下划线，等价于 [A-Za-z0-9_]" },
    { symbol: "\\W", description: "匹配任意非字母、数字或下划线，等价于 [^A-Za-z0-9_]" },
    { symbol: "\\s", description: "匹配任意空白字符（空格、制表符、换行符等）" },
    { symbol: "\\S", description: "匹配任意非空白字符" },
    { symbol: "[abc]", description: "匹配方括号内的任意字符" },
    { symbol: "[^abc]", description: "匹配不在方括号内的任意字符" },
    { symbol: "[a-z]", description: "匹配指定范围内的任意字符" },
    { symbol: "\\", description: "转义字符，用于匹配特殊字符本身" }
  ],
  anchor: [
    { symbol: "^", description: "匹配字符串开头" },
    { symbol: "$", description: "匹配字符串结尾" },
    { symbol: "\\b", description: "匹配单词边界" },
    { symbol: "\\B", description: "匹配非单词边界" }
  ],
  quantifier: [
    { symbol: "*", description: "匹配前面的表达式 0 次或多次" },
    { symbol: "+", description: "匹配前面的表达式 1 次或多次" },
    { symbol: "?", description: "匹配前面的表达式 0 次或 1 次" },
    { symbol: "{n}", description: "匹配前面的表达式恰好 n 次" },
    { symbol: "{n,}", description: "匹配前面的表达式至少 n 次" },
    { symbol: "{n,m}", description: "匹配前面的表达式 n 到 m 次" },
    { symbol: "*?", description: "非贪婪模式，尽可能少地匹配" },
    { symbol: "+?", description: "非贪婪模式，尽可能少地匹配" },
    { symbol: "??", description: "非贪婪模式，尽可能少地匹配" }
  ],
  group: [
    { symbol: "(abc)", description: "捕获组，可以通过 $1, $2 等引用" },
    { symbol: "(?:abc)", description: "非捕获组，不会被保存" },
    { symbol: "a|b", description: "匹配 a 或 b" },
    { symbol: "(?=abc)", description: "正向先行断言，匹配后面是 abc 的位置" },
    { symbol: "(?!abc)", description: "负向先行断言，匹配后面不是 abc 的位置" },
    { symbol: "(?<=abc)", description: "正向后行断言，匹配前面是 abc 的位置" },
    { symbol: "(?<!abc)", description: "负向后行断言，匹配前面不是 abc 的位置" }
  ],
  flag: [
    { symbol: "g", description: "全局匹配（查找所有匹配而非在找到第一个匹配后停止）" },
    { symbol: "i", description: "不区分大小写" },
    { symbol: "m", description: "多行模式（^和$匹配每一行的开头和结尾）" },
    { symbol: "s", description: "允许.匹配换行符" },
    { symbol: "u", description: "使用unicode码的模式进行匹配" },
    { symbol: "y", description: "执行粘性搜索，匹配从目标字符串的当前位置开始" }
  ]
}; 