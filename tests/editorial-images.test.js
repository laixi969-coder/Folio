import{it,expect}from'vitest';
import{newArticle,imageBlock,exportHTML}from'../src/model';
it('新增图片排列导出保留所有图片、顺序及图注，奇数张不丢失',()=>{
 const images=['a','b','c','d'].map((x,i)=>({id:x,src:'/media/'+x+'.png',name:x,alt:'替代'+x,caption:'图注'+x}));
 for(const layout of ['lead-pair','wide-left','wide-right','inset','numbered'])for(const count of [1,2,3,4]){
  const b={...imageBlock(images.slice(0,count)),layout,gap:8};const a={...newArticle(),blocks:[b]};const original=JSON.stringify(a);const html=exportHTML(a);let position=-1;for(const im of b.images){const next=html.indexOf(im.src);expect(next).toBeGreaterThan(position);position=next;expect(html).toContain(im.caption);expect(html).toContain(im.alt)}expect((html.match(/<img /g)||[])).toHaveLength(count);expect(JSON.stringify(a)).toBe(original);if(layout==='numbered')expect(html).toContain('01 /');if(layout==='inset')expect(html).toContain('width:82%');
 }
});
it('裁切比例和主体位置随图片布局导出',()=>{const b={...imageBlock([{id:'a',src:'/media/a.png',position:72}]),layout:'inset',ratio:'wide'};expect(exportHTML({...newArticle(),blocks:[b]})).toContain('aspect-ratio:16/9;object-fit:cover;object-position:72% 50%')});
