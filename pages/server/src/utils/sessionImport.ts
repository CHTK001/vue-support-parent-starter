/**
 * 客户端 SSH 会话文件解析（OpenSSH config / PuTTY .reg / 便携版 .ini / Xshell .xsh）。
 *
 * <p>放在 utils 而不是弹窗里，有两个原因：</p>
 * <ul>
 *   <li>解析规则是这个功能里最容易出错、也最值得单测的部分，抽出来才能不启动浏览器验证；</li>
 *   <li>各客户端的文件格式差异大（编码、节名、键名、口令是否加密），集中在纯函数里比较好维护。</li>
 * </ul>
 *
 * <p><b>口令边界</b>：只有能拿到明文的才填 {@code password}。PuTTY 的 {@code Password} 是它自己
 * 加密的 base64、Xshell 的 {@code Password} 同理，一律只标记 {@code passwordLocked}，
 * 绝不把密文当成口令写进主机账号。</p>
 *
 * @author CH
 * @since 4.0.0.54
 */

/** 会话来源 */
export type SessionSource = "openssh" | "putty" | "xshell" | "plink" | "text";

/** 来源展示名 */
export const SOURCE_LABEL: Record<SessionSource, string> = {
  openssh: "OpenSSH config",
  putty: "PuTTY / plink",
  xshell: "Xshell",
  plink: "plink 命令",
  text: "文本片段",
};

/** 一条客户端会话（还没和主机匹配） */
export interface ParsedSession {
  /** 会话名 / 主机别名 */
  name: string;
  source: SessionSource;
  address: string;
  port: number;
  username: string;
  /** 明文口令，没有就是空串 */
  password: string;
  /** 客户端自己加密了口令，只能提示手动补 */
  passwordLocked: boolean;
  /** 解析阶段就发现的问题（例如非 SSH 协议） */
  note: string;
  /** 是否建议导入（解析阶段的初值，匹配主机后还会调整） */
  include: boolean;
}

/** 匹配需要的主机字段 */
export interface ImportHost {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostPort: number;
  serverHostPublicIp?: string | null;
  serverHostPrivateIp?: string | null;
}

/**
 * 把文件字节解成文本：识别 UTF-8 / UTF-16(LE/BE)。
 *
 * <p>Xshell 的 {@code .xsh} 默认存成 UTF-16LE，Windows 导出的 {@code .reg} 常见 UTF-16LE + BOM；
 * 用 {@code file.text()} 直接读会得到一串带 {@code \0} 的乱码，节名一个都匹配不上。</p>
 *
 * @param buf 文件内容
 * @returns 文本
 */
export function decodeSessionText(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buf);
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buf);
  }
  // 没有 BOM 时用「偶数位大量 0x00」判断 UTF-16LE（ASCII 文本才会这样）
  let zero = 0;
  const probe = Math.min(bytes.length, 512);
  for (let i = 1; i < probe; i += 2) {
    if (bytes[i] === 0) zero++;
  }
  if (probe > 8 && zero > probe / 6) {
    return new TextDecoder("utf-16le").decode(buf);
  }
  return new TextDecoder("utf-8").decode(buf);
}

/** 去掉两端引号 */
function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
  return v;
}

/** 把端口文本转成数字，非法回落 22 */
function toPort(value: string | undefined): number {
  const n = Number((value ?? "").trim());
  return Number.isFinite(n) && n > 0 && n < 65536 ? Math.trunc(n) : 22;
}

/**
 * 解析 OpenSSH 客户端 config（Host 块）。
 *
 * @param text 文本
 * @returns 会话列表
 */
export function parseOpenSsh(text: string): ParsedSession[] {
  const out: ParsedSession[] = [];
  let cur: ParsedSession | null = null;
  const flush = (): void => {
    if (cur && cur.address) out.push(cur);
    cur = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^([A-Za-z]+)[\s=]+(.+)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = unquote(m[2]);
    if (key === "host") {
      flush();
      // 一个 Host 行可以带多个别名，取第一个当成这台主机的名字
      const alias = val.split(/\s+/)[0] ?? "";
      // 通配块（Host *）是模板而不是可登录会话
      if (!alias || alias.includes("*") || alias.includes("?")) continue;
      cur = {
        name: alias, source: "openssh", address: "", port: 22, username: "",
        password: "", passwordLocked: false, note: "", include: true,
      };
      continue;
    }
    if (!cur) continue;
    if (key === "hostname") cur.address = val;
    else if (key === "port") cur.port = toPort(val);
    else if (key === "user") cur.username = val;
  }
  flush();
  return out;
}

/**
 * 解析 PuTTY / plink 的注册表导出（{@code .reg}）。
 *
 * @param text 文本
 * @returns 会话列表
 */
