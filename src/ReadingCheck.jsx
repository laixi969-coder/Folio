import React, {useMemo, useState} from 'react';
import {readingIssues} from './reading-check';

export default function ReadingCheck({article, onChange, onLocate}) {
  const [limit, setLimit] = useState(180);
  const issues = useMemo(() => readingIssues(article, {paragraphLimit: limit}), [article.blocks, article.style, limit]);
  const ignored = article.readingDismissed || [];
  const visible = issues.filter(issue => !ignored.includes(issue.key));
  return <section className="reading-check" aria-label="阅读体检结果">
    <p className="muted">检查阅读节奏和文字层级，保留你的原文与设计。建议不影响导出。</p>
    <label className="field">长段提示线<select value={limit} onChange={event => setLimit(Number(event.target.value))}>
      <option value={120}>120 字 · 短段阅读</option><option value={180}>180 字 · 常规长文</option><option value={260}>260 字 · 叙事长文</option>
    </select></label>
    <p role="status">{visible.length ? `${visible.length} 项建议，点击定位后可手动调整。` : '当前没有待处理建议，发布前仍建议手机通读。'}</p>
    <ol className="reading-issues">{visible.map(issue => <li key={issue.key}>
      <strong>{issue.title}</strong><p>{issue.detail}</p>
      <div className="button-row"><button className="button" onClick={() => onLocate(issue.blockId)}>定位到正文</button>
        <button className="text-button" onClick={() => onChange(a => ({...a, readingDismissed: [...new Set([...(a.readingDismissed || []).filter(key => issues.some(i => i.key === key)), issue.key])]}))}>忽略此建议</button></div>
    </li>)}</ol>
    {issues.some(issue => ignored.includes(issue.key)) && <button className="text-button" onClick={() => onChange({readingDismissed: []})}>恢复已忽略建议</button>}
  </section>;
}
