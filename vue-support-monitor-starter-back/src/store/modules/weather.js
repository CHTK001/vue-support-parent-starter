import config from "@/config";

export default {
	state: {
	},
	mutations: {
		weather(state, key){
			Object.keys(key).forEach(ele => {
				state[ele] = key[ele];
			})
		},
	}
}
