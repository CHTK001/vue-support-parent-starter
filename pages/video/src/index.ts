/**
 * 视频管理模块
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// 主要页面组件导出
import VideoConfig from "./views/config/index.vue";
import VideoManage from "./views/manage/index.vue";
import VideoDetailResult from "./views/manage/manage/detail.vue";
import VideoParse from "./views/parse/index.vue";
import VideoSearch from "./views/search/index.vue";
import VideoSearchResult from "./views/search/search.vue";
import VideoSource from "./views/source/index.vue";

// 主模块导出
export * from "./api";
export * from "./router";
export { VideoConfig, VideoDetailResult, VideoManage, VideoParse, VideoSearch, VideoSearchResult, VideoSource };
