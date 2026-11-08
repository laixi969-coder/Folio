import{describe,it,expect}from'vitest';
import{NEW_CHAPTER_IDS,applyHeadingSeries,seriesHeadingHTML}from'../public/heading-series.js';
import{newArticle,autoLayout,exportHTML,parseMarkdown,preserveHeadingPrefix,headingDisplayHTML}from'../src/model';

describe('五款章节版式',()=>{
 it('五款都可导出，结构各异，段距按参考图拉开',()=>{
  const margins={'accent-dot':'64px 0 32px','serif-slash':'56px 0 32px','full-rule':'34px 0 48px','indent-block':'96px 0 56px','framed-air':'96px 0 56px'};
  const rendered=new Set();
  for(const id of NEW_CHAPTER_IDS){
   const a={...newArticle(),style:applyHeadingSeries(newArticle().style,id),blocks:parseMarkdown('## 第一节\n正文\n## 第二节')};
   const html=exportHTML(a);
   expect(html).toContain('margin:'+margins[id]);
   expect(html).toContain('第一节');
   expect(html).toContain('data-folio-heading-title');
   expect(html).toContain('01');
   expect(html).toContain('02');
   rendered.add(seriesHeadingHTML(a.style,'01','第一节'));
  }
  expect(rendered.size).toBe(5);
 });
 it('色点有大编号、圆点与短色带',()=>{
  const html=seriesHeadingHTML({...newArticle().style,headingSeries:'accent-dot'},'01','标题');
  expect(html).toContain('font-size:56px');
  expect(html).toContain('border-radius:50%');
  expect(html).toContain('width:96px;max-width:100%;height:3px');
  expect(html).toContain('text-align:center');
  expect(html).toContain('font-size:32px');
  expect(html).not.toContain('112px');
 });
 it('宋体留白框使用真实边框和内边距，长标题完整显示，字号跟随设置',()=>{
  const html=seriesHeadingHTML({...newArticle().style,headingSeries:'serif-slash',headingSize:26},'01','金钟的一次见面，和一份4.5亿港元的担保');
  const root=document.createElement('div');root.innerHTML=html;const title=root.querySelector('[data-folio-heading-title]');
  expect(title.textContent).toBe('金钟的一次见面，和一份4.5亿港元的担保');expect(title.style.fontSize).toBe('26px');expect(title.style.lineHeight).toBe('1.6');
  expect(root.querySelector('table')).toBeNull();expect(root.querySelectorAll('[aria-hidden=true]')).toHaveLength(0);expect(html).toContain('border:1px solid');expect(html).toContain('padding:32px 20px 34px');
  expect(html).toContain('margin:56px 0 32px');expect(html).toContain('font-size:12px');expect(html).not.toContain('font-size:36px');
  const custom=document.createElement('div');custom.innerHTML=seriesHeadingHTML({headingSeries:'serif-slash',headingSize:23},'02','章节');expect(custom.querySelector('h2').style.fontSize).toBe('23px');
 });
 it('带框款是细框加大内边距',()=>{
  const html=seriesHeadingHTML({...newArticle().style,headingSeries:'framed-air'},'01','标题');
  expect(html).toContain('border:1px solid');
  expect(html).toContain('padding:40px 34px 42px');
 });
 it('选章节系列会联动开篇题记，旧系列不动题记',()=>{
  const next=applyHeadingSeries({subtitleSeries:'eyebrow'},'accent-dot');
  expect(next.headingSeries).toBe('accent-dot');
  expect(next.subtitleSeries).toBe('accent-dot');
  expect(applyHeadingSeries({subtitleSeries:'tinted'},'editorial').subtitleSeries).toBe('tinted');
 });
 it('一键排版保留章节与题记版式',()=>{
  const a={...newArticle(),subtitle:'题记',style:applyHeadingSeries(newArticle().style,'framed-air'),blocks:parseMarkdown('## 一、第一节\n正文')};
  const b=autoLayout(a);
  expect(b.style.headingSeries).toBe('framed-air');
  expect(b.style.subtitleSeries).toBe('framed-air');
  const html=exportHTML(b);
  expect(html).toContain('data-deck="framed-air"');
  expect(html).toContain('padding:40px 34px 42px');
 });
});

it('数字加空格的 Word 段落识别为章节，并保留原始编号和正文',()=>{
 const blocks=[{id:'p',type:'paragraph',html:'上一段。'},{id:'h',type:'paragraph',html:'7 161亿进了专户，海外数字还在打架'},{id:'t',type:'paragraph',html:'正文保持不变。'}];
 const article=autoLayout({...newArticle(),blocks,style:applyHeadingSeries(newArticle().style,'serif-slash')});
 expect(article.blocks[1].type).toBe('heading');
 expect(article.blocks[1].html).toBe(blocks[1].html);
 const html=exportHTML(article);
 const root=document.createElement('div');root.innerHTML=html;expect(root.querySelector('h2').previousElementSibling.textContent).toBe('07');
 expect(root.querySelector('h2').textContent).toContain('161亿进了专户');
 expect(html).not.toContain('>7 161亿');
 expect(html).toContain('正文保持不变。');
});

it('编辑章节显示标题一次，并保留原有编号',()=>{
 expect(headingDisplayHTML('<strong>7 标题</strong>')).toBe('<strong>标题</strong>');
 expect(preserveHeadingPrefix('<strong>7 标题</strong>','<strong>新标题</strong>')).toBe('7 <strong>新标题</strong>');
});
