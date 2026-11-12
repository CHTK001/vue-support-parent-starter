/*
 * 终端内搜索（Ctrl+F）—— 手写实现，不依赖 xterm 的 search addon。
 *
 * 为什么不引 addon：public/term 下只有 xterm.js 与 addon-fit.js，没有
 * addon-search 的构建产物；要引就得先 vendored 一份，留到「换 addon」那一轮一起做。
 *
 * 用法（ssh-direct.html / telnet-direct.html 相同）：
 *   <link rel="stylesheet" href="/term/terminal-search.css" />
 *   <script src="/term/terminal-search.js"></script>
 *   ... 建好 term 之后：
 *   TerminalSearch.attach(term);          // hostId 默认 'term'
 *
 * 行为：Ctrl+F 打开（终端内与终端外都接管），Enter 下一个、Shift+Enter 上一个、
 * Esc 关闭；命中后滚到那一行并选中关键字。选区按**单元格列**算而不是字符串下标，
 * 中文/emoji 行才不会偏。
 */
(function () {
  'use strict';

  var BAR_HTML =
    '<input id="find-input" type="text" placeholder="在回滚缓冲里搜索" spellcheck="false" />' +
    '<span id="find-count"></span>' +
    '<button id="find-prev" type="button" title="上一个（Shift+Enter）">↑</button>' +
    '<button id="find-next" type="button" title="下一个（Enter）">↓</button>' +
    '<button id="find-close" type="button" title="关闭（Esc）">×</button>';

  /**
   * 按行扫回滚缓冲收集命中（同一行多处命中都算）。
   *
   * 返回的 col/len 是单元格列：translateToString 对宽字符每两个单元格只产出一个
   * 字符，emoji 还可能占两个 UTF-16 码元，直接拿 indexOf 的结果去 select，中文行的
   * 选区会偏左、长度偏短。
   */
  function collectHits(term, needle) {
    var hits = [];
    var lower = needle.toLowerCase();
    var buf = term.buffer.active;
    for (var y = 0; y < buf.length; y++) {
      var line = buf.getLine(y);
      if (!line) continue;
      var text = line.translateToString(true);
      if (!text) continue;
      var lowerText = text.toLowerCase();
      /* 大小写转换可能改变长度（土耳其 İ、德语 ß）：那种情况下标与 cellAt 对不上，
         退化成区分大小写搜索，保证选区位置仍准确 */
      var sameLen = lowerText.length === text.length;
      var haystack = sameLen ? lowerText : text;
      var needleText = sameLen ? lower : needle;
      var from = haystack.indexOf(needleText);
      if (from < 0) continue;
      /* 只为确实有命中的行建「字符串下标 → 单元格列」映射，没命中的行不多走一遍 */
      var cellAt = [];
      var strIdx = 0;
      for (var x = 0; x < line.length; x++) {
        var cell = line.getCell(x);
        var chars = cell ? cell.getChars() : '';
        if (!chars) continue;                 /* 宽字符尾部占位格没有字符 */
        for (var k = 0; k < chars.length; k++) cellAt[strIdx + k] = x;
        strIdx += chars.length;
      }
      while (from >= 0) {
        var head = cellAt[from];
        var tail = cellAt[from + needleText.length - 1];
        if (head === undefined) {
          from = haystack.indexOf(needleText, from + 1);
          continue;
        }
        if (tail === undefined) tail = head;
        hits.push({ row: y, col: head, len: tail - head + 1 });
        from = haystack.indexOf(needleText, from + needleText.length);
      }
    }
    return hits;
  }

  /**
   * 把搜索条挂到某个终端上。
   *
   * @param term   已 open 的 xterm 实例
   * @param hostId 终端容器元素 id，用来判断焦点是否在终端里（默认 'term'）
   */
  function attach(term, hostId) {
    var host = document.getElementById(hostId || 'term');
    var bar = document.createElement('div');
    bar.id = 'find';
    bar.className = 'hide';
    bar.innerHTML = BAR_HTML;
    document.body.appendChild(bar);

    var input = bar.querySelector('#find-input');
    var count = bar.querySelector('#find-count');
    var hits = [];
    var index = -1;

    function showHit() {
      if (!hits.length) {
        count.textContent = '0/0';
        return;
      }
      var hit = hits[index];
      count.textContent = (index + 1) + '/' + hits.length;
      try {
        term.scrollToLine(hit.row);
        var top = term.buffer.active.viewportY;
        term.select(hit.col, Math.max(0, hit.row - top), hit.len);
      } catch (err) {
        /* 老版本 xterm 没有 select：滚到位置也算达成 */
      }
    }

    function step(delta) {
      var needle = input.value;
      if (!needle) {
        hits = [];
        index = -1;
        count.textContent = '';
        return;
      }
      hits = collectHits(term, needle);
      if (!hits.length) {
        index = -1;
        count.textContent = '0/0';
        return;
      }
      if (index < 0 || index >= hits.length) {
        index = delta > 0 ? 0 : hits.length - 1;
      } else {
        index = (index + delta + hits.length) % hits.length;
      }
      showHit();
    }

    function open() {
      bar.className = '';
      hits = [];
      index = -1;
      count.textContent = '';
      input.focus();
      input.select();
      if (input.value) step(1);
    }

    function close() {
      bar.className = 'hide';
      hits = [];
      index = -1;
      count.textContent = '';
      /* 关键词留着：再按 Ctrl+F 直接回车就能接着找，和浏览器查找一致 */
      term.focus();
    }

    input.addEventListener('input', function () {
      index = -1;
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        step(e.shiftKey ? -1 : 1);
      }
    });
    bar.querySelector('#find-prev').addEventListener('click', function () {
      step(-1);
    });
    bar.querySelector('#find-next').addEventListener('click', function () {
      step(1);
    });
    bar.querySelector('#find-close').addEventListener('click', function () {
      close();
    });

    /* Ctrl+F / Cmd+F 归页面所有，不再把 ^F 发给远端 shell */
    term.attachCustomKeyEventHandler(function (e) {
      if (e.type !== 'keydown' || e.altKey) return true;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        open();
        return false;
      }
      return true;
    });

    /* 焦点不在终端里时按 Ctrl+F：浏览器会弹自己的查找框，而它搜的是 DOM，
       终端内容一个字都搜不到。捕获阶段先接管；终端内部交给 xterm 的 key handler。 */
    document.addEventListener(
      'keydown',
      function (e) {
        if (e.altKey || e.shiftKey) return;
        if (!(e.ctrlKey || e.metaKey) || (e.key !== 'f' && e.key !== 'F')) return;
        if (host && e.target && host.contains(e.target)) return;
        e.preventDefault();
        open();
      },
      true
    );
  }

  window.TerminalSearch = { attach: attach };
})();
