#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成字体加密字体文件
使用 fonttools 创建自定义字体，将数字和汉字映射到字母位置
"""

import os
import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._c_m_a_p import table__c_m_a_p
import json

# 数字映射：0->a, 1->b, 2->c, ..., 9->j
NUMBER_MAP = {
    '0': 'a', '1': 'b', '2': 'c', '3': 'd', '4': 'e',
    '5': 'f', '6': 'g', '7': 'h', '8': 'i', '9': 'j'
}

# 常用汉字映射（从TypeScript文件读取映射关系）
# 映射到字母k-z, A-Z, 0-9, 符号和Unicode私有区域
COMMON_CHINESE_MAP = {
    # 数字汉字
    '零': 'k', '一': 'l', '二': 'm', '三': 'n', '四': 'o',
    '五': 'p', '六': 'q', '七': 'r', '八': 's', '九': 't',
    '十': 'u', '百': 'v', '千': 'w', '万': 'x', '亿': 'y',
    # 常用汉字
    '的': 'z', '了': 'A', '在': 'B', '是': 'C', '我': 'D',
    '有': 'E', '和': 'F', '就': 'G', '不': 'H', '人': 'I',
    '这': 'J', '中': 'K', '大': 'L', '为': 'M', '上': 'N',
    '个': 'O', '国': 'P', '他': 'Q', '时': 'R', '来': 'S',
    '用': 'T', '们': 'U', '生': 'V', '到': 'W', '作': 'X',
    '地': 'Y', '于': 'Z',
    # 符号映射
    '出': '!', '分': '@', '对': '#', '成': '$', '会': '%',
    '可': '^', '主': '&', '发': '*', '年': '(', '动': ')',
    '同': '-', '工': '_', '也': '=', '能': '+', '下': '[',
    '过': ']', '子': '{', '说': '}', '产': '|', '种': '\\',
    '面': ';', '而': ':', '方': "'", '后': '"', '多': '<',
    '定': '>', '行': ',', '学': '.', '法': '?', '所': '/',
    '民': '`', '得': '~',
    # Unicode私有区域映射
    '电': '\uE000', '力': '\uE001', '里': '\uE002', '如': '\uE003', '水': '\uE004',
    '化': '\uE005', '高': '\uE006', '自': '\uE007', '理': '\uE008', '心': '\uE009',
    '实': '\uE00A', '比': '\uE00B', '量': '\uE00C', '制': '\uE00D', '使': '\uE00E',
    '点': '\uE00F', '业': '\uE010', '体': '\uE011', '集': '\uE012', '号': '\uE013',
    '文': '\uE014', '次': '\uE015', '思': '\uE016', '通': '\uE017', '但': '\uE018',
    '条': '\uE019', '较': '\uE01A', '克': '\uE01B', '又': '\uE01C', '公': '\uE01D',
    '孔': '\uE01E', '领': '\uE01F', '军': '\uE020', '流': '\uE021', '入': '\uE022',
    '接': '\uE023', '席': '\uE024', '位': '\uE025', '情': '\uE026', '运': '\uE027',
    '器': '\uE028', '并': '\uE029', '习': '\uE02A', '原': '\uE02B', '油': '\uE02C',
    '放': '\uE02D', '立': '\uE02E', '题': '\uE02F', '质': '\uE030', '指': '\uE031',
    '建': '\uE032', '区': '\uE033', '验': '\uE034', '活': '\uE035', '众': '\uE036',
    '很': '\uE037', '教': '\uE038', '决': '\uE039', '特': '\uE03A', '此': '\uE03B',
    '常': '\uE03C', '石': '\uE03D', '强': '\uE03E', '极': '\uE03F', '少': '\uE040',
    '根': '\uE041', '共': '\uE042', '直': '\uE043', '团': '\uE044', '统': '\uE045',
    '式': '\uE046', '转': '\uE047', '别': '\uE048', '造': '\uE049', '切': '\uE04A',
    '你': '\uE04B', '取': '\uE04C', '西': '\uE04D', '持': '\uE04E', '总': '\uE04F',
    '料': '\uE050', '连': '\uE051', '任': '\uE052', '志': '\uE053', '观': '\uE054',
    '调': '\uE055', '么': '\uE056', '山': '\uE057', '程': '\uE058', '报': '\uE059',
    '更': '\uE05A', '见': '\uE05B', '必': '\uE05C', '真': '\uE05D', '保': '\uE05E',
    '热': '\uE05F', '委': '\uE060', '手': '\uE061', '改': '\uE062', '管': '\uE063',
    '处': '\uE064', '已': '\uE065', '修': '\uE066', '支': '\uE067', '识': '\uE068',
    '病': '\uE069', '象': '\uE06A', '先': '\uE06B', '老': '\uE06C', '光': '\uE06D',
    '专': '\uE06E', '几': '\uE06F', '什': '\uE070', '型': '\uE071', '具': '\uE072',
    '示': '\uE073', '复': '\uE074', '安': '\uE075', '带': '\uE076', '每': '\uE077',
    '东': '\uE078', '增': '\uE079', '则': '\uE07A', '完': '\uE07B', '风': '\uE07C',
    '回': '\uE07D', '南': '\uE07E', '广': '\uE07F', '劳': '\uE080', '轮': '\uE081',
    '科': '\uE082', '北': '\uE083', '打': '\uE084', '积': '\uE085', '车': '\uE086',
    '计': '\uE087', '给': '\uE088', '节': '\uE089', '做': '\uE08A', '务': '\uE08B',
    '被': '\uE08C', '整': '\uE08D', '联': '\uE08E', '步': '\uE08F', '类': '\uE090',
    '列': '\uE091', '温': '\uE092', '装': '\uE093',
}


def create_font_file(output_path: str):
    """
    创建字体文件
    从系统字体读取字形，然后重新映射到字母位置
    """
    try:
        # 尝试从系统字体读取
        system_fonts = [
            'C:/Windows/Fonts/msyh.ttc',  # Windows 微软雅黑
            'C:/Windows/Fonts/simsun.ttc',  # Windows 宋体
            '/System/Library/Fonts/PingFang.ttc',  # macOS
            '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',  # Linux
        ]
        
        source_font = None
        source_font_path = None
        for font_path in system_fonts:
            if os.path.exists(font_path):
                try:
                    # TTC文件需要指定字体索引
                    if font_path.endswith('.ttc'):
                        fonts = TTFont(font_path, fontNumber=0)
                    else:
                        fonts = TTFont(font_path)
                    
                    # 检查是否有cmap表
                    if 'cmap' in fonts:
                        source_font = fonts
                        source_font_path = font_path
                        print(f"使用系统字体: {font_path}")
                        break
                except Exception as e:
                    print(f"尝试打开字体 {font_path} 失败: {e}")
                    continue
        
        if source_font is None:
            print("错误: 未找到可用的系统字体")
            print("请确保系统安装了中文字体（如微软雅黑、PingFang SC等）")
            return False
        
        # 创建新字体（复制源字体）
        print("正在创建字体文件...")
        new_font = TTFont(source_font_path, fontNumber=0 if source_font_path.endswith('.ttc') else None)
        
        # 获取cmap表
        cmap_table = new_font.getBestCmap()
        if not cmap_table:
            print("错误: 无法获取字体cmap表")
            return False
        
        # 获取glyphSet
        glyph_set = new_font.getGlyphSet()
        
        # 创建新的 cmap（只保留我们需要的映射，减少体积与不确定性）
        new_cmap = {}
        
        # 映射数字：将数字的字形映射到字母位置
        print("正在映射数字...")
        for num, letter in NUMBER_MAP.items():
            num_unicode = ord(num)
            letter_unicode = ord(letter)
            
            if num_unicode in cmap_table:
                # 获取数字的字形名称
                num_glyph_name = cmap_table[num_unicode]
                # 将字母位置映射到数字的字形
                new_cmap[letter_unicode] = num_glyph_name
                print(f"  映射: {num} ({num_unicode:04X}) -> {letter} ({letter_unicode:04X})")
        
        # 映射汉字：将汉字的字形映射到字母/符号位置
        print("正在映射汉字...")
        mapped_count = 0
        for chinese, target_char in COMMON_CHINESE_MAP.items():
            chinese_unicode = ord(chinese)
            target_unicode = ord(target_char)
            
            if chinese_unicode in cmap_table:
                # 获取汉字的字形名称
                chinese_glyph_name = cmap_table[chinese_unicode]
                # 将目标字符位置映射到汉字的字形
                new_cmap[target_unicode] = chinese_glyph_name
                mapped_count += 1
                if mapped_count <= 10:  # 只打印前10个
                    print(f"  映射: {chinese} ({chinese_unicode:04X}) -> {target_char} ({target_unicode:04X})")
        
        print(f"  共映射 {mapped_count} 个汉字")
        
        # 更新 cmap 表：创建单一的 Unicode BMP format 4 子表
        from fontTools.ttLib.tables._c_m_a_p import CmapSubtable
        cmap_subtable = table__c_m_a_p()
        # fontTools 不同版本字段名略有差异，这里两个都设置，避免兼容问题
        cmap_subtable.tableVersion = 0
        cmap_subtable.version = 0

        subtable = CmapSubtable.newSubtable(4)
        subtable.platformID = 3  # Microsoft
        subtable.platEncID = 1   # Unicode BMP
        subtable.language = 0
        subtable.cmap = new_cmap

        cmap_subtable.tables = [subtable]
        new_font["cmap"] = cmap_subtable
        
        # 先保存为 TTF（基础格式）
        ttf_path = output_path.replace(".woff2", ".ttf")
        if os.path.exists(ttf_path):
            os.remove(ttf_path)
        new_font.save(ttf_path)
        print(f"TTF字体文件已生成: {ttf_path}")
        
        # 转换为 WOFF2（如果支持）
        try:
            from fontTools.woff2 import compress
            with open(ttf_path, 'rb') as f:
                ttf_data = f.read()
            woff2_data = compress(ttf_data)
            if os.path.exists(output_path):
                os.remove(output_path)
            with open(output_path, 'wb') as f:
                f.write(woff2_data)
            print(f"WOFF2字体文件已生成: {output_path}")
            # 删除临时TTF文件
            os.remove(ttf_path)
        except ImportError:
            print("提示: 当前环境不支持生成 WOFF2，本次保留 TTF 格式")
            output_path = ttf_path
        except Exception as e:
            print(f"警告: 转换为WOFF2失败: {e}，本次保留 TTF 格式")
            output_path = ttf_path
        
        print(f"字体文件生成完成: {output_path}")
        print(f"文件大小: {os.path.getsize(output_path)} 字节")
        return True
        
    except Exception as e:
        print(f"生成字体文件失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """主函数"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, '../src/assets/fonts')
    os.makedirs(output_dir, exist_ok=True)

    # 是否支持生成 WOFF2（fontTools 需要 woff2 依赖）
    woff2_supported = True
    try:
        from fontTools.woff2 import compress  # noqa: F401
    except Exception:
        woff2_supported = False

    font_ext = "woff2" if woff2_supported else "ttf"
    font_path = os.path.join(output_dir, f"font-encryption.{font_ext}")
    
    print("=" * 60)
    print("字体加密字体文件生成工具")
    print("=" * 60)
    print(f"输出路径: {font_path}")
    print()
    
    # 检查是否安装了 fonttools
    try:
        import fontTools
        print(f"fonttools 版本: {fontTools.__version__}")
    except ImportError:
        print("错误: 未安装 fonttools")
        print("请运行: pip install fonttools")
        sys.exit(1)
    
    # 检查是否安装了 brotli（用于WOFF2）
    try:
        import brotli
        if woff2_supported:
            print("brotli 已安装，将生成 WOFF2 格式")
        else:
            print("brotli 已安装，但 fontTools 缺少 woff2 支持，将生成 TTF 格式")
    except ImportError:
        if woff2_supported:
            print("警告: 未安装 brotli，将生成 TTF 格式")
            print("建议安装: pip install brotli")
            woff2_supported = False
            font_path = os.path.join(output_dir, "font-encryption.ttf")
        else:
            print("警告: 未安装 brotli，将生成 TTF 格式")
    
    print()
    
    # 生成字体文件
    if create_font_file(font_path):
        print()
        print("=" * 60)
        print("字体文件生成成功！")
        print("=" * 60)
        sys.exit(0)
    else:
        print()
        print("=" * 60)
        print("字体文件生成失败")
        print("=" * 60)
        sys.exit(1)


if __name__ == '__main__':
    main()
