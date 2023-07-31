import config from "@/config"
import http from "@/utils/request"

export default {
	blob: {
        url: `${config.API_LEARNING}/v1/compare/face`,
		name: "获取文件",
		post: async function(url, data, config={}){
			return await http.post(url, data, config);
		}
	},
}