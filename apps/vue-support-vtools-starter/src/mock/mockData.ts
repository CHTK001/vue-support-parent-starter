import { VideoInfo } from "../view/video/types";

// 视频类型数据
export const videoTypes = [
  { videoId: "all", videoName: "全部类型", videoIcon: "ri:search-line", videoColor: "#409EFF" },
  { videoId: "movie", videoName: "电影", videoIcon: "ri:movie-line", videoColor: "#FF9C00" },
  { videoId: "tv", videoName: "电视剧", videoIcon: "ri:tv-line", videoColor: "#00BE06" },
  { videoId: "anime", videoName: "动漫", videoIcon: "ri:gamepad-line", videoColor: "#FB7299" },
  { videoId: "variety", videoName: "综艺", videoIcon: "ri:live-line", videoColor: "#FF8800" },
  { videoId: "documentary", videoName: "纪录片", videoIcon: "ri:film-line", videoColor: "#0099FF" },
  { videoId: "short", videoName: "短视频", videoIcon: "ri:video-line", videoColor: "#000000" },
  { videoId: "music", videoName: "音乐MV", videoIcon: "ri:music-line", videoColor: "#FF0000" },
];

// 视频平台数据
export const videoPlatforms = [
  { videoId: "all", videoName: "全部平台", videoIcon: "ri:global-line", videoColor: "#409EFF", videoUrl: "" },
  { videoId: "bilibili", videoName: "哔哩哔哩", videoIcon: "ri:bilibili-line", videoColor: "#FB7299", videoUrl: "https://search.bilibili.com/all?keyword={{keyword}}" },
  { videoId: "youtube", videoName: "YouTube", videoIcon: "ri:youtube-line", videoColor: "#FF0000", videoUrl: "https://www.youtube.com/results?search_query={{keyword}}" },
  { videoId: "iqiyi", videoName: "爱奇艺", videoIcon: "ri:tv-line", videoColor: "#00BE06", videoUrl: "https://so.iqiyi.com/so/q_{{keyword}}" },
  { videoId: "tencent", videoName: "腾讯视频", videoIcon: "ri:video-line", videoColor: "#FF9C00", videoUrl: "https://v.qq.com/x/search/?q={{keyword}}" },
  { videoId: "youku", videoName: "优酷", videoIcon: "ri:play-circle-line", videoColor: "#0099FF", videoUrl: "https://so.youku.com/search_video/q_{{keyword}}" },
  { videoId: "mgtv", videoName: "芒果TV", videoIcon: "ri:movie-line", videoColor: "#FF8800", videoUrl: "https://so.mgtv.com/so/k-{{keyword}}" },
  { videoId: "douyin", videoName: "抖音", videoIcon: "ri:rhythm-line", videoColor: "#000000", videoUrl: "https://www.douyin.com/search/{{keyword}}" },
];

// 模拟视频数据
export const videoList = [
  {
    videoId: "1",
    videoTitle: "流浪地球2：人类最后的希望",
    videoName: "流浪地球2",
    videoAliasName: "The Wandering Earth 2",
    videoDescription: "在不久的将来，太阳即将毁灭，人类面临灭绝危机。为了寻找新家园，人类启动流浪地球计划，试图将地球推离太阳系。",
    videoThumbnail: "https://img2.baidu.com/it/u=3535883079,1323546611&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=500",
    videoType: "电影",
    videoYear: 2023,
    videoRegion: "中国大陆",
    videoLanguage: "中文",
    videoDirector: "郭帆",
    videoActors: "吴京,刘德华,李雪健,沙溢,宁理,王智",
    videoDuration: "2:03:45",
    videoQuality: "HD",
    videoPlatform: "tencent",
    videoScore: 8.6,
    videoStatus: 1,
  },
  {
    videoId: "2",
    videoTitle: "满江红：宋朝悬疑大片",
    videoName: "满江红",
    videoAliasName: "Full River Red",
    videoDescription: "南宋绍兴年间，岳飞死后四年，秦桧率领的金国使者入境，所到之处舆图尽失。一个名叫张大（沈腾 饰）的小兵，与亲兵营副统领孙均（易烊千玺 饰）机缘巧合地闯入了一场纵横捭阖的杀局。北方的张大，本是与南宋毫无关系的人，但随着他进入南宋军营，一段身世之谜也将慢慢揭开...",
    videoThumbnail: "https://img0.baidu.com/it/u=2808499481,4256689840&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=281",
    videoType: "电影",
    videoYear: 2023,
    videoRegion: "中国大陆",
    videoLanguage: "中文",
    videoDirector: "张艺谋",
    videoActors: "沈腾,易烊千玺,张译,雷佳音,岳云鹏",
    videoDuration: "2:39:00",
    videoQuality: "HD",
    videoPlatform: "iqiyi",
    videoScore: 7.9,
    videoStatus: 1,
  },
];

// 模拟同步配置数据
export const syncConfigList = [
  {
    syncId: "1",
    syncName: "哔哩哔哩每日热门视频同步",
    syncType: "cron",
    syncSource: "https://api.bilibili.com/x/web-interface/popular",
    syncTarget: "local_db",
    syncCron: "0 0 * * *",
    syncParams: '{"limit": 50}',
    syncStatus: 1,
    syncDescription: "每天0点从哔哩哔哩获取热门视频数据",
    createTime: "2023-05-01 10:00:00",
    updateTime: "2023-05-10 15:30:00",
  },
  {
    syncId: "2",
    syncName: "YouTube每周热门视频同步",
    syncType: "cron",
    syncSource: "https://www.googleapis.com/youtube/v3/videos",
    syncTarget: "local_db",
    syncCron: "0 0 * * 1",
    syncParams: '{"part": "snippet,contentDetails,statistics", "chart": "mostPopular", "regionCode": "US", "maxResults": 50}',
    syncStatus: 1,
    syncDescription: "每周一0点从YouTube获取热门视频数据",
    createTime: "2023-05-02 11:20:00",
    updateTime: "2023-05-12 09:15:00",
  },
  {
    syncId: "3",
    syncName: "腾讯视频电影数据同步",
    syncType: "manual",
    syncSource: "https://v.qq.com/x/api/movie_list",
    syncTarget: "local_db",
    syncParams: '{"type": "movie", "limit": 100}',
    syncStatus: 0,
    syncDescription: "手动同步腾讯视频电影数据",
    createTime: "2023-05-03 14:30:00",
    updateTime: "2023-05-15 16:45:00",
  },
];

// 模拟同步任务状态数据
export const syncTaskStatusList = [
  {
    taskId: "task_1",
    configId: "1",
    status: "success",
    progress: 100,
    startTime: "2023-05-15 00:00:00",
    endTime: "2023-05-15 00:05:23",
    message: "同步成功，获取到48个视频",
    result: {
      total: 48,
      success: 48,
      failed: 0,
    },
  },
  {
    taskId: "task_2",
    configId: "2",
    status: "running",
    progress: 65,
    startTime: "2023-05-15 08:30:00",
    message: "正在同步第32/50个视频",
  },
  {
    taskId: "task_3",
    configId: "3",
    status: "failed",
    progress: 45,
    startTime: "2023-05-14 15:20:00",
    endTime: "2023-05-14 15:25:12",
    message: "同步失败，API请求超时",
    result: {
      total: 100,
      success: 45,
      failed: 55,
      error: "Request timeout after 30s",
    },
  },
];