export function parsePuttyReg(text: string): ParsedSession[] {
  const out: ParsedSession[] = [];
  let cur: ParsedSession | null = null;
  const section = /^\[HKEY_CURRENT_USER\\Software\\SimonTatham\\PuTTY\\Sessions\\(.+)]/i;
  const flush = (): void => {
    if (cur && cur.address) out.push(cur);
    cur = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const sec = section.exec(line);
    if (sec) {
      flush();
      const rawName = sec[1].split("\\").pop() ?? "";
      // 导出时会话名会被百分号转义，需要还原成可读名称
      let name = rawName;
      try {
        name = decodeURIComponent(rawName);
      } catch {
        name = rawName.replace(/%([0-9A-Fa-f]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
      }
      if (!name || /^Default Settings$/i.test(name)) continue;
      cur = {
        name, source: "putty", address: "", port: 22, username: "",
        password: "", passwordLocked: false, note: "", include: true,
      };
      continue;
    }
    if (!cur) continue;
    const kv = /^"([^"]+)"=(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const val = unquote(kv[2]);
    if (key === "hostname") cur.address = val;
    else if (key === "username") cur.username = val;
    else if (key === "portnumber") {
      const hex = /^dword:([0-9a-f]+)$/i.exec(val);
      cur.port = hex ? toPort(String(parseInt(hex[1], 16))) : toPort(val);
    } else if (key === "password") {
      // PuTTY 存的是它自己加密的 blob，不是明文
      if (val) {
        cur.passwordLocked = true;
        cur.note = "口令由 PuTTY 加密保存，需在主机账号里补填";
      }
    }
  }
  flush();
  return out;
}

/**
 * 解析 ini 风格的会话块（PuTTY 便携版 {@code putty.ini}、plink 会话文件）。
 *
 * @param text   文本
 * @param source 来源标记
 * @returns 会话列表
 */
export function parseIniSessions(text: string, source: SessionSource = "putty"): ParsedSession[] {
  const out: ParsedSession[] = [];
  // 这些节是客户端自身的配置，不是会话
  const skip = new Set(["sessions", "session", "putty", "windows", "general", "main"]);
  let cur: ParsedSession | null = null;
  const flush = (): void => {
    if (cur && cur.address) out.push(cur);
    cur = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;
    const sec = /^\[(.+)]$/.exec(line);
    if (sec) {
      flush();
      const name = sec[1].trim();
      if (!name || skip.has(name.toLowerCase())) continue;
      cur = {
        name, source, address: "", port: 22, username: "",
        password: "", passwordLocked: false, note: "", include: true,
      };
      continue;
    }
    if (!cur) continue;
    const kv = /^([^=]+)=(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1].trim().toLowerCase();
    const val = unquote(kv[2]);
    if (key === "hostname" || key === "host") cur.address = val;
    else if (key === "username" || key === "user") cur.username = val;
    else if (key === "portnumber" || key === "port") cur.port = toPort(val);
    else if (key === "password") {
      if (val) {
        cur.passwordLocked = true;
        cur.note = "口令由客户端加密保存，需在主机账号里补填";
      }
    }
  }
  flush();
  return out;
}

/**
 * 解析 Xshell 会话文件（{@code .xsh}）。
 *
 * <p>真实结构是 {@code [Session] → Name}、{@code [CONNECTION] → Protocol/Host/Port}、
 * {@code [CONNECTION:AUTHENTICATION] → UserName/Password}，名字出现在连接节之前，
 * 所以要先缓存 {@code pendingName} 再在遇到 {@code [CONNECTION]} 时建会话。
 * 旧实现只认 {@code [AUTHENTICATION]}，用户名会整列丢失。</p>
 *
 * @param text 文本
 * @returns 会话列表
 */
export function parseXshell(text: string): ParsedSession[] {
  const out: ParsedSession[] = [];
  let section = "";
  let pendingName = "";
  let cur: ParsedSession | null = null;
  const flush = (): void => {
    if (cur && cur.address) out.push(cur);
    cur = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(";")) continue;
    const sec = /^\[(.+)]$/.exec(line);
    if (sec) {
      section = sec[1].trim().toUpperCase();
      if (section === "SESSION") {
        // 一个文件里可能有多个会话，遇到 [Session] 就是上一条的结束
        flush();
        pendingName = "";
      } else if (section === "CONNECTION") {
        flush();
        cur = {
          name: pendingName, source: "xshell", address: "", port: 22, username: "",
          password: "", passwordLocked: false, note: "", include: true,
        };
      }
      continue;
    }
    const kv = /^([^=]+)=(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1].trim().toLowerCase();
    const val = unquote(kv[2]);
    if (section === "SESSION") {
      if (key === "name") pendingName = val;
      continue;
    }
    if (!cur) continue;
    if (section === "CONNECTION") {
      if (key === "host") cur.address = val;
      else if (key === "port") cur.port = toPort(val);
      else if (key === "protocol" && val && !/ssh/i.test(val)) {
        // RDP / Telnet / SFTP-only 会话没有「主机账号」语义，不参与导入
        cur.note = `协议 ${val} 不是 SSH，已跳过`;
        cur.include = false;
      }
    } else if (section.startsWith("CONNECTION:AUTHENTICATION")) {
      if (key === "username" || key === "user") cur.username = val;
      else if (key === "password" && val) {
        cur.passwordLocked = true;
        cur.note = "口令由 Xshell 加密保存，需在主机账号里补填";
      }
    }
  }
  flush();
  return out;
}

