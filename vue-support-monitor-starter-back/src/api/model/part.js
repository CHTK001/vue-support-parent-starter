import config from "@/config"
import http from "@/utils/request"

export default {
    weather: {
        url:  `${config.API_URL}/v1/external/weather`,
        name: "获取天气",
        get: async function(data, config={headers:{}}){
             return await http.get(this.url, data, config); 
        }
    }
}
