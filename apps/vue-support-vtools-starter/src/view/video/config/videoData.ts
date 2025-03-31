import { reactive } from "vue";

// 视频类型接口
export interface VideoType {
  id: string;
  name: string;
}

// 视频项接口
export interface VideoItem {
  id: number | string;
  title: string;
  cover: string;
  year: string;
  type: string;
  region: string;
  language: string;
  rating: string;
  views: number;
  duration: string;
  description: string;
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
  { id: "all", name: "全部" },
  { id: "movie", name: "电影" },
  { id: "tv", name: "电视剧" },
  { id: "anime", name: "动漫" },
  { id: "documentary", name: "纪录片" },
  { id: "variety", name: "综艺" },
  { id: "sports", name: "体育" },
  { id: "news", name: "新闻" },
  { id: "education", name: "教育" },
  { id: "music", name: "音乐" },
  { id: "game", name: "游戏" },
  { id: "children", name: "少儿" },
  { id: "comedy", name: "喜剧" },
  { id: "action", name: "动作" },
  { id: "romance", name: "爱情" },
  { id: "sci-fi", name: "科幻" },
  { id: "horror", name: "恐怖" },
  { id: "thriller", name: "惊悚" },
  { id: "crime", name: "犯罪" },
  { id: "war", name: "战争" },
  { id: "history", name: "历史" },
  { id: "biography", name: "传记" },
  { id: "fantasy", name: "奇幻" },
  { id: "adventure", name: "冒险" },
];

// 地区数据
export const videoRegions: VideoType[] = [
  { id: "all", name: "全部" },
  { id: "china", name: "中国大陆" },
  { id: "hongkong", name: "香港" },
  { id: "taiwan", name: "台湾" },
  { id: "japan", name: "日本" },
  { id: "korea", name: "韩国" },
  { id: "usa", name: "美国" },
  { id: "uk", name: "英国" },
  { id: "france", name: "法国" },
  { id: "germany", name: "德国" },
  { id: "italy", name: "意大利" },
  { id: "spain", name: "西班牙" },
  { id: "india", name: "印度" },
  { id: "thailand", name: "泰国" },
  { id: "russia", name: "俄罗斯" },
  { id: "australia", name: "澳大利亚" },
  { id: "canada", name: "加拿大" },
  { id: "brazil", name: "巴西" },
];

// 语言数据
export const videoLanguages: VideoType[] = [
  { id: "all", name: "全部" },
  { id: "mandarin", name: "普通话" },
  { id: "cantonese", name: "粤语" },
  { id: "english", name: "英语" },
  { id: "japanese", name: "日语" },
  { id: "korean", name: "韩语" },
  { id: "french", name: "法语" },
  { id: "german", name: "德语" },
  { id: "italian", name: "意大利语" },
  { id: "spanish", name: "西班牙语" },
  { id: "russian", name: "俄语" },
  { id: "hindi", name: "印地语" },
  { id: "thai", name: "泰语" },
  { id: "arabic", name: "阿拉伯语" },
  { id: "portuguese", name: "葡萄牙语" },
];

// 排序选项
export const sortOptions: VideoType[] = [
  { id: "newest", name: "最新上线" },
  { id: "hottest", name: "最热门" },
  { id: "rating", name: "评分最高" },
];

// 热门搜索词
export const hotSearchTerms: string[] = ["战狼", "流浪地球", "你好，李焕英", "长津湖", "我和我的祖国", "哪吒", "红海行动", "唐人街探案", "速度与激情", "复仇者联盟"];

// 生成模拟视频数据
export const generateMockVideos = (count: number = 100): VideoItem[] => {
  const mockResults: VideoItem[] = [];
  for (let i = 1; i <= count; i++) {
    mockResults.push({
      id: i,
      title: `视频标题 ${i}`,
      cover: `https://picsum.photos/300/400?random=${i}`,
      year: Math.floor(Math.random() * 30 + 1990).toString(),
      type: videoCategories[Math.floor(Math.random() * 5) + 1].id,
      region: videoRegions[Math.floor(Math.random() * 5) + 1].id,
      language: videoLanguages[Math.floor(Math.random() * 5) + 1].id,
      rating: (Math.random() * 2 + 7).toFixed(1),
      views: Math.floor(Math.random() * 10000000),
      duration: `${Math.floor(Math.random() * 120 + 60)}分钟`,
      description: `这是视频${i}的简介，包含了一些基本信息。`,
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
      debugger;
      this.loading = true;

      // 模拟API请求延迟
      setTimeout(() => {
        // 生成模拟数据
        const mockResults = generateMockVideos();

        // 过滤逻辑
        let results = [...mockResults];

        // 关键词过滤
        if (this.filters.keyword) {
          const keyword = this.filters.keyword.toLowerCase();
          results = results.filter((video) => video.title.toLowerCase().includes(keyword) || video.description.toLowerCase().includes(keyword));
        }

        // 类型过滤 - 支持多选
        if (this.filters.category && this.filters.category.length > 0) {
          results = results.filter((video) => this.filters.category.includes(video.type));
        }

        // 年份过滤 - 支持多选
        if (this.filters.year && this.filters.year.length > 0) {
          results = results.filter((video) => {
            const videoYear = parseInt(video.year);

            return this.filters.year.some((yearFilter) => {
              if (yearFilter === "2010s") return videoYear >= 2010 && videoYear < 2020;
              if (yearFilter === "2000s") return videoYear >= 2000 && videoYear < 2010;
              if (yearFilter === "1990s") return videoYear >= 1990 && videoYear < 2000;
              if (yearFilter === "1980s") return videoYear >= 1980 && videoYear < 1990;
              if (yearFilter === "1970s") return videoYear >= 1970 && videoYear < 1980;
              if (yearFilter === "1960s") return videoYear >= 1960 && videoYear < 1970;
              if (yearFilter === "earlier") return videoYear < 1960;
              return video.year === yearFilter;
            });
          });
        }

        // 地区过滤 - 支持多选
        if (this.filters.region && this.filters.region.length > 0) {
          results = results.filter((video) => this.filters.region.includes(video.region));
        }

        // 语言过滤 - 支持多选
        if (this.filters.language && this.filters.language.length > 0) {
          results = results.filter((video) => this.filters.language.includes(video.language));
        }

        // 排序
        if (this.filters.sort === "newest") {
          results.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        } else if (this.filters.sort === "hottest") {
          results.sort((a, b) => b.views - a.views);
        } else if (this.filters.sort === "rating") {
          results.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        }

        // 分页处理
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;

        this.totalResults = results.length;
        this.searchResults = results.slice(startIndex, endIndex);
        this.loading = false;
      }, 500);
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
