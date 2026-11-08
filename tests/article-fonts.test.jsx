import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import ArticleFontPicker from '../src/ArticleFontPicker';
import {ARTICLE_FONTS,articleFont,safeFontFamily} from '../public/article-fonts.js';
import {newArticle,normalizeStyle,autoLayout,exportHTML,imageBlock} from '../src/model';
import {HEADING_SERIES} from '../public/heading-series.js';

afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
describe('文章字体',()=>{
 it('切换预设或填写设备已有的自定义字体',()=>{
  const change=vi.fn();const {rerender}=render(<ArticleFontPicker style={{fontFamily:'default'}} onChange={change}/>);
  fireEvent.change(screen.getByLabelText('文章字体'),{target:{value:'serif'}});
  expect(change).toHaveBeenCalledWith({fontFamily:'serif'});
  rerender(<ArticleFontPicker style={{fontFamily:'custom'}} onChange={change}/>);
  fireEvent.change(screen.getByLabelText('自定义字体名称'),{target:{value:'Noto Serif CJK SC'}});
  expect(change).toHaveBeenLastCalledWith({fontFamily:'custom',customFont:'Noto Serif CJK SC'});
 });
 it('既有文章保留版式默认，非法字体名称不能注入导出样式',()=>{
  expect(normalizeStyle({}).fontFamily).toBe('default');
  expect(articleFont({fontFamily:'custom',customFont:'x; color:red'})).toBe('');
  expect(normalizeStyle({fontFamily:'custom',customFont:'x; color:red'}).customFont).toBe('');
 });
 it('内置字体可选择，等待实际字体载入才显示成功，失败时告知后备字体',async()=>{
  const load=vi.fn().mockResolvedValue([{}]);Object.defineProperty(document,'fonts',{configurable:true,value:{load}});
  const change=vi.fn(),{rerender}=render(<ArticleFontPicker style={{fontFamily:'noto-sans-sc'}} onChange={change}/>);
  for(const f of ARTICLE_FONTS.filter(f=>f.file))expect(screen.getByRole('option',{name:f.name})).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain('正在载入');
  await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('字体已载入'));
  expect(load).toHaveBeenCalledWith('16px "Noto Sans SC"','文字排版');
  expect(screen.getByRole('link',{name:'查看授权'}).getAttribute('href')).toBe('/fonts/noto-sans-sc/OFL.txt');
  expect(screen.getByText(/公众号不携带字体文件/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('文章字体'),{target:{value:'lxgw-wenkai'}});
  expect(change).toHaveBeenLastCalledWith({fontFamily:'lxgw-wenkai'});
  load.mockRejectedValueOnce(Error('offline'));rerender(<ArticleFontPicker style={{fontFamily:'smiley-sans'}} onChange={change}/>);
  await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('载入失败'));
  expect(screen.getByText(/不建议整篇长文/)).toBeTruthy();
  delete document.fonts;
 });
 it('五款字体保存和重新排版后保留，全文与局部文字都带字体名称导出',()=>{
  for(const font of ARTICLE_FONTS.filter(f=>f.file)){
   const a=newArticle();a.style={...a.style,fontFamily:font.id,headingSeries:'serif-slash'};
   a.blocks=[{id:'h',type:'heading',html:'金钟的一次见面，和一份4.5亿港元的担保'},{id:'p',type:'paragraph',html:`<span style="font-family:${font.family}">这一句有自己的字体。</span>`}];
   const restored=JSON.parse(JSON.stringify(autoLayout(a,a.style)));
   expect(normalizeStyle(restored.style).fontFamily).toBe(font.id);expect(safeFontFamily(font.family)).toBe(font.family);
   const doc=new DOMParser().parseFromString(exportHTML(restored),'text/html');
   expect(doc.querySelector('body > section').style.fontFamily).toContain(font.face);
   expect(doc.querySelector('h2').closest('section').style.fontFamily).toContain(font.face);
   const span=[...doc.querySelectorAll('span')].find(el=>el.textContent==='这一句有自己的字体。');
   expect(span.style.fontFamily).toContain(font.face);
  }
 });
 it('一键排版保留字体，导出正文、题记、引用、图注和各章节标题使用所选字体',()=>{
  for(const {id} of HEADING_SERIES){
   const a=newArticle();a.style={...a.style,fontFamily:'custom',customFont:'Noto Serif CJK SC',headingSeries:id};
   a.subtitle='题记';a.blocks=[{id:'h',type:'heading',html:'章节'},{id:'q',type:'quote',html:'引用'}, {...imageBlock([{id:'i',src:'/media/a.png',caption:'图片说明'}]),caption:'组说明'}];
   const formatted=autoLayout(a);expect(formatted.style.customFont).toBe('Noto Serif CJK SC');expect(formatted.style.fontFamily).toBe('custom');
   const doc=new DOMParser().parseFromString(exportHTML(formatted),'text/html');
   expect(doc.querySelector('body > section').style.fontFamily).toContain('Noto Serif CJK SC');
   const subtitle=[...doc.querySelectorAll('p')].find(el=>el.textContent==='题记');expect(subtitle.style.fontFamily).toContain('Noto Serif CJK SC');
   const quote=doc.querySelector('blockquote');expect(quote.style.fontFamily).toContain('Noto Serif CJK SC');
   const caption=[...doc.querySelectorAll('p')].find(el=>el.textContent==='组说明');expect(caption.style.fontFamily).toContain('Noto Serif CJK SC');
   const heading=[...doc.querySelectorAll('h2,td')].find(el=>el.textContent==='章节');expect(heading).toBeTruthy();
   let el=heading;while(el&&(!el.style.fontFamily||el.style.fontFamily==='inherit'))el=el.parentElement;expect(el?.style.fontFamily).toContain('Noto Serif CJK SC');
  }
 });
});
