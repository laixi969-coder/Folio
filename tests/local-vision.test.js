// @vitest-environment node
import{it,expect}from'vitest';
import fs from'node:fs';import os from'node:os';import path from'node:path';
import{localVisionItems,runLocalVision}from'../local-vision.mjs';
it('本机识别只读取文章中的本地媒体，拒绝外部路径及符号链接',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'folio-vision-test-'));fs.mkdirSync(path.join(dir,'media'));fs.writeFileSync(path.join(dir,'media','a.png'),'a');
 const article=src=>({blocks:[{type:'images',images:[{src}]}]});
 expect(localVisionItems(article('/media/a.png'),dir)).toHaveLength(1);
 expect(()=>localVisionItems(article('/media/../../secret'),dir)).toThrow();
 expect(()=>localVisionItems(article('https://example.com/a.png'),dir)).toThrow();
 fs.symlinkSync(path.join(dir,'media','a.png'),path.join(dir,'media','link.png'));
 expect(()=>localVisionItems(article('/media/link.png'),dir)).toThrow();fs.rmSync(dir,{recursive:true,force:true});
});
it('非 macOS 明确提示并保留离线基础排版',async()=>{await expect(runLocalVision([{src:'/media/a.png',path:'/tmp/a'}],{platform:'linux'})).rejects.toThrow('macOS')});
