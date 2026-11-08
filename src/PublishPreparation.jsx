import PublicationChecks from './PublicationChecks';
import {publicationSignature} from './editorial-model';
import React, {useEffect, useState} from 'react';
import {publicationIssues, publishingTitle} from './reading-check';
import {safeSrc} from './model';

export default function PublishPreparation({article, onChange, onCover, dirty, loadStatus, onReadingCheck, busy, refreshKey}) {
  const [status, setStatus] = useState(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus(null); setError('');
    loadStatus(article.id).then(result => {if (active) setStatus(result);}).catch(() => {if (active) setError('同步记录暂时无法读取。');});
    return () => {active = false;};
  }, [article.id, loadStatus, retry, refreshKey]);
  const missing = publicationIssues(article);
  return <section className="publish-preparation" aria-label="发布准备">
    <fieldset disabled={busy}>
      <legend>发布信息</legend>
      <label className="field">发布标题<input value={publishingTitle(article)} onChange={e => onChange({publishTitle: e.target.value})}/></label>
      <p className="muted">用于公众号草稿标题，不改动正文中的大标题。</p>
      <label className="field">发布摘要<textarea rows={3} value={article.digest || ''} placeholder="写明读者能从这篇文章获得什么" onChange={e => onChange({digest: e.target.value})}/></label>
      <p className="muted">摘要独立保存。留空时 Folio 不提取正文，请在微信后台核对平台的最终摘要。</p>
      <label className="field">作者<input value={article.author || ''} onChange={e => onChange({author: e.target.value})}/></label>
      <div className="publish-cover">{article.cover?.src && <img src={safeSrc(article.cover.src)} alt="待发布封面"/>}<div><button className="button" onClick={onCover}>{article.cover?.src ? '更换封面' : '上传封面'}</button><p className="muted">封面裁切以微信后台预览为准。</p></div></div>
    </fieldset>
    {missing.length > 0 && <div className="publish-missing"><strong>同步草稿前还需补充</strong><ul>{missing.map(item => <li key={item}>{item}</li>)}</ul><p>这些项目不影响复制或下载正文。</p></div>}
    <div className="publish-sync" role="status"><strong>公众号同步记录</strong>
      <p>{error || (!status ? '正在读取…' : !status.configured ? '尚未配置公众号。' : status.pending ? '上次创建结果待核对，请先到微信草稿箱检查。' : !status.revision ? '此公众号下暂无本篇同步记录。' : (status.signature ? status.signature !== publicationSignature(article) : dirty || article.revision !== status.revision) ? '本地有新修改，尚未同步。' : '当前版本已同步到公众号草稿箱。')}</p>
      {status?.at && <small>上次记录：{new Date(status.at).toLocaleString('zh-CN')} · 版本 {status.revision || '待核对'}</small>}
      {error && <button className="text-button" onClick={() => setRetry(n => n + 1)}>重新读取同步记录</button>}
      <p className="muted">这是 Folio 的同步记录，未检查远端草稿是否被修改或删除；同步不代表正式发布。</p>
    </div>
    <PublicationChecks article={article} onChange={onChange}/><button className="button" disabled={busy} onClick={onReadingCheck}>检查阅读体验</button>
  </section>;
}
