import {textOf,autoLayout,splitLongParagraph,layoutArticleImages,normalizeStyle,uid} from './model';
import {fingerprint,contentSignature,clone,LAYOUTS,layoutStyle,localCandidates} from './editorial-model';
import {readingIssues,publicationIssues} from './reading-check';

// Evenly sample the whole document, including its end, within the provider's budget.
export function distributedSources(article) {
 const all=article.blocks.filter(b=>b.html&&textOf(b.html).trim());
 const count=Math.min(all.length,120),chosen=Array.from({length:count},(_,i)=>all[count===1?0:Math.round(i*(all.length-1)/(count-1))]);
 const budget=Math.max(40,Math.min(1800,Math.floor(19000/Math.max(count,1))));
 return chosen.map(b=>({id:b.id,text:textOf(b.html).slice(0,budget)}));
}
export function recommendedLayout(article) {
 const text=article.blocks.map(b=>textOf(b.html)).join(''),pictures=article.blocks.filter(b=>b.type==='images').length;
 const lists=article.blocks.filter(b=>b.type==='list'||b.markdownKind==='list').length;
 const option=LAYOUTS.find(l=>l.id===(lists>=3||/步骤|操作指南|产品说明/.test(article.title)?'scan':pictures>=3||/人物|故事|采访|回忆/.test(article.title)?'story':'calm'));
 return {...option,evidence:`${text.length} 字 · ${pictures} 组图片 · ${lists} 个列表。${option.reason}`};
}
export const workflowSignature=a=>fingerprint([a.title,a.subtitle,a.blocks,a.style,a.columnId,a.columnName]);
export function planAutomation(article,library) {
 const previous=article.automationState||{},option=recommendedLayout(article);
 const preset=library?.presets.find(p=>p.id===article.columnId||article.columnName&&p.name===article.columnName);
 const style=normalizeStyle(preset?.style||layoutStyle(article.style,option));
 const changes=[],protectedIds=[],unchanged=[];
 for(const [i,b] of article.blocks.entries()) {
  const sig=fingerprint(b),last=previous.blocks?.[b.id];
  if(b.automationLocked||(last&&last!==sig)||b.fontSize||b.fontFamily||/<span[^>]+style=/i.test(b.html||'')){protectedIds.push(b.id);continue}
  if(last===sig){unchanged.push(b.id);continue}
  let next=[b],label='整理阅读结构';const plain=textOf(b.html).trim();
  if(b.type==='images'){
   // Existing deliberate image treatments/crops are protected, even on the first pass.
   if(b.ratio&&b.ratio!=='original'||b.treatment&&!['plain'].includes(b.treatment)||b.layout&&!['vertical','pair'].includes(b.layout)){protectedIds.push(b.id);continue}
   next=layoutArticleImages({...article,blocks:[b]}).blocks;label='按图片比例安排图组';
  }else if(b.role==='title'||/^标题[：:]/.test(plain)){
   if(!article.title?.trim()){changes.push({id:'title',kind:'field',field:'title',before:article.title||'',after:plain.replace(/^标题[：:]\s*/,''),label:'识别文章标题'});}continue;
  }else if(/^副标题[：:]/.test(plain)&&!article.subtitle){changes.push({id:'subtitle',kind:'field',field:'subtitle',before:article.subtitle||'',after:plain.replace(/^副标题[：:]\s*/,''),label:'识别副标题'});continue;
  }else if(b.type==='paragraph'&&!b.role&&!b.markdownKind){
   if(article.blocks[i-1]?.type==='images'&&plain.length<=100&&/^(图[片源注]?|来源|摄影|©|photo|图片来源|资料来源)[：:\s\d]/i.test(plain)){next=[{...b,role:'image-caption'}];label='识别图片说明'}
   else {next=autoLayout({...article,title:article.title||'正文',blocks:[b]},article.style).blocks;
    if(i===0&&next.length===1&&next[0].type==='paragraph'&&plain.length>=30&&plain.length<=110&&article.blocks.length>=3){next=[{...b,type:'lead'}];label='设置开篇导语'}
    else label=next.length>1?'按句子停顿拆分长段':next[0]?.type!==b.type?'建立章节层级':'整理阅读结构';
   }
  }
  if(fingerprint([b])!==fingerprint(next))changes.push({id:b.id,kind:'block',blockId:b.id,before:clone(b),after:next,label});
 }
 if(fingerprint(style)!==fingerprint(normalizeStyle(article.style))&&!article.automationStyleLocked&&(!previous.style||previous.style===fingerprint(article.style)))changes.push({id:'style',kind:'style',before:clone(article.style),after:style,label:preset?'沿用已确认的栏目风格':'采用'+option.name});
 return {signature:workflowSignature(article),changes,protectedIds,unchanged,option,presetName:preset?.name,createdAt:new Date().toISOString()};
}
export function previewAutomation(article,plan,selected=plan.changes.map(c=>c.id)) {
 if(workflowSignature(article)!==plan.signature)throw Error('文章已变化，请重新检查建议。');
 let result={...article};for(const c of plan.changes.filter(c=>selected.includes(c.id))){
  if(c.kind==='block')result.blocks=result.blocks.flatMap(b=>b.id===c.blockId?clone(c.after):b);
  else if(c.kind==='style')result.style=clone(c.after);
  else result[c.field]=c.after;
 }return result;
}
export function applyAutomation(article,plan,selected) {
 const result=previewAutomation(article,plan,selected);
 const before={title:article.title,subtitle:article.subtitle,style:clone(article.style),blocks:clone(article.blocks),automationState:clone(article.automationState)};
 const accepted=plan.changes.filter(c=>selected.includes(c.id)),handled=new Set(accepted.filter(c=>c.kind==='block').flatMap(c=>c.after.map(b=>b.id)));
 // Remember only confirmed/unaffected blocks. Declined suggestions remain reviewable.
 const pending=new Set(plan.changes.filter(c=>c.kind==='block'&&!selected.includes(c.id)).map(c=>c.blockId));
 const hashes={...article.automationState?.blocks};for(const b of result.blocks)if(!pending.has(b.id)&&(!plan.protectedIds.includes(b.id)||handled.has(b.id)))hashes[b.id]=fingerprint(b);
 return {...result,automationState:{blocks:hashes,style:fingerprint(result.style),checkedAt:new Date().toISOString()},automationCheckpoint:{before,afterSignature:workflowSignature(result),at:new Date().toISOString()},automationReport:{applied:accepted.length,protected:plan.protectedIds.length,unchanged:plan.unchanged.length}};
}
export function restoreAutomation(article){const cp=article.automationCheckpoint;if(!cp||cp.afterSignature!==workflowSignature(article))throw Error('整理后又做了修改，请使用编辑器撤销或先导出备份，避免覆盖新内容。');return {...article,...clone(cp.before),automationCheckpoint:null,automationReport:null}}
export function rhythmIssues(article){const issues=readingIssues(article);article.blocks.forEach((b,i)=>{
 const length=textOf(b.html).trim().length;
 if(['heading','subheading'].includes(b.type)&&length>22)issues.push({blockId:b.id,kind:'heading-wrap',title:'章题可能出现多行折返',detail:'建议在手机预览核对断行；标题文字由编辑决定。'});
 if(b.role==='image-caption'&&article.blocks[i-1]?.type!=='images')issues.push({blockId:b.id,kind:'caption-gap',title:'图注与图片分离',detail:'请将图注移回对应图片下方。'});
 if(b.type==='heading'&&['heading','subheading'].includes(article.blocks[i-1]?.type))issues.push({blockId:b.id,kind:'heading-gap',title:'连续章题缺少正文过渡',detail:'核对章节层级与阅读停顿。'});
 });return issues}
