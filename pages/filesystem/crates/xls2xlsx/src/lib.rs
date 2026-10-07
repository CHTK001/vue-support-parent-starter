//! BIFF(.xls) → OOXML(.xlsx) 转换器（浏览器内 wasm）
//!
//! 存在的理由只有一个：**让 `.xls` 和 `.xlsx` 预览长得一模一样。**
//!
//! 前端只有 `@vue-office/excel` 一套表格渲染 UI（sheet 页签、冻结窗格、选区、
//! 主题跟随）。若 `.xls` 另起炉灶自己画一个表格，就要把这套交互重做一遍，而且必然
//! 越做越不像。所以这里把 `.xls` 转成合法 xlsx 字节，再交同一个组件渲染——
//! 组件那边一行都不用改，交互自动一致。
//!
//! ## 读写的分工
//!
//! - [`calamine`] 读 BIFF5/BIFF8（`.xls`），纯 Rust、无 C 依赖，天生适合 wasm。
//! - [`rust_xlsxwriter`] 写 xlsx 到 `Vec<u8>`，同样是纯 Rust。
//!
//! 入口必须是 `open_workbook_auto_from_rs`：wasm 里没有 `std::fs`，`open_workbook_auto`
//! 那条按路径打开的 API 用不了，只能从内存字节读。
//!
//! ## 保真度边界（务必如实告知用户）
//!
//! calamine 是**只读值**的库，官方明确不支持读取 formatting。所以本转换器产出的是
//! 「只有值和类型」的 xlsx：
//!
//! - **会丢**：单元格样式（字体/填充/边框/对齐）、列宽行高、合并单元格、
//!   条件格式、图表、图片、批注、宏。
//! - **会丢**：BIFF 公式。`worksheet_formula()` 在 `Reader` trait 里有，但 `Xls`
//!   的实现能否取到 BIFF 公式未经验证，代码按「取不到」设计。
//! - **能救回来一点**：类型。calamine 给的是 `Data::DateTime` 而不是 Excel 序列号，
//!   所以能重新挂一个日期数字格式，不至于显示成 42145。
//!
//! 换句话说：数据对、UI 与交互完全一致，**像素级样式不保**。这是选 calamine 的
//! 必然结果而非实现缺陷——换成 rust_xlsxwriter 写也一样，它没东西可写。
//!
//! ## 体积上限
//!
//! 20MB。两个原因：
//!
//! 1. wasm 内存线性增长，而 `rust_xlsxwriter` 的 `constant_memory` / `low_memory`
//!    模式依赖 tempfile，wasm 里没有文件系统用不了，只能 standard 模式整份常驻。
//! 2. calamine 读 `.xls` 无法惰性加载（`Xls` 在 `open` 时一次载入全部 sheet，
//!    只有 xlsx/xlsb 才有 lazy loading），大文件会一次性吃满内存。
//!
//! 另有实测参考：calamine 读 60MB xls 原生 9.1s、wasm 33.5s（issue #268）。
//! 预览场景卡在 20MB 内没有这个问题，超出直接引导下载比转圈到天荒地老好。

use calamine::{open_workbook_auto_from_rs, Data, Reader};
use rust_xlsxwriter::{Format, Workbook};
use std::io::Cursor;
use wasm_bindgen::prelude::*;

/// 在线预览体积上限（字节）。超出的文件请用户下载后用本地软件打开。
const MAX_BYTES: usize = 20 * 1024 * 1024;

/// 单元格数量上限（行 × 列，按 range 面积估算）。
///
/// 恶意 / 损坏文件可以在 BIFF 头里声明极大的 `!ref` 而几乎不占字节，
/// 展开就是一个几 GB 的循环。这里先卡住，不给「打开一个 Excel 就吃掉标签页」的机会。
const MAX_CELLS: u64 = 4_000_000;

/// 字节数可读化（错误文案用）。
fn human(bytes: usize) -> String {
    const MB: f64 = 1024.0 * 1024.0;
    let m = bytes as f64 / MB;
    if m >= 1024.0 {
        format!("{:.2} GB", m / 1024.0)
    } else {
        format!("{:.1} MB", m)
    }
}

