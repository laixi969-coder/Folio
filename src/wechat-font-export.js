import {ARTICLE_FONTS} from '../public/article-fonts.js';
import {exportHTML,escape} from './model';

export function usesBundledFonts(article){
 return ARTICLE_FONTS.some(f=>f.file&&(article.style?.fontFamily===f.id||article.blocks?.some(b=>b.html?.includes(f.face))));
}
export function wechatFontMode(article){
 const mode=article.style?.wechatFontMode;
 return ['text','headings','all'].includes(mode)?mode:usesBundledFonts(article)?'all':'text';
}
export const fontModeDescription=mode=>mode==='all'?'所有正文文字按段落转为高清图片，保留字体和排版；微信中不能直接编辑、选字复制或随阅读字号放大，链接也不再可点击。Folio 原稿仍可编辑。':mode==='headings'?'章题转为高清图片，保留章号、边框、留白和字体；正文仍为可编辑文字，正文中的特殊字体可能被微信替换。':'保留可编辑文字。公众号和读者设备可能替换字体，不能保证与 Folio 字形相同。';

export function selectFontTargets(root,mode){
 if(mode==='text')return [];
 if(mode==='headings')return [...root.children].filter(el=>el.matches('h2,h3')||el.querySelector('h2,h3'));
 return [...root.children].flatMap(el=>{
  if(!el.textContent.trim())return [];
  // Original photos stay intact. Capture only their text captions.
  if(el.querySelector('img')&&!el.querySelector('table'))return [...el.querySelectorAll('p,figcaption')].filter(p=>p.textContent.trim()&&!p.querySelector('img')&&!p.parentElement.closest('figcaption'));
  return [el];
 });
}

// Inspect painted pixels, since canvas font baselines can differ from DOM ranges.
export function fontPixelCuts(height,isBlank,limit=3000){
 const cuts=[0];let start=0;
 while(height-start>limit){
  let end=start+limit;
  while(end>start+limit/2&&!(isBlank(end-1)&&isBlank(end)&&isBlank(end+1)))end--;
  if(end<=start+limit/2)throw Error('无法在完整字形之间切分，请先拆分长段落。');
  let top=end;while(top>start+limit/2&&isBlank(top-1))top--;
  start=Math.floor((top+end)/2);cuts.push(start);
 }
 cuts.push(height);return cuts;
}
const withTimeout=(promise,ms,message)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),ms)})]).finally(()=>clearTimeout(timer))};

