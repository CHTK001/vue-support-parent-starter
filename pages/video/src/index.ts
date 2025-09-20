/**
 * 视频管理模块
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// 主要页面组件导出
import VideoConfig from "./views/config/index.vue";
import VideoManage from "./views/manage/index.vue";
import VideoAddResult from "./views/manage/manage/add.vue";
import VideoDetailResult from "./views/manage/manage/detail.vue";
import VideoEditResult from "./views/manage/manage/edit.vue";
import VideoManageSearchResult from "./views/manage/search.vue";
import VideoParse from "./views/parse/index.vue";
import VideoPlay from "./views/play/play.vue";
import VideoDetail from "./views/search/detail.vue";
import VideoSearch from "./views/search/index.vue";
import VideoSearchResult from "./views/search/result.vue";
import VideoSource from "./views/source/index.vue";

// 主模块导出
export * from "./api";
export * from "./router";
export { VideoAddResult, VideoConfig, VideoDetail, VideoDetailResult, VideoEditResult, VideoManage, VideoManageSearchResult, VideoParse, VideoPlay, VideoSearch, VideoSearchResult, VideoSource };
