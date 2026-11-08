import React from 'react';
import {it,expect,vi} from 'vitest';
import {screen,fireEvent,waitFor} from '@testing-library/react';
import {clean,newArticle,exportHTML,splitLongParagraph} from '../src/model';
import {sizeTextRange,fontTextRange,captureTextRanges} from '../src/text-size';
import {articleFont} from '../public/article-fonts.js';

it('局部字号保留选区外的内容、嵌套格式和安全约束',()=>{
 const source='第一<strong>二三四</strong>五';
 const result=sizeTextRange(source,1,4,24);
 const doc=document.createElement('div');doc.innerHTML=result;
 expect(doc.textContent).toBe('第一二三四五');
 expect(doc.querySelector('strong').textContent).toBe('二三四');
 expect([...doc.querySelectorAll('span')].map(n=>n.textContent).join('')).toBe('一二三');
 expect([...doc.querySelectorAll('span')].every(n=>n.style.fontSize==='24px')).toBe(true);
 const again=sizeTextRange(result,2,3,18);doc.innerHTML=again;
 expect(doc.textContent).toBe('第一二三四五');expect([...doc.querySelectorAll('span')].find(n=>n.textContent==='二').style.fontSize).toBe('18px');
 expect(clean('<span style="font-size:24px;color:red" onclick="alert(1)">安全</span>')).toBe('<span>安全</span>');
 expect(clean('<span style="font-size:999px">安全</span>')).toBe('<span>安全</span>');
 expect(clean('<span style="font-size:24px">安全</span>')).toContain('font-size: 24px');
 const a=newArticle();a.blocks=[{id:'p',type:'paragraph',html:result}];expect(exportHTML(a)).toContain('font-size: 24px');
});

it('局部字体和字号可叠加，导出保留样式且过滤恶意字体',()=>{
 const family=articleFont({fontFamily:'serif'}), source='甲<strong>乙丙</strong>丁';
 const formatted=fontTextRange(sizeTextRange(source,1,3,24),1,2,family);
 const el=document.createElement('div');el.innerHTML=clean(formatted);
 expect(el.textContent).toBe('甲乙丙丁');
 const font=el.querySelector('[style*="font-family"]');expect(font.textContent).toBe('乙');expect(font.style.fontFamily).toContain('Songti SC');
 expect(font.parentElement.style.fontSize).toBe('24px');
 expect(clean('<span style="font-family: x; background: url(https://example.com)">测试</span>')).toBe('<span>测试</span>');
 expect(fontTextRange(source,0,1,'x; color:red')).toBe(source);
 const a=newArticle();a.blocks=[{id:'p',type:'paragraph',html:formatted}];const out=exportHTML(a);expect(out).toContain('font-family:');expect(out).toContain('Songti SC');expect(out).toContain('font-size: 24px');
});

it('跨多个编辑段落捕获精确选区',()=>{
 const paper=document.createElement('article');paper.innerHTML='<section data-block-id="a"><div contenteditable="true">一<strong>二三</strong>四</div></section><section data-block-id="b"><div contenteditable="true">五六七八</div></section>';document.body.append(paper);
 const roots=paper.querySelectorAll('[contenteditable]'),range=document.createRange();range.setStart(roots[0].firstChild,1);range.setEnd(roots[1].firstChild,2);
 const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
 const a={blocks:[{id:'a',type:'paragraph',html:'一<strong>二三</strong>四'},{id:'b',type:'paragraph',html:'五六七八'}]};
 expect(captureTextRanges(selection,a,paper)).toMatchObject([{id:'a',start:1,end:4},{id:'b',start:0,end:2}]);
 selection.removeAllRanges();paper.remove();
});

it('编辑器可调整选中文字和多个内容块，并可撤销',async()=>{
 window.scrollTo=vi.fn();document.body.innerHTML='<div id="root"></div>';
 global.fetch=vi.fn(async(url,options)=>{if(url==='/api/articles'&&!options?.method)return {ok:true,json:async()=>({articles:[],defaultStyle:null})};if(url==='/api/articles'&&options?.method==='POST')return {ok:true,json:async()=>({...JSON.parse(options.body),id:'size-test',revision:1,updatedAt:new Date().toISOString()})};if(url==='/api/articles/size-test'&&options?.method==='PUT')return {ok:true,json:async()=>({...JSON.parse(options.body),revision:2})};throw Error('unexpected '+url)});
 await import('../src/main.jsx');await waitFor(()=>expect(screen.getByText(/打开示例，试试排版/)).toBeTruthy());fireEvent.click(screen.getByText(/打开示例，试试排版/));
 const first=await screen.findByRole('textbox',{name:'段落 1'});await waitFor(()=>expect(first.textContent).toContain('周末'));const original=first.textContent;
 const range=document.createRange();range.setStart(first.firstChild,0);range.setEnd(first.firstChild,2);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);fireEvent(document,new Event('selectionchange'));
 const input=screen.getByLabelText('选中文字字号');fireEvent.mouseDown(input);fireEvent.blur(first);fireEvent.change(input,{target:{value:'26'}});fireEvent.click(screen.getByRole('button',{name:'应用字号'}));
 await waitFor(()=>expect(first.querySelector('span')?.style.fontSize).toBe('26px'));
 expect(first.textContent).toBe(original);expect(first.querySelector('span').textContent).toBe(original.slice(0,2));
 fireEvent.click(screen.getByRole('button',{name:'选择多个内容块'}));const boxes=screen.getAllByRole('checkbox',{name:/选择/});fireEvent.click(boxes[0]);fireEvent.click(boxes[1]);
 fireEvent.change(screen.getByLabelText('所选段落字体'),{target:{value:'serif'}});fireEvent.change(screen.getByLabelText('所选段落字号'),{target:{value:'20'}});fireEvent.click(screen.getByRole('button',{name:'同时应用字体和字号'}));
 const blocks=document.querySelectorAll('.paper.editable .article-block');for(const block of [blocks[0],blocks[1]]){expect(block.querySelector('[style*="20px"]')).toBeTruthy();expect(block.querySelector('[style*="font-family"]').style.fontFamily).toContain('Songti SC')}
 fireEvent.click(screen.getAllByRole('button',{name:'撤销'})[0]);await waitFor(()=>{expect(blocks[1].querySelector('[style*="20px"]')).toBeNull();expect(blocks[1].querySelector('[style*="font-family"]')).toBeNull()});
});
