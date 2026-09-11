/**
 * urlSelector 鍗曞厓楠岃瘉锛圢ode 鐩存帴杩愯锛岄浂渚濊禆锛? * 杩愯锛歯ode --experimental-strip-types ./urlSelector.test.ts
 */
import { createUrlSelector } from "./urlSelector.ts";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) { passed++; console.log(`ok - ${name}`); }
  else { failed++; console.error(`FAIL - ${name}`, extra ?? ""); }
}

// 1) 绌哄湴鍧€杩斿洖 null
check("绌哄湴鍧€杩斿洖null", createUrlSelector({ urls: [] }).next() === null);

// 2) 鍗曞湴鍧€杞
{
  const s = createUrlSelector({ urls: ["http://a"] });
  check("鍗曞湴鍧€杩斿洖", s.next() === "http://a" && s.next() === "http://a");
}

// 3) 澶氬湴鍧€ round-robin 杞崲
{
  const s = createUrlSelector({ urls: ["http://a", "http://b", "http://c"] });
  const seq = [s.next(), s.next(), s.next(), s.next()];
  check("杞椤哄簭abc鍐峚", JSON.stringify(seq) === JSON.stringify(["http://a","http://b","http://c","http://a"]), seq);
}

// 4) 澶辫触鍦板潃杩涢粦鍚嶅崟锛屽悗缁璺宠繃
{
  const s = createUrlSelector({ urls: ["http://a", "http://b", "http://c"], blacklistTtlMs: 60000 });
  s.next(); // a
  s.markFailure("http://b");
  const n1 = s.next(); // 搴旇烦杩?b -> c
  const n2 = s.next(); // c -> a锛堣疆鎹級
  check("澶辫触鍦板潃琚烦杩?, n1 === "http://c" && n2 === "http://a", [n1, n2]);
  check("鍙敤鏁?2", s.availableCount() === 2);
}

// 5) 杩炴帴鎴愬姛娓呴櫎榛戝悕鍗?{
  const s = createUrlSelector({ urls: ["http://a", "http://b"], blacklistTtlMs: 60000 });
  s.markFailure("http://b");
  check("榛戝悕鍗曞悗鍙墿1鍙敤", s.availableCount() === 1);
  s.markSuccess("http://b");
  check("鎴愬姛鍚庢仮澶?鍙敤", s.availableCount() === 2);
}

// 6) 榛戝悕鍗?TTL 鍒版湡鑷姩鎭㈠锛堢敤鐭?TTL锛?{
  const s = createUrlSelector({ urls: ["http://a", "http://b"], blacklistTtlMs: 30 });
  s.markFailure("http://b");
  check("绔嬪嵆璺宠繃", s.next() === "http://a" || s.availableCount() === 1);
  await new Promise(r => setTimeout(r, 60));
  check("TTL鍒版湡鎭㈠", s.availableCount() === 2, s.availableCount());
}

// 7) 鍏ㄩ儴榛戝悕鍗曟椂閲嶇疆绔嬪嵆閲嶈瘯
{
  const s = createUrlSelector({ urls: ["http://a", "http://b"], blacklistTtlMs: 60000 });
  s.markFailure("http://a");
  s.markFailure("http://b");
  const n = s.next();
  check("鍏ㄩ粦鍚嶅崟閲嶇疆鍚庤兘杩斿洖鍦板潃", n === "http://a" || n === "http://b", n);
  check("閲嶇疆鍚庡彲鐢ㄦ暟=2", s.availableCount() === 2);
}

// 8) reset 娓呴櫎榛戝悕鍗?{
  const s = createUrlSelector({ urls: ["http://a"], blacklistTtlMs: 60000 });
  s.markFailure("http://a");
  check("榛戝悕鍗曞悗0鍙敤", s.availableCount() === 0);
  s.reset();
  check("reset鍚庢仮澶?, s.availableCount() === 1);
}

console.log(`\n閫氳繃 ${passed} 椤癸紝澶辫触 ${failed} 椤筦);
process.exit(failed === 0 ? 0 : 1);
