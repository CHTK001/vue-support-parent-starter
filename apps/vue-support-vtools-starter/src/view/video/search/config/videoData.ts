import { reactive } from "vue";

// 视频类型接口
export interface VideoType {
  id: string;
  name: string;
}

// 视频项接口
export interface VideoItem {
  videoId: number | string;
  videoTitle: string;
  videoCover: string;
  videoYear: string;
  videoType: string;
  videoRegion: string;
  videoLanguage: string;
  videoRating: string;
  videoViews: number;
  videoDuration: string;
  videoDescription: string;
}

// 视频搜索过滤条件接口
export interface VideoFilters {
  keyword: string;
  category: string[];
  year: string[];
  region: string[];
  language: string[];
  sort: string;
}

// 视频存储状态接口
export interface VideoStore {
  filters: VideoFilters;
  sortOptions: VideoType[];
  categories: VideoType[];
  years: VideoType[];
  regions: VideoType[];
  languages: VideoType[];
  searchResults: VideoItem[];
  totalResults: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  resetFilters: () => void;
  search: () => void;
  formatNumber: (num: number) => string;
}

// 生成年代数据
export const generateYearData = (): VideoType[] => {
  const currentYear = new Date().getFullYear();
  const years: VideoType[] = [];

  // 添加"全部"选项
  years.push({ id: "all", name: "全部" });

  // 添加最近10年
  for (let i = 0; i < 10; i++) {
    const year = currentYear - i;
    years.push({ id: year.toString(), name: year.toString() });
  }

  // 添加年代段
  years.push({ id: "2010s", name: "2010年代" });
  years.push({ id: "2000s", name: "2000年代" });
  years.push({ id: "1990s", name: "1990年代" });
  years.push({ id: "1980s", name: "1980年代" });
  years.push({ id: "1970s", name: "1970年代" });
  years.push({ id: "1960s", name: "1960年代" });
  years.push({ id: "earlier", name: "更早" });

  return years;
};

// 视频分类数据
export const videoCategories: VideoType[] = [
  { id: "全部", name: "全部" },
  { id: "电影", name: "电影" },
  { id: "电视剧", name: "电视剧" },
  { id: "动漫", name: "动漫" },
  { id: "纪录片", name: "纪录片" },
  { id: "综艺", name: "综艺" },
  { id: "体育", name: "体育" },
  { id: "新闻", name: "新闻" },
  { id: "教育", name: "教育" },
  { id: "音乐", name: "音乐" },
  { id: "游戏", name: "游戏" },
  { id: "少儿", name: "少儿" },
  { id: "喜剧", name: "喜剧" },
  { id: "动作", name: "动作" },
  { id: "爱情", name: "爱情" },
  { id: "科幻", name: "科幻" },
  { id: "恐怖", name: "恐怖" },
  { id: "惊悚", name: "惊悚" },
  { id: "犯罪", name: "犯罪" },
  { id: "战争", name: "战争" },
  { id: "历史", name: "历史" },
  { id: "传记", name: "传记" },
  { id: "奇幻", name: "奇幻" },
  { id: "冒险", name: "冒险" },
];

// 地区数据
export const videoRegions: VideoType[] = [
  { id: "全部", name: "全部" },
  { id: "中国大陆", name: "中国大陆" },
  { id: "香港", name: "香港" },
  { id: "台湾", name: "台湾" },
  { id: "日本", name: "日本" },
  { id: "韩国", name: "韩国" },
  { id: "美国", name: "美国" },
  { id: "英国", name: "英国" },
  { id: "法国", name: "法国" },
  { id: "德国", name: "德国" },
  { id: "意大利", name: "意大利" },
  { id: "西班牙", name: "西班牙" },
  { id: "印度", name: "印度" },
  { id: "泰国", name: "泰国" },
  { id: "俄罗斯", name: "俄罗斯" },
  { id: "澳大利亚", name: "澳大利亚" },
  { id: "加拿大", name: "加拿大" },
  { id: "巴西", name: "巴西" },
];

// 语言数据
export const videoLanguages: VideoType[] = [
  { id: "全部", name: "全部" },
  { id: "普通话", name: "普通话" },
  { id: "粤语", name: "粤语" },
  { id: "英语", name: "英语" },
  { id: "日语", name: "日语" },
  { id: "韩语", name: "韩语" },
  { id: "法语", name: "法语" },
  { id: "德语", name: "德语" },
  { id: "意大利语", name: "意大利语" },
  { id: "西班牙语", name: "西班牙语" },
  { id: "俄语", name: "俄语" },
  { id: "印地语", name: "印地语" },
  { id: "泰语", name: "泰语" },
  { id: "阿拉伯语", name: "阿拉伯语" },
  { id: "葡萄牙语", name: "葡萄牙语" },
];

// 排序选项
export const sortOptions: VideoType[] = [
  { id: "最新上线", name: "最新上线" },
  { id: "最热门", name: "最热门" },
  { id: "评分最高", name: "评分最高" },
];

