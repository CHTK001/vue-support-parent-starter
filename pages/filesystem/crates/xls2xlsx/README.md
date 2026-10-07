# xls2xlsx — 浏览器内 XLS → XLSX 转换器（WASM）

`.xls` 是 BIFF（二进制复合文档），前端唯一能渲染表格的 `@vue-office/excel`
走 ZIP/OOXML 解包，直接喂 `.xls` 会抛
`Can't find end of central directory`。这个 crate 把 `.xls` 转成合法
`.xlsx` 字节再交给同一个组件，于是 **xls 与 xlsx 共用同一套 UI 与交互**
（sheet 页签、冻结窗格、选区、主题跟随）。

实现：`calamine` 读 BIFF5/BIFF8，`rust_xlsxwriter` 写 xlsx，
两者都是纯 Rust、无 C 依赖，适合 wasm。

## 保真度边界（务必如实告知用户）

calamine 是**只读值**的库，官方明确不支持读取 formatting。产出的是
「只有值和类型」的 xlsx：

- **会丢**：单元格样式（字体/填充/边框/对齐）、列宽行高、合并单元格、
  条件格式、图表、图片、批注、宏。
- **会丢**：BIFF 公式（`worksheet_formula()` 对 `Xls` 的实现未经验证，
  代码按「取不到」设计）。
- **能救回一点**：类型。日期以 `Data::DateTime` 给出而非序列号，
  会补一个日期数字格式，不至于显示成 `42145`。

数据一致、UI 一致，**像素级样式不保**。这是选 calamine 的必然结果而非
实现缺陷 —— 换成 rust_xlsxwriter 写也一样，它没东西可写。

## 体积上限 20MB

wasm 内存线性增长，而 `rust_xlsxwriter` 的 `constant_memory` /
`low_memory` 模式依赖 tempfile，浏览器里用不了，只能 standard 模式整份常驻；
且 calamine 读 `Xls` 无法惰性加载（打开时一次载入全部 sheet）。

参考实测：calamine 读 60MB xls 原生 9.1s、wasm 33.5s（issue #268）。

## 构建

前置：`rustup target add wasm32-unknown-unknown`，且
`wasm-bindgen` CLI 版本必须与依赖的 crate 版本**完全一致**
（schema version 不匹配会直接报 `linked against version of wasm-bindgen
that uses a different bindgen format`）。当前锁定 0.2.129：

```bash
rustup target add wasm32-unknown-unknown
cargo install -f wasm-bindgen-cli --version 0.2.129

cargo build --release --target wasm32-unknown-unknown
wasm-bindgen --target web \
  --out-dir ../../src/wasm/xls2xlsx \
  --out-name xls2xlsx \
  target/wasm32-unknown-unknown/release/xls2xlsx.wasm
```

产物 `src/wasm/xls2xlsx/` **随包提交**（前端用 `?url` 打成同源静态资源），
避免公网 CDN。前端加载层见 `src/utils/xls2xlsx.ts`。

改 Rust 代码后必须重新执行上述两步，产物要与源码同步提交。

## 踩过的坑

1. **`rust_xlsxwriter` 的 `wasm` feature 不能省。** `Workbook::new()`
   会给 `docProps/core.xml` 写 `dcterms:created`，默认实现走
   `SystemTime::now()` —— wasm32-unknown-unknown 没有系统时钟，那一行直接
   panic（`RuntimeError: unreachable`，整个模块不可用）。开了 `wasm`
   feature 后改用 `js_sys::Date::now()`。见 `datetime.rs::system_now`
   的两套 `cfg` 实现。
2. **`Format::new()` + `Workbook::register_format()`**，0.99 已没有
   `Workbook::add_format()`。
3. **`add_worksheet()` 不收参数**，建完再 `set_name()`。
4. 不要开 `panic = "abort"`：panic 会 abort 整个 wasm 模块，
   拿不到错误文案，前端只会看到一个无信息的 `unreachable`。