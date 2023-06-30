import Constant from "@/config/common"
const HOST1 = Constant.PREFIX + '/terminal';

const HOST = Constant.ENDPOINT + '/terminal';
const URL = {
    HELP: HOST1 + '/help',
    WS: 'http://localhost:31256/terminal'

}

export default URL;