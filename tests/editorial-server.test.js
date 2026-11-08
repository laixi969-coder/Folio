// @vitest-environment node
import {it,expect,vi,beforeAll,afterAll} from 'vitest';
import express from 'express';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createEditorialStore} from '../editorial-store.mjs';
import {createEditorialAI} from '../editorial-ai.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'folio-editorial-')),remote=vi.fn(),running=new Set();let server,base;
const config={text:{baseURL:'https://model.test/v1',apiKey:'secret',model:'text-model'},image:{baseURL:'https://images.test/v1',apiKey:'secret',model:'gpt-image-1'}};
const articles=[{id:'a',title:'正文',cover:{src:'/media/a.png'},blocks:[],review:{publishedAt:'2026-11-07T12:00:00Z',recordedAt:'2026-11-07T12:30:00Z',reads:0}}];
const req=async(p,body)=>{const r=await fetch(base+p,{method:body?(p==='/library'?'PUT':'POST'):'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return{status:r.status,data:await r.json()}};
beforeAll(async()=>{const app=express();app.use(express.json());app.use(createEditorialStore({dir,getArticles:()=>articles}));app.use('/generate',createEditorialAI({getConfig:()=>config,running,hide:s=>String(s).replaceAll('secret','[hidden]'),fetcher:remote}));await new Promise(r=>{server=app.listen(0,'127.0.0.1',r)});base='http://127.0.0.1:'+server.address().port});
afterAll(async()=>{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true})});
it('共享库持久化，拒绝陈旧版本，按真实文章统计素材使用',async()=>{
 const old=(await req('/library')).data;expect(old.revision).toBe(0);
 const saved=await req('/library',{...old,snippets:[{id:'snip',name:'作者介绍',blocks:[{id:'p',type:'paragraph',html:'作者'}]}],assets:[{id:'asset',name:'封面',src:'/media/a.png'}]});expect(saved.status).toBe(200);expect(saved.data.revision).toBe(1);
 expect(JSON.parse(fs.readFileSync(path.join(dir,'editorial-library.json'))).snippets[0].name).toBe('作者介绍');
 const conflict=await req('/library',old);expect(conflict.status).toBe(409);expect(conflict.data.current.assets).toHaveLength(1);
 expect((await req('/asset-usage')).data.asset).toEqual([{id:'a',title:'正文'}]);expect((await req('/reviews')).data[0].review.reads).toBe(0);
});
it('拒绝无效素材与重复标识，不损坏已有库',async()=>{
 const current=(await req('/library')).data;expect((await req('/library',{...current,assets:[{id:'bad',name:'bad',src:'https://external.test/a.png'}]})).status).toBe(400);
 expect((await req('/library',{...current,snippets:[current.snippets[0],current.snippets[0]]})).status).toBe(400);
 expect((await req('/library')).data.revision).toBe(current.revision);
});
const json=d=>({ok:true,status:200,json:async()=>d});
const source={title:'标题',blocks:[{id:'p',text:'真实正文，只有这些事实。'}]};
it('文字模型调用配置服务，只接受能在原文定位的候选',async()=>{
 remote.mockResolvedValueOnce(json({choices:[{message:{content:JSON.stringify({candidates:Array.from({length:3},()=>({title:'新标题',digest:'摘要',audience:'读者',reason:'理由',evidenceBlockId:'p',evidenceQuote:'真实正文'}))})}}]}));
 const result=await req('/generate/candidates',source);expect(result.status).toBe(200);expect(result.data.candidates[0].title).toBe('新标题');const [url,options]=remote.mock.calls.at(-1);expect(url).toBe('https://model.test/v1/chat/completions');expect(options.headers.Authorization).toBe('Bearer secret');expect(JSON.stringify(result.data)).not.toContain('secret');
 remote.mockResolvedValueOnce(json({choices:[{message:{content:JSON.stringify({candidates:Array.from({length:3},()=>({title:'假标题',digest:'摘要',evidenceBlockId:'p',evidenceQuote:'编造内容'}))})}}]}));expect((await req('/generate/candidates',source)).data.error).toContain('依据无法核对');expect(running.size).toBe(0);
});
it('图像生成只接受有格式签名的base64，保留生成来源且不自动插入',async()=>{
 remote.mockResolvedValueOnce(json({data:[{b64_json:'iVBORw0KGgo='}]}));const result=await req('/generate/image',{prompt:'一张明确标注的插画'});expect(result.status).toBe(200);expect(result.data.data).toBe('data:image/png;base64,iVBORw0KGgo=');expect(result.data.provenance.model).toBe('gpt-image-1');const options=JSON.parse(remote.mock.calls.at(-1)[1].body);expect(options.response_format).toBeUndefined();expect(articles[0].blocks).toEqual([]);
 remote.mockResolvedValueOnce(json({data:[{url:'http://127.0.0.1/private'}]}));expect((await req('/generate/image',{prompt:'图片'})).data.error).toContain('base64');
});
it('无模型、重复请求与服务商错误不显示成功，错误隐藏密钥',async()=>{
 running.add('text');expect((await req('/generate/candidates',source)).status).toBe(409);running.clear();
 remote.mockResolvedValueOnce({ok:false,status:401,json:async()=>({error:{message:'invalid secret'}})});const response=await req('/generate/candidates',source);expect(response.status).toBe(400);expect(response.data.error).not.toContain('secret');expect(running.size).toBe(0);
 config.image.model='';expect((await req('/generate/image',{prompt:'x'})).data.error).toContain('填写模型');config.image.model='gpt-image-1';
});
it('停止等待会中止上游请求并释放模型锁',async()=>{
 let upstreamSignal;
 remote.mockImplementationOnce(async(url,options)=>{upstreamSignal=options.signal;return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}))});
 const controller=new AbortController();const request=fetch(base+'/generate/candidates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(source),signal:controller.signal}).catch(e=>e);
 await vi.waitFor(()=>expect(running.has('text')).toBe(true));controller.abort();await request;
 await vi.waitFor(()=>expect(running.has('text')).toBe(false));expect(upstreamSignal.aborted).toBe(true);
});
