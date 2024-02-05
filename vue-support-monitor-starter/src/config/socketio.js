import io from 'socket.io-client';
import api from '@/api'
import tool from '@/utils/tool'
import config from "@/config"
import { ElNotification } from 'element-plus'

export default {
    install: (app) => {
        const token = tool.cookie.get(config.TOKEN)
        if (token) {
            const socket = io(api.monitor.socket.url, {
                query: {
                    "x-oauth-token": token,
                },
                transports: ["websocket"],
                reconnection: false
            })
            socket.on('connect', data => {
                console.log("连接成功", data);
            });
            socket.on('connecting', data => {
                console.log("正在连接", data);
            });
            socket.on('disconnect', data => {
                console.log("断开连接", data);
            });
            socket.on('connect_failed', data => {
                console.log("连接失败", data);
            });
            socket.on('error', data => {
                console.log("错误", data);
            });
            socket.on('reconnect_failed', data => {
                console.log("重连失败", data);
            });
            socket.on('reconnect', data => {
                console.log("成功重连", data);
            });
            socket.on('reconnecting', data => {
                console.log("正在重连", data);
            });

             if(window.Notification && Notification.permission === "denied") {
                Notification.requestPermission();
             }

            socket.on('online', data => {
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
            socket.on('offline', data => {
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
            app.config.globalProperties.$socket = socket
            app.provide('socket', socket)
        }

    }
}
