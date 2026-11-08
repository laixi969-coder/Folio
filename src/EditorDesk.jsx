import React,{useState,useEffect,useRef} from 'react';
import EditorialLibrary from './EditorialLibrary';
import ReadingNotes from './ReadingNotes';
import LayoutOptions from './LayoutOptions';
import ImageWorksheet from './ImageWorksheet';
import EntryCandidates from './EntryCandidates';
import ReviewDesk from './ReviewDesk';
import ReadingCheck from './ReadingCheck';
import PublicationChecks from './PublicationChecks';
import AutomationDesk from './AutomationDesk';
import JobCenter from './JobCenter';
import './editorial.css';

const tabs=[['workflow','自动成稿'],['jobs','后台任务'],['notes','通读标记'],['library','栏目与组件'],['layouts','排版比较'],['images','配图工作单'],['candidates','阅读入口'],['review','发布复盘'],['checks','阅读体检']];
export default function EditorDesk({article,onChange,onLocate,onClose,initialTab='workflow',initialBlockId,selectedIds,api,onSettings,download}) {
  const bodyRef=useRef(null);
  const [tab,setTab]=useState(initialTab),[library,setLibrary]=useState(null),[usage,setUsage]=useState({}),[saving,setSaving]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0);
  useEffect(()=>{let active=true;setError('');Promise.all([api('/editorial/library'),api('/editorial/asset-usage')]).then(([lib,used])=>{if(active){setLibrary(lib);setUsage(used)}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[api,reload]);
  useEffect(()=>{if(bodyRef.current)bodyRef.current.scrollTop=0},[tab]);
  async function saveLibrary(next){if(saving)return false;setSaving(true);setError('');try{const saved=await api('/editorial/library',{method:'PUT',body:JSON.stringify(next)});setLibrary(saved);return true}catch(e){setError(e.message);if(e.current)setLibrary(e.current);return false}finally{setSaving(false)}}
  const common={article,onChange,onLocate,library,saveLibrary,saving,api,onSettings};
  return <div className="overlay editorial-overlay" onClick={onClose}><section className="editorial-desk" role="dialog" aria-modal="true" aria-label="小编工作台" onClick={e=>e.stopPropagation()}>
    <header className="desk-header"><div><span className="kicker">FOLIO · 编辑工具</span><h2>小编工作台</h2><p>{article.title||'未命名文章'} · 所有文章修改自动保存，可回编辑器撤销</p></div><button className="button" aria-label="关闭小编工作台" onClick={onClose}>关闭</button></header>
    <nav className="desk-tabs" aria-label="小编工具">{tabs.map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}{id==='notes'&&(article.readingNotes||[]).some(n=>!n.resolved)?` ${(article.readingNotes||[]).filter(n=>!n.resolved).length}`:''}</button>)}</nav>
    <div className="desk-body" ref={bodyRef}>{error&&<div className="inline-error" role="alert">{error}<button className="button" onClick={()=>setReload(n=>n+1)}>重新读取素材库</button></div>}
      {tab==='workflow'&&<AutomationDesk {...common} onTab={setTab}/>}
      {tab==='jobs'&&<JobCenter {...common}/>}
      {tab==='notes'&&<ReadingNotes {...common} initialBlockId={initialBlockId}/>}
      {tab==='library'&&<EditorialLibrary {...common} selectedIds={selectedIds}/>}
      {tab==='layouts'&&<LayoutOptions {...common}/>}
      {tab==='images'&&<ImageWorksheet {...common} usage={usage}/>}
      {tab==='candidates'&&<EntryCandidates {...common}/>}
      {tab==='review'&&<><ReviewDesk {...common} download={download}/><PublicationChecks article={article} onChange={onChange}/></>}
      {tab==='checks'&&<ReadingCheck article={article} onChange={onChange} onLocate={onLocate}/>}
    </div>
  </section></div>;
}
