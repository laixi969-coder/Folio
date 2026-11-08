import React from'react';import{describe,it,expect,vi}from'vitest';import{render,screen,fireEvent,cleanup}from'@testing-library/react';
import{HEADING_SERIES,SELECTABLE_HEADING_SERIES,normalizeSeries,randomSeries,headingSeriesStyles}from'../public/heading-series.js';
import HeadingSeriesPicker from'../src/HeadingSeriesPicker';
import{autoLayout,newArticle,parseMarkdown,exportHTML}from'../src/model';
describe('全文副标题系列',()=>{
 it('新增书刊章题，各系列有明确不同的排法',()=>{expect(HEADING_SERIES).toHaveLength(23);expect(new Set(HEADING_SERIES.map(s=>JSON.stringify(headingSeriesStyles({headingSeries:s.id}))))).toHaveProperty('size',23);expect(normalizeSeries('invalid')).toBe('editorial')});
 it('随机一次选一套且不重复当前套，不逐段随机',()=>{for(const s of HEADING_SERIES)for(const r of [0,.25,.5,.75,.999]){expect(randomSeries(s.id,()=>r)).not.toBe(s.id);expect(HEADING_SERIES.map(s=>s.id)).toContain(randomSeries(s.id,()=>r))}});
 it('重新一键排版保留文章已选系列，导出全部章节共用同一套',()=>{for(const series of HEADING_SERIES){const a={...newArticle(),subtitle:'文章副标题',blocks:parseMarkdown('导语\n## 第一章\n正文\n## 第二章\n正文\n### 二级标题')};a.style.headingSeries=series.id;const b=autoLayout(a);expect(b.style.headingSeries).toBe(series.id);const html=exportHTML(b);expect(html).toContain('文章副标题');expect(html).toContain('第一章');expect(html).toContain('第二章');if(series.id==='centered'){expect(html.match(/<h2/g)).toHaveLength(2);expect(html).toContain('text-align:center')}if(series.id==='band')expect(html.match(/background:#E9EEEA/g).length).toBeGreaterThanOrEqual(3)}});
 it('点选与随机按钮只产生文章级系列选择',()=>{const changed=vi.fn();render(<HeadingSeriesPicker value="bookish" onChange={changed}/>);expect(screen.getAllByRole('button',{pressed:false})).toHaveLength(4);fireEvent.click(screen.getByRole('button',{name:/色点章序/}));expect(changed).toHaveBeenLastCalledWith('accent-dot');fireEvent.click(screen.getByRole('button',{name:'随机换一套'}));expect(changed.mock.calls.at(-1)[0]).not.toBe('bookish');cleanup()});
});

it('筛去四款后不再出现在选项或随机结果，旧文章仍可渲染',()=>{const removed=['rule','label','underline','dot'];const change=vi.fn();const view=render(<HeadingSeriesPicker value="rule" onChange={change}/>);for(const name of ['细线分隔','标签引导','短线收束','小圆点'])expect(screen.queryByRole('button',{name:new RegExp(name)})).toBeNull();for(const id of removed){expect(normalizeSeries(id)).toBe(id);for(const r of [0,.2,.5,.999])expect(removed).not.toContain(randomSeries(id,()=>r));expect(exportHTML({...newArticle(),style:{...newArticle().style,headingSeries:id},blocks:parseMarkdown('## 标题')})).toContain('标题')}view.unmount()});

it('精选不同排法，移除浅底块和近似选项，旧稿仍可重排和导出',()=>{
 const ids=['bookish','accent-left','accent-dot','serif-slash','side'];expect(SELECTABLE_HEADING_SERIES.map(s=>s.id)).toEqual(ids);
 const change=vi.fn(),view=render(<HeadingSeriesPicker value="bookish" onChange={change}/>);
 for(const s of SELECTABLE_HEADING_SERIES){fireEvent.click(screen.getByRole('button',{name:new RegExp(s.name)}));expect(change).toHaveBeenLastCalledWith(s.id)}
 for(const old of HEADING_SERIES.filter(s=>!ids.includes(s.id))){expect(screen.queryByRole('button',{name:new RegExp(old.name)})).toBeNull();const a={...newArticle(),style:{...newArticle().style,headingSeries:old.id},blocks:parseMarkdown('## 旧稿章节')};expect(autoLayout(a).style.headingSeries).toBe(old.id);expect(exportHTML(a)).toContain('旧稿章节')}
 view.unmount();
});
it('居左色点保留完整章题与色点短线，编辑和兼容导出使用同一排法',()=>{
 const a={...newArticle(),style:{...newArticle().style,headingSeries:'accent-left'},blocks:parseMarkdown('## 一个很长但仍需要完整显示的章节标题\n正文\n## 第二章\n正文')};
 const html=exportHTML(a),root=document.createElement('div');root.innerHTML=html;
 const titles=[...root.querySelectorAll('[data-folio-heading-title]')];expect(titles).toHaveLength(2);expect(titles[0].textContent).toBe('一个很长但仍需要完整显示的章节标题');expect(titles[0].style.textAlign).toBe('left');expect(titles[0].style.fontSize).toBe('26px');expect(html).toContain('border-radius:50%');expect(html).toContain('width:64px');expect(autoLayout(a).style.headingSeries).toBe('accent-left');
});
