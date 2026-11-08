import {it,expect} from 'vitest';
import {applyArticleSeries} from '../public/article-series.js';
import {newArticle,parseMarkdown,normalizeStyle,exportHTML,blockTypography,autoLayout,recognizeNumberedChapters,preserveHeadingPrefix} from '../src/model';
it('书刊风格往返存储与重新排版不丢失，导出包含字号、字体、颜色和完整原文',()=>{
 const article={...newArticle(),subtitle:'写给愿意慢下来的人',blocks:parseMarkdown('这是开篇导语。\n\n## 一、看见生活\n\n保留 **原文的重点**。\n\n> 一段值得停留的话。')};article.blocks[0].type='lead';
 const before=JSON.stringify(article.blocks);article.style=applyArticleSeries(article.style,'book-ivory');
 const restored={...article,style:normalizeStyle(JSON.parse(JSON.stringify(article.style)))};
 expect(restored.style).toMatchObject({typography:'book',headingSeries:'bookish',sidePadding:26,headingSize:23});
 const html=exportHTML(restored);const root=document.createElement('div');root.innerHTML=html;
 expect(root.querySelector('h2').textContent).toBe('看见生活');expect(root.querySelector('h2').parentElement.style.fontFamily).toContain('Songti');
 expect(html).toContain(blockTypography(article.blocks[0],restored.style));expect(html).not.toContain('font-size:48px');expect(html).toContain('padding:0 26px');expect(html).toContain('background:#FBF8F1');expect(html).toContain('原文的重点');
 expect(autoLayout(restored,restored.style).style).toEqual(restored.style);expect(JSON.stringify(article.blocks)).toBe(before);
 const legacy=applyArticleSeries(article.style,'celadon-editorial');expect(legacy.typography).toBe('standard');expect(exportHTML({...article,style:legacy})).toContain('font-size:48px');
});
it('中文顿号编号成为章节且不会重复显示，修改标题保留原始编号',()=>{
 const original={...newArticle(),style:applyArticleSeries(newArticle().style,'book-ink'),blocks:parseMarkdown('引言\n\n1、第一章\n\n正文\n\n2、第二章\n\n结尾')};
 const formatted=recognizeNumberedChapters(original);expect(formatted.blocks.filter(b=>b.type==='heading')).toHaveLength(2);
 const root=document.createElement('div');root.innerHTML=exportHTML(formatted);expect([...root.querySelectorAll('h2')].map(x=>x.textContent)).toEqual(['第一章','第二章']);
 expect(preserveHeadingPrefix('2、第二章','新题目')).toBe('2、新题目');expect(original.blocks[1].type).toBe('paragraph');
});
