// @vitest-environment node
import {it,expect,vi,beforeAll,afterAll} from 'vitest';
import express from 'express';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import sharp from 'sharp';
import {createEditorialJobs} from '../editorial-jobs.mjs';
import {storeMedia} from '../media-store.mjs';
import {organizeAssets} from '../editorial-media.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'folio-jobs-')),fetcher=vi.fn(),running=new Set();
const config={text:{baseURL:'https://test.example/v1',model:'test',apiKey:'private-key'},image:{baseURL:'https://test.example/v1',model:'image',apiKey:'private-key'}};
let server,base;const router=()=>createEditorialJobs({dir,getConfig:()=>config,running,hide:s=>String(s).replaceAll('private-key','[hidden]'),fetcher});
async function start(){const app=express();app.use(express.json());app.use(router());await new Promise(r=>{server=app.listen(0,'127.0.0.1',r)});base='http://127.0.0.1:'+server.address().port}
const req=async(p='',body,method=body?'POST':'GET')=>{const r=await fetch(base+'/'+p,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}};
const input={kind:'candidates',articleId:'a',sourceSignature:'s',body:{title:'原文',blocks:[{id:'p',text:'真实事实依据'}]}};
const response=()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({candidates:Array.from({length:3},()=>({title:'候选',digest:'摘要',evidenceBlockId:'p',evidenceQuote:'真实事实'}))})}}]})});
beforeAll(start);afterAll(async()=>{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true})});
it('后台任务持久化、跨页面完成、相同请求仅计费一次，结果不含密钥',async()=>{
 let finish;fetcher.mockImplementationOnce(()=>new Promise(r=>finish=r));const first=await req('',input);expect(first.status).toBe(202);
 const duplicate=await req('',input);expect(duplicate.data.id).toBe(first.data.id);expect(fetcher).toHaveBeenCalledTimes(1);
 expect((await req(first.data.id)).data.status).toBe('running');finish(response());await vi.waitFor(async()=>expect((await req(first.data.id)).data.status).toBe('completed'));
 const result=(await req(first.data.id)).data;expect(result.result.candidates).toHaveLength(3);expect(JSON.stringify(result)).not.toContain('private-key');expect(JSON.stringify(result)).not.toContain('configHash');
 expect(fs.readFileSync(path.join(dir,'editorial-jobs.json'),'utf8')).not.toContain('private-key');
 expect((await req('',input)).data.id).toBe(first.data.id);expect(fetcher).toHaveBeenCalledTimes(1);
});
it('失败不自动重试；明确重试后保存成功，错误隐藏密钥',async()=>{
 fetcher.mockRejectedValueOnce(Error('private-key invalid'));const job=(await req('',{...input,sourceSignature:'s2'})).data;
 await vi.waitFor(async()=>expect((await req(job.id)).data.status).toBe('failed'));
 expect((await req(job.id)).data.error).toBe('[hidden] invalid');const calls=fetcher.mock.calls.length;
 expect((await req('',{...input,sourceSignature:'s2'})).data.id).toBe(job.id);expect(fetcher.mock.calls.length).toBe(calls);
 fetcher.mockResolvedValueOnce(response());await req(job.id+'/retry',{});await vi.waitFor(async()=>expect((await req(job.id)).data.status).toBe('completed'));
 expect((await req(job.id)).data.attempts).toBe(2);
});
it('重启保留完成结果，未知完成状态暂停，拒绝自动发布任务',async()=>{
 await new Promise(r=>server.close(r));const file=path.join(dir,'editorial-jobs.json'),saved=JSON.parse(fs.readFileSync(file));saved.push({...saved[0],id:'uncertain',status:'running'});fs.writeFileSync(file,JSON.stringify(saved));await start();
 expect((await req('uncertain')).data.status).toBe('interrupted');expect((await req(saved[0].id)).data.status).toBe('completed');expect((await req('',{...input,kind:'publish'})).status).toBe(400);
});
it('图片以内容去重，保留原始像素、来源，轻量版独立保存，图表不压缩',async()=>{
 const bytes=await sharp({create:{width:2400,height:1600,channels:3,background:'#718682'}}).png().toBuffer(),data='data:image/png;base64,'+bytes.toString('base64');
 const a=storeMedia(dir,{data,name:'街景'}),duplicate=storeMedia(dir,{data,name:'第二次上传'});expect(duplicate.src).toBe(a.src);expect(duplicate.duplicate).toBe(true);
 const result=await organizeAssets(dir,[{...a,source:'自摄',license:'本人拍摄'},duplicate]);expect(result.duplicates).toBe(1);expect(result.assets[0].width).toBe(2400);expect(result.assets[0].source).toBe('自摄');expect(result.assets[0].derivative.width).toBe(1600);
 expect(fs.readFileSync(path.join(dir,'media',path.basename(a.src)))).toEqual(bytes);
 const chart=await organizeAssets(dir,[{...a,name:'统计图表'}]);expect(chart.assets[0].derivative).toBeUndefined();
 expect((await organizeAssets(dir,[{src:'/media/../../secret'}])).errors).toHaveLength(1);
});
it('本机素材整理无需模型密钥，保存逐张进度与结果',async()=>{
 config.text.apiKey='';const raw=await sharp({create:{width:320,height:200,channels:3,background:'#def'}}).png().toBuffer();const asset=storeMedia(dir,{data:'data:image/png;base64,'+raw.toString('base64'),name:'小图'});
 const job=(await req('',{kind:'assets',articleId:'a',sourceSignature:'s',body:{assets:[asset]}})).data;
 await vi.waitFor(async()=>expect((await req(job.id)).data.status).toBe('completed'));
 const result=(await req(job.id)).data;expect(result.progress).toEqual({done:1,total:1});expect(result.result.assets[0].clarity).toContain('分辨率偏低');
});
