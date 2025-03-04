export const RANDOM_DATA = [
  "一段穿越沙漠的旅程，群骆驼行走在金色的沙丘上，夕阳染红天空，画面壮丽而静谧",
  "亚洲女模特，白色棒球夹克，看镜头，真实，白色背景，棚拍",
  "雪景，森林，微距，松鼠，细节清晰，高质量，8K",
  "单独的小房子，别墅，风景，阳光，粘土动画风格，8k，高清质感",
  "野餐，水果，面包，野餐布，公园，美食",
  '写实摄影风格，一家温馨浪漫的花店外观。"精致的窗户"装饰着蕾丝窗帘和鲜花点缀，正对镜头展示。漂亮的木质门呈深棕色，带有复古铜制把手，门前铺着淡色石板路。花店招牌悬挂上方，整体呈现欧式乡村风情，暖色调光影渲染，高清细节丰富。近景正面构图。',
  '写实摄影风格，一家精致的花店外观。"漂亮的木质门"呈深棕色，纹理清晰可见，门把手是复古黄铜质地。窗户采用欧式设计，透明玻璃上贴着优雅花纹，窗台摆放各色鲜花。门与窗正面构图，花店招牌隐约可见。整体色调温暖明亮，展现细节丰富质感。近景建筑外立面特写。',
  "一个站在墙壁前的小学生，带着眼镜，黑色头发，橘黄色外套",
  "3d，毛茸茸的知更鸟，湖蓝色羽毛，个性图案的肚皮，全身特写十分可爱,对异性充满吸引力的面容，个性的眉毛，长长的模糊毛皮，皮克斯渲染，unreal电影级别的渲染如电影般流畅，复杂的细节",
  "沉浸在全页灰度涂色的迷人世界中，有一只老虎在曼陀罗宁静的森林中，画面采用线条、笔画",
  "中国画风格的花鸟矢量插图，圆形，白色背景",
  "宋代壁画，版画，中式阁楼，圆月，留白",
  "艺术摄影，中心是一个心形装置设计，浪花，粉红色的氛围，3d，C4D，Octane",
  "艺术摄影，特写，亚洲男性，半身照，浅色西装，白色背心，棚拍",
];

export const CATEGORY_TEMPLATE = [
  {
    label: "结合图片",
    value: "combining_images",
  },
  {
    label: "风格",
    value: "style",
  },
];

export const DEFAULT_TEMPLATE_RESOLUTION = ["1024*1024", "1440*720", "1248*832", "1072*1424"];
export const DEFAULT_TEMPLATE_PROMPT = [
  "小男孩在树林里玩耍",
  "两只北极熊在冰川上温馨地交谈",
  "猫咪试图偷吃鱼，却被主人及时抓住",
  "机器人好奇地涂上睫毛膏，结果短路烧焦。",
  "小狗追逐蝴蝶，结果一头撞上大树",
  "针织娃娃相对而望，甜蜜的情侣头像",
  "一对白色毛毡小鸟站在树枝上，轻声细语",
  "一对情侣戴动物帽子相互微笑，黄色卡通背景",
  "两只毛毡小狗在绿草地上欢快地追逐嬉戏",
  "一对白兔子耳朵缠绕在一起，构成情侣头像",
  "面包店的菱形logo应用在招牌上",
  "健身房的logo设计应用于健身T恤",
  "花店的logo展示在漂亮的橱窗中",
  "茶馆的logo应用在精美的茶杯上",
  "服装店的logo别致地印在衣物标签上",
  "两个人在雪地里一起堆雪人，欢乐无比。",
  "蒙古草原上的骏马飞驰，场景壮丽。",
  "圣诞老人点燃烟花，场面充满欢乐。",
  "火箭从发射升空，壮观地进入太空。",
  "两人在篝火旁载歌载舞，气氛热烈。",
  "一个女人，双手托着笔记本电脑",
  "一个女孩捧着鲜花",
  "一个女孩拿着一杯珍珠奶茶",
  "一个女孩拿着红包",
  "一个女孩捧着榴莲，背景里飘着榴莲",
];

