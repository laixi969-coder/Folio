import React,{useMemo,useState} from 'react';
import {uid,textOf,safeSrc} from './model';
import {clone,localCandidates,contentSignature} from './editorial-model';
import {distributedSources} from './automation-model';
import useModelJob from './useModelJob';

export default function EntryCandidates({article,onChange,library,api,onLocate,onSettings}) {
  const job=useModelJob(api,{articleId:article.id,sourceSignature:contentSignature(article)}),[message,setMessage]=useState('');
  const candidates=article.entryCandidates||[];
  const sources=useMemo(()=>distributedSources(article),[article.blocks]);
  const assets=[...new Map([article.cover,...article.blocks.flatMap(b=>b.images||[]),...(library?.assets||[])].filter(Boolean).map(im=>[im.src,im])).values()];
  const update=(id,patch)=>onChange(a=>({...a,entryCandidates:(a.entryCandidates||[]).map(c=>c.id===id?{...c,...patch,...(Object.keys(patch).some(k=>['title','digest','cover'].includes(k))?{verifiedSignature:null}:{})}:c)}));
  async function generate(){const result=await job.run('candidates',{title:article.title,blocks:sources});if(result)setMessage('任务已保存，可离开此页。请到「后台任务」查看结果并收进候选。')}
  return <div><p className="desk-intro">将标题、摘要和封面作为一个完整入口比较。只帮助编辑选择，不预测点击率，也不代表真实流量实验。</p>
    <div className="button-row"><button className="button" disabled={!sources.length} onClick={()=>onChange(a=>({...a,entryCandidates:[...(a.entryCandidates||[]),...localCandidates(a)]}))}>从原文建立候选</button><button className="button" onClick={()=>onChange(a=>({...a,entryCandidates:[...(a.entryCandidates||[]),{id:uid(),title:'',digest:'',audience:'',reason:'',evidenceBlockId:'',evidenceQuote:'',cover:clone(a.cover),origin:'手动编辑',sourceSignature:contentSignature(a),createdAt:new Date().toISOString()}]}))}>新建空白组合</button></div>
    <details className="desk-card"><summary>用文字模型辅助拟定</summary><p>将下方可见的标题与正文片段发送给已配置服务商，可能计费。仅生成候选，不改动文章。</p><button className="text-button" onClick={()=>onSettings('text')}>设置文字模型</button><details><summary>查看将发送的 {sources.length} 个片段（覆盖全文位置，长段截取）</summary><div className="sent-excerpts"><h4>{article.title}</h4>{sources.map(b=><p key={b.id}>{b.text}</p>)}</div></details><button className="button" disabled={job.running||!sources.length} onClick={generate}>发送片段并生成三组候选</button>{job.running&&<p role="status">正在保存任务…</p>}{job.error&&<p className="inline-error" role="alert">{job.error} 可再次点击生成重试。</p>}</details>
    <div className="candidate-grid">{candidates.map((c,index)=>{const stale=c.sourceSignature!==contentSignature(article);return <section className="desk-card" key={c.id}><div className="desk-row"><strong>组合 {index+1}</strong><small>{c.origin}{c.provenance?.model?' · '+c.provenance.model:''}</small></div><div className="entry-card">{c.cover?.src?<img src={safeSrc(c.cover.src)} alt={'组合 '+(index+1)+' 封面'}/>:<div className="cover-placeholder">待选封面</div>}<h3>{c.title||'待拟标题'}</h3><p>{c.digest||'待写摘要'}</p></div>
      {[['title','候选标题'],['digest','候选摘要'],['audience','面向读者'],['reason','选择理由']].map(([key,label])=><label className="field" key={key}>{label}<textarea aria-label={label+' '+(index+1)} rows={2} maxLength={key==='title'?64:key==='digest'?120:600} value={c[key]||''} onChange={e=>update(c.id,{[key]:e.target.value})}/></label>)}
      <label className="field">候选封面<select aria-label={'候选封面 '+(index+1)} value={c.cover?.src||''} onChange={e=>update(c.id,{cover:clone(assets.find(a=>a.src===e.target.value)||null)})}><option value="">不选封面</option>{assets.map(a=><option key={a.src} value={a.src}>{a.name||'图片'}</option>)}</select></label>
      {c.evidenceQuote&&<blockquote>{c.evidenceQuote}</blockquote>}{c.evidenceBlockId&&<button className="text-button" disabled={!article.blocks.some(b=>b.id===c.evidenceBlockId)} onClick={()=>onLocate(c.evidenceBlockId)}>核对原文依据</button>}
      {stale&&<p className="desk-warning">原文已变化，请重新核对这组候选。</p>}
      <label className="desk-check"><input type="checkbox" checked={c.verifiedSignature===contentSignature(article)} onChange={e=>update(c.id,{verifiedSignature:e.target.checked?contentSignature(article):null})}/>已核对标题与摘要的承诺有正文支持</label>
      <button className="button primary" disabled={!c.title.trim()||c.verifiedSignature!==contentSignature(article)} onClick={()=>{onChange(a=>({...a,publishTitle:c.title,digest:c.digest,cover:clone(c.cover),selectedEntryId:c.id}));setMessage('已采用整组发布信息，正文保持原样，可撤销。')}}>采用这组发布信息</button><button className="text-button" onClick={()=>onChange(a=>({...a,entryCandidates:(a.entryCandidates||[]).filter(item=>item.id!==c.id)}))}>移除候选（可撤销）</button>
    </section>})}</div>{message&&<p className="desk-message" role="status">{message}</p>}
  </div>;
}
