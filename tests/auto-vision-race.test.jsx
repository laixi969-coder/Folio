import React from 'react';import{it,expect,vi}from'vitest';import{screen,fireEvent,waitFor}from'@testing-library/react';
it('后台识别期间手动调整图片不会被迟到的推荐覆盖',async()=>{
 document.body.innerHTML='<div id="root"></div>';window.scrollTo=vi.fn();let finish;
 let stored={id:'race',revision:1,title:'并发文章',status:'draft',style:{preset:'magazine'},blocks:[{id:'img',type:'images',images:[{id:'a',src:'/media/a.png'},{id:'b',src:'/media/b.png'}],layout:'pair',ratio:'original',gap:8}]};
 global.fetch=vi.fn(async(url,options)=>{
  if(url==='/api/articles')return{ok:true,json:async()=>({articles:[{id:'race',title:'并发文章',wordCount:0,updatedAt:new Date().toISOString()}],defaultStyle:null})};
  if(url==='/api/articles/race'&&!options?.method)return{ok:true,json:async()=>stored};
  if(url==='/api/articles/race'&&options?.method==='PUT'){stored={...JSON.parse(options.body),revision:stored.revision+1};return{ok:true,json:async()=>stored}}
  if(url==='/api/articles/race/local-vision')return await new Promise(resolve=>{finish=()=>resolve({ok:true,json:async()=>({results:[{src:'/media/a.png',width:1000,height:800,labels:[{id:'outdoor',confidence:.9}],faces:0},{src:'/media/b.png',width:1000,height:800,labels:[],faces:1}]})})});
  throw Error('unexpected '+url);
 });
 await import('../src/main.jsx');await screen.findByRole('button',{name:/并发文章/});fireEvent.click(screen.getByRole('button',{name:/并发文章/}));await screen.findByRole('button',{name:'一键排版'});fireEvent.click(screen.getByRole('button',{name:'一键排版'}));await waitFor(()=>expect(finish).toBeTypeOf('function'));
 fireEvent.click(screen.getByText('继续微调'));await waitFor(()=>expect(document.querySelector('.image-export-preview')).toBeTruthy());fireEvent.click(document.querySelector('.image-export-preview'));fireEvent.change(screen.getByLabelText('排列方式'),{target:{value:'vertical'}});expect(screen.getByLabelText('排列方式').value).toBe('vertical');finish();fireEvent.click(screen.getByRole('button',{name:'预览'}));
 await waitFor(()=>expect(screen.getByText('图片已手动调整，保留你的修改。')).toBeTruthy());expect(document.querySelectorAll('.image-export-preview img')).toHaveLength(2);expect(document.querySelector('.image-export-preview').innerHTML).not.toContain('width:62%');
});
