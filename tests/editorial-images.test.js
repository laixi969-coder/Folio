import{it,expect}from'vitest';
import{newArticle,imageBlock,exportHTML}from'../src/model';
it('新增图片排列导出保留所有图片、顺序及图注，奇数张不丢失',()=>{
 const images=['a','b','c','d'].map((x,i)=>({id:x,src:'/media/'+x+'.png',name:x,alt:'替代'+x,caption:'图注'+x}));
 for(const layout of ['lead-pair','wide-left','wide-right','inset','numbered'])for(const count of [1,2,3,4]){
  const b={...imageBlock(images.slice(0,count)),layout,gap:8};const a={...newArticle(),blocks:[b]};const original=JSON.stringify(a);const html=exportHTML(a);let position=-1;for(const im of b.images){const next=html.indexOf(im.src);expect(next).toBeGreaterThan(position);position=next;expect(html).toContain(im.caption);expect(html).toContain(im.alt)}expect((html.match(/<img /g)||[])).toHaveLength(count);expect(JSON.stringify(a)).toBe(original);if(layout==='numbered')expect(html).toContain('01 /');if(layout==='inset')expect(html).toContain('width:100%');
 }
});
it('裁切比例和主体位置随图片布局导出',()=>{const b={...imageBlock([{id:'a',src:'/media/a.png',position:72}]),layout:'inset',ratio:'wide'};expect(exportHTML({...newArticle(),blocks:[b]})).toContain('aspect-ratio:16/9;object-fit:cover;object-position:72% 50%')});
it('自动设计按数量与位置变化，保留图片和图注，重复排版稳定',async()=>{
 const {autoLayout,parseMarkdown}=await import('../src/model');
 const im=i=>({id:String(i),src:'/media/'+i+'.png',caption:'图片说明'+i});
 const a={...newArticle(),blocks:[...parseMarkdown('开篇'),imageBlock([im(1)]),...parseMarkdown('段落'),imageBlock([im(2)]),...parseMarkdown('## 章节'),imageBlock([im(3)]),imageBlock([im(4)]),...parseMarkdown('段落'),imageBlock([im(5),im(6),im(7)]),...parseMarkdown('结尾'),imageBlock([im(8),im(9),im(10),im(11),im(12)])]};
 const result=autoLayout(a);const groups=result.blocks.filter(b=>b.type==='images');
 expect(groups.map(b=>b.layout)).toEqual(['vertical','vertical','pair','lead-pair','pair']);
 expect(groups.every(b=>b.ratio==='original')).toBe(true);
 expect(groups.flatMap(b=>b.images).map(x=>x.id)).toEqual(Array.from({length:12},(_,i)=>String(i+1)));
 expect(autoLayout(result,result.style)).toEqual(result);
 for(const b of groups){const html=exportHTML({...result,blocks:[b]});expect(html).not.toContain('object-fit:cover');for(const im of b.images)expect(html).toContain(im.caption)}
});
it('图片预览和兼容导出共用同一渲染内容',async()=>{
 const {renderImageGroup}=await import('../src/model');
 for(const layout of ['vertical','inset','wide-left','wide-right','lead-pair','pair','grid','numbered','horizontal']){
  const b={...imageBlock(['a','b','c'].map(id=>({id,src:'/media/'+id+'.png'}))),layout};const a={...newArticle(),blocks:[b]};
  expect(exportHTML(a)).toContain(renderImageGroup(b,a.style));
 }
});
