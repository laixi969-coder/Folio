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
