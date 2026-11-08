import{describe,it,expect}from'vitest';
import{renderImageGroup,normalizeStyle,newArticle,imageBlock,exportHTML,autoLayout}from'../src/model';

const style=normalizeStyle(newArticle().style);
const block=(treatment,extra={})=>({...imageBlock([{id:'a',src:'/media/a.png',name:'图',alt:'替代',caption:'单图说明 ｜ 摄影：作者'}]),caption:'整组说明 ｜ 来源：作者',treatment,...extra});

describe('参考归藏图片排版的新版式',()=>{
 it('纸底包壳给截图加纸色底、发丝线与内边距，图片和图注都保留',()=>{
  const html=renderImageGroup(block('frame'),style);
  expect(html).toContain('outline:1px solid #CFD8D1');
  expect(html).toContain('padding:0;');
  expect(html).toContain('/media/a.png');
  expect(html).toContain('单图说明');
  expect(html).toContain('整组说明');
 });
 it('浏览器框加三枚窗控点与 CAPTURE 标记',()=>{
  const html=renderImageGroup(block('browser'),style);
  expect((html.match(/border-radius:50%/g)||[])).toHaveLength(3);
  expect(html).toContain('CAPTURE');
  expect(html).toContain('padding:0;');
 });
 it('图片与说明纵向排列，照片与正文两侧对齐且不出现 FIG 标记',()=>{
  const html=renderImageGroup(block('split'),style);
  expect(html).toContain('width:100%');
  expect(html).not.toContain('FIG.');
  expect(html).toContain('整组说明');
  expect(html).toContain('来源：作者');
 });
 it('旧图版标记样式不再输出 FIG 编号且保留图片',()=>{
  const html=renderImageGroup(block('lede'),style);
  expect(html).not.toContain('FIG.');
  expect(html).toContain('/media/a.png');
 });
 it('所有版式都进导出，且不丢图片与文字',()=>{
  for(const treatment of ['plain','feature','frame','browser','lede','split']){
   const html=exportHTML({...newArticle(),blocks:[block(treatment)]});
   for(const text of ['单图说明','摄影：作者','整组说明','来源：作者'])expect(html).toContain(text);
   expect(html).toContain('/media/a.png');
  }
 });
 it('包壳不改变并排与裁切行为',()=>{
  const two={...block('frame'),layout:'pair',images:[{id:'a',src:'/media/a.png'},{id:'b',src:'/media/b.png'}]};
  const html=renderImageGroup(two,style);
  expect((html.match(/outline:1px solid #CFD8D1/g)||[])).toHaveLength(2);
  expect(html).toContain('width:50%');
  expect(html).not.toContain('object-fit:cover');
 });
});

it('自动排图按图片比例与数量选版式，齐边且不裁切',()=>{
 const wide={id:'a',src:'/media/a.png',width:1600,height:900};
 const tall={id:'b',src:'/media/b.png',width:600,height:1000};
 const article={...newArticle(),blocks:[imageBlock([wide,tall])]};
 const result=autoLayout(article);expect(result.blocks[0].layout).toBe('wide-left');
 expect(result.blocks[0].ratio).toBe('original');
 const html=exportHTML(result);expect(html).not.toContain('FIG.');expect(html).not.toContain('object-fit:cover');
 expect(html.indexOf('/media/a.png')).toBeLessThan(html.indexOf('/media/b.png'));
 const screenshot=autoLayout({...newArticle(),blocks:[imageBlock([{...wide,name:'screenshot.png'}])]});
 expect(screenshot.blocks[0].treatment).toBe('browser');
});

it('图片说明识别仅标记图后短段落，保留文字、图片版式并使用较小字号导出',async()=>{
 const {recognizeImageCaptions,isCaptionCandidate}=await import('../src/model');
 const photo={...imageBlock([{id:'a',src:'/media/a.png'}]),layout:'inset',treatment:'lede'};
 const note={id:'note',type:'paragraph',html:'照片说明，保留文字。'};
 const text={id:'text',type:'paragraph',html:'后续正文。'};
 const source={...newArticle(),blocks:[photo,note,text]};
 expect(isCaptionCandidate(source.blocks,1)).toBe(true);
 const result=recognizeImageCaptions(source);
 expect(result.blocks[1]).toEqual({...note,role:'image-caption'});
 expect(result.blocks[0]).toEqual(photo);
 expect(result.blocks[2]).toEqual(text);
 const html=exportHTML(result);
 expect(html).toContain('font-size:13px');
 expect(html).toContain('照片说明，保留文字。');
 expect(html).toContain('width:100%');
 expect(html).not.toContain('FIG.');
});