async function mount(html){
 const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
 frame.style.cssText='position:fixed;left:-10000px;top:0;width:375px;height:1200px;border:0;pointer-events:none;';
 document.body.append(frame);
 try{
  const doc=frame.contentDocument;
  doc.open();doc.write('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:375px}*{box-sizing:border-box}</style></head><body>'+html+'</body></html>');doc.close();
  const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('/fonts/fonts.css',location.href).href;
  const loaded=new Promise((resolve,reject)=>{link.onload=resolve;link.onerror=()=>reject(Error('内置字体样式读取失败，请刷新重试。'))});doc.head.append(link);
  await withTimeout(loaded,15000,'字体样式载入超时，请刷新重试。');
  const root=doc.body.firstElementChild;
  const families=[...new Set([root,...root.querySelectorAll('*')].map(el=>frame.contentWindow.getComputedStyle(el).fontFamily))];
  for(const family of families){
   const font=ARTICLE_FONTS.find(f=>f.file&&family.split(',')[0].replace(/['"]/g,'').trim()===f.face);
   if(font){const faces=await withTimeout(doc.fonts.load(`16px "${font.face}"`,'文字排版'),30000,'字体载入超时，请稍后重试。');if(!faces.length||faces.some(f=>f.status!=='loaded'))throw Error(`${font.name} 未载入，已停止导出，避免输出后备字形。`)}
  }
  await doc.fonts.ready;
  for(const img of root.querySelectorAll('img'))await withTimeout(img.decode(),15000,'正文图片载入失败，请重新上传。');
  return {root,frame};
 }catch(error){frame.remove();throw error}
}

async function rasterize(element){
 const {default:html2canvas}=await import('html2canvas');
 const doc=element.ownerDocument,win=doc.defaultView,style=win.getComputedStyle(element),rect=element.getBoundingClientRect();
 const width=Math.ceil(rect.width),height=Math.ceil(rect.height);
 if(width<1||height<1)throw Error('文字块没有可用尺寸，请检查排版。');
 if(height>4096)throw Error('单个文字块过长，请先使用「拆分长段落」后重试。');
 if(element.scrollWidth>width+2)throw Error('文字块超出正文宽度，请先缩短长网址或调整表格。');
 const background=win.getComputedStyle(doc.body.firstElementChild).backgroundColor;
 // Extra descent room prevents canvas metrics from clipping the last text line.
 const canvas=await html2canvas(element,{scale:3,backgroundColor:background,logging:false,foreignObjectRendering:false,useCORS:false,allowTaint:false,imageTimeout:15000,width,height:height+12,x:0,y:0,windowWidth:375,windowHeight:1200,onclone:async cloned=>{await cloned.fonts.ready}});
 try{
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  let visible=false;for(let p=4;p<pixels.length;p+=4){if(pixels[p]!==pixels[0]||pixels[p+1]!==pixels[1]||pixels[p+2]!==pixels[2]||pixels[p+3]!==pixels[3]){visible=true;break}}
  if(!visible)throw Error('生成的文字图片为空白，已停止导出。请刷新后重试。');
  const bg=(background.match(/[\d.]+/g)||[]).slice(0,3).map(Number),rows=new Map();
  const isBlank=y=>{if(rows.has(y))return rows.get(y);for(let x=12;x<canvas.width-12;x++){const p=(y*canvas.width+x)*4;if(Math.abs(pixels[p]-bg[0])+Math.abs(pixels[p+1]-bg[1])+Math.abs(pixels[p+2]-bg[2])>20){rows.set(y,false);return false}}rows.set(y,true);return true};
  let paintedHeight=height*3;
  for(let y=canvas.height-1;y>=height*3-3;y--)if(!isBlank(y)){paintedHeight=Math.max(paintedHeight,y+4);break}
  if(paintedHeight>canvas.height)throw Error('末行字形超出图片边界，请稍增行距后重试。');
  const cuts=fontPixelCuts(paintedHeight,isBlank),tiles=[];
  for(let i=0;i<cuts.length-1;i++){
   const tile=doc.createElement('canvas');tile.width=canvas.width;tile.height=cuts[i+1]-cuts[i];
   tile.getContext('2d').drawImage(canvas,0,cuts[i],canvas.width,tile.height,0,0,tile.width,tile.height);
   const data=tile.toDataURL('image/png');
   if(!data.startsWith('data:image/png;base64,')||data.length>6.5*1024*1024)throw Error('文字图片生成失败或过大，请先拆分长段落。');
   tiles.push({data,width,height:tile.height/3,pixelWidth:tile.width,pixelHeight:tile.height});tile.width=tile.height=0;
  }
  return {tiles,marginTop:style.marginTop,marginBottom:Math.max(0,parseFloat(style.marginBottom)-(paintedHeight/3-height))+'px'};
 }finally{canvas.width=canvas.height=0}
}

export async function convertWechatFonts(root,{mode,render=rasterize,onProgress=()=>{}}){
 const targets=selectFontTargets(root,mode),images=[];
 for(let i=0;i<targets.length;i++){
  onProgress(`正在保留字体 ${i+1}/${targets.length}…`);
  const node=targets[i],text=node.textContent.trim(),result=await render(node);
  const replacement=node.ownerDocument.createElement('section');replacement.style.cssText=`margin:${result.marginTop||'0px'} 0 ${result.marginBottom||'0px'};padding:0;font-size:0;line-height:0;`;
  for(const tile of result.tiles){
   const name=`文字-${String(images.length+1).padStart(3,'0')}.png`,img=node.ownerDocument.createElement('img');
   img.src=tile.data;img.alt=text.slice(0,300);img.width=tile.pixelWidth;img.height=tile.pixelHeight;img.setAttribute('style',`display:block;width:100%;max-width:100%;height:auto;margin:0;padding:0;border:0;`);
   replacement.append(img);images.push({...tile,name,alt:img.alt});
  }
  node.replaceWith(replacement);
 }
 return {html:root.outerHTML,images,count:targets.length,mode};
}

let last=null;
export async function prepareWechatExport(article,{assets={},mode=wechatFontMode(article),onProgress=()=>{}}={}){
 const html=exportHTML(article,{assets,compatible:true});
 if(mode==='text')return {html,images:[],count:0,mode};
 const key=mode+'\0'+html;
 if(last?.key===key)return last.promise;
 const promise=(async()=>{
  onProgress('正在载入字体与排版…');const {root,frame}=await mount(html);
  try{return await convertWechatFonts(root,{mode,onProgress})}finally{frame.remove()}
 })();
 last={key,promise};try{return await promise}catch(error){if(last?.promise===promise)last=null;throw error}
}

export function wechatFontFiles(article,result){
 let html=result.html;
 const files={};for(const image of result.images){files[image.name]=Uint8Array.from(atob(image.data.split(',')[1]),c=>c.charCodeAt(0));html=html.split(image.data).join(image.name)}
 files['公众号正文.html']=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(article.title||'公众号正文')}</title><body style="max-width:375px;margin:24px auto">${html}</body></html>`;
 files['使用说明.txt']=`解压到同一文件夹，打开「公众号正文.html」，复制正文到公众号后台。\n如果粘贴的文字图片没有显示，请按编号上传随包 PNG 并替换相应位置，上传后字形不再依赖读者安装字体。\n${fontModeDescription(result.mode)}\n图片按 375px 手机宽度、3 倍清晰度生成；其他设备会等比例缩放，不会重新换行。\n公众号自己的文章标题由平台控制，字体不能更改。发布前请在微信预览检查图片与间距。`;
 files['原文.txt']=article.blocks.map(b=>b.html?new DOMParser().parseFromString(b.html,'text/html').body.textContent:b.caption||'').join('\n\n');
 return files;
}
