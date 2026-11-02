import React from'react';
import{it,expect,vi}from'vitest';
import{render,screen,fireEvent,cleanup}from'@testing-library/react';
import{ARTICLE_PALETTES,articlePalette,applyArticlePalette}from'../public/article-palettes.js';
import{newArticle,autoLayout,parseMarkdown,exportHTML,normalizeStyle}from'../src/model';
import ArticlePalettePicker from'../src/ArticlePalettePicker';
it('预览规则与导出使用同一套文章配色，重新排版保留已选配色和原文',()=>{
 for(const p of ARTICLE_PALETTES){const a={...newArticle(),subtitle:'副标题',style:applyArticlePalette(newArticle().style,p.id),blocks:parseMarkdown('开篇\n## 一节\n正文\n> 引语')};const b=autoLayout(a);expect(b.style.paletteId).toBe(p.id);expect(b.blocks.map(b=>b.html)).toEqual(a.blocks.map(b=>b.html));const html=exportHTML(b);for(const color of [p.paper,p.tint,p.accent,p.ink])expect(html).toContain(color);expect(html).not.toContain('#f04b36');expect(html).not.toContain('#1749d2');}
});
it('旧品牌蓝默认脱离文章，保留用户的自定义强调色',()=>{expect(normalizeStyle({preset:'magazine',accent:'#1749d2'}).accent).toBe(ARTICLE_PALETTES[0].accent);expect(articlePalette({accent:'#993322'}).accent).toBe('#993322');expect(normalizeStyle({preset:'classic',accent:'#1749d2'}).accent).toBe('#1749d2')});
it('选择一次以文章级风格交付，不修改输入',()=>{const changed=vi.fn(),s=newArticle().style;render(<ArticlePalettePicker style={s} onChange={changed}/>);fireEvent.click(screen.getByRole('button',{name:'宫墙 · 米纸'}));expect(changed).toHaveBeenCalledWith({...s,paletteId:'cinnabar',accent:'#93443B'});expect(s.paletteId).toBe('celadon');cleanup()});
it('新增十二组正式配色可选、随机可达并保留到导出',async()=>{
 const {NEW_PALETTE_IDS,randomArticlePalette}=await import('../public/article-palettes.js');
 expect(NEW_PALETTE_IDS).toHaveLength(12);
 const changed=vi.fn();const view=render(<ArticlePalettePicker style={newArticle().style} onChange={changed}/>);
 for(const id of NEW_PALETTE_IDS){const palette=ARTICLE_PALETTES.find(p=>p.id===id);expect(palette).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:palette.name}));expect(changed.mock.calls.at(-1)[0]).toMatchObject({paletteId:id,accent:palette.accent});const html=exportHTML({...newArticle(),style:applyArticlePalette(newArticle().style,id),blocks:parseMarkdown('## 测试\n正文')});expect(html).toContain(palette.accent);expect(html).toContain(palette.paper);}
 const selected=new Set(Array.from({length:ARTICLE_PALETTES.length-1},(_,i)=>randomArticlePalette({paletteId:'celadon'},()=>(i+.5)/(ARTICLE_PALETTES.length-1))));for(const id of NEW_PALETTE_IDS)expect(selected.has(id)).toBe(true);
 view.unmount();
});