/**
 * 兜底解析：从纯文本里找 {@code user@host}、{@code host:port}，以及
 * {@code ssh/plink -P 22 -l user -pw pass host} 这类命令行片段。
 *
 * @param text 文本
 * @returns 会话列表
 */
export function parsePlainText(text: string): ParsedSession[] {
  const out: ParsedSession[] = [];
  const seen = new Set<string>();
  const push = (address: string, port: number, username: string, password: string): void => {
    const addr = address.trim();
    if (!addr) return;
    // 过滤掉明显不是主机的词（文件名、选项值）
    if (!addr.includes(".") && !/^\d+$/.test(addr)) return;
    const key = `${username}@${addr}:${port}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      name: `${username ? `${username}@` : ""}${addr}`,
      source: "text", address: addr, port, username, password,
      passwordLocked: false, note: "", include: true,
    });
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    // 形如 ssh -p 2222 root@10.0.0.1 / plink -P 2222 -l root -pw pass 10.0.0.1
    if (/\b(?:ssh|plink|putty|sshpass)\b/i.test(line)) {
      const tokens = line.split(/\s+/);
      let port = 22;
      let username = "";
      let password = "";
      const hosts: string[] = [];
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t === "-p" || t === "-P") {
          port = toPort(tokens[++i]);
        } else if (t === "-l" || t === "-pw") {
          const v = unquote(tokens[++i] ?? "");
          if (t === "-l") username = v;
          else password = v;
        } else if (t.startsWith("-")) {
          // -i / -o / -L 等带值选项，跳过它的值
          if (/^-(i|o|L|R|D|F|E|e|b|c|m|O|Q|S|W|w)$/.test(t)) i++;
        } else if (!/^(ssh|plink|putty|sshpass)$/i.test(t)) {
          hosts.push(unquote(t));
        }
      }
      const target = hosts.find(h => h.includes(".") || /^\d+$/.test(h) || /@/.test(h));
      if (target) {
        const at = target.lastIndexOf("@");
        const addr = at >= 0 ? target.slice(at + 1) : target;
        const user = at >= 0 ? target.slice(0, at) : username;
        const colon = /^(.*):(\d{1,5})$/.exec(addr);
        push(colon ? colon[1] : addr, colon ? toPort(colon[2]) : port, user, password);
        continue;
      }
    }

    // 普通文本里的 user@host 或 host:port
    const m = /(?:^|\s|,)(?:([\w.\-\\]+)@)?([A-Za-z0-9][\w.\-]*(?:\.[\w.\-]+)+)(?::(\d{1,5}))?(?:\s|,|$)/.exec(line);
    if (!m) continue;
    push(m[2], toPort(m[3]), m[1] ?? "", "");
  }
  return out;
}

/**
 * 按文件名与内容特征分派解析器。
 *
 * @param fileName 文件名（自带扩展名）
 * @param text     文本内容
 * @returns 会话列表
 */
export function parseSessionFile(fileName: string, text: string): ParsedSession[] {
  const name = fileName.toLowerCase();
  if (name.endsWith(".reg")) return parsePuttyReg(text);
  if (name.endsWith(".xsh")) return parseXshell(text);
  if (name === "config" || name.endsWith(".sshconfig") || name.endsWith(".ssh_config") || /\bconfig\b/.test(name)) {
    if (/^\s*Host\s+\S+/m.test(text)) return parseOpenSsh(text);
  }
  if (name.endsWith(".ini")) return parseIniSessions(text, "putty");
  // 内容特征优先：合并导出的 txt 也常带完整节名
  if (/\[CONNECTION]/i.test(text) && /\[Session]/i.test(text)) return parseXshell(text);
  if (/SimonTatham\\PuTTY\\Sessions/i.test(text)) return parsePuttyReg(text);
  if (/^\s*Host\s+\S+/m.test(text) && /^[\s#]*HostName\s/mi.test(text)) return parseOpenSsh(text);
  if (/^\[[^\]]+]$/m.test(text) && /^\s*(HostName|Host)\s*=/mi.test(text)) return parseIniSessions(text, "putty");
  return parsePlainText(text);
}

/**
 * 把一条会话匹配到台账主机：先「地址 + 端口」，再「同地址」；内/外网 IP 也参与匹配。
 *
 * @param address 会话地址
 * @param port    会话端口
 * @param hosts   台账主机
 * @returns 命中的主机，没有则 null
 */
export function matchImportHost(address: string, port: number, hosts: ImportHost[]): ImportHost | null {
  const addr = (address ?? "").trim().toLowerCase();
  if (!addr) return null;
  const same = hosts.filter(h =>
    String(h.serverHostAddress ?? "").toLowerCase() === addr
    || String(h.serverHostPublicIp ?? "").toLowerCase() === addr
    || String(h.serverHostPrivateIp ?? "").toLowerCase() === addr);
  if (!same.length) return null;
  return same.find(h => Number(h.serverHostPort) === port) ?? same[0];
}
