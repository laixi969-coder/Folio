import React, {useState} from 'react';
import {it, expect, vi, afterEach} from 'vitest';
import {render, screen, fireEvent, cleanup} from '@testing-library/react';
import {newArticle, exportHTML} from '../src/model';
import {readingIssues, publicationIssues, publishingTitle} from '../src/reading-check';
import ReadingCheck from '../src/ReadingCheck';
import PublishPreparation from '../src/PublishPreparation';

afterEach(cleanup);
const paragraph = (id, html) => ({id, type: 'paragraph', html});
it('检查原文不变，忽略图注、代码和引用的字号风格', () => {
  const article = {...newArticle(), blocks: [paragraph('long', '长'.repeat(181)), paragraph('bold', '<b><strong>'+'重'.repeat(45)+'</strong></b>'+'轻'.repeat(20)), paragraph('size', '<span style="font-size:32px">放大</span>'), {id:'sub',type:'subheading',html:'独立小节'}, {...paragraph('caption','图'.repeat(200)),role:'image-caption'}, {...paragraph('code','<pre>'+'码'.repeat(200)+'</pre>'),markdownKind:'code'}, {id:'quote',type:'quote',html:'<span style="font-size:32px">引语</span>'}]};
  const before = JSON.stringify(article);
  const issues = readingIssues(article);
  expect(issues.map(i=>i.kind)).toEqual(['length','emphasis','size','hierarchy']);
  expect(issues.find(i=>i.kind==='emphasis').detail).toContain('69%');
  expect(JSON.stringify(article)).toBe(before);
});
it('连续文字在章节和图片处断开，修改后建议身份更新', () => {
  const a={...newArticle(),blocks:[1,2,3].map(n=>paragraph(String(n),'文'.repeat(210)))};
  expect(readingIssues(a).some(i=>i.kind==='density')).toBe(true);
  const original=readingIssues(a)[0].key;
  a.blocks[0]={...a.blocks[0],html:'新'+a.blocks[0].html};
  expect(readingIssues(a)[0].key).not.toBe(original);
  a.blocks.splice(1,0,{id:'img',type:'images',images:[]});
  expect(readingIssues(a).some(i=>i.kind==='density')).toBe(false);
});
it('体检支持定位、忽略和恢复，不向正文导出检查记录', () => {
  const locate=vi.fn();
  let latest;
  function Harness(){const [a,setA]=useState({...newArticle(),blocks:[paragraph('long','文'.repeat(181))]});latest=a;return <ReadingCheck article={a} onLocate={locate} onChange={patch=>setA(a=>typeof patch==='function'?patch(a):{...a,...patch})}/>}
  render(<Harness/>);
  fireEvent.click(screen.getByText('定位到正文'));expect(locate).toHaveBeenCalledWith('long');
  fireEvent.click(screen.getByText('忽略此建议'));expect(screen.queryByText('这一段较长')).toBeNull();
  expect(exportHTML(latest)).not.toContain('readingDismissed');
  fireEvent.click(screen.getByText('恢复已忽略建议'));expect(screen.getByText('这一段较长')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('长段提示线'),{target:{value:'260'}});expect(screen.queryByText('这一段较长')).toBeNull();
});
it('旧稿沿用标题，单独发布标题允许清空并提示；封面只阻止同步', () => {
  const a={...newArticle(),title:'原始标题'};
  expect(publishingTitle(a)).toBe('原始标题');
  expect(publicationIssues(a)).toEqual(['请上传封面']);
  expect(publicationIssues({...a,publishTitle:''})).toContain('请填写发布标题');
});
it('发布面板保留独立摘要，同步状态随本地修改变化，失败可重试', async () => {
  const a={...newArticle(),id:'a',title:'正文标题',revision:2,digest:'独立摘要'};
  const load=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue({configured:true,revision:2,at:'2026-11-07T10:00:00Z'}), change=vi.fn();
  const props={article:a,onChange:change,onCover:vi.fn(),loadStatus:load,onReadingCheck:vi.fn(),dirty:false};
  const {rerender}=render(<PublishPreparation {...props}/>);
  await screen.findByText('同步记录暂时无法读取。');fireEvent.click(screen.getByText('重新读取同步记录'));
  await screen.findByText('当前版本已同步到公众号草稿箱。');
  fireEvent.change(screen.getByLabelText('发布标题'),{target:{value:'新发布标题'}});expect(change).toHaveBeenCalledWith({publishTitle:'新发布标题'});
  expect(screen.getByLabelText('发布摘要').value).toBe('独立摘要');
  rerender(<PublishPreparation {...props} dirty/>);expect(screen.getByText('本地有新修改，尚未同步。')).toBeTruthy();
  rerender(<PublishPreparation {...props} article={{...a,revision:3}}/>);expect(screen.getByText('本地有新修改，尚未同步。')).toBeTruthy();
  expect(load).toHaveBeenCalledTimes(2);
});
