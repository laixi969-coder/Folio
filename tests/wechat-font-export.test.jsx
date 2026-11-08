import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {newArticle,exportHTML,normalizeStyle,autoLayout} from '../src/model';
import {SELECTABLE_HEADING_SERIES} from '../public/heading-series';
import {wechatFontMode,convertWechatFonts,fontPixelCuts,wechatFontFiles,prepareWechatExport} from '../src/wechat-font-export';
import WechatFontOptions from '../src/WechatFontOptions';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jT9sAAAAASUVORK5CYII=';
const fakeRender=async()=>({tiles:[{data:png,width:315,height:120,pixelWidth:945,pixelHeight:360}],marginTop:'56px',marginBottom:'32px'});
afterEach(cleanup);
it('内置全文或局部字体默认保留字形，用户选择可保存且一键排版不丢失',()=>{
 const a=newArticle();expect(wechatFontMode(a)).toBe('text');a.style.fontFamily='lxgw-wenkai';expect(wechatFontMode(a)).toBe('all');
 a.style={...a.style,wechatFontMode:'headings'};expect(wechatFontMode(JSON.parse(JSON.stringify(autoLayout(a))))).toBe('headings');
 expect(normalizeStyle({wechatFontMode:'bad'}).wechatFontMode).toBe('auto');
 a.style={};a.blocks=[{type:'paragraph',html:'<span style="font-family:ZCOOL XiaoWei,serif">局部字体</span>'}];expect(wechatFontMode(a)).toBe('all');
 const change=vi.fn();render(<WechatFontOptions article={a} onChange={change}/>);
 expect(screen.getByLabelText('公众号字体处理').value).toBe('all');expect(screen.getByText(/链接也不再可点击/)).toBeTruthy();
 fireEvent.change(screen.getByLabelText('公众号字体处理'),{target:{value:'text'}});expect(change).toHaveBeenCalledWith({style:{wechatFontMode:'text'}});
});
it('五款章题只在导出副本转图，保留长标题替代文本、边距、原图和可编辑正文',async()=>{
 for(const series of SELECTABLE_HEADING_SERIES){
  const a=newArticle();a.style={...a.style,fontFamily:'lxgw-wenkai',headingSeries:series.id};a.blocks=[{id:'h',type:'heading',html:'金钟的一次见面，和一份4.5亿港元的担保'},{id:'p',type:'paragraph',html:'<strong>正文仍可编辑</strong>'},{id:'i',type:'images',images:[{src:png}]}];const original=JSON.stringify(a);
  const holder=document.createElement('div');holder.innerHTML=exportHTML(a);const root=holder.firstElementChild,render=vi.fn(fakeRender),result=await convertWechatFonts(root,{mode:'headings',render});
  expect(render).toHaveBeenCalledTimes(1);expect(result.images).toHaveLength(1);expect(result.html).not.toContain('<h2');expect(result.html).toContain('正文仍可编辑');
  const image=root.querySelector('img');expect(image.alt).toContain('4.5亿港元');expect(image.width).toBe(945);expect(image.parentElement.style.margin).toBe('56px 0px 32px');expect(root.querySelectorAll('img')).toHaveLength(2);expect(JSON.stringify(a)).toBe(original);
 }
});
it('全文模式保留原始照片，转换题记、正文、局部字体和图片说明，不需要外部字体 CSS',async()=>{
 const a=newArticle();a.subtitle='开篇题记';a.blocks=[{id:'p',type:'paragraph',html:'局部 <span style="font-family:LXGW WenKai,serif">文楷</span> 正文'},{id:'i',type:'images',caption:'图片说明',images:[{src:png}]}];
 const holder=document.createElement('div');holder.innerHTML=exportHTML(a);const root=holder.firstElementChild,originalImage=root.querySelector('img');
 const result=await convertWechatFonts(root,{mode:'all',render:fakeRender});expect(result.images.length).toBeGreaterThanOrEqual(3);expect(root.contains(originalImage)).toBe(true);expect(root.textContent.trim()).toBe('');
 expect(result.images.map(i=>i.alt).join(' ')).toContain('文楷');expect(result.images.map(i=>i.alt).join(' ')).toContain('图片说明');expect(result.html).not.toContain('@font-face');
 const files=wechatFontFiles(a,result);expect(Object.keys(files)).toContain('文字-001.png');expect([...files['文字-001.png'].slice(0,8)]).toEqual([137,80,78,71,13,10,26,10]);expect(files['原文.txt']).toContain('文楷');expect(files['公众号正文.html']).toContain('src="文字-001.png"');expect(files['使用说明.txt']).toContain('上传');
});
it('长段落只在文字行间切分，不能安全切分时中止；渲染失败不返回伪成功',async()=>{
 const hasInk=y=>y%32<22;const cuts=fontPixelCuts(2880,y=>!hasInk(y),1000);
 expect(cuts[0]).toBe(0);expect(cuts.at(-1)).toBe(2880);for(const cut of cuts.slice(1,-1))expect(hasInk(cut)||hasInk(cut-1)||hasInk(cut+1)).toBe(false);
 expect(()=>fontPixelCuts(4000,()=>false)).toThrow('无法');
 const root=document.createElement('section');root.innerHTML='<p>不能丢失的文字</p>';
 await expect(convertWechatFonts(root,{mode:'all',render:async()=>{throw Error('字体未载入')}})).rejects.toThrow('字体未载入');expect(root.textContent).toBe('不能丢失的文字');
 const a=newArticle();a.blocks=[{type:'paragraph',id:'p',html:'正文'}];expect((await prepareWechatExport(a)).images).toEqual([]);
});
