package com.chua.starter.monitor.utils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 表格打印工具类 - 修复表头对齐问题
 * 
 * @author CH
 * @since 2024/12/18
 */
public class TablePrinter {
    
    private final List<String> headers;
    private final List<List<String>> rows;
    private final Map<Integer, Integer> columnWidths;
    private String borderChar = "-";
    private String separatorChar = "|";
    private String paddingChar = " ";
    private boolean showBorder = true;
    private boolean showHeader = true;
    private TextAlign defaultAlign = TextAlign.LEFT;
    private final Map<Integer, TextAlign> columnAligns;
    
    /**
     * 文本对齐方式
     */
    public enum TextAlign {
        LEFT, CENTER, RIGHT
    }
    
    public TablePrinter() {
        this.headers = new ArrayList<>();
        this.rows = new ArrayList<>();
        this.columnWidths = new HashMap<>();
        this.columnAligns = new HashMap<>();
    }
    
    public TablePrinter(List<String> headers) {
        this();
        this.headers.addAll(headers);
        calculateColumnWidths();
    }
    
    /**
     * 设置表头
     */
    public TablePrinter setHeaders(List<String> headers) {
        this.headers.clear();
        this.headers.addAll(headers);
        calculateColumnWidths();
        return this;
    }
    
    /**
     * 添加行数据
     */
    public TablePrinter addRow(List<String> row) {
        if (row.size() != headers.size()) {
            throw new IllegalArgumentException("行数据列数与表头不匹配");
        }
        rows.add(new ArrayList<>(row));
        calculateColumnWidths();
        return this;
    }
    
    /**
     * 添加行数据（可变参数）
     */
    public TablePrinter addRow(String... row) {
        return addRow(Arrays.asList(row));
    }
    
    /**
     * 设置列对齐方式
     */
    public TablePrinter setColumnAlign(int columnIndex, TextAlign align) {
        columnAligns.put(columnIndex, align);
        return this;
    }
    
    /**
     * 设置默认对齐方式
     */
    public TablePrinter setDefaultAlign(TextAlign align) {
        this.defaultAlign = align;
        return this;
    }
    
    /**
     * 设置边框字符
     */
    public TablePrinter setBorderChar(String borderChar) {
        this.borderChar = borderChar;
        return this;
    }
    
    /**
     * 设置分隔符
     */
    public TablePrinter setSeparatorChar(String separatorChar) {
        this.separatorChar = separatorChar;
        return this;
    }
    
    /**
     * 设置是否显示边框
     */
    public TablePrinter setShowBorder(boolean showBorder) {
        this.showBorder = showBorder;
        return this;
    }
    
    /**
     * 设置是否显示表头
     */
    public TablePrinter setShowHeader(boolean showHeader) {
        this.showHeader = showHeader;
        return this;
    }
    
    /**
     * 计算列宽度
     */
    private void calculateColumnWidths() {
        // 初始化列宽度为表头宽度
        for (int i = 0; i < headers.size(); i++) {
            String header = headers.get(i);
            int width = getDisplayWidth(header);
            columnWidths.put(i, width);
        }
        
        // 检查每行数据，更新最大宽度
        for (List<String> row : rows) {
            for (int i = 0; i < row.size() && i < headers.size(); i++) {
                String cell = row.get(i);
                int width = getDisplayWidth(cell);
                columnWidths.put(i, Math.max(columnWidths.getOrDefault(i, 0), width));
            }
        }
        
        // 确保最小宽度为3（用于显示对齐）
        for (int i = 0; i < headers.size(); i++) {
            columnWidths.put(i, Math.max(columnWidths.getOrDefault(i, 0), 3));
        }
    }
    
    /**
     * 获取字符串显示宽度（考虑中文字符）
     */
    private int getDisplayWidth(String text) {
        if (text == null) {
            return 0;
        }
        
        int width = 0;
        for (char c : text.toCharArray()) {
            // 中文字符宽度为2，英文字符宽度为1
            if (isChinese(c)) {
                width += 2;
            } else {
                width += 1;
            }
        }
        return width;
    }
    
