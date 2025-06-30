package com.chua.starter.monitor.starter.guacamole;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Guacamole Tunnel 实现
 * 用于在 WebSocket 和 Guacamole 协议之间建立桥梁
 *
 * @author CH
 * @since 2024/12/18
 */
@Slf4j
public class GuacamoleTunnel {

    /**
     * 关联的 WebSocket 会话
     */
    private final WebSocketSession webSocketSession;

    /**
     * Guacamole 客户端
     */
    private final Object guacamoleClient;

    /**
     * SimpleGuacamoleTunnel 实例
     */
    private Object simpleGuacamoleTunnel;

    /**
     * 连接状态
     */
    private final AtomicBoolean connected = new AtomicBoolean(false);

    /**
     * 消息队列
     */
    private final BlockingQueue<String> messageQueue = new LinkedBlockingQueue<>();

    /**
     * 数据回调接口
     */
    private GuacamoleDataCallback dataCallback;

    public GuacamoleTunnel(WebSocketSession webSocketSession, Object guacamoleClient) {
        this.webSocketSession = webSocketSession;
        this.guacamoleClient = guacamoleClient;
    }

    /**
     * 建立 Guacamole 连接
     */
    public boolean connect() {
        try {
            log.info("建立 Guacamole Tunnel 连接: sessionId={}", webSocketSession.getId());

            // 使用反射调用 client.createSession().getTunnel()
            Object session = guacamoleClient.getClass().getMethod("createSession").invoke(guacamoleClient);
            this.simpleGuacamoleTunnel = session.getClass().getMethod("getTunnel").invoke(session);

            if (simpleGuacamoleTunnel != null) {
                connected.set(true);
                
                // 启动数据监听线程
                startDataListener();
                
                log.info("Guacamole Tunnel 连接成功: sessionId={}", webSocketSession.getId());
                return true;
            } else {
                log.error("创建 SimpleGuacamoleTunnel 失败: sessionId={}", webSocketSession.getId());
                return false;
            }

        } catch (Exception e) {
            log.error("建立 Guacamole Tunnel 连接失败: sessionId={}, error={}", 
                     webSocketSession.getId(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * 启动数据监听线程
     */
    private void startDataListener() {
        Thread listenerThread = new Thread(() -> {
            try {
                while (connected.get() && simpleGuacamoleTunnel != null) {
                    // 从 SimpleGuacamoleTunnel 读取数据
                    String data = readFromTunnel();
                    if (data != null && dataCallback != null) {
                        dataCallback.onDataReceived(data);
                    }
                    
                    // 短暂休眠避免过度占用CPU
                    Thread.sleep(10);
                }
            } catch (InterruptedException e) {
                log.info("Guacamole 数据监听线程被中断: sessionId={}", webSocketSession.getId());
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("Guacamole 数据监听异常: sessionId={}, error={}", 
                         webSocketSession.getId(), e.getMessage(), e);
            }
        }, "GuacamoleTunnel-Listener-" + webSocketSession.getId());
        
        listenerThread.setDaemon(true);
        listenerThread.start();
    }

    /**
     * 从 Tunnel 读取数据
     */
    private String readFromTunnel() {
        try {
            if (simpleGuacamoleTunnel != null) {
                // 使用反射调用 tunnel.read() 方法
                Object instruction = simpleGuacamoleTunnel.getClass().getMethod("read").invoke(simpleGuacamoleTunnel);
                if (instruction != null) {
                    return instruction.toString();
                }
            }
        } catch (Exception e) {
            log.debug("从 Tunnel 读取数据失败: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 向 Tunnel 写入数据
     */
    public void writeToTunnel(String data) {
        try {
            if (simpleGuacamoleTunnel != null && connected.get()) {
                // 使用反射调用 tunnel.write() 方法
                simpleGuacamoleTunnel.getClass().getMethod("write", String.class).invoke(simpleGuacamoleTunnel, data);
                log.debug("向 Tunnel 写入数据: sessionId={}, data={}", webSocketSession.getId(), data);
            }
        } catch (Exception e) {
            log.error("向 Tunnel 写入数据失败: sessionId={}, error={}", 
                     webSocketSession.getId(), e.getMessage(), e);
        }
    }

    /**
     * 发送鼠标事件
     */
    public void sendMouseEvent(int x, int y, int mask) {
        String instruction = String.format("3.mouse,%d.%d,%d.%d,%d.%d;", x, y, mask);
        writeToTunnel(instruction);
    }

    /**
     * 发送键盘事件
     */
    public void sendKeyEvent(int keysym, boolean pressed) {
        String instruction = String.format("3.key,%d.%d,%d.%d;", keysym, pressed ? 1 : 0);
        writeToTunnel(instruction);
    }

    /**
     * 发送屏幕调整事件
     */
    public void sendSizeEvent(int width, int height) {
        String instruction = String.format("4.size,%d.%d,%d.%d;", width, height);
        writeToTunnel(instruction);
    }

    /**
     * 发送剪贴板数据
     */
    public void sendClipboard(String data) {
        try {
            String instruction = String.format("9.clipboard,%d.%s;", data.length(), data);
            writeToTunnel(instruction);
        } catch (Exception e) {
            log.error("发送剪贴板数据失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 断开连接
     */
    public void disconnect() {
        try {
            log.info("断开 Guacamole Tunnel 连接: sessionId={}", webSocketSession.getId());
            
            connected.set(false);
            
            if (simpleGuacamoleTunnel != null) {
                // 使用反射调用 tunnel.close() 方法
                simpleGuacamoleTunnel.getClass().getMethod("close").invoke(simpleGuacamoleTunnel);
                simpleGuacamoleTunnel = null;
            }
            
        } catch (Exception e) {
            log.error("断开 Guacamole Tunnel 连接失败: sessionId={}, error={}", 
                     webSocketSession.getId(), e.getMessage(), e);
        }
    }

    /**
     * 检查连接状态
     */
    public boolean isConnected() {
        return connected.get() && simpleGuacamoleTunnel != null;
    }

    /**
     * 设置数据回调
     */
    public void setDataCallback(GuacamoleDataCallback callback) {
        this.dataCallback = callback;
    }

    /**
     * 数据回调接口
     */
    public interface GuacamoleDataCallback {
        void onDataReceived(String data);
    }
}
