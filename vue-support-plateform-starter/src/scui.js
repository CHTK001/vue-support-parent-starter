import config from "@/config"
import api from '@/api'
import tool from '@/utils/tool'
import http from "@/utils/request"
import { permission, rolePermission } from '@/utils/permission'

import scTable from '@/components/scTable/index.vue'
import scDymaicTable from '@/components/scDymaicTable/index.vue'

import scTableColumn from '@/components/scTable/column.js'
import scFilterBar from '@/components/scFilterBar/index.vue'
import scUpload from '@/components/scUpload/index.vue'
import scUploadMultiple from '@/components/scUpload/multiple.vue'
import scUploadFile from '@/components/scUpload/file.vue'
import scFormTable from '@/components/scFormTable/index.vue'
import scTableSelect from '@/components/scTableSelect/index.vue'
import scPageHeader from '@/components/scPageHeader/index.vue'
import scSelect from '@/components/scSelect/index.vue'
import scDialog from '@/components/scDialog/index.vue'
import scForm from '@/components/scForm/index.vue'
import scTitle from '@/components/scTitle/index.vue'
import scWaterMark from '@/components/scWaterMark/index.vue'
import scPagintion from '@/components/scPagintion/index.vue'

import VueDragResize from 'vue-drag-resize'
import scStatusIndicator from '@/components/scMini/scStatusIndicator.vue'
import scTrend from '@/components/scMini/scTrend.vue'
import scExport from '@/components/export/index.vue'
import scDrag from '@/components/scDrag/index.vue'

import auth from '@/directives/auth'
import auths from '@/directives/auths'
import authsAll from '@/directives/authsAll'
import role from '@/directives/role'
import time from '@/directives/time'
import copy from '@/directives/copy'
import errorHandler from '@/utils/errorHandler'

import * as elIcons from '@element-plus/icons-vue'
import * as scIcons from '@/assets/icons'

export default {
	install(app) {
		//挂载全局对象
		app.config.globalProperties.$CONFIG = config;
		app.config.globalProperties.$TOOL = tool;
		app.config.globalProperties.$HTTP = http;
		app.config.globalProperties.$API = api;
		app.config.globalProperties.$AUTH = permission;
		app.config.globalProperties.$ROLE = rolePermission;

		//注册全局组件
		app.component('scTable', scTable);
		app.component('scDymaicTable', scDymaicTable);
		app.component('scDrag', scDrag);
		app.component('scExport', scExport);
		app.component('scPagintion', scPagintion);
		app.component('scTableColumn', scTableColumn);
		app.component('scFilterBar', scFilterBar);
		app.component('scUpload', scUpload);
		app.component('vue-drag-resize', VueDragResize);
		app.component('scUploadMultiple', scUploadMultiple);
		app.component('scUploadFile', scUploadFile);
		app.component('scFormTable', scFormTable);
		app.component('scTableSelect', scTableSelect);
		app.component('scPageHeader', scPageHeader);
		app.component('scSelect', scSelect);
		app.component('scDialog', scDialog);
		app.component('scForm', scForm);
		app.component('scTitle', scTitle);
		app.component('scWaterMark', scWaterMark);
		app.component('scStatusIndicator', scStatusIndicator);
		app.component('scTrend', scTrend);

		//注册全局指令
		app.directive('auth', auth)
		app.directive('auths', auths)
		app.directive('auths-all', authsAll)
		app.directive('role', role)
		app.directive('time', time)
		app.directive('copy', copy)

		//统一注册el-icon图标
		for(let icon in elIcons){
			app.component(`ElIcon${icon}`, elIcons[icon])
		}
		//统一注册sc-icon图标
		for(let icon in scIcons){
			app.component(`ScIcon${icon}`, scIcons[icon])
		}

		//关闭async-validator全局控制台警告
		window.ASYNC_VALIDATOR_NO_WARNING = 1

		//全局代码错误捕捉
		app.config.errorHandler = errorHandler
	}
}
