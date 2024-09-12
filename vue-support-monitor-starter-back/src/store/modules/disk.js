
export default {
	state: {
        data: [],
		diskIO:[]
	},
	mutations: {
		updateDisk(status, item) {
			Object.assign(status.data, item);
        },
       
		updateDiskIO(status, item) {
			Object.assign(status.diskIO, item);
        },
       
	},
}
