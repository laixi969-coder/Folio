import React from 'react';
import{it,expect,vi}from'vitest';
import{screen,fireEvent,waitFor}from'@testing-library/react';
it('粘贴后直接排版预览，满意即可导出，微调参数默认收起',async()=>{
 document.body.innerHTML='<div id="root"></div>';window.scrollTo=vi.fn();let created;
 global.fetch=vi.fn(async(url,options)=>{
  if(url==='/api/articles'&&!options?.method)return{ok:true,json:async()=>({articles:[],defaultStyle:{fontSize:18,lineHeight:2,paragraphGap:20,sidePadding:24,imageGap:24,accent:'#333333'}})};
  if(url==='/api/articles'&&options?.method==='POST'){created=JSON.parse(options.body);return{ok:true,json:async()=>({...created,id:'auto',revision:1})}}
  throw new Error('unexpected request');
 });
 await import('../src/main.jsx');
 await waitFor(()=>expect(screen.getByText('第一篇文章，从这里开始。')).toBeTruthy());
 fireEvent.click(screen.getByText('粘贴并自动排版'));
 fireEvent.change(screen.getByLabelText('文章内容'),{target:{value:'原文不改\n## 小标题\n这里是正文'}});
 fireEvent.click(screen.getByRole('button',{name:'一键排版并预览'}));
 await waitFor(()=>expect(screen.getByText('满意，去导出')).toBeTruthy());
 expect(screen.queryByRole('textbox',{name:'段落 1'})).toBeNull();
 expect(created.style.fontSize).toBe(18);expect(created.blocks[0].html).toBe('原文不改');
 fireEvent.click(screen.getByText('继续微调'));
 await waitFor(()=>expect(screen.getByText('手动微调排版')).toBeTruthy());
 expect(screen.getByText('手动微调排版').parentElement.open).toBe(false);
});
