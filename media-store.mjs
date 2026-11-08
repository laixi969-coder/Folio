import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export function storeMedia(dir,{data,name}) {
 const m=typeof data==='string'&&data.match(/^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/=\r\n]+)$/);
 if(!m)throw Error('支持 JPG、PNG、GIF、WebP 图片');
 const bytes=Buffer.from(m[2],'base64');
 if(bytes.length>12*1024*1024)throw Object.assign(Error('单张图片请控制在 12 MB 以内'),{status:413});
 const magic=m[1]==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):m[1]==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:m[1]==='gif'?bytes.subarray(0,3).toString()==='GIF':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!magic)throw Error('图片内容与格式不符');
 const hash=crypto.createHash('sha256').update(bytes).digest('hex'),file=hash+'.'+m[1],folder=path.join(dir,'media');
 fs.mkdirSync(folder,{recursive:true});const target=path.join(folder,file),duplicate=fs.existsSync(target);
 if(!duplicate){fs.writeFileSync(target+'.tmp',bytes);fs.renameSync(target+'.tmp',target)}
 return {id:crypto.randomUUID(),src:'/media/'+file,hash,bytes:bytes.length,duplicate,name:String(name||'图片').slice(0,200),alt:'',caption:'',position:50,mime:'image/'+m[1]};
}
