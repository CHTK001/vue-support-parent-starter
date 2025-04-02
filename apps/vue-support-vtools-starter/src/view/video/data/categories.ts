// 视频分类数据
export const videoCategories = [
  { label: '全部', value: 'all', active: true },
  { label: '电影', value: 'movie', active: false },
  { label: '电视剧', value: 'tv', active: false },
  { label: '动漫', value: 'anime', active: false },
  { label: '纪录片', value: 'documentary', active: false },
  { label: '综艺', value: 'variety', active: false },
  { label: '体育', value: 'sports', active: false },
  { label: '音乐', value: 'music', active: false },
  { label: '教育', value: 'education', active: false },
  { label: '少儿', value: 'children', active: false },
  { label: '其他', value: 'other', active: false },
];

// 电影类型数据
export const movieTypes = [
  { label: '全部', value: 'all', active: true },
  { label: '动作', value: 'action', active: false },
  { label: '喜剧', value: 'comedy', active: false },
  { label: '爱情', value: 'romance', active: false },
  { label: '科幻', value: 'sci-fi', active: false },
  { label: '恐怖', value: 'horror', active: false },
  { label: '剧情', value: 'drama', active: false },
  { label: '战争', value: 'war', active: false },
  { label: '犯罪', value: 'crime', active: false },
  { label: '动画', value: 'animation', active: false },
  { label: '悬疑', value: 'suspense', active: false },
  { label: '惊悚', value: 'thriller', active: false },
  { label: '灾难', value: 'disaster', active: false },
  { label: '冒险', value: 'adventure', active: false },
  { label: '奇幻', value: 'fantasy', active: false },
  { label: '历史', value: 'history', active: false },
  { label: '武侠', value: 'martial-arts', active: false },
  { label: '古装', value: 'costume', active: false },
  { label: '家庭', value: 'family', active: false },
  { label: '儿童', value: 'children', active: false },
  { label: '传记', value: 'biography', active: false },
  { label: '纪录', value: 'documentary', active: false },
  { label: '歌舞', value: 'musical', active: false },
  { label: '黑色电影', value: 'film-noir', active: false },
  { label: '西部', value: 'western', active: false },
];

// 年代数据 - 动态生成从当前年份开始往前推
export const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [{ label: '全部', value: 'all', active: true }];
  
  for (let year = currentYear; year >= 1950; year--) {
    years.push({ label: `${year}`, value: `${year}`, active: false });
  }
  
  // 添加年代段
  years.push({ label: '40年代', value: '1940s', active: false });
  years.push({ label: '30年代', value: '1930s', active: false });
  years.push({ label: '更早', value: 'earlier', active: false });
  
  return years;
};

// 热门搜索关键词
export const hotSearchKeywords = [
  { label: '战狼', value: '战狼' },
  { label: '流浪地球', value: '流浪地球' },
  { label: '你好，李焕英', value: '你好，李焕英' },
  { label: '长津湖', value: '长津湖' },
  { label: '我和我的祖国', value: '我和我的祖国' },
  { label: '哪吒', value: '哪吒' },
  { label: '红海行动', value: '红海行动' },
  { label: '唐人街探案', value: '唐人街探案' },
];

// 模拟视频搜索结果数据
export const mockVideoResults = [
  {
    videoId: 1,
    videoName: '战狼2',
    videoDescription: '冷锋突破重重危机，救同胞于危难之中',
    videoCover: 'https://via.placeholder.com/300x180?text=战狼2',
    videoType: 'movie',
    videoTags: '动作,战争,爱国',
    createTime: '2023-01-15',
    district: '中国大陆',
    year: '2017',
    language: '普通话',
    rating: 4.7,
    views: 1845139
  },
  {
    videoId: 2,
    videoName: '流浪地球',
    videoDescription: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新家园',
    videoCover: 'https://via.placeholder.com/300x180?text=流浪地球',
    videoType: 'movie',
    videoTags: '科幻,灾难,冒险',
    createTime: '2023-02-10',
    district: '中国大陆',
    year: '2019',
    language: '普通话',
    rating: 4.6,
    views: 965218
  },
  {
    videoId: 3,
    videoName: '长津湖',
    videoDescription: '讲述志愿军战士在极寒条件下浴血奋战的故事',
    videoCover: 'https://via.placeholder.com/300x180?text=长津湖',
    videoType: 'movie',
    videoTags: '战争,历史,动作',
    createTime: '2023-03-05',
    district: '中国大陆',
    year: '2021',
    language: '普通话',
    rating: 4.8,
    views: 725918
  },
  {
    videoId: 4,
    videoName: '你好，李焕英',
    videoDescription: '女孩穿越回到过去，与年轻的母亲相遇',
    videoCover: 'https://via.placeholder.com/300x180?text=你好李焕英',
    videoType: 'movie',
    videoTags: '喜剧,奇幻,家庭',
    createTime: '2023-04-20',
    district: '中国大陆',
    year: '2021',
    language: '普通话',
    rating: 4.5,
    views: 1295138
  },
  {
    videoId: 5,
    videoName: '我和我的祖国',
    videoDescription: '七个故事讲述普通人与国家大事件的联系',
    videoCover: 'https://via.placeholder.com/300x180?text=我和我的祖国',
    videoType: 'movie',
    videoTags: '剧情,历史',
    createTime: '2023-05-15',
    district: '中国大陆',
    year: '2019',
    language: '普通话',
    rating: 4.7,
    views: 895218
  },
  {
    videoId: 6,
    videoName: '红海行动',
    videoDescription: '中国海军执行撤侨任务，展开惊心动魄的营救行动',
    videoCover: 'https://via.placeholder.com/300x180?text=红海行动',
    videoType: 'movie',
    videoTags: '动作,战争,犯罪',
    createTime: '2023-06-10',
    district: '中国大陆',
    year: '2018',
    language: '普通话',
    rating: 4.6,
    views: 785139
  },
];