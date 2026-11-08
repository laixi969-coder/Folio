import React from'react';import{it,expect,vi}from'vitest';import{screen,fireEvent,waitFor}from'@testing-library/react';
it('一键排版后自动识别图片，不需要额外按钮',async()=>{
 document.body.innerHTML='<div id="root"></div>';window.scrollTo=vi.fn();let stored={id:'doc',revision:1,title:'有图文章',status:'draft',style:{preset:'magazine'},blocks:[{id:'img',type:'images',images:[{id:'a',src:'/media/a.png'},{id:'b',src:'/media/b.png'}],layout:'pair',ratio:'original',gap:8}]};
 global.fetch=vi.fn(async(url,options)=>{
  if(url==='/api/articles')return{ok:true,json:async()=>({articles:[{id:'doc',title:'有图文章',wordCount:0,updatedAt:new Date().toISOString()}],defaultStyle:null})};
  if(url==='/api/articles/doc'&&!options?.method)return{ok:true,json:async()=>stored};
  if(url==='/api/articles/doc'&&options?.method==='PUT'){stored={...JSON.parse(options.body),revision:stored.revision+1};return{ok:true,json:async()=>stored}}
  if(url==='/api/articles/doc/local-vision')return{ok:true,json:async()=>({revision:stored.revision,results:[{src:'/media/a.png',width:1000,height:800,labels:[{id:'outdoor',confidence:.9}],faces:0},{src:'/media/b.png',width:1000,height:800,labels:[],faces:1}]})};
  throw Error('unexpected '+url);
 });
 await import('../src/main.jsx');await waitFor(()=>expect(screen.getByRole('button',{name:/有图文章/})).toBeTruthy());fireEvent.click(screen.getByRole('button',{name:/有图文章/}));await waitFor(()=>expect(screen.getByRole('button',{name:'一键排版'})).toBeTruthy());fireEvent.click(screen.getByRole('button',{name:'一键排版'}));
 await waitFor(()=>expect(global.fetch.mock.calls.some(([url])=>url==='/api/articles/doc/local-vision')).toBe(true));
 await waitFor(()=>expect(screen.getByText('图片内容分析与排版已完成。')).toBeTruthy());
 expect(document.querySelector('.image-export-preview').innerHTML).toContain('width:62%');expect(screen.queryByRole('button',{name:'本机识别并推荐'})).toBeNull();
});
