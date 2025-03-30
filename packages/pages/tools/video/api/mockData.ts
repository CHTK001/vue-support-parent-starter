// 视频信息接口
export interface VideoInfo {
  monitorVideoId: string;
  monitorVideoTitle: string;
  monitorVideoDescription: string;
  monitorVideoThumbnail: string;
  monitorVideoUrl: string;
  monitorVideoDuration: string;
  monitorVideoViews: number;
  monitorVideoLikes: number;
  monitorVideoPublishDate: string;
  monitorVideoType: string;
  monitorVideoPlatform: string;
  monitorVideoAuthor: string;
}

// 视频类型数据
export const videoTypes = [
  { videoId: "all", videoName: "全部类型", videoIcon: "ri:search-line", videoColor: "#409EFF" },
  { videoId: "movie", videoName: "电影", videoIcon: "ri:movie-line", videoColor: "#FF9C00" },
  { videoId: "tv", videoName: "电视剧", videoIcon: "ri:tv-line", videoColor: "#00BE06" },
  { videoId: "anime", videoName: "动漫", videoIcon: "ri:gamepad-line", videoColor: "#FB7299" },
  { videoId: "variety", videoName: "综艺", videoIcon: "ri:live-line", videoColor: "#FF8800" },
  { videoId: "documentary", videoName: "纪录片", videoIcon: "ri:film-line", videoColor: "#0099FF" },
  { videoId: "short", videoName: "短视频", videoIcon: "ri:video-line", videoColor: "#000000" },
  { videoId: "music", videoName: "音乐MV", videoIcon: "ri:music-line", videoColor: "#FF0000" }
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
  { videoId: "douyin", videoName: "抖音", videoIcon: "ri:rhythm-line", videoColor: "#000000", videoUrl: "https://www.douyin.com/search/{{keyword}}" }
];

// 热门关键词数据
export const videoHotKeywords = [
  "热门电影", "综艺节目", "动漫", "纪录片", "电视剧", "音乐MV", "教程", "游戏实况"
];

// 模拟视频数据
export const videoList: VideoInfo[] = [
  {
    monitorVideoId: "1",
    monitorVideoTitle: "【电影】流浪地球2：人类最后的希望",
    monitorVideoDescription: "在不久的将来，太阳即将毁灭，人类面临灭绝危机。为了寻找新家园，人类启动流浪地球计划，试图将地球推离太阳系。",
    monitorVideoThumbnail: "https://img2.baidu.com/it/u=3535883079,1323546611&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=500",
    monitorVideoUrl: "https://www.example.com/video/1",
    monitorVideoDuration: "2:03:45",
    monitorVideoViews: 12500000,
    monitorVideoLikes: 980000,
    monitorVideoPublishDate: "2023-01-22",
    monitorVideoType: "电影",
    monitorVideoPlatform: "腾讯视频",
    monitorVideoAuthor: "郭帆"
  },
  {
    monitorVideoId: "2",
    monitorVideoTitle: "【动漫】间谍过家家 第二季 第1集",
    monitorVideoDescription: "为了潜入名校，特工黄昏不得不组建一个临时家庭，然而他不知道的是，他收养的女儿是能读心的超能力者，而他的妻子则是一名顶尖杀手。",
    monitorVideoThumbnail: "https://img1.baidu.com/it/u=1361135615,3501066973&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=281",
    monitorVideoUrl: "https://www.example.com/video/2",
    monitorVideoDuration: "24:15",
    monitorVideoViews: 8700000,
    monitorVideoLikes: 720000,
    monitorVideoPublishDate: "2023-04-01",
    monitorVideoType: "动漫",
    monitorVideoPlatform: "哔哩哔哩",
    monitorVideoAuthor: "WIT STUDIO"
  },
  {
    monitorVideoId: "3",
    monitorVideoTitle: "【综艺】这！就是街舞 第五季 第12期",
    monitorVideoDescription: "中国首档街舞题材综艺节目，集结了顶尖舞者和明星队长，通过舞蹈对决的方式角逐总冠军。",
    monitorVideoThumbnail: "https://img0.baidu.com/it/u=2750179659,1901944208&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333",
    monitorVideoUrl: "https://www.example.com/video/3",
    monitorVideoDuration: "1:45:30",
    monitorVideoViews: 6500000,
    monitorVideoLikes: 520000,
    monitorVideoPublishDate: "2023-03-18",
    monitorVideoType: "综艺",
    monitorVideoPlatform: "优酷",
    monitorVideoAuthor: "优酷综艺"
  },
  {
    monitorVideoId: "4",
    monitorVideoTitle: "【纪录片】蓝色星球2：深海的奥秘",
    monitorVideoDescription: "BBC制作的海洋纪录片，展示了海洋生物的奇妙世界和深海的神秘景观。",
    monitorVideoThumbnail: "https://img2.baidu.com/it/u=3098580627,1815973478&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=500",
    monitorVideoUrl: "https://www.example.com/video/4",
    monitorVideoDuration: "58:20",
    monitorVideoViews: 4200000,
    monitorVideoLikes: 380000,
    monitorVideoPublishDate: "2023-02-15",
    monitorVideoType: "纪录片",
    monitorVideoPlatform: "爱奇艺",
    monitorVideoAuthor: "BBC"
  },
  {
    monitorVideoId: "5",
    monitorVideoTitle: "【电视剧】狂飙 第23集",
    monitorVideoDescription: "讲述了一个普通警察卧底黑帮，与犯罪组织进行斗争的故事。",
    monitorVideoThumbnail: "https://img1.baidu.com/it/u=3004742363,3225221474&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=281",
    monitorVideoUrl: "https://www.example.com/video/5",
    monitorVideoDuration: "45:12",
    monitorVideoViews: 9800000,
    monitorVideoLikes: 850000,
    monitorVideoPublishDate: "2023-01-28",
    monitorVideoType: "电视剧",
    monitorVideoPlatform: "腾讯视频",
    monitorVideoAuthor: "徐纪周"
  },
  {
    monitorVideoId: "6",
    monitorVideoTitle: "【音乐MV】周杰伦 - 最伟大的作品",
    monitorVideoDescription: "周杰伦2022年发行的新歌MV，展现了他独特的音乐风格和创作才华。",
    monitorVideoThumbnail: "https://img0.baidu.com/it/u=3202947311,1063918206&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=281",
    monitorVideoUrl: "https://www.example.com/video/6",
    monitorVideoDuration: "4:35",
    monitorVideoViews: 15000000,
    monitorVideoLikes: 1200000,
    monitorVideoPublishDate: "2022-12-10",
    monitorVideoType: "音乐MV",
    monitorVideoPlatform: "QQ音乐",
    monitorVideoAuthor: "周杰伦"
  }
];