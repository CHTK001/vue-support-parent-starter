package com.chua.starter.monitor.starter.guacamole;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

/**
 * Guacamole 协议处理器
 * 负责处理 WebSocket 消息与 Guacamole 协议指令之间的转换
 *
 * @author CH
 * @since 2024/12/18
 */
@Slf4j
public class GuacamoleProtocolHandler {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 处理鼠标事件
     */
    public static String handleMouseEvent(Map<String, Object> data) {
        try {
            Integer x = (Integer) data.get("x");
            Integer y = (Integer) data.get("y");
            Integer button = (Integer) data.get("button");
            Boolean pressed = (Boolean) data.get("pressed");

            if (x == null || y == null) {
                return null;
            }

            // 构建鼠标按钮掩码
            int mask = 0;
            if (button != null && pressed != null && pressed) {
                switch (button) {
                    case 0: // 左键
                        mask = 1;
                        break;
                    case 1: // 中键
                        mask = 4;
                        break;
                    case 2: // 右键
                        mask = 2;
                        break;
                }
            }

            // 构建 Guacamole 鼠标指令: mouse,x,y,mask;
            return String.format("5.mouse,%d.%d,%d.%d,%d.%d;", x, y, mask);

        } catch (Exception e) {
            log.error("处理鼠标事件失败: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 处理键盘事件
     */
    public static String handleKeyboardEvent(Map<String, Object> data) {
        try {
            Integer keysym = (Integer) data.get("keysym");
            Boolean pressed = (Boolean) data.get("pressed");

            if (keysym == null || pressed == null) {
                return null;
            }

            // 构建 Guacamole 键盘指令: key,keysym,pressed;
            return String.format("3.key,%d.%d,%d.%d;", keysym, pressed ? 1 : 0);

        } catch (Exception e) {
            log.error("处理键盘事件失败: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 处理屏幕调整事件
     */
    public static String handleScreenResize(Map<String, Object> data) {
        try {
            Integer width = (Integer) data.get("width");
            Integer height = (Integer) data.get("height");

            if (width == null || height == null) {
                return null;
            }

            // 构建 Guacamole 屏幕调整指令: size,width,height;
            return String.format("4.size,%d.%d,%d.%d;", width, height);

        } catch (Exception e) {
            log.error("处理屏幕调整事件失败: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 处理剪贴板事件
     */
    public static String handleClipboard(Map<String, Object> data) {
        try {
            String text = (String) data.get("text");
            if (text == null) {
                return null;
            }

            // 构建 Guacamole 剪贴板指令: clipboard,stream,mimetype,data;
            String mimetype = "text/plain";
            return String.format("9.clipboard,%d.stream,%d.%s,%d.%s;", 
                                text.length(), mimetype.length(), mimetype, text.length(), text);

        } catch (Exception e) {
            log.error("处理剪贴板事件失败: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 处理连接请求
     */
    public static String handleConnect(Map<String, Object> data) {
        try {
            // 构建连接参数
            StringBuilder connectParams = new StringBuilder();
            
            // 添加协议参数
            String protocol = (String) data.get("protocol");
            if (protocol != null) {
                connectParams.append("protocol=").append(protocol);
            }

            String host = (String) data.get("host");
            if (host != null) {
                if (connectParams.length() > 0) connectParams.append("&");
                connectParams.append("hostname=").append(host);
            }

            Integer port = (Integer) data.get("port");
            if (port != null) {
                if (connectParams.length() > 0) connectParams.append("&");
                connectParams.append("port=").append(port);
            }

            String username = (String) data.get("username");
            if (username != null) {
                if (connectParams.length() > 0) connectParams.append("&");
                connectParams.append("username=").append(username);
            }

            String password = (String) data.get("password");
            if (password != null) {
                if (connectParams.length() > 0) connectParams.append("&");
                connectParams.append("password=").append(password);
            }

            // 构建 Guacamole 连接指令: connect,params;
            String params = connectParams.toString();
            return String.format("7.connect,%d.%s;", params.length(), params);

        } catch (Exception e) {
            log.error("处理连接请求失败: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 解析 Guacamole 指令
     */
    public static GuacamoleInstruction parseInstruction(String instruction) {
        try {
            if (instruction == null || instruction.isEmpty()) {
                return null;
            }

            // Guacamole 指令格式: length.opcode,length.arg1,length.arg2,...;
            String[] parts = instruction.split(",");
            if (parts.length == 0) {
                return null;
            }

            // 解析操作码
            String firstPart = parts[0];
            int dotIndex = firstPart.indexOf('.');
            if (dotIndex == -1) {
                return null;
            }

            String opcode = firstPart.substring(dotIndex + 1);
            
            // 解析参数
            String[] args = new String[parts.length - 1];
            for (int i = 1; i < parts.length; i++) {
                String part = parts[i];
                int argDotIndex = part.indexOf('.');
                if (argDotIndex != -1) {
                    args[i - 1] = part.substring(argDotIndex + 1);
                } else {
                    args[i - 1] = part;
                }
            }

            return new GuacamoleInstruction(opcode, args);

        } catch (Exception e) {
            log.error("解析 Guacamole 指令失败: instruction={}, error={}", instruction, e.getMessage());
            return null;
        }
    }

    /**
     * 构建错误响应
     */
    public static String buildErrorResponse(String message) {
        return String.format("5.error,%d.%s;", message.length(), message);
    }

    /**
     * 构建成功响应
     */
    public static String buildSuccessResponse(String message) {
        return String.format("7.success,%d.%s;", message.length(), message);
    }

    /**
     * Guacamole 指令对象
     */
    public static class GuacamoleInstruction {
        private final String opcode;
        private final String[] args;

        public GuacamoleInstruction(String opcode, String[] args) {
            this.opcode = opcode;
            this.args = args;
        }

        public String getOpcode() {
            return opcode;
        }

        public String[] getArgs() {
            return args;
        }

        public String getArg(int index) {
            return index < args.length ? args[index] : null;
        }

        @Override
        public String toString() {
            return String.format("GuacamoleInstruction{opcode='%s', args=%s}", 
                               opcode, java.util.Arrays.toString(args));
        }
    }
}
