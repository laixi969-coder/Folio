import {exportHTML,escape,textOf,mapEmbeddedImages} from './model';
import {prepareExport} from './export-check';
import {reviewChecklist} from './automation-model';
import {publishingTitle} from './reading-check';
import {prepareWechatExport,wechatFontFiles} from './wechat-font-export';
const encoder=new TextEncoder();
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0}
// Uncompressed ZIP: keeps image bytes unchanged and supports Unicode filenames.
export function makeZip(files){const chunks=[],central=[];let offset=0;
 for(const [name,content] of Object.entries(files)){const filename=encoder.encode(name),data=typeof content==='string'?encoder.encode(content):content,crc=crc32(data),header=new Uint8Array(30+filename.length),h=new DataView(header.buffer);h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,filename.length,true);header.set(filename,30);chunks.push(header,data);
  const entry=new Uint8Array(46+filename.length),v=new DataView(entry.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint32(16,crc,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,filename.length,true);v.setUint32(42,offset,true);entry.set(filename,46);central.push(entry);offset+=header.length+data.length;
 }
 const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,central.length,true);v.setUint16(10,central.length,true);v.setUint32(12,central.reduce((n,b)=>n+b.length,0),true);v.setUint32(16,offset,true);return new Blob([...chunks,...central,end],{type:'application/zip'});
}
const readBlob=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('图片读取失败'));r.readAsDataURL(blob)});
export async function buildDeliveryPackage(article,{fetchImage=fetch,readImage=readBlob,prepareTypography=prepareWechatExport}={}){
 const check=await prepareExport(article,fetchImage,readImage);
 if(check.issues.some(i=>i.level==='blocking'))throw Error(check.issues.filter(i=>i.level==='blocking').map(i=>i.message).join('；'));
 const assets=check.assets;
 async function embed(src){if(assets[src])return assets[src];if(!/^\/media\/[a-zA-Z0-9-]+\.(png|jpeg|gif|webp)$/.test(src)&&!/^data:image\/(png|jpeg|gif|webp);base64,/.test(src))throw Error('交稿素材不是可读取的本机图片');const r=await fetchImage(src);if(!r.ok)throw Error('交稿图片读取失败');const blob=await r.blob();if(!/^image\/(png|jpeg|gif|webp)$/.test(blob.type))throw Error('图片格式不受支持');return assets[src]=await readImage(blob)}
 // Traverse checkpoints and unselected candidates as well, making the editable backup portable.
 async function portable(value){if(Array.isArray(value))return Promise.all(value.map(portable));if(value&&typeof value==='object'){const out={};for(const [key,item] of Object.entries(value)){if(['src','originalSrc'].includes(key)&&typeof item==='string')out[key]=await embed(item);else if(key==='html'&&typeof item==='string'){const sources=[];mapEmbeddedImages(item,src=>{sources.push(src);return src});for(const src of sources)await embed(src);out[key]=mapEmbeddedImages(item,src=>assets[src])}else out[key]=await portable(item)}return out}return value}
 const backup=await portable(article),pending=reviewChecklist(article),title=publishingTitle(article),typography=await prepareTypography(article,{assets});
 const files={
  '正文.html':'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><body style="max-width:680px;margin:32px auto">'+typography.html+'</body></html>',
  '发布信息.txt':`标题：${title}\n摘要：${article.digest||'待填写'}\n作者：${article.author||'待填写'}\n栏目：${article.columnName||'未分栏目'}\n\n正式发布由编辑在公众号后台完成。`,
  '审阅清单.md':`# ${title}\n\n交稿时间：${new Date().toISOString()}\n\n${[...pending,...check.issues.map(i=>i.message)].map(i=>'- [ ] '+i).join('\n')}\n\n本文未自动发布。封面裁切和字体效果请在微信真机核对。`,
  '可编辑备份.folio.json':JSON.stringify({format:'folio-v1',article:backup},null,2),
  '原文.txt':article.blocks.map(b=>textOf(b.html)||b.caption||'').join('\n\n')
 };
 if(typography.images.length)for(const [name,content] of Object.entries(wechatFontFiles(article,typography)))files['字体素材/'+name]=content;
 if(article.cover?.src){const data=await embed(article.cover.src),match=data.match(/^data:image\/(\w+);base64,(.*)$/s);if(!match)throw Error('封面编码错误');files['封面.'+match[1]]=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0))}
 return {blob:makeZip(files),files,pending,issues:check.issues};
}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
