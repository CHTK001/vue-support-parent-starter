
export default {
	state: {
        data: [],
	},
	mutations: {
		updateDisk(status, item) {
			Object.assign(status.data, item);
        },
       
	},
}
