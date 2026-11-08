import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
// Qwen-Image uses DashScope's native synchronous endpoint, not Images compatibility.
export function dashscopeImageEndpoint(profile){
 const url=new URL(profile.baseURL);
 if(url.protocol!=='https:'||!/^qwen-image(?:-|$)/i.test(profile.model))return null;
 if(!['dashscope.aliyuncs.com','dashscope-intl.aliyuncs.com'].includes(url.hostname)&&!/^[-a-z0-9]+\.(?:cn-beijing|ap-southeast-1)\.maas\.aliyuncs\.com$/.test(url.hostname))return null;
 return url.origin+'/api/v1/services/aigc/multimodal-generation/generation';
}
export async function generateDashscopeImage({profile,prompt,signal,fetcher=fetch,cacheDir}){
 let result;
 const cacheFile=cacheDir?path.join(cacheDir,crypto.createHash('sha256').update(JSON.stringify([profile.baseURL,profile.model,profile.apiKey,prompt])).digest('hex')+'.json'):null;
 if(cacheFile&&fs.existsSync(cacheFile)){result=JSON.parse(fs.readFileSync(cacheFile,'utf8'));if(Date.now()-result.cachedAt>23*3600000)throw Error('已生成图片链接过期，请建立新任务；未重复调用生图接口。')}
 else {
 const response=await fetcher(dashscopeImageEndpoint(profile),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+profile.apiKey},body:JSON.stringify({model:profile.model,input:{messages:[{role:'user',content:[{text:prompt}]}]},parameters:{size:'1024*1024',n:1,prompt_extend:false,watermark:false}}),signal,redirect:'error'});
 try{result=await response.json()}catch{throw Error('百炼未返回有效 JSON')}
 if(!response.ok||result.code)throw Error(`百炼返回 ${result.code||response.status}：${result.message||'请检查模型权限与余额'}`);
 if(cacheFile){fs.mkdirSync(cacheDir,{recursive:true});fs.writeFileSync(cacheFile+'.tmp',JSON.stringify({...result,cachedAt:Date.now()}),{mode:0o600});fs.renameSync(cacheFile+'.tmp',cacheFile)}
 }
 let url;try{url=new URL(result.output?.choices?.[0]?.message?.content?.find(c=>c.image)?.image)}catch{throw Error('百炼未返回生成图片')}
 // Download only the official result bucket, never forward the API key to it.
 if(url.protocol!=='https:'||url.username||url.password||url.port||!/^dashscope-(?:result-)?[a-z0-9-]+\.oss[-.][a-z0-9-]+\.aliyuncs\.com$/.test(url.hostname))throw Error('百炼图片地址不在受支持的官方结果域名内：'+url.hostname);
 const image=await fetcher(url.href,{signal,redirect:'error'});if(!image.ok)throw Error('生成成功，但下载结果图片失败，请保留任务并核对服务商记录');
 if(Number(image.headers.get('content-length'))>12*1024*1024){await image.body?.cancel();throw Error('生成图片超过 12 MB')}
 const chunks=[];let size=0;for await(const chunk of image.body){size+=chunk.length;if(size>12*1024*1024)throw Error('生成图片超过 12 MB');chunks.push(chunk)}
 return {data:[{b64_json:Buffer.concat(chunks).toString('base64')}],request_id:result.request_id};
}