    /**
     * 判断是否为中文字符
     */
    private boolean isChinese(char c) {
        return c >= 0x4E00 && c <= 0x9FFF;
    }
    
    /**
     * 格式化单元格内容
     */
    private String formatCell(String content, int columnIndex) {
        if (content == null) {
            content = "";
        }
        
        int targetWidth = columnWidths.get(columnIndex);
        int contentWidth = getDisplayWidth(content);
        
        if (contentWidth >= targetWidth) {
            return content;
        }
        
        int paddingNeeded = targetWidth - contentWidth;
        TextAlign align = columnAligns.getOrDefault(columnIndex, defaultAlign);
        
        switch (align) {
            case CENTER:
                int leftPadding = paddingNeeded / 2;
                int rightPadding = paddingNeeded - leftPadding;
                return repeat(paddingChar, leftPadding) + content + repeat(paddingChar, rightPadding);
            case RIGHT:
                return repeat(paddingChar, paddingNeeded) + content;
            case LEFT:
            default:
                return content + repeat(paddingChar, paddingNeeded);
        }
    }
    
    /**
     * 重复字符
     */
    private String repeat(String str, int count) {
        if (count <= 0) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < count; i++) {
            sb.append(str);
        }
        return sb.toString();
    }
    
    /**
     * 生成分隔线
     */
    private String generateSeparatorLine() {
        if (!showBorder) {
            return "";
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append(separatorChar);
        
        for (int i = 0; i < headers.size(); i++) {
            int width = columnWidths.get(i);
            sb.append(repeat(borderChar, width));
            if (i < headers.size() - 1) {
                sb.append(separatorChar);
            }
        }
        
        sb.append(separatorChar);
        return sb.toString();
    }
    
    /**
     * 生成表格行
     */
    private String generateRow(List<String> rowData) {
        StringBuilder sb = new StringBuilder();
        
        if (showBorder) {
            sb.append(separatorChar);
        }
        
        for (int i = 0; i < rowData.size(); i++) {
            String formattedCell = formatCell(rowData.get(i), i);
            sb.append(formattedCell);
            
            if (showBorder && i < rowData.size() - 1) {
                sb.append(separatorChar);
            }
        }
        
        if (showBorder) {
            sb.append(separatorChar);
        }
        
        return sb.toString();
    }
    
    /**
     * 打印表格
     */
    public String print() {
        if (headers.isEmpty()) {
            return "";
        }
        
        StringBuilder result = new StringBuilder();
        
        // 顶部边框
        if (showBorder) {
            result.append(generateSeparatorLine()).append("\n");
        }
        
        // 表头
        if (showHeader) {
            result.append(generateRow(headers)).append("\n");
            
            // 表头分隔线
            if (showBorder) {
                result.append(generateSeparatorLine()).append("\n");
            }
        }
        
        // 数据行
        for (List<String> row : rows) {
            result.append(generateRow(row)).append("\n");
        }
        
        // 底部边框
        if (showBorder) {
            result.append(generateSeparatorLine()).append("\n");
        }
        
        return result.toString();
    }
    
    /**
     * 打印到控制台
     */
    public void printToConsole() {
        System.out.print(print());
    }
    
    /**
     * 清空数据
     */
    public TablePrinter clear() {
        rows.clear();
        return this;
    }
    
    /**
     * 获取行数
     */
    public int getRowCount() {
        return rows.size();
    }
    
    /**
     * 获取列数
     */
    public int getColumnCount() {
        return headers.size();
    }
    
    /**
     * 创建简单表格的静态方法
     */
    public static TablePrinter create(String... headers) {
        return new TablePrinter(Arrays.asList(headers));
    }
    
    /**
     * 创建带数据的表格
     */
    public static TablePrinter createWithData(List<String> headers, List<List<String>> data) {
        TablePrinter printer = new TablePrinter(headers);
        for (List<String> row : data) {
            printer.addRow(row);
        }
        return printer;
    }
}
