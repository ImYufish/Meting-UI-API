// QQ 音乐歌词代理 —— EdgeOne Makers（Cloud Functions，固定区域执行版）
//
// ⚠️ 为什么用 Makers 而不是「边缘函数」：
//   边缘函数就近执行——Vercel 在美国，函数就跑在美国边缘，从美国 IP 抓 c.y.qq.com 被 QQ 墙。
//   Makers（Cloud Functions）是「固定区域」执行，在 edgeone.json 里把地域钉死为广州(ap-guangzhou)，
//   函数就永远跑在国内节点，从国内 IP 抓 QQ → 放行。
//   部署时务必确认 edgeone.json 的 mainlandRegions/overseasRegions 都是 ["ap-guangzhou"]（见同目录 edgeone.json）。
//
// 入口：Makers 调用 export async function onRequest(context)，context.request 是 Fetch Request。
// 路由：[[default]].js 为 catch-all，接管域名下任意路径；api.js 把 https://c.y.qq.com 整段替换成
//       本代理域名，所以代理收到的 pathname 已是 /lyric/...，无需再处理前缀。

const UPSTREAM = 'https://c.y.qq.com';

export async function onRequest(context) {
  const req = context.request;
  const u = new URL(req.url);

  // 只允许歌词接口路径，缩小暴露面（api.js 仅会请求 /lyric/ 下的地址）
  if (!u.pathname.startsWith('/lyric/')) {
    return new Response('forbidden', { status: 403 });
  }

  // 只代理到 c.y.qq.com，避免被当开放代理滥用
  const target = UPSTREAM + u.pathname + u.search;

  // 只保留必要头，避免把调用方奇葩头（含中文 UA / 追踪 Cookie）带给 QQ 引发异常
  const headers = new Headers();
  headers.set('host', 'c.y.qq.com');
  headers.set('referer', 'https://y.qq.com/');
  headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36');
  headers.set('accept', '*/*');

  const body = req.method === 'POST' ? await req.text().catch(() => undefined) : undefined;
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: 'follow'
  });

  // 缓冲响应体再返回（避免流式透传被下游截断），并清掉会让下游二次解压的响应头
  const respHeaders = new Headers();
  respHeaders.set('access-control-allow-origin', '*');
  respHeaders.set('content-type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
  ['content-encoding', 'content-length', 'transfer-encoding'].forEach((h) => respHeaders.delete(h));

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: respHeaders
  });
}
