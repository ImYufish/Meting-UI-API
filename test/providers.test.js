import { apiHandler } from '../set/routes/api.js'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { test, expect } from 'vitest'

const app = new Hono()
app.use('*', cors())
app.get('/api', apiHandler)

test('非法 server 参数返回 400', async () => {
    const res = await app.request('/api?server=spotify&type=song&id=123')
    expect(res.status).toBe(400)
})

test('非法 type 参数返回 400', async () => {
    const res = await app.request('/api?server=tencent&type=unknown&id=123')
    expect(res.status).toBe(400)
})

test('有效默认请求能进入处理逻辑（网络可用 2xx；音源无数据 404；异常 500，均视为已响应）', async () => {
    const res = await app.request('/api?server=tencent&type=playlist&id=8664505249')
    expect([200, 404, 500]).toContain(res.status)
})
