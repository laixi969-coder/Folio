import React,{useState,useMemo} from 'react';
import {textOf,uid} from './model';
import {clone,contentSignature,fingerprint} from './editorial-model';
import {planAutomation,previewAutomation,applyAutomation,restoreAutomation,workflowSignature,rhythmIssues,baselineEntries,distributedSources} from './automation-model';
import {ArticleSample} from './EditorialLibrary';
import {buildDeliveryPackage,downloadBlob} from './delivery-package';
export default function AutomationDesk({article,onChange,onLocate,library,saveLibrary,saving,api,onSettings,onTab}){
 const [plan,setPlan]=useState(null),[selected,setSelected]=useState([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[model,setModel]=useState(false),[organize,setOrganize]=useState(true),[entries,setEntries]=useState(true);
 const stale=plan&&workflowSignature(article)!==plan.signature;
 const preview=useMemo(()=>plan&&!stale?previewAutomation(article,plan,selected):article,[article,plan,selected,stale]);
 const issues=useMemo(()=>rhythmIssues(preview),[preview]);
 const images=[...new Map([article.cover,...article.blocks.flatMap(b=>b.images||[])].filter(Boolean).map(im=>[im.src,im])).values()];
 async function inspect(){
  setBusy(true);setError('');setMessage('');
  try{
   const next=planAutomation(article,library);setPlan(next);setSelected(next.changes.map(c=>c.id));
   if(organize&&images.length)await api('/connections/jobs',{method:'POST',body:JSON.stringify({kind:'assets',articleId:article.id,sourceSignature:contentSignature(article),body:{assets:images.map(({id,src,name,alt,source,license})=>({id,src,name,alt,source,license}))}})});
   setMessage('检查完成，请对照预览采用建议。'+(organize&&images.length?'素材整理已进入后台任务。':''));
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function apply(){
  if(!plan||stale)return;setBusy(true);setError('');
  try{
   let next=applyAutomation(article,plan,selected);
   if(entries&&!(next.entryCandidates||[]).some(c=>c.sourceSignature===contentSignature(next)))next={...next,entryCandidates:[...(next.entryCandidates||[]),...baselineEntries(next)]};
   onChange(a=>{if(workflowSignature(a)!==plan.signature)throw Error('文章已变化，请重新检查');return {...a,...next}});
   setPlan(null);setMessage('已采用所选建议，入口候选可在「阅读入口」核对。原稿快照已保存。');
   if(model)await api('/connections/jobs',{method:'POST',body:JSON.stringify({kind:'candidates',articleId:next.id,sourceSignature:contentSignature(next),body:{title:next.title,blocks:distributedSources(next)}})});
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function remember(){if(!library||!article.columnName?.trim())return;const old=library.presets.find(p=>p.id===article.columnId||p.name===article.columnName);const preset={...old,id:old?.id||uid(),name:article.columnName,style:clone(article.style),opening:old?.opening||[],closing:old?.closing||[]};if(await saveLibrary({...library,presets:[...library.presets.filter(p=>p.id!==preset.id),preset]})){onChange({columnId:preset.id});setMessage('已记住本栏目的风格，下次整理同栏目时自动推荐。')}}
 async function deliver(){setBusy(true);setError('');try{const result=await buildDeliveryPackage(article);downloadBlob(result.blob,(article.title||'文章').replace(/[\\/:*?"<>|]/g,'-')+'-交稿包.zip');setMessage('交稿包已下载：正文、发布信息、封面（如有）、审阅清单与可编辑备份。')}catch(e){setError(e.message)}finally{setBusy(false)}}
 const describe=c=>c.kind==='style'?`${c.after.fontSize}px 正文 · ${c.after.lineHeight} 倍行距 · ${c.after.paragraphGap}px 段距`:c.kind==='field'?c.after:c.after.map(b=>b.type==='images'?`${b.images.length} 张 · ${b.layout}`:textOf(b.html)).join('\n');
 return <div className="automation-desk"><section className="automation-hero"><span className="kicker">从初稿到交稿</span><h3>把重复工作，交给 Folio。</h3><p>结构、阅读节奏、图片与交稿检查连起来做。你决定采用哪些建议，正式发布留在公众号后台。</p><div className="automation-steps"><span>01 结构整理</span><span>02 风格与素材</span><span>03 集中审阅</span><span>04 交稿包</span></div></section>
 <section className="desk-card"><div className="desk-grid"><div><h3>一键检查成稿</h3><p>识别章节、导语与明确图注，按自然停顿拆分长段。手工锁定或上次整理后修改的内容会保留。</p><label className="desk-check"><input type="checkbox" checked={organize} onChange={e=>setOrganize(e.target.checked)}/>后台整理本篇素材：去重、尺寸检查与轻量版本</label><label className="desk-check"><input type="checkbox" checked={entries} onChange={e=>setEntries(e.target.checked)}/>采用时准备三组原文标题、摘要与封面候选</label><button className="button primary" disabled={busy||!library} onClick={inspect}>{busy?'正在处理…':plan?'重新检查当前版本':'检查并生成整理建议'}</button></div><div><h3>本栏目偏好</h3><label className="field">栏目名称<input maxLength={120} value={article.columnName||''} onChange={e=>{onChange({columnName:e.target.value});setPlan(null)}} placeholder="例如：每周人物"/></label><button className="button" disabled={!library||saving||!article.columnName?.trim()} onClick={remember}>记住当前排版</button><label className="desk-check"><input type="checkbox" checked={!!article.automationStyleLocked} onChange={e=>onChange({automationStyleLocked:e.target.checked})}/>锁定全文风格，自动整理只处理结构</label></div></div></section>
 {plan&&<section className="desk-card"><div className="desk-row"><h3>集中审阅 · {plan.changes.length} 项建议</h3><span>{plan.protectedIds.length} 块受保护 · {plan.unchanged.length} 块复用上次结果</span></div><p>{plan.presetName?'栏目风格：'+plan.presetName:plan.option.evidence}</p>{stale&&<p className="desk-warning">文章已修改，请重新检查以生成当前版本建议。</p>}<div className="button-row"><button className="button" disabled={stale} onClick={()=>setSelected(plan.changes.map(c=>c.id))}>全选建议</button><button className="button" onClick={()=>setSelected([])}>全部保留原样</button></div><div className="automation-changes">{plan.changes.map(c=><label key={c.id} className="automation-change"><input type="checkbox" disabled={stale} checked={selected.includes(c.id)} onChange={e=>setSelected(e.target.checked?[...selected,c.id]:selected.filter(id=>id!==c.id))}/><div><strong>{c.label}</strong><div className="automation-diff"><p><small>修改前</small>{c.kind==='style'?`${c.before.fontSize}px / ${c.before.lineHeight} 倍行距`:c.kind==='field'?c.before||'未填写':textOf(c.before.html)||c.before.layout||'图片组'}</p><p><small>建议后</small>{describe(c)}</p></div></div></label>)}</div>{!plan.changes.length&&<p>当前结构与排版没有新增建议，可以直接检查阅读入口或交稿。</p>}
 <details><summary>对照全文排版效果</summary><div className="desk-grid"><div><h4>当前稿</h4><ArticleSample article={article}/></div><div><h4>采用所选建议后</h4><ArticleSample article={preview}/></div></div></details>
 <label className="desk-check"><input type="checkbox" checked={model} onChange={e=>setModel(e.target.checked)}/>同时让文字模型补充三组入口候选（发送下方片段，可能计费）</label>{model&&<><button className="text-button" onClick={()=>onSettings('text')}>配置文字模型</button><details><summary>查看将发送的全文分布片段</summary><div className="sent-excerpts">{distributedSources(preview).map(b=><p key={b.id}>{b.text}</p>)}</div></details></>}
 <button className="button primary" disabled={busy||stale} onClick={apply}>采用所选建议，整理成待审稿</button></section>}
 <section className="desk-card"><h3>阅读节奏与待审事项 · {issues.length}</h3>{issues.length?issues.slice(0,30).map((issue,i)=><div className="rhythm-row" key={i}><div><strong>{issue.title}</strong><p>{issue.detail}</p></div><button className="text-button" onClick={()=>onLocate(issue.blockId)}>定位</button></div>):<p>未发现规则范围内的阅读节奏问题。仍需核对事实与真机效果。</p>}{issues.length>30&&<p>另有 {issues.length-30} 项，请在阅读体检查看。</p>}</section>
 <section className="desk-card"><h3>保留手工调整</h3><details><summary>查看并锁定内容块</summary><div className="automation-locks">{article.blocks.map((b,i)=><label className="desk-check" key={b.id}><input type="checkbox" checked={!!b.automationLocked} onChange={e=>{onChange(a=>({...a,blocks:a.blocks.map(x=>x.id===b.id?{...x,automationLocked:e.target.checked}:x)}));setPlan(null)}}/>{i+1}. {textOf(b.html).slice(0,50)||'图片组'}</label>)}</div></details></section>
 <section className="desk-card automation-handoff"><div><h3>准备交稿</h3><p>打包公众号兼容正文、标题摘要作者、封面、待审事项和可编辑备份。下载完成后交给审稿人。</p></div><div className="button-row"><button className="button primary" disabled={busy} onClick={deliver}>下载完整交稿包</button><button className="button" onClick={()=>onTab('candidates')}>审阅阅读入口</button><button className="button" onClick={()=>onTab('jobs')}>查看后台任务</button></div>{article.automationCheckpoint&&<button className="text-button" disabled={busy||article.automationCheckpoint.afterSignature!==workflowSignature(article)} onClick={()=>{try{onChange(restoreAutomation);setPlan(null);setMessage('已恢复本次自动整理前的正文与排版。')}catch(e){setError(e.message)}}}>恢复最近一次整理前的原稿</button>}{article.automationCheckpoint&&article.automationCheckpoint.afterSignature!==workflowSignature(article)&&<p>整理后又有修改，整稿恢复已停用；可以使用编辑器撤销逐步退回。</p>}</section>
 {error&&<p className="inline-error" role="alert">{error}</p>}{message&&<p className="desk-message" role="status">{message}</p>}</div>
}
