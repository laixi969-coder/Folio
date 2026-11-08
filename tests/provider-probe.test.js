// @vitest-environment node
import {it,expect,beforeEach,afterEach,vi} from 'vitest';
import express from 'express';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createConnections} from '../connections.mjs';
import {textRequestOptions,modelConfigurationError} from '../public/model-providers.js';
let dir,server,base;const remote=vi.fn();
const req=async(p='',body,method)=>{const r=await fetch(base+p,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}};
const json=(d,status=200)=>({ok:status<400,status,json:async()=>d});
beforeEach(async()=>{remote.mockReset();dir=fs.mkdtempSync(path.join(os.tmpdir(),'folio-probe-'));const app=express();app.use(express.json());app.use(createConnections({dir,fetcher:remote}));await new Promise(r=>{server=app.listen(0,'127.0.0.1',r)});base='http://127.0.0.1:'+server.address().port;await req('/text',{baseURL:'https://api.deepseek.com',model:'deepseek-flash',apiKey:'private-key'},'PUT')});
afterEach(async()=>{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true})});
it('模型列表不可用时仍能真实试运行，不发送用户文章；更换模型使结果失效',async()=>{
 remote.mockResolvedValueOnce(json({},404));expect((await req('/text/models',{})).status).toBe(400);
 remote.mockResolvedValueOnce(json({choices:[{finish_reason:'stop',message:{content:'{"ok":true}'}}]}));
 const response=await req('/text/probe',{article:'绝不能被转发的正文'});expect(response.status).toBe(200);expect(response.data.text.lastGenerationTest.ok).toBe(true);
 const [url,options]=remote.mock.calls.at(-1);expect(url).toBe('https://api.deepseek.com/chat/completions');expect(options.body).not.toContain('绝不能被转发');expect(JSON.parse(options.body).thinking.type).toBe('disabled');expect(JSON.stringify(response.data)).not.toContain('private-key');
 const changed=await req('/text',{baseURL:'https://api.deepseek.com',model:'deepseek-v4-pro'},'PUT');expect(changed.data.text.lastGenerationTest).toBeNull();
});
it('HTTP成功但输出无效或被截断不能标记已验证，接口列表成功不能冒充生成成功',async()=>{
 for(const choice of [{message:{content:'hello'}},{message:{content:'{"ok":false}'}},{finish_reason:'length',message:{content:'{"ok":true}'}}]){
  remote.mockResolvedValueOnce(json({choices:[choice]}));expect((await req('/text/probe',{})).status).toBe(400);expect((await req()).data.text.lastGenerationTest.ok).toBe(false);
 }
 remote.mockResolvedValueOnce(json({data:[{id:'deepseek-flash'}]}));expect((await req('/text/test',{})).data.text.lastTest.ok).toBe(true);expect((await req()).data.text.lastGenerationTest.ok).toBe(false);
});
it('缺失密钥和误选文字模型生图在请求前拦截，错误不会泄露密钥',async()=>{
 remote.mockResolvedValueOnce(json({error:{message:'invalid private-key'}},401));expect((await req('/text/probe',{})).data.error).not.toContain('private-key');
 await req('/text',{baseURL:'https://api.deepseek.com',model:'deepseek-flash',clearKey:true},'PUT');const count=remote.mock.calls.length;expect((await req('/text/probe',{})).data.error).toContain('API Key');expect(remote.mock.calls.length).toBe(count);
 expect(modelConfigurationError({baseURL:'https://x.test',apiKey:'x',model:'qwen3.8-flash'},'image')).toContain('文字模型');
 expect(modelConfigurationError({baseURL:'http://localhost:11434/v1',model:'local-model'})).toBe('');
});
it('GLM 5.3保留强制思考并降低强度，自定义网关不添加专属参数',()=>{
 expect(textRequestOptions({baseURL:'https://open.bigmodel.cn/api/paas/v4',model:'glm-5.3'})).toMatchObject({thinking:{type:'enabled'},reasoning_effort:'low'});
 expect(textRequestOptions({baseURL:'https://gateway.test/v1',model:'glm-5.3'}).thinking).toBeUndefined();
});
