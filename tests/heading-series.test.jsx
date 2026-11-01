import React from'react';import{describe,it,expect,vi}from'vitest';import{render,screen,fireEvent,cleanup}from'@testing-library/react';
import{HEADING_SERIES,normalizeSeries,randomSeries,headingSeriesStyles}from'../public/heading-series.js';
import HeadingSeriesPicker from'../src/HeadingSeriesPicker';
import{autoLayout,newArticle,parseMarkdown,exportHTML}from'../src/model';
describe('全文副标题系列',()=>{
 it('共10种，不同系列有明确不同的排法',()=>{expect(HEADING_SERIES).toHaveLength(10);expect(new Set(HEADING_SERIES.map(s=>JSON.stringify(headingSeriesStyles({headingSeries:s.id}))))).toHaveProperty('size',10);expect(normalizeSeries('invalid')).toBe('editorial')});
 it('随机一次选一套且不重复当前套，不逐段随机',()=>{for(const s of HEADING_SERIES)for(const r of [0,.25,.5,.75,.999]){expect(randomSeries(s.id,()=>r)).not.toBe(s.id);expect(HEADING_SERIES.map(s=>s.id)).toContain(randomSeries(s.id,()=>r))}});
 it('重新一键排版保留文章已选系列，导出全部章节共用同一套',()=>{for(const series of HEADING_SERIES){const a={...newArticle(),subtitle:'文章副标题',blocks:parseMarkdown('导语\n## 第一章\n正文\n## 第二章\n正文\n### 二级标题')};a.style.headingSeries=series.id;const b=autoLayout(a);expect(b.style.headingSeries).toBe(series.id);const html=exportHTML(b);expect(html).toContain('文章副标题');expect(html).toContain('第一章');expect(html).toContain('第二章');if(series.id==='centered'){expect(html.match(/<h2/g)).toHaveLength(2);expect(html).toContain('text-align:center')}if(series.id==='band')expect(html.match(/background:#E9EEEA/g).length).toBeGreaterThanOrEqual(3)}});
 it('点选与随机按钮只产生文章级系列选择',()=>{const changed=vi.fn();render(<HeadingSeriesPicker value="editorial" onChange={changed}/>);expect(screen.getAllByRole('button',{pressed:false})).toHaveLength(9);fireEvent.click(screen.getByRole('button',{name:/居中题记/}));expect(changed).toHaveBeenLastCalledWith('centered');fireEvent.click(screen.getByRole('button',{name:'随机换一套'}));expect(changed.mock.calls.at(-1)[0]).not.toBe('editorial');cleanup()});
});
