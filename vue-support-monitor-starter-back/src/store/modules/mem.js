
export default {
	state: {
        total: 0,
        free: 0,
        used: 0,
        system: 0,
        process: 0,
	},
	mutations: {
		updateMem(status, item) {
            status.total = item?.total;
            status.free = item?.free;
            status.used = item?.used;
            status.system = item?.system;
            status.process = item?.process;
        },
       
	},
    actions:{
        getUsed() {
            if(this.state.total == 0) {
                return 0;
            }
            return Math.round((this.state.used / this.state.total) * 100);
        },
        getFree() {
            if(this.state.total == 0) {
                return 100;
            }
            return Math.round((this.state.free / this.state.total) * 100);
        }
    }
}
