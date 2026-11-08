import{it,expect}from'vitest';
import{splitLongParagraph,splitArticleParagraphs,textOf,newArticle,autoLayout}from'../src/model';

it('长正文在自然停顿拆分，保留加粗、全部文字及顺序',()=>{
 const html='<strong>'+('第一句内容'.repeat(15))+'。</strong>'+('第二句内容'.repeat(14))+'；'+('第三句内容'.repeat(12))+'。';
 const b={id:'original',type:'paragraph',html};const parts=splitLongParagraph(b);
 expect(parts.length).toBeGreaterThan(1);expect(parts.map(x=>textOf(x.html)).join('')).toBe(textOf(html));
 expect(parts[0].id).toBe('original');expect(parts[0].html).toContain('<strong>');
 expect(new Set(parts.map(x=>x.id)).size).toBe(parts.length);
 expect(splitArticleParagraphs({...newArticle(),blocks:[b]}).blocks.length).toBe(parts.length);
 expect(autoLayout({...newArticle(),blocks:[b]}).blocks.length).toBe(parts.length);
});
it('图片说明、标题、短句及无停顿长句不拆分',()=>{
 for(const b of [{type:'heading',html:'标题'.repeat(100)},{type:'paragraph',role:'image-caption',html:'图注。'.repeat(80)},{type:'paragraph',html:'无标点'.repeat(100)},{type:'paragraph',html:'短句。'}])expect(splitLongParagraph(b)).toEqual([b]);
});
