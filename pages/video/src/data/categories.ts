// 视频分类数据
export const videoCategories = [
  { label: "全部", value: "ALL", active: true, icon: "ep:grid" },
  { label: "电影", value: "MV", active: false, icon: "ep:film" },
  { label: "电视剧", value: "TV", active: false, icon: "ep:monitor" },
  // { label: "磁力", value: "MA", active: false, icon: "ep:magnet" },
  { label: "动漫", value: "AC", active: false, icon: "ep:picture-rounded" },
  { label: "纪录片", value: "DOC", active: false, icon: "ep:camera" },
  { label: "综艺", value: "VAR", active: false, icon: "ep:magic-stick" },
  { label: "体育", value: "SP", active: false, icon: "ep:basketball" },
  { label: "音乐", value: "music", active: false, icon: "ep:headset" },
  { label: "解析", value: "vip", active: false, icon: "ep:video-play" },
  { label: "教育", value: "教育", active: false, icon: "ep:reading" },
  { label: "少儿", value: "少儿", active: false, icon: "ep:cherry" },
  { label: "其他", value: "其他", active: false, icon: "ep:more-filled" },
];

export const allCategories = videoCategories.map((item) => ({
  label: item.label,
  value: item.value,
}));

// 电影类型数据
export const movieTypes = [
  { label: "全部", value: "ALL", active: true },
  { label: "动作", value: "动作", active: false },
  { label: "喜剧", value: "喜剧", active: false },
  { label: "爱情", value: "爱情", active: false },
  { label: "科幻", value: "科幻", active: false },
  { label: "恐怖", value: "恐怖", active: false },
  { label: "剧情", value: "剧情", active: false },
  { label: "战争", value: "战争", active: false },
  { label: "犯罪", value: "犯罪", active: false },
  { label: "动画", value: "动画", active: false },
  { label: "悬疑", value: "悬疑", active: false },
  { label: "惊悚", value: "惊悚", active: false },
  { label: "灾难", value: "灾难", active: false },
  { label: "冒险", value: "冒险", active: false },
  { label: "奇幻", value: "奇幻", active: false },
  { label: "武侠", value: "武侠", active: false },
  { label: "古装", value: "古装", active: false },
  { label: "家庭", value: "家庭", active: false },
  { label: "传记", value: "传记", active: false },
  { label: "记录", value: "记录", active: false },
  { label: "歌舞", value: "歌舞", active: false },
  { label: "西部", value: "西部", active: false },
  { label: "同性", value: "同性", active: false },
  { label: "青春", value: "青春", active: false },
  { label: "美食", value: "美食", active: false },
  { label: "女性", value: "女性", active: false },
  { label: "治愈", value: "治愈", active: false },
  { label: "历史", value: "历史", active: false },
  { label: "真人秀", value: "真人秀", active: false },
  { label: "脱口秀", value: "脱口秀", active: false },
  // { label: "多选", value: "多选", active: false },
];

// 年代数据 - 动态生成从当前年份开始往前推
export const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [{ label: "全部", value: "ALL", active: true }];

  // 添加具体年份 - 从当前年到2015年
  for (let year = currentYear; year >= 2015; year--) {
    years.push({ label: `${year}`, value: `${year}`, active: false });
  }

  // 添加年代段
  years.push({ label: "20年代", value: "20年代", active: false });
  years.push({ label: "10年代", value: "10年代", active: false });
  years.push({ label: "00年代", value: "00年代", active: false });
  years.push({ label: "90年代", value: "90年代", active: false });
  years.push({ label: "80年代", value: "80年代", active: false });
  years.push({ label: "70年代", value: "70年代", active: false });
  years.push({ label: "60年代", value: "60年代", active: false });
  years.push({ label: "更早", value: "更早", active: false });

  return years;
};

// 热门搜索关键词
export const hotSearchKeywords = [
  { label: "战狼", value: "战狼" },
  { label: "流浪地球", value: "流浪地球" },
  { label: "你好，李焕英", value: "你好，李焕英" },
  { label: "长津湖", value: "长津湖" },
  { label: "我和我的祖国", value: "我和我的祖国" },
  { label: "哪吒", value: "哪吒" },
  { label: "红海行动", value: "红海行动" },
  { label: "唐人街探案", value: "唐人街探案" },
];

// 模拟视频搜索结果数据
export const mockVideoResults = [
  {
    videoId: 1,
    videoName: "战狼2",
    videoDescription: "冷锋突破重重危机，救同胞于危难之中",
    videoCover: "https://via.placeholder.com/300x180?text=战狼2",
    videoType: "电影",
    videoTags: "动作,战争,爱国",
    createTime: "2023-01-15",
    district: "中国大陆",
    year: "2017",
    language: "普通话",
    rating: 4.7,
    views: 1845139,
  },
  {
    videoId: 2,
    videoName: "流浪地球",
    videoDescription: "太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新家园",
    videoCover: "https://via.placeholder.com/300x180?text=流浪地球",
    videoType: "电影",
    videoTags: "科幻,灾难,冒险",
    createTime: "2023-02-10",
    district: "中国大陆",
    year: "2019",
    language: "普通话",
    rating: 4.6,
    views: 965218,
  },
  {
    videoId: 3,
    videoName: "长津湖",
    videoDescription: "讲述志愿军战士在极寒条件下浴血奋战的故事",
    videoCover: "https://via.placeholder.com/300x180?text=长津湖",
    videoType: "电影",
    videoTags: "战争,历史,动作",
    createTime: "2023-03-05",
    district: "中国大陆",
    year: "2021",
    language: "普通话",
    rating: 4.8,
    views: 725918,
  },
  {
    videoId: 4,
    videoName: "你好，李焕英",
    videoDescription: "女孩穿越回到过去，与年轻的母亲相遇",
    videoCover: "https://via.placeholder.com/300x180?text=你好李焕英",
    videoType: "电影",
    videoTags: "喜剧,奇幻,家庭",
    createTime: "2023-04-20",
    district: "中国大陆",
    year: "2021",
    language: "普通话",
    rating: 4.5,
    views: 1295138,
  },
  {
    videoId: 5,
    videoName: "我和我的祖国",
    videoDescription: "七个故事讲述普通人与国家大事件的联系",
    videoCover: "https://via.placeholder.com/300x180?text=我和我的祖国",
    videoType: "电影",
    videoTags: "剧情,历史",
    createTime: "2023-05-15",
    district: "中国大陆",
    year: "2019",
    language: "普通话",
    rating: 4.7,
    views: 895218,
  },
  {
    videoId: 6,
    videoName: "红海行动",
    videoDescription: "中国海军执行撤侨任务，展开惊心动魄的营救行动",
    videoCover: "https://via.placeholder.com/300x180?text=红海行动",
    videoType: "电影",
    videoTags: "动作,战争,犯罪",
    createTime: "2023-06-10",
    district: "中国大陆",
    year: "2018",
    language: "普通话",
    rating: 4.6,
    views: 785139,
  },
];
