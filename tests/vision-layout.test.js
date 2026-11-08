import{it,expect}from'vitest';
import{newArticle,imageBlock}from'../src/model';
import{classifyVision,recommendVisionLayouts,applyVisionLayouts}from'../src/vision-layout';
const result=(src,labels=[],extra={})=>({src,width:1000,height:800,labels,faces:0,...extra});
const label=(id,confidence)=>({id,confidence});
it('高置信内容和人脸驱动推荐，低置信不冒充识别成功',()=>{
 expect(classifyVision(result('/a',[label('people',.8)])).kind).toBe('portrait');
 expect(classifyVision(result('/a',[label('suit, suit of clothes',.8)])).kind).toBe('portrait');
 expect(classifyVision(result('/a',[],{faces:1})).kind).toBe('portrait');
 expect(classifyVision(result('/a',[label('document',.22)])).kind).toBe('unknown');
 const a={...newArticle(),blocks:[imageBlock([{src:'/media/a.png'},{src:'/media/b.png'}]),imageBlock([{src:'/media/c.png'}])]};
 const rec=recommendVisionLayouts(a,[result('/media/a.png',[label('outdoor',.93)]),result('/media/b.png',[],{faces:1}),result('/media/c.png',[label('screenshot',.9)])]);
 expect(rec[0]).toMatchObject({layout:'wide-left',kinds:['scene','portrait']});
 expect(rec[1]).toMatchObject({layout:'vertical',treatment:'browser',kinds:['screenshot']});
});
it('应用仅改变匹配图组的排法，保留文字、图像顺序与标注；失效及失败推荐不覆盖',()=>{
 const group={...imageBlock([{src:'/media/a.png',caption:'原图注'},{src:'/media/b.png'}]),caption:'整组'};
 const article={...newArticle(),blocks:[{id:'p',type:'paragraph',html:'正文'},group]};
 const rec=recommendVisionLayouts(article,[result('/media/a.png',[label('outdoor',.9)]),result('/media/b.png',[],{faces:1})]);
 const changed=applyVisionLayouts(article,rec);expect(changed.blocks[0]).toEqual(article.blocks[0]);expect(changed.blocks[1].images).toEqual(group.images);expect(changed.blocks[1].caption).toBe('整组');expect(changed.blocks[1].layout).toBe('wide-left');expect(changed.blocks[1].ratio).toBe('original');
 expect(applyVisionLayouts(article,[{...rec[0],sources:['/changed']}])).toEqual(article);
 expect(applyVisionLayouts(article,[{...rec[0],failed:true}])).toEqual(article);
});
