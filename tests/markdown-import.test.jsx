import React from 'react';
import {it,expect,vi} from 'vitest';
import {screen,fireEvent,waitFor} from '@testing-library/react';

it('导入 Markdown 新建文章并可插入现有文章，空文件不修改内容',async()=>{
 window.scrollTo=vi.fn();
 document.body.innerHTML='<div id="root"></div>';
 let created;
 global.fetch=vi.fn(async(url,options)=>{
  if(url==='/api/articles'&&!options?.method)return {ok:true,json:async()=>({articles:[],defaultStyle:null})};
  if(url==='/api/articles'&&options?.method==='POST'){created=JSON.parse(options.body);return {ok:true,json:async()=>({...created,id:'md-article',revision:1})}};
  throw Error('unexpected '+url);
 });
 await import('../src/main.jsx');
 await screen.findByText('第一篇文章，从这里开始。');
 const fileInput=document.querySelector('input[accept=".docx,.md"]');
 const file={name:'原稿.MD',size:100,text:async()=> '\ufeff# 文章标题\n正文 **重点**\n## 章节\n> 引用'};
 fireEvent.change(fileInput,{target:{files:[file]}});
 await screen.findByText('排版效果');
 expect(created.title).toBe('文章标题');
 expect(created.blocks.map(b=>b.type)).toEqual(['lead','heading','quote']);
 expect(created.blocks[0].html).toContain('<strong>重点</strong>');
 fireEvent.click(screen.getByText('继续微调'));
 fireEvent.click(screen.getByRole('button',{name:'插入'}));
 fireEvent.change(fileInput,{target:{files:[{name:'追加.md',size:20,text:async()=> '追加段落'}]}});
 await waitFor(()=>expect(screen.getByText('追加段落')).toBeTruthy());
 expect(screen.queryByRole('dialog')).toBeNull();
 fireEvent.click(screen.getByText('继续微调'));
 fireEvent.click(screen.getByRole('button',{name:'插入'}));
 fireEvent.change(fileInput,{target:{files:[{name:'空.md',size:0,text:async()=> '  \n'}]}});
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('没有找到可导入的文字'));
 expect(screen.getByRole('dialog')).toBeTruthy();
});
