import {it,expect,vi} from 'vitest';
import {SELECTABLE_HEADING_SERIES,seriesHeadingHTML,chapterTitleMetrics} from '../public/heading-series';
import {exportHTML,newArticle,textOf} from '../src/model';
import {copyRichText} from '../src/export-check';
it('全部推荐章题的长标题和金额保持完整，内联样式独立于 Folio CSS',()=>{
 const titles=['慢一点，才看得见','金钟的一次见面，和一份4.5亿港元的担保','关于一份长期家族安排的多个细节：受托人、受益人与管理人的责任究竟如何划分','AnExtremelyLongEnglishChapterTitleWithoutSpacesForMobileReading'];
 for(const {id} of SELECTABLE_HEADING_SERIES)for(const title of titles){
  const html=seriesHeadingHTML({headingSeries:id,headingSize:23},'01','<strong>'+title+'</strong>'),root=document.createElement('div');root.innerHTML=html;
  const h=root.querySelector('h2');expect(h.textContent).toBe(title);expect(h.style.whiteSpace).toBe('normal');expect(h.style.overflowWrap).toBe('break-word');expect(h.style.wordBreak).toBe('break-word');expect(parseFloat(h.style.fontSize)).toBeLessThanOrEqual(36);
  expect(root.querySelector('table,style')).toBeNull();expect(root.querySelector('[class]')).toBeNull();expect(html).not.toMatch(/(?:display:(?:flex|grid)|position:absolute|text-wrap:balance)/);
  if(title.includes('4.5亿港元'))expect(h.querySelector('span[style]')?.textContent).toBe('4.5亿港元');
 }
 expect(chapterTitleMetrics({headingSeries:'accent-dot',headingSize:23},titles[2]).fontSize).toBeLessThan(chapterTitleMetrics({headingSeries:'accent-dot',headingSize:23},titles[0]).fontSize);
});
it('真实复制事件携带五种章题的边框、字号、留白与长标题，粘贴后无需样式表',async()=>{
 const amount='金钟的一次见面，和一份4.5亿港元的担保',blocks=SELECTABLE_HEADING_SERIES.map((s,i)=>({id:'h'+i,type:'heading',html:amount}));
 const originalClipboard=navigator.clipboard,originalExec=document.execCommand;
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});
 let clipboard={};document.execCommand=vi.fn(()=>{const event=new Event('copy',{cancelable:true});Object.defineProperty(event,'clipboardData',{value:{setData:(kind,value)=>clipboard[kind]=value}});document.dispatchEvent(event);return true});
 try{for(const {id} of SELECTABLE_HEADING_SERIES){
  const a={...newArticle(),blocks,style:{...newArticle().style,headingSeries:id,headingSize:23}},html=exportHTML(a);
  await copyRichText(html,amount);expect(clipboard['text/html']).toBe(html);const pasted=document.createElement('div');pasted.innerHTML=clipboard['text/html'];
  const headings=[...pasted.querySelectorAll('h2')];expect(headings).toHaveLength(5);expect(headings.every(h=>h.textContent===amount)).toBe(true);expect(headings.every(h=>parseFloat(h.style.fontSize)>0)).toBe(true);
  if(id==='serif-slash')expect(pasted.querySelector('[style*="border:1px solid"]')?.style.padding).toBe('32px 20px 34px');
  expect(textOf(a.blocks[0].html)).toBe(amount);
 }}finally{Object.defineProperty(navigator,'clipboard',{configurable:true,value:originalClipboard});document.execCommand=originalExec}
});