// 热门搜索词
export const hotSearchTerms: string[] = ["战狼", "流浪地球", "你好，李焕英", "长津湖", "我和我的祖国", "哪吒", "红海行动", "唐人街探案", "速度与激情", "复仇者联盟"];

// 生成模拟视频数据
export const generateMockVideos = (count: number = 100): VideoItem[] => {
  const mockResults: VideoItem[] = [];
  for (let i = 1; i <= count; i++) {
    mockResults.push({
      videoId: i,
      videoTitle: `视频标题 ${i}`,
      videoCover: `https://picsum.photos/300/400?random=${i}`,
      videoYear: Math.floor(Math.random() * 30 + 1990).toString(),
      videoType: videoCategories[Math.floor(Math.random() * 5) + 1].id,
      videoRegion: videoRegions[Math.floor(Math.random() * 5) + 1].id,
      videoLanguage: videoLanguages[Math.floor(Math.random() * 5) + 1].id,
      videoRating: (Math.random() * 2 + 7).toFixed(1),
      videoViews: Math.floor(Math.random() * 10000000),
      videoDuration: `${Math.floor(Math.random() * 120 + 60)}分钟`,
      videoDescription: `这是视频${i}的简介，包含了一些基本信息。`,
    });
  }
  return mockResults;
};

// 创建默认的视频存储状态
export const createDefaultVideoStore = (): VideoStore => {
  return reactive({
    // 搜索过滤条件
    filters: {
      keyword: "",
      category: [],
      year: [],
      region: [],
      language: [],
      sort: "newest",
    },

    // 排序选项
    sortOptions,

    // 分类数据
    categories: videoCategories,
    years: generateYearData(),
    regions: videoRegions,
    languages: videoLanguages,

    // 搜索结果
    searchResults: [],
    totalResults: 0,
    currentPage: 1,
    pageSize: 20,
    loading: false,

    // 重置过滤条件
    resetFilters() {
      this.filters.keyword = "";
      this.filters.category = [];
      this.filters.year = [];
      this.filters.region = [];
      this.filters.language = [];
      this.filters.sort = "newest";
    },

    // 搜索方法
    search() {
      this.loading = true;

      return new Promise((resolve) => {
        // 模拟API请求延迟
        setTimeout(() => {
          // 生成模拟数据
          const mockResults = generateMockVideos();

          // 过滤逻辑
          let results = [...mockResults];

          // 关键词过滤
          if (this.filters.keyword) {
            const keyword = this.filters.keyword.toLowerCase();
            results = results.filter((video) => video.videoTitle.toLowerCase().includes(keyword) || video.videoDescription.toLowerCase().includes(keyword));
          }

          // 类型过滤 - 支持多选
          if (this.filters.category && this.filters.category.length > 0) {
            results = results.filter((video) => this.filters.category.includes(video.videoType));
          }

          // 年份过滤 - 支持多选
          if (this.filters.year && this.filters.year.length > 0) {
            results = results.filter((video) => {
              const videoYear = parseInt(video.videoYear);

              return this.filters.year.some((yearFilter) => {
                if (yearFilter === "2010s") return videoYear >= 2010 && videoYear < 2020;
                if (yearFilter === "2000s") return videoYear >= 2000 && videoYear < 2010;
                if (yearFilter === "1990s") return videoYear >= 1990 && videoYear < 2000;
                if (yearFilter === "1980s") return videoYear >= 1980 && videoYear < 1990;
                if (yearFilter === "1970s") return videoYear >= 1970 && videoYear < 1980;
                if (yearFilter === "1960s") return videoYear >= 1960 && videoYear < 1970;
                if (yearFilter === "earlier") return videoYear < 1960;
                return video.videoYear === yearFilter;
              });
            });
          }

          // 地区过滤 - 支持多选
          if (this.filters.region && this.filters.region.length > 0) {
            results = results.filter((video) => this.filters.region.includes(video.videoRegion));
          }

          // 语言过滤 - 支持多选
          if (this.filters.language && this.filters.language.length > 0) {
            results = results.filter((video) => this.filters.language.includes(video.videoLanguage));
          }

          // 排序
          if (this.filters.sort === "newest") {
            results.sort((a, b) => parseInt(b.videoYear) - parseInt(a.videoYear));
          } else if (this.filters.sort === "hottest") {
            results.sort((a, b) => b.videoViews - a.videoViews);
          } else if (this.filters.sort === "rating") {
            results.sort((a, b) => parseFloat(b.videoRating) - parseFloat(a.videoRating));
          }

          // 分页处理
          const startIndex = (this.currentPage - 1) * this.pageSize;
          const endIndex = startIndex + this.pageSize;

          this.totalResults = results.length;
          this.searchResults = results.slice(startIndex, endIndex);
          this.loading = false;
          resolve({
            data: {
              data: this.searchResults
            },
            total: this.totalResults,
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          });
        }, 500);
      });
    },

    // 格式化数字
    formatNumber(num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + "万";
      }
      return num.toString();
    },
  });
};
