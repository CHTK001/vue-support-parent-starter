
export default {
	state: {
        data: {
			sys: 0,
			user: 0,
			timestamp: 0,
		},
	},
	mutations: {
		updateCpu(status, item) {
			status.data.sys = item?.sys;
			status.data.user = item?.user;
			status.data.timestamp = item?.timestamp;
        },
       
	},
}
