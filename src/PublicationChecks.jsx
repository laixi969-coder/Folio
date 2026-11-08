import React from 'react';
import {safeSrc} from './model';
import {publicationSignature} from './editorial-model';

export default function PublicationChecks({article,onChange}) {
  const signature=publicationSignature(article),focus=article.coverFocus||{},check=article.deviceCheck;
  const stage=(key,label)=>{const event=article.deliveryEvents?.[key];return <p><strong>{label}</strong> · {event?`${event.signature===signature?'当前内容':'之前版本'}，${new Date(event.at).toLocaleString('zh-CN')}`:'尚无记录'}</p>};
  return <section className="desk-card publication-checks"><h3>发布过程记录</h3>{stage('copied','正文复制')}{stage('synced','草稿同步')}<p><strong>正式发布</strong> · {article.review?.recordedAt?'用户已手动确认，见发布复盘':'尚未手动确认'}</p>
    <label className="desk-check"><input type="checkbox" checked={check?.signature===signature} onChange={e=>onChange({deviceCheck:e.target.checked?{signature,at:new Date().toISOString()}:null})}/>我已用微信真机检查当前内容</label>{check&&check.signature!==signature&&<p className="desk-warning">内容或版式已改变，需要重新检查。</p>}<p className="muted">请检查图片、字体、组图、引语和长标题。此项仅由你确认，不是系统自动验收。</p>
    {article.cover?.src&&<details><summary>封面裁切参考</summary><p className="muted">分别保存横图与方图焦点。这里是参考预览，上传仍使用原图，最终裁切请在微信后台设置。</p><div className="cover-reference-grid">{[['wide','横图参考',2.35],['square','方图参考',1]].map(([key,label,ratio])=>{const f=focus[key]||{x:50,y:50};return <div key={key}><h4>{label}</h4><img src={safeSrc(article.cover.src)} alt={label} style={{width:'100%',aspectRatio:ratio,objectFit:'cover',objectPosition:`${f.x}% ${f.y}%`}}/>{[['x','左右焦点'],['y','上下焦点']].map(([axis,title])=><label className="field" key={axis}>{label}{title}<input type="range" min="0" max="100" value={f[axis]} onChange={e=>onChange(a=>({...a,coverFocus:{...a.coverFocus,[key]:{...f,[axis]:Number(e.target.value)}}}))}/></label>)}</div>})}</div></details>}
  </section>;
}
