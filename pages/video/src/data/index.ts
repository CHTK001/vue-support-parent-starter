// 视频类型选项
export const videoTypeOptions = [
  { label: "全部类型", value: "" },
  { label: "MP4", value: "mp4" },
  { label: "AVI", value: "avi" },
  { label: "MKV", value: "mkv" },
  { label: "MOV", value: "mov" },
  { label: "WMV", value: "wmv" },
];

export const VideoOrderByOptions = [
  { value: "original_title.asc", label: "标题升序" },
  { value: "original_title.desc", label: "标题降序" },
  { value: "popularity.asc", label: "受欢迎程度升序" },
  { value: "popularity.desc", label: "受欢迎程度降序" },
  { value: "revenue.asc", label: "票房升序" },
  { value: "revenue.desc", label: "票房降序" },
  { value: "primary_release_date.asc", label: "上映日期升序" },
  { value: "primary_release_date.desc", label: "上映日期降序" },
  { value: "vote_count.asc", label: "评分升序" },
  { value: "vote_count.desc", label: "评分降序" },
];

// 导出视频地区和语言选项
export * from "./videoOptions";

// 视频列表列定义
export const videoColumns = [{ label: "视频", prop: "default" }];

// 格式化视频大小
export const formatVideoSize = (size?: number): string => {
  if (!size) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let formattedSize = size;

  while (formattedSize >= 1024 && index < units.length - 1) {
    formattedSize /= 1024;
    index++;
  }

  return `${formattedSize.toFixed(2)} ${units[index]}`;
};

// 格式化视频时长
export const formatVideoDuration = (duration?: number): string => {
  if (!duration) return "00:00";

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// 格式化日期
export const formatDate = (dateString?: string): string => {
  if (!dateString) return "未知";

  try {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateString;
  }
};

// 默认查询参数
export const defaultQueryParams = {
  videoName: "",
  videoType: "",
  videoStatus: 1, // 默认只搜索启用的视频
  pageNum: 1,
  pageSize: 12,
};

// 占位图片
export const placeholderImage = "https://via.placeholder.com/300x180?text=No+Image";

// 导出网盘类型数据
export * from "./panTypes";

// 导出视频过滤器数据
export * from "./videoFilters";
