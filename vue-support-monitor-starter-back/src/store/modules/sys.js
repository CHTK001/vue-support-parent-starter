
export default {
	state: {
        jvm: {
		},
		process: [],
	},
	mutations: {
		updateJvm(status, item) {
			status.jvm = item
        },
		updateProcess(status, item) {
			status.process = item
        },
       
	},
}
