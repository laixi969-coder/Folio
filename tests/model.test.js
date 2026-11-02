import{describe,it,expect}from'vitest';
import{parseMarkdown,parseHTML,clean,newArticle,imageBlock,exportHTML,suggestions,normalizeStyle}from'../src/model';
describe('导入与安全',()=>{
 it('保留中文顺序并识别层级、引用、强调',()=>{const bs=parseMarkdown('开篇\n## 小标题\n正文 **重点**\n> 引用\n- 列表');expect(bs.map(b=>b.type)).toEqual(['paragraph','heading','paragraph','quote','list']);expect(bs[2].html).toContain('<strong>重点</strong>')});
 it('移除脚本和危险链接',()=>{expect(clean('<script>alert(1)</script><a href="javascript:alert(1)">内容</a><img src=x onerror=alert(1)>')).toBe('<a>内容</a>')});
 it('Word图片和段落保持顺序',()=>{const b=parseHTML('<p>之前</p><p><img src="/media/example.png"></p><p>之后</p>');expect(b.map(b=>b.type)).toEqual(['paragraph','images','paragraph']);expect(b[2].html).toBe('之后')});
 it('拒绝外部Word图片',()=>{expect(parseHTML('<img src="https://example.com/track.png">')).toEqual([])})
});
describe('预览与导出边界',()=>{
 it('兼容导出转纵排，互动导出保留滑动，原稿不变',()=>{const a=newArticle();const b=imageBlock([{id:'1',src:'/media/test.png',alt:'测试',caption:''}]);b.layout='horizontal';a.blocks=[b];expect(exportHTML(a)).not.toContain('overflow-x');expect(exportHTML(a,{compatible:false})).toContain('overflow-x:auto');expect(a.blocks[0].layout).toBe('horizontal')});
 it('只导出正文，不重复发布标题或导出建议',()=>{const a={...newArticle(),title:'独立发布标题',blocks:parseMarkdown('正文')};const html=exportHTML(a);expect(html).toContain('正文');expect(html).not.toContain('独立发布标题');expect(html).not.toContain('contentEditable')});
 it('危险图片地址被清空',()=>{const a={...newArticle(),blocks:[imageBlock([{src:'javascript:alert(1)',id:'x'}])]};expect(exportHTML(a)).not.toContain('javascript:')});
 it('排版参数有范围限制',()=>{expect(normalizeStyle({fontSize:999,sidePadding:-10,accent:'url(x)'})).toMatchObject({fontSize:22,sidePadding:12,accent:'#333333'})});
 it('配图建议只建议，忽略后移除，不改文',()=>{const a={...newArticle(),blocks:parseMarkdown('开篇\n## 回到故乡\n正文')};const s=suggestions(a);expect(s).toHaveLength(1);expect(a.blocks).toHaveLength(3);a.dismissed=[s[0].blockId];expect(suggestions(a)).toHaveLength(0)})
});

describe('一键排版',()=>{
 it('统一默认风格，不改写正文、标题或图注，不自动加图',async()=>{const{autoLayout}=await import('../src/model');const a={...newArticle(),title:'原标题',blocks:parseMarkdown('原文 **重点**\n## 标题\n> 引用')};a.style.fontSize=22;const before=JSON.stringify(a);const b=autoLayout(a);expect(b.style.fontSize).toBe(16);expect(b.title).toBe('原标题');expect(b.blocks.map(b=>b.html)).toEqual(a.blocks.map(b=>b.html));expect(JSON.stringify(a)).toBe(before)});
 it('合并Word连续图片，根据数量设计并保留原比例',async()=>{const{autoLayout}=await import('../src/model');const ims=[{id:'a',src:'/media/a.png',caption:'说明a'},{id:'b',src:'/media/b.png',caption:'说明b'}];const a={...newArticle(),blocks:[...parseMarkdown('之前'),imageBlock([ims[0]]),imageBlock([ims[1]]),...parseMarkdown('之后')]};const b=autoLayout(a);expect(b.blocks).toHaveLength(3);expect(b.blocks[1]).toMatchObject({layout:'wide-left',ratio:'original',images:ims});expect(a.blocks).toHaveLength(4);expect(autoLayout({...a,blocks:[imageBlock([...ims,{id:'c',src:'/media/c.png'}])]}).blocks[0].layout).toBe('lead-pair')});
 it('保留独立整组图注，重复执行稳定，使用个人默认参数',async()=>{const{autoLayout}=await import('../src/model');const first={...imageBlock([{id:'a',src:'/media/a.png'}]),caption:'独立图组说明'};const a={...newArticle(),blocks:[first,imageBlock([{id:'b',src:'/media/b.png'}])]};const b=autoLayout(a,{...a.style,fontSize:18,lineHeight:2});expect(b.blocks).toHaveLength(2);expect(b.blocks[0].caption).toBe(first.caption);expect(b.style.fontSize).toBe(18);expect(autoLayout(b,b.style)).toEqual(b)})
});

