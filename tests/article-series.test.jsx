import React from'react';
import{it,expect,vi}from'vitest';
import{render,screen,fireEvent,cleanup}from'@testing-library/react';
import{ARTICLE_SERIES,applyArticleSeries,currentArticleSeries,randomArticleSeries}from'../public/article-series.js';
import{ARTICLE_PALETTES,randomArticlePalette}from'../public/article-palettes.js';
import{newArticle,parseMarkdown,autoLayout,exportHTML,normalizeStyle,imageBlock}from'../src/model';
import ArticleSeriesPicker from'../src/ArticleSeriesPicker';
it('整篇替换一次同时更新配色与排法，保留正文、图注、顺序、个人字号和留白',()=>{
 const a={...newArticle(),subtitle:'副标题',blocks:[...parseMarkdown('开篇\n## 第一节\n正文\n## 第二节\n正文'),{...imageBlock([{id:'image',src:'/media/a.png',caption:'原图注'}]),treatment:'feature',caption:'用户说明'}]};a.style.sidePadding=32;a.style.subtitleSize=18;
 const before=JSON.stringify(a);
 for(const series of ARTICLE_SERIES){const style=applyArticleSeries(a.style,series.id),p=ARTICLE_PALETTES.find(p=>p.id===series.paletteId),b={...a,style};expect(style).toMatchObject({paletteId:series.paletteId,headingSeries:series.headingSeries,accent:p.accent,sidePadding:32,subtitleSize:18});expect(currentArticleSeries(style).id).toBe(series.id);expect(normalizeStyle(JSON.parse(JSON.stringify(style)))) .toMatchObject(style);expect(autoLayout(b).style).toMatchObject({paletteId:series.paletteId,headingSeries:series.headingSeries,accent:p.accent});const html=exportHTML(b);expect(html).toContain('原图注');expect(html).toContain(p.accent);expect(html).toContain(p.paper);expect(html).toContain('padding:0 32px');expect((html.match(/第一节|第二节/g)||[])).toHaveLength(2);if(series.headingSeries==='centered')expect(html.match(/<h2/g)).toHaveLength(2);}
 expect(JSON.stringify(a)).toBe(before);
});
it('自定义组合不误标为预设，随机整篇只抽一次且排除当前系列',()=>{
 for(const s of ARTICLE_SERIES){const style=applyArticleSeries({},s.id);for(const r of [0,.2,.5,.999])expect(randomArticleSeries(style,()=>r)).not.toBe(s.id);expect(currentArticleSeries({...style,accent:'#123456'})).toBeNull()}
 expect(currentArticleSeries({paletteId:'celadon',headingSeries:'band'})).toBeNull();expect(ARTICLE_SERIES.map(s=>s.id)).toContain(randomArticleSeries({paletteId:'celadon',headingSeries:'band'}));for(const p of ARTICLE_PALETTES)expect(randomArticlePalette({paletteId:p.id},()=>.99)).not.toBe(p.id);
});
it('一个按钮只产生一次完整风格更新，微调后可返回系列',()=>{const change=vi.fn(),style={...newArticle().style,sidePadding:33};const view=render(<ArticleSeriesPicker style={style} onChange={change}/>);fireEvent.click(screen.getByRole('button',{name:'宫墙细线 细线分隔'}));expect(change).toHaveBeenCalledTimes(1);expect(change).toHaveBeenLastCalledWith({...style,accent:'#93443B',paletteId:'cinnabar',headingSeries:'rule'});fireEvent.click(screen.getByRole('button',{name:'随机整篇换一套'}));expect(change).toHaveBeenCalledTimes(2);expect(currentArticleSeries(change.mock.calls[1][0]).id).not.toBe('celadon-editorial');view.rerender(<ArticleSeriesPicker style={{...style,headingSeries:'band'}} onChange={change}/>);expect(screen.getByRole('status').textContent).toContain('自定义组合');expect(screen.getAllByRole('button',{pressed:false})).toHaveLength(6);cleanup()});
