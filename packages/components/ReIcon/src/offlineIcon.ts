// 这里存放本地图标，在 src/layout/index.vue 文件中加载，避免在首启动加载
import { addIcon } from "@iconify/vue/dist/offline";
import { markRaw } from "vue";

// 本地菜单图标，后端在路由的 icon 中返回对应的图标字符串并且前端在此处使用 addIcon 添加即可渲染菜单图标
// @iconify-icons/ep
import Lollipop from "@iconify-icons/ep/lollipop";
import HomeFilled from "@iconify-icons/ep/home-filled";
import Check from "@iconify-icons/ep/check";
addIcon("ep:lollipop", markRaw(Lollipop));
addIcon("ep:home-filled", markRaw(HomeFilled));
addIcon("ep:check", markRaw(Check));
// @iconify-icons/ri
import Search from "@iconify-icons/ri/search-line";
import InformationLine from "@iconify-icons/ri/information-line";
import Settings3Line from "@iconify-icons/ri/settings-3-line";
import Translate2 from "@iconify-icons/ri/translate-2";
import ArrowDownSLine from "@iconify-icons/ri/arrow-down-s-line";
import GlobalLine from "@iconify-icons/ri/global-line";
import UserSettingsLine from "@iconify-icons/ri/user-settings-line";
import ArrowRightSLine from "@iconify-icons/ri/arrow-right-s-line";
import LogoutCircleRLine from "@iconify-icons/ri/logout-circle-r-line";
addIcon("ri:search-line", markRaw(Search));
addIcon("ri:information-line", markRaw(InformationLine));
addIcon("ri:settings-3-line", markRaw(Settings3Line));
addIcon("ri:translate-2", markRaw(Translate2));
addIcon("ri:arrow-down-s-line", markRaw(ArrowDownSLine));
addIcon("ri:global-line", markRaw(GlobalLine));
addIcon("ri:user-settings-line", markRaw(UserSettingsLine));
addIcon("ri:arrow-right-s-line", markRaw(ArrowRightSLine));
addIcon("ri:logout-circle-r-line", markRaw(LogoutCircleRLine));
// @iconify-icons/line-md
import BackupRestore from "@iconify-icons/line-md/backup-restore";
addIcon("line-md:backup-restore", markRaw(BackupRestore));
