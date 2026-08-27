// HMAC 签名鉴权配置（可选）
// 默认关闭。将 ENABLE_AUTH 设为 true 后，/api 的 url / pic / lrc 类型请求需携带 token 参数。
// token 计算方法：HMAC-SHA256(HMAC_SECRET, `${server}${type}${id}`)
export const HMAC_SECRET = process.env.HMAC_SECRET || 'meting';
export const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true' || false;