/// 把 BIFF(.xls) 转成 xlsx 字节。
///
/// # Errors
///
/// 返回可读的中文错误文案：体积超限、无法识别容器、工作表读取失败、
/// 或转换器自身出错。调用方（前端面板）直接把它展示给用户即可。
#[wasm_bindgen]
pub fn xls_to_xlsx(bytes: &[u8]) -> Result<Vec<u8>, String> {
    if bytes.len() > MAX_BYTES {
        return Err(format!(
            "文件过大（{}），超过在线预览上限 {}，请下载后用本地软件打开",
            human(bytes.len()),
            human(MAX_BYTES)
        ));
    }
    if bytes.is_empty() {
        return Err("文件为空".to_string());
    }

    // 1) 打开工作簿。Cursor 持有 Vec<u8>，calamine 要求 Read + Seek + Clone
    let mut src = open_workbook_auto_from_rs(Cursor::new(bytes.to_vec()))
        .map_err(|e| format!("无法解析该 XLS 文件：{e}"))?;

    let names: Vec<String> = src.sheet_names().to_vec();
    if names.is_empty() {
        return Err("该文件不含任何工作表".to_string());
    }

    // 2) 新建 xlsx
    let mut dst = Workbook::new();
    // 日期/时间的数字格式：calamine 已把 1900 日期制（含闰年 bug）换算成真实日期，
    // 这里补一个格式，否则 xlsx 里存的是序列号，表格里会显示 42145 这种数字。
    // rust_xlsxwriter 0.99 的 API 是 `Format::new()` + `Workbook::register_format`，
    // 没有旧版的 `Workbook::add_format`。
    let date_fmt = Format::new().set_num_format("yyyy-mm-dd");
    let datetime_fmt = Format::new().set_num_format("yyyy-mm-dd hh:mm:ss");
    dst.register_format(&date_fmt);
    dst.register_format(&datetime_fmt);

    for name in &names {
        let range = src
            .worksheet_range(name)
            .map_err(|e| format!("工作表「{name}」读取失败：{e}"))?;

        // range 的宽高来自文件头声明，先按面积卡一道，避免展开超大空白区域
        let area = range.width() as u64 * range.height() as u64;
        if area > MAX_CELLS {
            return Err(format!(
                "工作表「{name}」声明的尺寸过大（约 {} 万单元格），超过在线预览上限 {} 万，请下载后用本地软件打开",
                area / 10_000,
                MAX_CELLS / 10_000
            ));
        }

        // 0.99 的 add_worksheet() 不收名字，先建再 set_name
        let ws = dst.add_worksheet();
        ws.set_name(name.as_str())
            .map_err(|e| format!("创建工作表「{name}」失败：{e}"))?;

        for (ri, row) in range.rows().enumerate() {
            let r = ri as u32;
            for (ci, cell) in row.iter().enumerate() {
                let c = ci as u16;
                match cell {
                    Data::Empty => {}
                    Data::String(s) => {
                        ws.write_string(r, c, s)
                            .map_err(|e| format!("写入失败：{e}"))?;
                    }
                    Data::Int(i) => {
                        ws.write_number(r, c, *i as f64)
                            .map_err(|e| format!("写入失败：{e}"))?;
                    }
                    Data::Float(f) => {
                        ws.write_number(r, c, *f)
                            .map_err(|e| format!("写入失败：{e}"))?;
                    }
                    Data::Bool(b) => {
                        ws.write_boolean(r, c, *b)
                            .map_err(|e| format!("写入失败：{e}"))?;
                    }
                    Data::DateTime(dt) => {
                        // 1900 日期制（含那个闰年 bug）：calamine 的 as_datetime()
                        // 已把序列号换算成真实日期，直接带数字格式写回去即可。
                        // 换不来（超出 chrono 支持范围等）时退回裸序列号，
                        // 至少数字与原文件一致，不会凭空丢数据。
                        match dt.as_datetime() {
                            Some(ndt) if dt.is_datetime() => {
                                ws.write_datetime_with_format(r, c, ndt, &datetime_fmt)
                                    .map_err(|e| format!("写入日期失败：{e}"))?;
                            }
                            Some(ndt) => {
                                ws.write_datetime_with_format(r, c, ndt, &date_fmt)
                                    .map_err(|e| format!("写入日期失败：{e}"))?;
                            }
                            None => {
                                ws.write_number(r, c, dt.as_f64())
                                    .map_err(|e| format!("写入失败：{e}"))?;
                            }
                        }
                    }
                    // 错误值 / 空桩：按显示文本落一个字符串，别让渲染器拿到裸错误码
                    other => {
                        ws.write_string(r, c, &other.to_string())
                            .map_err(|e| format!("写入失败：{e}"))?;
                    }
                }
            }
        }
        }

    // 3) 序列化成 xlsx 字节
    dst.save_to_buffer()
        .map_err(|e| format!("生成 XLSX 失败：{e}"))
}