import io from 'socket.io-client';
import api from '@/api'
import tool from '@/utils/tool'
import config from "@/config"
import { ElNotification } from 'element-plus'
import { sm2 } from 'sm-crypto';
export default {
    install: (app) => {
        const token = tool.cookie.get(config.TOKEN)
        if (token) {
            const socket = io(config.SOCKET.ADDRESS, {
                query: {
                    "x-oauth-token": token,
                },
                transports: ["websocket"],
                reconnection: true
            });
            const socketWrapper = {
                socket: socket,
                on: function(event, callback) {
                    socket.on(event, (data) => {
                        if(!data) {
                            return;
                        }
                        const data1 = JSON.parse(data);
                        var origin = data1?.uuid || data?.uid;
                        if(origin) {
                            const ts = data1.timestamp;
                            try{
                                data = JSON.parse(sm2.doDecrypt(data1?.data.substring(6, data1?.data.length - 4), tool.crypto.AES.decrypt(origin, ts), 0))
                            }catch(err){}
                        }
                        callback(JSON.parse(data?.data))
                    });
                },
                off: function(event) {
                    socket.off(event);
                },
                emit: function(event, data) {
                    socket.emit(event, data)   ;
                }
            }
            socketWrapper.on('connect', data => {
                console.log("连接成功", data);
            });
            socketWrapper.on('connecting', data => {
                console.log("正在连接", data);
            });
            socketWrapper.on('disconnect', data => {
                console.log("断开连接", data);
            });
            socketWrapper.on('connect_failed', data => {
                console.log("连接失败", data);
            });
            socketWrapper.on('error', data => {
                console.log("错误", data);
            });
            socketWrapper.on('reconnect_failed', data => {
                console.log("重连失败", data);
            });
            socketWrapper.on('reconnect', data => {
                console.log("成功重连", data);
            });
            socketWrapper.on('reconnecting', data => {
                console.log("正在重连", data);
            });

             if(window.Notification && Notification.permission === "denied") {
                Notification.requestPermission();
             }

             socketWrapper.on('online', data => {
                // 浏览器支持且用户没有禁止浏览器通知的情况下执行
                if(window.Notification && Notification.permission !== "denied") {
                    const data1 = JSON.parse(data);
                    Notification.requestPermission(function(status) {
                        var n = new Notification('上线通知', { body:  data1.appName + '(' + data1.serverHost + ":" + data1.serverPort + ')上线了' }); 
                    });
                } else {
                    const data1 = JSON.parse(data);
                    ElNotification({
                        title: '上线通知',
                        type: 'success',
                        message: data1.appName + '(' + data1.serverHost + ":" + data1.serverPort + ')上线了' 
                    })
                }
            });
            socketWrapper.on('offline', data => {
                // 浏览器支持且用户没有禁止浏览器通知的情况下执行
                if(window.Notification && Notification.permission !== "denied") {
                    const data1 = JSON.parse(data);
                    Notification.requestPermission(function(status) {
                        var n = new Notification('下线通知', { body:  data1.appName + '(' + data1.serverHost + ":" + data1.serverPort + ')下线了' }); 
                    });
                } else{
                    const data1 = JSON.parse(data);
                    ElNotification({
                        title: '下线通知',
                        type: 'warning',
                        message: data1.appName + '(' + data1.serverHost + ":" + data1.serverPort + ')下线了' 
                    })
                }
            });
            socket.pingInterval = 60000;
            app.config.globalProperties.$socket = socketWrapper
            app.provide('socket', socketWrapper)
        }

    }
}
