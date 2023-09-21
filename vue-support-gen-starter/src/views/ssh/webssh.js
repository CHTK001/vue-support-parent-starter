import ReconnectingWebSocket from 'reconnecting-websocket';



const WSSHClient  = {
    _connection: undefined,
    _generateEndpointfunction () {
        if (window.location.protocol == 'https:') {
            var protocol = 'wss://';
        } else {
            var protocol = 'ws://';
        }
        //'ws://' + window.location.hostname + ":{{ws}}/trace"
        var endpoint = this.url;
        return endpoint;
    },

connectfunction (options) {
    var endpoint = this._generateEndpoint();

    if (window.WebSocket) {
        //如果支持websocket
        this._connection = new ReconnectingWebSocket(endpoint);
    }else {
        //否则报错
        options.onError('WebSocket Not Supported');
        return;
    }

    this._connection.onopen = function () {
        options.onConnect();
    };

    this._connection.onmessage = function (evt) {
        var data = evt.data.toString();
        //data = base64.decode(data);
        options.onData(data);
    };


    this._connection.onclose = function (evt) {
        options.onClose();
    };
},

closefunction (data) {
    this._connection.close();
},

sendfunction (data) {
    this._connection.send(JSON.stringify(data));
},

sendInitDatafunction (options) {
    //连接参数
    this._connection.send(JSON.stringify(options));
},

sendClientDatafunction (data) {
    //发送指令
    this._connection.send(JSON.stringify({"operate": "command", "command": data}))
}
}


export default WSSHClient;
