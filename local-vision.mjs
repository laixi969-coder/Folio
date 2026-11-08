import path from 'node:path';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const runner=path.join(path.dirname(fileURLToPath(import.meta.url)),'scripts/local-vision.swift');
export function localVisionItems(article,dir){
 const sources=[...new Set(article.blocks.filter(b=>b.type==='images').flatMap(b=>b.images.map(im=>im.src)))];
 if(sources.length>100)throw new Error('单篇最多分析 100 张图片，请分批处理');
 const media=path.resolve(dir,'media');
 return sources.map(src=>{if(typeof src!=='string'||!/^\/media\/[a-zA-Z0-9.-]+$/.test(src))throw new Error('文章含无法本地分析的图片，请重新导入');const file=path.join(media,src.slice(7));if(!fs.existsSync(file)||!fs.statSync(file).isFile())throw new Error('文章图片缺失，请重新导入');if(fs.lstatSync(file).isSymbolicLink()||path.dirname(fs.realpathSync(file))!==fs.realpathSync(media))throw new Error('图片路径不受支持');return {src,path:file}});
}
export function runLocalVision(items,{platform=process.platform,spawnProcess=spawn,timeoutMs=180000}={}){
 if(platform!=='darwin')return Promise.reject(new Error('本机图片识别目前需要 macOS；可继续使用按数量和比例排版'));
 if(!items.length)return Promise.resolve([]);
 return new Promise((resolve,reject)=>{
  const child=spawnProcess('/usr/bin/swift',[runner],{stdio:['pipe','pipe','pipe']});let output='',err='',settled=false;
  const timer=setTimeout(()=>{child.kill();finish(new Error('本机识别超时，请稍后重试'))},timeoutMs);
  function finish(error,value){if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value)}
  child.stdout.on('data',chunk=>{output+=chunk;if(output.length>2_000_000){child.kill();finish(new Error('识别结果过大'))}});
  child.stderr.on('data',chunk=>{if(err.length<2000)err+=chunk});
  child.on('error',()=>finish(new Error('无法启动本机图片识别，请检查 macOS 开发者工具')));
  child.on('close',code=>{if(code!==0)return finish(new Error('本机图片识别失败，请检查 macOS 开发者工具'));try{const result=JSON.parse(output);if(!Array.isArray(result)||result.length!==items.length)throw Error();finish(null,result)}catch{finish(new Error('本机识别返回异常，请重试'))}});
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(items));
 });
}
