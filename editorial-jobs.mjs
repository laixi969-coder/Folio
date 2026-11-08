import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {runEditorialGeneration} from './editorial-ai.mjs';
import {organizeAssets} from './editorial-media.mjs';
import {storeMedia} from './media-store.mjs';
import {modelConfigurationError} from './public/model-providers.js';
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const now=()=>new Date().toISOString();
export function createEditorialJobs({dir,getConfig,running,hide,fetcher=fetch,onComplete=()=>{}}) {
 const file=path.join(dir,'editorial-jobs.json'),router=express.Router();
 let jobs=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[],working=false;
 const persist=()=>{fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(jobs),{mode:0o600});fs.renameSync(file+'.tmp',file)};
 // Never replay an uncertain paid request after a process restart.
 for(const job of jobs)if(['running','queued'].includes(job.status)){job.status='interrupted';job.error='服务重启，任务已暂停。请核对服务商记录后手动重试，避免重复计费。'}
 if(jobs.length)persist();
 for(const kind of ['candidates','image']){const p=getConfig()[kind==='image'?'image':'text'];const completed=jobs.filter(j=>j.kind===kind&&j.status==='completed'&&j.configHash===digest([p.baseURL,p.model,p.apiKey])).at(-1);if(completed)onComplete(kind,p,completed.result)}
 const publicJob=({body,configHash,dedupe,...job})=>job;
 async function drain(){
  if(working)return;working=true;
  try{let job;while((job=jobs.find(j=>j.status==='queued'))){
   const local=job.kind==='assets',slot=local?'assets':job.kind==='image'?'image':'text',profile=local?{}:getConfig()[slot];
   if(!local&&job.configHash!==digest([profile.baseURL,profile.model,profile.apiKey])){job.status='failed';job.error='模型配置已变化，请检查后手动重试。';persist();continue}
   if(running.has(slot)){job.status='failed';job.error='模型正在处理其他请求，请稍后手动重试。';persist();continue}
   job.status='running';job.startedAt=now();persist();running.add(slot);
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),job.kind==='image'?180000:90000);
   try{let result=local?await organizeAssets(dir,job.body.assets,progress=>{job.progress=progress;persist()}):await runEditorialGeneration({kind:job.kind,body:job.body,profile,signal:controller.signal,fetcher,imageCacheDir:path.join(dir,'generation-cache')});
    if(job.kind==='image'){const asset=storeMedia(dir,{data:result.data,name:'生成插画'});result={...result,data:undefined,asset:{...asset,origin:'AI 生成',source:result.provenance.provider,model:result.provenance.model,prompt:result.prompt,createdAt:result.provenance.createdAt,license:'待核对服务商使用条款'}}}
    if(!local)onComplete(job.kind,profile,result);
    job.result=result;job.status='completed';job.error=null;
   }catch(e){job.status='failed';job.error=controller.signal.aborted?'生成超时，服务商可能仍计费。请核对后手动重试。':hide(e.message)}
   finally{clearTimeout(timer);running.delete(slot);job.finishedAt=now();persist()}
  }}finally{working=false}
 }
 router.get('/',(req,res)=>res.json(jobs.filter(j=>!req.query.articleId||j.articleId===req.query.articleId).map(publicJob).reverse()));
 router.get('/:id',(req,res)=>{const job=jobs.find(j=>j.id===req.params.id);job?res.json(publicJob(job)):res.status(404).json({error:'任务不存在'})});
 router.post('/',(req,res)=>{
  const {kind,articleId,sourceSignature,taskId,body}=req.body||{};
  if(!['candidates','image','assets'].includes(kind)||typeof articleId!=='string'||!articleId||articleId.length>100||typeof sourceSignature!=='string'||sourceSignature.length>100||!body||JSON.stringify(body).length>(kind==='assets'?200000:32000)||taskId!=null&&(typeof taskId!=='string'||taskId.length>100))return res.status(400).json({error:'任务内容不完整或过大'});
  const profile=kind==='assets'?{}:getConfig()[kind==='image'?'image':'text'],problem=kind==='assets'?null:modelConfigurationError(profile,kind==='image'?'image':'text');if(problem)return res.status(400).json({error:problem});
  const configHash=digest([profile.baseURL,profile.model,profile.apiKey]),dedupe=digest([kind,articleId,kind==='assets'?null:sourceSignature,taskId,body,configHash]);
  const previous=jobs.find(j=>j.dedupe===dedupe);if(previous)return res.json(publicJob(previous));
  if(jobs.length>=300)return res.status(400).json({error:'任务记录已满，请在任务中心清理已完成记录'});
  const job={id:crypto.randomUUID(),kind,articleId,sourceSignature,taskId,body,configHash,dedupe,status:'queued',createdAt:now(),model:profile.model||'本机素材整理'};jobs.push(job);persist();res.status(202).json(publicJob(job));void drain();
 });
 router.post('/:id/retry',(req,res)=>{const job=jobs.find(j=>j.id===req.params.id);if(!job||!['failed','interrupted'].includes(job.status))return res.status(400).json({error:'仅失败或中断任务可以重试'});
  const p=job.kind==='assets'?{}:getConfig()[job.kind==='image'?'image':'text'],problem=job.kind==='assets'?null:modelConfigurationError(p,job.kind==='image'?'image':'text');if(problem)return res.status(400).json({error:problem});
  job.configHash=digest([p.baseURL,p.model,p.apiKey]);job.dedupe=digest([job.kind,job.articleId,job.kind==='assets'?null:job.sourceSignature,job.taskId,job.body,job.configHash]);job.model=p.model||'本机素材整理';job.status='queued';job.error=null;job.attempts=(job.attempts||1)+1;persist();res.json(publicJob(job));void drain();
 });
 router.delete('/:id',(req,res)=>{const job=jobs.find(j=>j.id===req.params.id);if(job&&['running','queued'].includes(job.status))return res.status(409).json({error:'请等待任务完成后清理'});jobs=jobs.filter(j=>j.id!==req.params.id);persist();res.json({ok:true})});
 return router;
}
