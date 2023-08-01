import config from "@/config"
import http from "@/utils/request"

export default {
	faceCompare: {
        url: `${config.API_LEARNING}/v1/compare/face`,
		name: "人脸1:1",
		post: async function(data, config={
			Headers: {
				'ContentType': 'multipart/form-data'
			}
		}){
			return await http.post(this.url, data, config);
		}
	},
	imageCompare: {
        url: `${config.API_LEARNING}/v1/compare/image`,
		name: "图片1:1",
		post: async function(data, config={
			Headers: {
				'ContentType': 'multipart/form-data'
			}
		}){
			return await http.post(this.url, data, config);
		}
	},
	ocr: {
        url: `${config.API_LEARNING}/v1/ocr`,
		name: "OCR",
		post: async function(data, config={
			Headers: {
				'ContentType': 'multipart/form-data'
			}
		}){
			config.timeout = 180000;
			return await http.post(this.url, data, config);
		}
	},
	faceDetection: {
        url: `${config.API_LEARNING}/v1/face/detection`,
		name: "人脸检测",
		post: async function(data, config={
			Headers: {
				'ContentType': 'multipart/form-data'
			}
		}){
			return await http.post(this.url, data, config);
		}
	},

}