export const CREATIVE_TEMPLATE = [
  {
    modelId: "301-2.1-t2i-plus",
    modelName: "四格漫画",
    description: "擅长卡通风格小漫画",
    cover: "https://wanx.alicdn.com/model/sigemanhua.png",
    category: "combining_images",
    triggerWord: "",
    recommendPrompt: ["小男孩在树林里玩耍", "两只北极熊在冰川上温馨地交谈", "猫咪试图偷吃鱼，却被主人及时抓住", "机器人好奇地涂上睫毛膏，结果短路烧焦。", "小狗追逐蝴蝶，结果一头撞上大树"],
    trainModel: "wanx2.1-t2i-plus",
    sort: 1,
    template: "sigemanhua",
    cueWord: "描述你希望展现的漫画剧情与风格",
    resolutions: ["1024*1024"],
  },
  {
    modelId: "303-2.1-t2i-plus",
    modelName: "情侣头像",
    description: "擅长清新可爱的情侣头像",
    cover: "https://wanx.alicdn.com/model/qinglvtouxiang.png",
    category: "combining_images",
    triggerWord: "",
    recommendPrompt: ["针织娃娃相对而望，甜蜜的情侣头像", "一对白色毛毡小鸟站在树枝上，轻声细语", "一对情侣戴动物帽子相互微笑，黄色卡通背景", "两只毛毡小狗在绿草地上欢快地追逐嬉戏", "一对白兔子耳朵缠绕在一起，构成情侣头像"],
    trainModel: "wanx2.1-t2i-plus",
    sort: 2,
    template: "qinglvtouxiang",
    cueWord: "描述你想要的头像内容与风格",
    resolutions: ["1440*720"],
  },
  {
    modelId: "302-2.1-t2i-plus",
    modelName: "图标印花",
    description: "擅长设计和展示印花效果",
    cover: "https://wanx.alicdn.com/model/tubiaoyinhua.png",
    category: "combining_images",
    triggerWord: "",
    recommendPrompt: ["面包店的菱形logo应用在招牌上", "健身房的logo设计应用于健身T恤", "花店的logo展示在漂亮的橱窗中", "茶馆的logo应用在精美的茶杯上", "服装店的logo别致地印在衣物标签上"],
    trainModel: "wanx2.1-t2i-plus",
    sort: 3,
    template: "tubiaoyinhua",
    cueWord: "描述你希望设计的Logo印花样式与贴图效果",
    resolutions: ["1248*832"],
  },
  {
    modelId: "300-2.1-t2i-plus",
    modelName: "电影分镜",
    description: "擅长电影质感画面",
    cover: "https://wanx.alicdn.com/model/dianyingfenjing.png",
    category: "combining_images",
    triggerWord: "",
    recommendPrompt: ["两个人在雪地里一起堆雪人，欢乐无比。", "蒙古草原上的骏马飞驰，场景壮丽。", "圣诞老人点燃烟花，场面充满欢乐。", "火箭从发射升空，壮观地进入太空。", "两人在篝火旁载歌载舞，气氛热烈。"],
    trainModel: "wanx2.1-t2i-plus",
    sort: 4,
    template: "dianyingfenjing",
    cueWord: "描述你希望展现的电影故事主题与画面内容",
    resolutions: ["1072*1424"],
  },
  {
    modelId: "304-2.1-t2i-plus",
    modelName: "新年请神",
    description: "擅长人像",
    cover: "https://wanx.alicdn.com/model/qingshen.png",
    category: "style",
    triggerWord: "请神风格，汉服",
    recommendPrompt: ["一个女人，双手托着笔记本电脑", "一个女孩捧着鲜花", "一个女孩拿着一杯珍珠奶茶", "一个女孩拿着红包", "一个女孩捧着榴莲，背景里飘着榴莲"],
    trainModel: "wanx2.1-t2i-plus",
    sort: 200,
    template: "qingshen",
  },
];
const STYLE = [
  {
    code: "<auto>",
    name: "默认",
    pic: "https://img.alicdn.com/imgextra/i4/O1CN01RzKicz1W0YWzYkWcK_!!6000000002726-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
  {
    code: "<watercolor>",
    name: "水彩",
    pic: "https://img.alicdn.com/imgextra/i1/O1CN01M5D6fB1PVVzdwM375_!!6000000001846-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
  {
    code: "<photography>",
    name: "摄影",
    pic: "https://img.alicdn.com/imgextra/i1/O1CN01M5D6fB1PVVzdwM375_!!6000000001846-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
  {
    code: "<portrait>",
    name: "人像写真",
    pic: "https://img.alicdn.com/imgextra/i1/O1CN01M5D6fB1PVVzdwM375_!!6000000001846-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
  {
    code: "<oil painting>",
    name: "油画",
    pic: "https://img.alicdn.com/imgextra/i4/O1CN01wuUOm31wLmtuwafhG_!!6000000006292-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
  {
    code: "<chinese painting>",
    name: "中国画",
    pic: "https://img.alicdn.com/imgextra/i3/O1CN01tN84xj1oI6nEhfmL1_!!6000000005201-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
  {
    code: "<flat illustration>",
    name: "扁平插画",
    pic: "https://img.alicdn.com/imgextra/i2/O1CN01XMadUe29wy3eouOgg_!!6000000008133-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
  {
    code: "<anime>",
    name: "二次元",
    pic: "https://img.alicdn.com/imgextra/i4/O1CN01RIdXyT1Qoa62pyko6_!!6000000002023-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
  {
    code: "<sketch>",
    name: "素描",
    pic: "https://img.alicdn.com/imgextra/i1/O1CN017OBYOc1YWjaZbcRpu_!!6000000003067-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
  {
    code: "<3d cartoon>",
    name: "3D卡通",
    pic: "https://img.alicdn.com/imgextra/i1/O1CN01W1aZZv1vqBZYXLLrn_!!6000000006223-2-tps-132-104.png",
    styleType: "text_to_image",
    orderNumber: 0,
  },
];
/**
 * 获取样式
 * @param tag 标签
 * @returns  样式
 */
export const getStyleLabel = (tag: string): string => {
  //@ts-ignore
  return STYLE.find((it) => it.code === tag)?.name || tag;
};

const QUALITY_TEMPLATE = {
  quality: {
    name: "质量优先",
    title: "质量优先，生成质量高",
    icon: "ri:clockwise-2-line",
  },
  speed: {
    name: "速度优先",
    title: "速度优先，生成时间更快，质量相对降低",
    icon: "ri:speed-fill",
  },
};
export const getQuality = (tag: string): string => {
  return QUALITY_TEMPLATE[tag];
};
