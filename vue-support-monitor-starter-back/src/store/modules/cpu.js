
export default {
	state: {
        data: {
			sys: 0,
			user: 0,
			timestamp: 0,
			system: 0,
			process: 0,
		},
	},
	mutations: {
		updateCpu(status, item) {
			status.data.sys = item?.sys;
			status.data.user = item?.user;
			status.data.system = item?.system;
			status.data.process = item?.process;
			status.data.timestamp = item?.timestamp;
        },
       
	},
}
