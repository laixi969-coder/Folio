// @vitest-environment node
import{it,expect,beforeAll,afterAll}from'vitest';
import{spawn}from'node:child_process';import fs from'node:fs';import os from'node:os';import path from'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'folio-test-'));let child;const base='http://127.0.0.1:4279';
const call=(url,body,method='POST')=>fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
beforeAll(async()=>{child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4279',FOLIO_DATA_DIR:dir},stdio:'pipe'});await new Promise((resolve,reject)=>{child.stdout.on('data',d=>{if(d.toString().includes('localhost'))resolve()});child.on('error',reject);child.on('exit',c=>reject(new Error('Server exited '+c)))})});
afterAll(()=>{child?.kill();fs.rmSync(dir,{recursive:true,force:true})});
it('空库、新稿、原子保存、旧版本冲突和持久化',async()=>{expect((await(await fetch(base+'/api/articles')).json()).articles).toEqual([]);const res=await call('/api/articles',{title:'测试稿',blocks:[],style:{},status:'draft'});expect(res.status).toBe(201);const a=await res.json();const saved=await call('/api/articles/'+a.id,{...a,title:'修改稿'},'PUT');expect(saved.status).toBe(200);expect((await saved.json()).revision).toBe(2);const conflict=await call('/api/articles/'+a.id,{...a,title:'旧设备稿'},'PUT');expect(conflict.status).toBe(409);expect((await conflict.json()).current.title).toBe('修改稿');expect(JSON.parse(fs.readFileSync(path.join(dir,'articles.json'))).articles[0].title).toBe('修改稿')});
it('不接收伪图片与来源不匹配的修改',async()=>{expect((await call('/api/media',{data:'data:image/png;base64,YWJj',name:'fake'})).status).toBe(400);expect((await fetch(base+'/api/style',{method:'PUT',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:'{}'})).status).toBe(403)});
it('本机识别检查文章版本及媒体路径，不会读取不存在或越界的文件',async()=>{
 const created=await(await call('/api/articles',{title:'识别测试',blocks:[{id:'img',type:'images',images:[{id:'a',src:'/media/../../secret'}]}],style:{},status:'draft'})).json();
 const stale=await call('/api/articles/'+created.id+'/local-vision',{revision:created.revision+1});expect(stale.status).toBe(409);
 const invalid=await call('/api/articles/'+created.id+'/local-vision',{revision:created.revision});expect(invalid.status).toBe(400);
 const after=await(await fetch(base+'/api/articles/'+created.id)).json();expect(after.revision).toBe(created.revision);expect(after.blocks).toEqual(created.blocks);
});
