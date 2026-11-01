import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
const fresh=()=>({text:{baseURL:'https://api.openai.com/v1',apiKey:'',model:'',models:[]},image:{baseURL:'https://api.openai.com/v1',apiKey:'',model:'',models:[]},wechat:{name:'',appId:'',appSecret:'',lastTest:null}});
export function createConnections({dir,fetcher=fetch}){
 const file=path.join(dir,'connections.json');let config=fs.existsSync(file)?{...fresh(),...JSON.parse(fs.readFileSync(file,'utf8'))}:fresh();
 const persist=()=>{fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(config,null,2),{mode:0o600});fs.renameSync(file+'.tmp',file);fs.chmodSync(file,0o600)};
 const publicConfig=()=>Object.fromEntries(Object.entries(config).map(([key,{apiKey,appSecret,...profile}])=>[key,{...profile,keyConfigured:!!apiKey,secretConfigured:!!appSecret}]));
 const router=express.Router(),running=new Set();let wechatToken=null;
 const validSlot=s=>['text','image','wechat'].includes(s);
 const hide=message=>{let result=String(message||'连接失败');for(const p of Object.values(config))for(const secret of [p.apiKey,p.appSecret,wechatToken?.value])if(secret)result=result.split(secret).join('[已隐藏]');return result.slice(0,400)};
 const friendly=e=>e.name==='TimeoutError'||e.name==='AbortError'?'连接超时，请检查地址和网络后重试':hide(e.message);
 const wrap=fn=>async(req,res)=>{try{await fn(req,res)}catch(e){res.status(e.status||400).json({error:friendly(e)})}};
 function endpoint(raw){let url;try{url=new URL(raw)}catch{throw Error('请输入完整接口地址，例如 https://api.openai.com/v1')}if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('接口地址只接受HTTP/HTTPS，不要包含密钥、查询参数或账号密码');if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error('远程模型接口请使用HTTPS；本机模型可使用localhost');return url.href.replace(/\/+$/,'')}
 async function listModels(p){const rows=[];let cursor='';for(let page=0;page<10;page++){const url=p.baseURL+'/models'+(cursor?'?after='+encodeURIComponent(cursor):'');const r=await fetcher(url,{headers:p.apiKey?{Authorization:'Bearer '+p.apiKey}:{},signal:AbortSignal.timeout(12000),redirect:'error'});let d;try{d=await r.json()}catch{throw Error('服务商没有返回JSON，请确认填写的是API基础地址')}if(!r.ok)throw Error(`服务商返回 ${r.status}：${d.error?.message||'请检查密钥、地址或账户权限'}`);if(!Array.isArray(d.data))throw Error('该服务商未提供兼容的 /models 列表，可手动填写模型ID');for(const m of d.data)if(typeof m?.id==='string')rows.push({id:m.id,owned_by:String(m.owned_by||''),created:Number(m.created)||0});if(!d.has_more)break;const next=d.last_id||d.data.at(-1)?.id;if(!next||next===cursor)throw Error('服务商分页异常，未更新已保存的列表');cursor=next;if(page===9)throw Error('模型列表分页过多，未保存不完整的列表')}return [...new Map(rows.map(m=>[m.id,m])).values()].sort((a,b)=>b.created-a.created||a.id.localeCompare(b.id))}
 router.get('/',(req,res)=>res.json(publicConfig()));
 router.put('/:slot',wrap(async(req,res)=>{const slot=req.params.slot;if(!validSlot(slot))throw Error('配置类型不存在');if(running.has(slot))throw Error('正在测试或同步，请稍后保存');const old=config[slot],b=req.body||{};if(slot==='wechat'){
  const appId=String(b.appId||'').trim();if(appId&&!/^wx[a-zA-Z0-9]{16}$/.test(appId))throw Error('AppID应为wx开头的18位开发者ID');if(appId!==old.appId&&old.appSecret&&!b.appSecret&&!b.clearSecret)throw Error('更换AppID时请重新填写AppSecret');const appSecret=b.clearSecret?'':typeof b.appSecret==='string'&&b.appSecret.trim()?b.appSecret.trim():old.appSecret;const changed=appId!==old.appId||appSecret!==old.appSecret;config.wechat={...old,name:String(b.name||'').slice(0,80),appId,appSecret,lastTest:changed?null:old.lastTest};if(changed)wechatToken=null;
 }else{
  const baseURL=endpoint(String(b.baseURL||''));if(baseURL!==old.baseURL&&old.apiKey&&!b.apiKey&&!b.clearKey)throw Error('更换接口地址时请重新填写密钥，避免把旧密钥发送到新的服务商');const apiKey=b.clearKey?'':typeof b.apiKey==='string'&&b.apiKey.trim()?b.apiKey.trim():old.apiKey;const changed=baseURL!==old.baseURL||apiKey!==old.apiKey;config[slot]={...old,baseURL,apiKey,model:String(b.model||'').trim().slice(0,200),models:changed?[]:old.models,syncedAt:changed?null:old.syncedAt,lastTest:changed?null:old.lastTest};
 }persist();res.json(publicConfig());}));
 router.post('/:slot/:action',wrap(async(req,res)=>{const{slot,action}=req.params;if(!validSlot(slot)||!['test','models','disconnect'].includes(action))throw Error('操作不存在');if(running.has(slot))throw Error('已有请求正在处理，请稍候');
 if(action==='disconnect'){config[slot]=fresh()[slot];if(slot==='wechat')wechatToken=null;persist();return res.json(publicConfig())}
 if(slot==='wechat'&&action==='models')throw Error('公众号不提供模型列表');running.add(slot);const start=Date.now();try{
 const p=config[slot];if(slot==='wechat'){
  if(!p.appId||!p.appSecret)throw Error('请先填写AppID和AppSecret');const r=await fetcher('https://api.weixin.qq.com/cgi-bin/stable_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'client_credential',appid:p.appId,secret:p.appSecret,force_refresh:false}),signal:AbortSignal.timeout(12000),redirect:'error'});const d=await r.json();if(!r.ok||d.errcode||!d.access_token){const fixes={40164:'请在微信后台添加本机出口公网IP到接口白名单',40013:'请检查AppID',40125:'请检查AppSecret',48001:'该公众号没有对应接口权限',45009:'接口调用次数受限，请稍后重试'};throw Error(`微信返回 ${d.errcode||r.status}：${fixes[d.errcode]||d.errmsg||'凭据验证失败'}`)}wechatToken={value:d.access_token,expiresAt:Date.now()+Number(d.expires_in||7200)*1000};p.lastTest={ok:true,at:new Date().toISOString(),latencyMs:Date.now()-start,message:'公众号凭据验证通过。尚未验证素材和草稿写入权限；未上传或发布文章。'};
 }else{
 const models=await listModels(p);if(action==='models'){p.models=models;p.syncedAt=new Date().toISOString()}p.lastTest={ok:true,at:new Date().toISOString(),latencyMs:Date.now()-start,message:`连接成功，服务商返回${models.length}个模型。仅验证接口和鉴权，未执行文字或图片生成。`};
 }persist();res.json(publicConfig());
 }catch(e){config[slot].lastTest={ok:false,at:new Date().toISOString(),message:friendly(e)};persist();throw e}finally{running.delete(slot)}}));
 return router;
}