describe('编辑层级与阅读节奏',()=>{
 it('识别Word中文章节与数字子标题，保留字句',async()=>{const{autoLayout}=await import('../src/model');const a={...newArticle(),blocks:parseHTML('<p>开篇介绍。</p><p>一、 麦橘（MERJIC）超逼真AI真人全套方法论</p><p>1. 影视级画面质感：用“3-5个具体影调词”锁定美学风格</p><p>法则一：绝不让人物静止超过3秒（破除物理站桩）</p><p><strong>独立加粗的小标题</strong></p>')};const b=autoLayout(a);expect(b.blocks.map(b=>b.type)).toEqual(['lead','heading','subheading','subheading','subheading']);expect(b.blocks.map(b=>b.html)).toEqual(a.blocks.map(b=>b.html))});
 it('明确的文章标题与副标题进入对应区域，普通开篇不被猜成标题',async()=>{const{autoLayout}=await import('../src/model');const a=autoLayout({...newArticle(),blocks:parseMarkdown('# 我的文章\n副标题：从这里开始\n这是一段正文。\n## 章节\n继续讲故事。')});expect(a.title).toBe('我的文章');expect(a.subtitle).toBe('从这里开始');expect(a.blocks).toHaveLength(3);expect(a.blocks[0].type).toBe('lead')});
 it('导出与预览使用同一组字号、字重及间距',async()=>{const{blockTypography,normalizeStyle}=await import('../src/model');const s=normalizeStyle();expect(blockTypography({type:'heading'},s)).toContain('font-size:23px;font-weight:700');expect(blockTypography({type:'subheading'},s)).toContain('font-size:19px;font-weight:650');const a={...newArticle(),subtitle:'这是真实副标题',blocks:parseMarkdown('## 章节\n### 子节\n正文')};const html=exportHTML(a);expect(html).toContain('font-size:19px;font-weight:600');expect(html).toContain('font-size:17px;font-weight:600');expect(html).toContain('line-height:1.98');expect(html).toContain('这是真实副标题')})
});

describe('已确认的杂志默认',()=>{
 it('新稿应用30px齐边留白、15px副标题与杂志预设',()=>{expect(newArticle().style).toMatchObject({preset:'magazine',sidePadding:30,subtitleSize:15,lineHeight:1.98,paragraphGap:24})});
 it('章节编号由实际章节顺序生成，导出保留导语设计和副标题',async()=>{const{autoLayout,headingNumber,headingDisplayHTML}=await import('../src/model');const a=autoLayout({...newArticle(),subtitle:'副标题',blocks:parseMarkdown('导语\n## 一、第一节\n正文\n## 第二节\n正文')});expect(headingNumber(a.blocks,1)).toBe('01');expect(headingNumber(a.blocks,3)).toBe('02');expect(headingDisplayHTML(a.blocks[1].html)).toBe('第一节');expect(a.blocks[1].html).toBe('一、第一节');const html=exportHTML(a);expect(html).toContain('padding:0 30px');expect(html).toContain('font-size:15px');expect(html).toContain('background:#E9EEEA');expect(html).toContain('Georgia,serif;font-size:61px');expect(html).not.toContain('NaN')});
 it('杂志自动排图保留原图与已有图注，不编写新文案',async()=>{const{autoLayout}=await import('../src/model');const pair=imageBlock([{id:'a',src:'/media/a.png'},{id:'b',src:'/media/b.png'}]);const feature={...imageBlock([{id:'c',src:'/media/c.png'}]),caption:'用户自己的图注'};const a=autoLayout({...newArticle(),blocks:[pair,feature]});expect(a.blocks[0].treatment).toBe('plain');expect(a.blocks[0].ratio).toBe('original');expect(a.blocks[1].treatment).toBe('feature');expect(exportHTML(a)).toContain('用户自己的图注');expect(exportHTML(a)).toContain('background:#426B64');expect(a.blocks[1].images).toHaveLength(1)});
 it('旧稿排版可保留经典样式，不强改为杂志',()=>{expect(normalizeStyle({sidePadding:20,fontSize:16})).toMatchObject({preset:'classic',sidePadding:20})})
});

describe('Markdown 结构导入',()=>{
 it('保留表格、代码和图片位置，导出时转义代码与保留表格',()=>{
  const blocks=parseMarkdown('开头\n\n| 名称 | 数量 |\n| --- | --- |\n| **苹果** | 2 |\n\n```js\nif (a < b) {\n  alert("x")\n}\n```\n\n图前 ![说明](photo.png) 图后');
  expect(blocks.map(b=>b.markdownKind||b.markdownImage?'special':b.type)).toEqual(['paragraph','special','special','paragraph','special','paragraph']);
  expect(blocks[1].html).toContain('<table>');
  expect(blocks[1].html).toContain('<strong>苹果</strong>');
  expect(blocks[2].html).toContain('a &lt; b');
  expect(blocks[4].markdownImage).toEqual({src:'photo.png',alt:'说明'});
  const html=exportHTML({...newArticle(),blocks:blocks.slice(0,3)});
  expect(html).toContain('<table style=');expect(html).toContain('<pre style=');expect(html).toContain('a &lt; b');
 });
});