export function reviewChecklist(article){return [...publicationIssues(article),...rhythmIssues(article).map(i=>i.title),...(article.readingNotes||[]).filter(n=>!n.resolved).map(n=>'通读标记待处理：'+(n.text||n.note||'原文标记')),'人工核对事实、配图来源及微信真机预览'];}
export function baselineEntries(article){const candidates=localCandidates(article),all=article.blocks.filter(b=>textOf(b.html).trim());
 while(candidates.length<3&&all.length){const b=all[Math.round((candidates.length/2)*(all.length-1))];candidates.push({id:uid(),title:textOf(b.html).split(/[。！？!?]/)[0].slice(0,64),digest:textOf(b.html).slice(0,120),evidenceBlockId:b.id,evidenceQuote:textOf(b.html).slice(0,160),reason:'原文摘录，需要核对是否代表全文。',origin:'原文摘录',sourceSignature:contentSignature(article),createdAt:new Date().toISOString()})}
 const covers=[...new Map([article.cover,...article.blocks.flatMap(b=>b.images||[])].filter(Boolean).map(im=>[im.src,im])).values()];
 return candidates.map((c,i)=>{const index=article.blocks.findIndex(b=>b.id===c.evidenceBlockId),body=i?article.blocks.slice(index+1).find(b=>['paragraph','lead'].includes(b.type)&&!b.role):null;return {...c,...(body?{digest:textOf(body.html).slice(0,120)}:{}),cover:clone(covers[i%Math.max(covers.length,1)]||null)}});
}
export function adoptJob(article,job){
 if(job.articleId!==article.id||job.status!=='completed'||(article.appliedJobIds||[]).includes(job.id))return article;
 if(job.sourceSignature!==contentSignature(article))throw Error('正文已变化，旧任务保留在任务中心，请针对当前正文重新生成。');
 let next;
 if(job.kind==='candidates')next={...article,entryCandidates:[...(article.entryCandidates||[]),...job.result.candidates.map((c,i)=>({...c,id:job.id+'-'+i,cover:clone(article.cover||article.blocks.flatMap(b=>b.images||[])[i]||null),sourceSignature:job.sourceSignature,origin:'模型建议',provenance:job.result.provenance,createdAt:job.result.provenance.createdAt}))]};
 else {const task=article.imageTasks?.find(t=>t.id===job.taskId);if(!task||task.prompt!==job.result.prompt)throw Error('配图工作单已修改或删除，图片仍保留在任务中心。');next={...article,imageTasks:article.imageTasks.map(t=>t.id===job.taskId?{...t,generatedAsset:job.result.asset,status:'待选图'}:t)}}
 return {...next,appliedJobIds:[...(article.appliedJobIds||[]),job.id]};
}
