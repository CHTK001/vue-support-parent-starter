<template>
	<el-config-provider :locale="locale" :size="config.size" :zIndex="config.zIndex" :button="config.button">
		<component v-if="plugin[mediaType]" style="height: 100%; width:100%;" :is='plugin[mediaType]' :name="name" :url="url" :ua="ua"  :suffix="mediaType"></component>
		<div v-else style="position: relative; left: 48%; top: 40%; overflow: hidden; display: inline-block;">不支持预览</div>
	</el-config-provider>
</template>
<script>
import { defineAsyncComponent } from 'vue'

const ImageViewer = defineAsyncComponent(() => import('@/views/data/oss/preview/image.vue'))
const JsonViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/json.vue'))
const XlsxViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/xlsx.vue'))
const MdViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/md.vue'))
const TxtViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/txt.vue'))
const PdfViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/pdf.vue'))
const VideoViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/video.vue'))
const DocxViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/docx.vue'))
const XmindViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/xmind.vue'))
const CodeViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/code.vue'))
const HtmlViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/html.vue'))
const ZipViewer  = defineAsyncComponent(() => import( '@/views/data/oss/preview/zip.vue'))
import colorTool from '@/utils/color'
import Base64 from "@/utils/base64";

export default {
	name: 'App',
	props: {
		url: {
			type: String,
			default: ''
		},
		ua: {
			type: String,
			default: ''
		},
		name: {
			type: String,
			default: ''
		},
		mediaType: {
			type: String,
			default: ''
		}
	},
	data() {
		return {
			config: {
				size: "default",
				zIndex: 2000,
				button: {
					autoInsertSpace: false
				}
			},
			mediaType: '',
            plugin: {
                'image': ImageViewer,
				"json": JsonViewer,
				"xlsx": XlsxViewer,
				"csv": XlsxViewer,
				"md": MdViewer,
				"pdf": PdfViewer,
				"text": TxtViewer,
				"plain": TxtViewer,
				"txt": TxtViewer,
				"video": VideoViewer,
				"docx": DocxViewer,
				"bat": CodeViewer,
				"js": CodeViewer,
				"css": CodeViewer,
				"java": CodeViewer,
				"yml": CodeViewer,
				"yaml": CodeViewer,
				"ini": CodeViewer,
				"json5": CodeViewer,
				"less": CodeViewer,
				"php": CodeViewer,
				"py": CodeViewer,
				"python": CodeViewer,
				"scss": CodeViewer,
				"sh": CodeViewer,
				"toml": CodeViewer,
				"groovy": CodeViewer,
				"http": CodeViewer,
				"log": CodeViewer,
				"ts": CodeViewer,
				"nginx": CodeViewer,
				"docker": CodeViewer,
				"xml": CodeViewer,
				"xmind": XmindViewer,
				"html": HtmlViewer,
				"zip": ZipViewer,
            },
			url: '',
			ua: '',
			name: '',
		}
	},
	computed: {
		locale() {
			return this.$i18n.messages[this.$i18n.locale].el
		},
	},
	created() {
		//设置主题颜色
		const app_color = this.$CONFIG.COLOR || this.$TOOL.data.get('APP_COLOR')
		if (app_color) {
			document.documentElement.style.setProperty('--el-color-primary', app_color);
			for (let i = 1; i <= 9; i++) {
				document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, colorTool.lighten(app_color, i / 10));
			}
			for (let i = 1; i <= 9; i++) {
				document.documentElement.style.setProperty(`--el-color-primary-dark-${i}`, colorTool.darken(app_color, i / 10));
			}
		}
	},
	mounted(){
		this.url = Base64.decode(this.getQueryString("data"));
		this.ua = Base64.decode(this.getQueryString("ua"));
		this.mediaType = this.getQueryString("mediaType");
		this.name = this.getQueryString("name");
	},
	methods: {
		getQueryString(name){
			var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
			var r = ((
				window.location.hash && window.location.hash.indexOf('?')>-1 ? 
					window.location.hash.substring(window.location.hash.indexOf('?')) :
				""

			) || window.location.search).substr(1).match(reg);
			if(r!=null)return  unescape(decodeURIComponent(r[2])); return null;
		}
	}
}
</script>

<style lang="scss">
@import '@/style/style.scss';
</style>
