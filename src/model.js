import {marked} from 'marked';
import{articleFont,normalizeFontId,normalizeCustomFont,DEFAULT_FONT_FAMILY,safeFontFamily}from'../public/article-fonts.js';
import{articlePalette}from'../public/article-palettes.js';
import DOMPurify from 'dompurify';
import{normalizeSeries,headingSeriesStyles,styleText,seriesHeadingHTML}from'../public/heading-series.js';
import{subtitleHTML,normalizeSubtitleSeries,DEFAULT_SUBTITLE_SERIES}from'../public/subtitle-series.js';
export const DEFAULT_STYLE={preset:'magazine',headingSeries:'editorial',paletteId:'celadon',fontFamily:'default',customFont:'',fontSize:16,lineHeight:1.98,paragraphGap:24,sidePadding:30,accent:'#426B64',imageGap:34,titleSize:31,subtitleSize:15,headingSize:19,subheadingSize:17,leadSize:14,quoteSize:23,subtitleSeries:DEFAULT_SUBTITLE_SERIES};
export const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const clean=html=>{const htmlSafe=DOMPurify.sanitize(html||'',{ALLOWED_TAGS:['strong','b','em','i','u','s','a','br','span','code','pre','table','thead','tbody','tr','th','td','img'],ALLOWED_ATTR:['href','src','alt','align','style'],ALLOW_DATA_ATTR:false});const d=document.createElement('div');d.innerHTML=htmlSafe;d.querySelectorAll('[style]').forEach(el=>{const raw=el.getAttribute('style'),rules=raw.split(';').map(x=>x.trim()).filter(Boolean),seen=new Set();let size='',family='',valid=el.tagName==='SPAN'&&rules.length>0;for(const rule of rules){const match=/^([a-z-]+)\s*:\s*(.+)$/i.exec(rule);if(!match){valid=false;break}const key=match[1].toLowerCase(),value=match[2].trim();if(seen.has(key)){valid=false;break}seen.add(key);if(key==='font-size'&&/^\d+(?:\.\d+)?px$/i.test(value)&&parseFloat(value)>=10&&parseFloat(value)<=72)size=parseFloat(value)+'px';else if(key==='font-family'&&safeFontFamily(value))family=value;else{valid=false;break}}el.removeAttribute('style');if(valid){if(size)el.style.fontSize=size;if(family)el.style.fontFamily=family}});d.querySelectorAll('img').forEach(img=>{if(!safeSrc(img.getAttribute('src')))img.remove()});d.querySelectorAll('[align]').forEach(el=>{if(!['left','center','right'].includes(el.getAttribute('align')))el.removeAttribute('align')});return d.innerHTML};
export function mapEmbeddedImages(html,mapper){const d=document.createElement('div');d.innerHTML=clean(html);d.querySelectorAll('img').forEach(img=>{const src=mapper(img.getAttribute('src'));if(safeSrc(src))img.setAttribute('src',src);else img.remove()});return d.innerHTML}
export function embeddedImageSources(html){const found=[];mapEmbeddedImages(html,src=>{found.push(src);return src});return found}
export const textOf=html=>{const d=document.createElement('div');d.innerHTML=clean(html);return d.textContent||''};
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const inline=s=>clean(escape(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2">$1</a>'));
function parseSimpleMarkdown(s){return s.replace(/\r\n/g,'\n').split(/\n/).filter(x=>x.trim()).map(line=>{const t=line.trim();let type='paragraph',content=t;if(/^#{1,2}\s/.test(t)){type='heading';content=t.replace(/^#+\s/,'')}else if(/^#{3,6}\s/.test(t)){type='subheading';content=t.replace(/^#+\s/,'')}else if(/^>\s?/.test(t)){type='quote';content=t.replace(/^>\s?/,'')}else if(/^([-*+] |\d+\. )/.test(t)){type='list';content=t.replace(/^([-*+] |\d+\. )/,'')}else if(/^(-{3,}|\*{3,})$/.test(t)){type='divider';content=''}return{id:uid(),type,html:inline(content),...(/^#\s/.test(t)?{role:'title'}:{})}})}

export function parseMarkdown(s){
 const out=[];
 const addText=(raw,kind)=>{if(raw.trim())out.push(...parseSimpleMarkdown(raw).map(b=>kind?{...b,type:kind}:b))};
 const hasImage=t=>t?.some(part=>part.type==='image'||(part.type!=='codespan'&&hasImage(part.tokens)));
 function parts(tokens,kind){let pending='';const flush=()=>{addText(pending,kind);pending=''};for(const part of tokens||[]){if(part.type==='image'){flush();out.push({id:uid(),type:'paragraph',html:escape(part.raw),markdownImage:{src:part.href,alt:part.text||''}})}else if(hasImage(part.tokens)){flush();parts(part.tokens,kind)}else pending+=part.raw}flush()}
 function walk(token,kind){
  if(token.type==='code'){
   out.push({id:uid(),type:'paragraph',markdownKind:'code',html:'<pre><code>'+escape(token.text)+'</code></pre>'});
  }else if(token.type==='table'){
   const images=[];const renderer=new marked.Renderer();renderer.image=({href,text})=>{const marker='folio-image-'+uid();images.push({marker,src:href,alt:text||''});return '<span>'+marker+'</span>'};
   const cell=(item,tag)=>'<'+tag+(item.align?' align="'+item.align+'"':'')+'>'+clean(marked.Parser.parseInline(item.tokens,{renderer}))+'</'+tag+'>';
   const head='<thead><tr>'+token.header.map(c=>cell(c,'th')).join('')+'</tr></thead>';
   const rows=token.rows.map(row=>'<tr>'+row.map(c=>cell(c,'td')).join('')+'</tr>').join('');
   out.push({id:uid(),type:'paragraph',markdownKind:'table',html:clean('<table>'+head+'<tbody>'+rows+'</tbody></table>'),...(images.length?{markdownImages:images}:{})});
  }else if((token.type==='paragraph'||token.type==='text')&&hasImage(token.tokens))parts(token.tokens,kind);
  else if(token.type==='list'&&token.items.some(item=>item.tokens.some(t=>t.type==='code'||t.type==='list'||hasImage(t.tokens))))token.items.forEach(item=>item.tokens.forEach(t=>walk(t,'list')));
  else if(token.type==='blockquote'&&token.tokens.some(t=>t.type==='code'||t.type==='table'||t.type==='list'||hasImage(t.tokens)))token.tokens.forEach(t=>walk(t,'quote'));
  else if(token.type!=='space'&&token.type!=='def')addText(token.raw,kind);
 }
 for(const token of marked.lexer(s.replace(/\r\n?/g,'\n')))walk(token);
 return out;
}

export function parseHTML(html){const dom=new DOMParser().parseFromString(DOMPurify.sanitize(html,{ADD_TAGS:['img'],ADD_ATTR:['src']}),'text/html');const out=[];function walk(node){if(node.nodeType===3){if(node.textContent.trim())out.push({id:uid(),type:'paragraph',html:escape(node.textContent)});return}if(node.nodeType!==1)return;const tag=node.tagName.toLowerCase();if(tag==='img'){if(node.getAttribute('src')?.startsWith('/media/'))out.push(imageBlock([{id:uid(),src:node.getAttribute('src'),name:node.alt||'Word 图片',alt:node.alt||'',caption:'',position:50}]));return}if(node.querySelector('img')||['div','section','article','ul','ol','table','tbody','tr','td'].includes(tag)){[...node.childNodes].forEach(walk);return}out.push({id:uid(),type:tag==='h1'||tag==='h2'?'heading':/^h[3-6]$/.test(tag)?'subheading':tag==='blockquote'?'quote':tag==='li'?'list':'paragraph',html:clean(node.innerHTML),...(tag==='h1'?{role:'title'}:{})})} [...dom.body.childNodes].forEach(walk);return out.filter(b=>b.type==='images'||textOf(b.html).trim())}
export const imageBlock=images=>({id:uid(),type:'images',images,layout:'vertical',gap:8,ratio:'original',caption:''});
export const newArticle=style=>({title:'',subtitle:'',author:'',cover:null,blocks:[],style:{...DEFAULT_STYLE,...style},status:'draft',dismissed:[]});
export function normalizeStyle(s={}){const magazine=s.preset==='magazine',palette=articlePalette(s);const fallback=magazine?DEFAULT_STYLE:{fontSize:16,lineHeight:1.95,paragraphGap:22,sidePadding:24,imageGap:28,titleSize:32,subtitleSize:17,headingSize:23,subheadingSize:19,leadSize:17,quoteSize:19,accent:'#333333'};const n=(key,min,max)=>Math.min(max,Math.max(min,Number(s[key])||fallback[key]));return{preset:magazine?'magazine':'classic',typography:s.typography==='book'?'book':'standard',headingSeries:normalizeSeries(s.headingSeries),paletteId:palette.id,fontFamily:normalizeFontId(s.fontFamily),wechatFontMode:['text','headings','all'].includes(s.wechatFontMode)?s.wechatFontMode:'auto',customFont:normalizeCustomFont(s.customFont),fontSize:n('fontSize',14,22),lineHeight:n('lineHeight',1.4,2.4),paragraphGap:n('paragraphGap',8,36),sidePadding:n('sidePadding',12,36),imageGap:n('imageGap',8,40),titleSize:n('titleSize',26,40),subtitleSize:n('subtitleSize',13,22),headingSize:n('headingSize',18,28),subheadingSize:n('subheadingSize',16,23),leadSize:n('leadSize',14,20),quoteSize:n('quoteSize',17,28),subtitleSeries:normalizeSubtitleSeries(s.subtitleSeries),accent:magazine?palette.accent:(/^#[0-9a-f]{6}$/i.test(s.accent)?s.accent:fallback.accent)}}
export function figureNumber(blocks,index){return 1+blocks.slice(0,index).reduce((count,b)=>count+(b.type==='images'?b.images.length:0),0)}
export function headingNumber(blocks,index){const explicit=textOf(blocks[index]?.html||'').trim().match(/^([0-9]{1,2})(?:\s+|[、．]\s*)(?=\S)/);return String(explicit?Number(explicit[1]):blocks.slice(0,index+1).filter(b=>b.type==='heading').length).padStart(2,'0')}
export function preserveHeadingPrefix(original,edited){const prefix=textOf(original).match(/^[0-9]{1,2}(?:\s+|[、．]\s*)(?=\S)/)?.[0]||'';return prefix+edited}
export function headingDisplayHTML(html){return clean(html).replace(/^((?:<(?:strong|b)>)*)(?:[一二三四五六七八九十]+[、.．]\s*|[0-9]{1,2}(?:\s+|[、．]\s*)(?=\S))/u,'$1')}

export function blockTypography(b,s){
 let css=baseBlockTypography(b,s);const spacing=b.spacing||{},line=Number(spacing.lineHeight),gap=Number(spacing.paragraphGap);
 if(spacing.lineHeight!=null&&Number.isFinite(line)&&line>=1&&line<=3)css=css.replace(/line-height:[^;]+;/,`line-height:${line};`);
 if(spacing.paragraphGap!=null&&Number.isFinite(gap)&&gap>=0&&gap<=80)css=css.replace(/margin:([^;]+);/,(_,value)=>{const [top,right=top,,left=right]=value.trim().split(/\s+/);return `margin:${top} ${right} ${gap}px ${left};`});
 return css;
}
function baseBlockTypography(b,s){
 if(b.type==='paragraph'&&b.role==='image-caption'){const p=articlePalette(s);return `font-size:${Math.max(13,s.fontSize-3)}px;font-weight:400;line-height:1.7;letter-spacing:0.1px;margin:0 0 ${s.paragraphGap}px;padding:0 0 0 10px;border-left:2px solid ${p.accent};color:${p.muted};`; }
 if(s.preset==='magazine'){
  const p=articlePalette(s);
  if(b.type==='heading')return styleText(headingSeriesStyles(s).heading);
  if(b.type==='subheading')return styleText(headingSeriesStyles(s).subheading);
  if(s.typography==='book'&&b.type==='lead')return `font-size:${s.leadSize}px;font-weight:400;line-height:1.95;letter-spacing:0.2px;color:${p.muted};margin:0 0 32px;padding:0 0 22px;border-bottom:1px solid ${p.rule};`;
  if(s.typography==='book'&&b.type==='quote')return `font-family:${articleFont(s)||"'Songti SC','STSong','Noto Serif CJK SC',serif"};font-size:${s.quoteSize}px;font-weight:500;line-height:1.8;letter-spacing:0.4px;color:${s.accent};margin:34px 0;padding:20px 8px;border-top:1px solid ${p.rule};border-bottom:1px solid ${p.rule};`;
  if(b.type==='lead')return `font-size:${s.leadSize}px;font-weight:400;line-height:2.05;margin:32px 0 0;padding:25px 21px;background:${p.tint};color:${p.ink};`;
  if(b.type==='quote')return `font-family:${articleFont(s)||"'Songti SC','STSong',serif"};font-size:${s.quoteSize}px;font-weight:600;line-height:1.8;letter-spacing:1px;color:${s.accent};margin:38px 0 36px;padding:24px 0 25px;border-top:1px solid ${p.rule};border-bottom:1px solid ${p.rule};`;
  return `font-size:${s.fontSize}px;font-weight:400;line-height:${s.lineHeight};letter-spacing:0.2px;margin:0 0 ${s.paragraphGap}px;text-align:left;color:${p.ink};`;
 }

 const common=`font-size:${s.fontSize}px;font-weight:400;line-height:${s.lineHeight};margin:0 0 ${s.paragraphGap}px;text-align:left;color:#333333;`;
 if(b.type==='heading')return `font-size:${s.headingSize}px;font-weight:700;line-height:1.45;letter-spacing:-0.4px;color:${s.accent};margin:48px 0 20px;`;
 if(b.type==='subheading')return `font-size:${s.subheadingSize}px;font-weight:650;line-height:1.55;color:${s.accent};margin:32px 0 14px;`;
 if(b.type==='lead')return `font-size:${s.leadSize}px;font-weight:500;line-height:1.95;color:#626965;margin:0 0 32px;`;
 if(b.type==='quote')return `font-size:${s.quoteSize}px;font-weight:600;line-height:1.8;color:#414c46;margin:36px 0;padding:22px 18px;border-top:1px solid #c5cbd2;border-bottom:1px solid #c5cbd2;`;
 return common;
}

export function suggestions(a){return a.blocks.filter((b,i)=>!a.dismissed?.includes(b.id)&&b.type!=='images'&&((b.type==='heading'&&i>0)||textOf(b.html).length>160)&&a.blocks[i+1]?.type!=='images').slice(0,3).map(b=>({blockId:b.id,reason:b.type==='heading'?'章节转换，适合用画面建立新的场景。':'这一段信息较密，可以在段后留出一次阅读停顿。',description:b.type==='heading'?'选择与这一节有关的人物、地点或物件；一张横图即可。':'选择能补充这段细节的照片；对比素材可以用两图并排。'}))}
export function safeSrc(src){return /^\/media\/[a-zA-Z0-9.-]+$/.test(src||'')||/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\r\n]+$/.test(src||'')?src:''}
import{renderImageGroup}from'../public/figure-layout.js';
export{renderImageGroup};
function renderMarkdownStructure(b,assets={}){const root=document.createElement('div');root.innerHTML=clean(b.html);root.querySelectorAll('table').forEach(el=>el.setAttribute('style','border-collapse:collapse;width:100%;'));root.querySelectorAll('th,td').forEach(el=>el.setAttribute('style','border:1px solid #d5dad7;padding:8px 12px;text-align:'+(el.getAttribute('align')||'left')+';'));root.querySelectorAll('img').forEach(img=>{img.setAttribute('src',safeSrc(assets[img.getAttribute('src')]||img.getAttribute('src')));img.setAttribute('style','display:block;max-width:100%;height:auto;')});root.querySelectorAll('th').forEach(el=>el.style.background='#eef2ef');root.querySelectorAll('pre').forEach(el=>el.setAttribute('style','white-space:pre;overflow-x:auto;padding:16px;background:#f2f4f2;font:14px/1.6 monospace;'));return root.innerHTML}
export function exportHTML(a,{compatible=true,assets={}}={}){const s=normalizeStyle(a.style),p=articlePalette(s);const blocks=a.blocks.map((b,index)=>{if(b.type==='divider')return '<hr style="border:0;border-top:1px solid #e5e5e5;margin:32px 0;"/>';if(b.type==='images')return renderImageGroup(b,s,{compatible,assets,figureStart:figureNumber(a.blocks,index),followedByCaption:a.blocks[index+1]?.role==='image-caption'});if(b.markdownKind==='table'||b.markdownKind==='code')return `<section style="overflow-x:auto;margin:24px 0;">${renderMarkdownStructure(b,assets)}</section>`;const h=clean(b.html);
if(s.preset==='magazine'&&b.type==='heading')return seriesHeadingHTML(s,headingNumber(a.blocks,index),headingDisplayHTML(h));
if(s.preset==='magazine'&&s.typography!=='book'&&b.type==='lead')return `<section style="${blockTypography(b,s)}"><p style="font-family:Georgia,serif;font-size:48px;line-height:0.8;color:${s.accent};margin:0 0 19px;">“</p><p style="margin:0;">${h}</p><p style="font-family:Georgia,serif;text-align:right;font-size:42px;line-height:0.8;color:${s.accent};margin:21px 0 0;">”</p></section>`;
const tag=b.type==='heading'?'h2':b.type==='subheading'?'h3':b.type==='quote'?'blockquote':'p';return `<${tag} style="${blockTypography(b,s)}">${b.type==='list'?'• ':''}${h}</${tag}>`}).join('');return `<section style="box-sizing:border-box;padding:0 ${s.sidePadding}px;background:${s.preset==='magazine'?p.paper:'#ffffff'};color:${s.preset==='magazine'?p.ink:'#333333'};font-family:${articleFont(s)||DEFAULT_FONT_FAMILY};font-size:${s.fontSize}px;line-height:${s.lineHeight};word-wrap:break-word;">${subtitleHTML(s,a.subtitle)}${blocks}</section>`}
export const demo=()=>({...newArticle(),title:'把日子，过回自己的节奏',subtitle:'一篇示例文章，试着调整它的留白与节奏。',author:'简序 · 示例',blocks:parseMarkdown('周末，我又走进了那条很久没去的街。\n\n沿街的梧桐还在，修鞋的小店也还在。门口摆着一把旧椅子，阳光从树叶的缝隙落下来，正好停在椅背上。\n\n## 有些事情，慢一点才看得见\n\n以前经过这里，我总是低着头看手机。导航告诉我还剩几分钟，消息提醒我下一件事。我知道自己要去哪里，却很少知道自己正经过什么。\n\n那天没有着急回的消息，我坐下来，听老板讲起这条街的变化。他说起一间关掉的书店，说起搬走的邻居，又说今年秋天来得晚。\n\n> 留一点没有安排的时间，让生活自己走进来。\n\n## 重新找回自己的步幅\n\n我们习惯了把一天填满，仿佛空下来就意味着落后。可很多真正记得住的时刻，并不是计划表上的一格。\n\n是一次没赶时间的散步，是与朋友多聊的十分钟，是把一顿饭认真吃完。\n\n不必急着改变全部生活。就从今天开始，给自己留下一小段空白。')});

// 图后短段落仅作为候选；由用户主动确认识别，保留文本与段落位置。
export function isCaptionCandidate(blocks,index){const b=blocks[index];if(index<1||blocks[index-1]?.type!=='images'||b?.type!=='paragraph'||b.role||b.markdownKind)return false;const text=textOf(b.html).trim();return text.length>0&&text.length<=100}
export function recognizeImageCaptions(article){return {...article,blocks:article.blocks.map((b,i)=>isCaptionCandidate(article.blocks,i)?{...b,role:'image-caption'}:b)}}
// 只识别数字加空格的章节，不改变图片、正文内容或既有样式。
export function isNumberedChapter(b){if(!['paragraph','subheading'].includes(b.type)||b.markdownKind)return false;const plain=textOf(b.html).trim();return plain.length<=40&&/^[0-9]{1,2}(?:\s+|[、．]\s*)\S/u.test(plain)&&!/[。！？!?]$/.test(plain)}
export function recognizeNumberedChapters(article){return {...article,blocks:article.blocks.map(b=>isNumberedChapter(b)?{...b,type:'heading'}:b)}}
// 归藏式图组：按已知数量与比例选版式，不猜测图片内容、不裁图。
export function chooseImageLayout(images){
 const count=images.length,ratio=im=>Number(im.width)>0&&Number(im.height)>0?Number(im.width)/Number(im.height):null;
 if(count<2)return 'vertical';
 if(count===2){const [a,b]=images.map(ratio);if(a&&b&&a>1.25&&b<.9)return 'wide-left';if(a&&b&&a<.9&&b>1.25)return 'wide-right';return 'pair'}
 if(count===3){const first=ratio(images[0]);return first&&first<.8?'pair':'lead-pair'}
 return 'pair';
}
export function layoutArticleImages(article){return {...article,blocks:article.blocks.map(b=>b.type==='images'?{...b,layout:chooseImageLayout(b.images),gap:b.images.length===1?0:8,ratio:'original',treatment:b.images.length===1&&/(截图|截屏|screenshot|screen[ _-]?shot)/i.test((b.images[0].name||'')+' '+(b.images[0].alt||''))?'browser':'plain'}:b)}}
// 按句末标点估算手机阅读长度，保留文字和内联格式；不在无自然停顿处硬切。
function paragraphBreaks(b){
 if(b.type!=='paragraph'||b.role||b.markdownKind||/<(?:img|table|pre|br)\b/i.test(b.html||''))return [];
 const text=textOf(b.html);if(text.length<=120)return [];
 const ends=[];const re=/[。！？!?；;][”’」』）)]*/gu;let m;while((m=re.exec(text)))ends.push(m.index+m[0].length);
 const cuts=[];let start=0;
 while(text.length-start>120){const candidates=ends.filter(n=>n-start>=60&&n-start<=120&&text.length-n>=20);const later=ends.find(n=>n-start>120&&n-start<=160&&text.length-n>=20);const cut=candidates.at(-1)||later;if(!cut)break;cuts.push(cut);start=cut}
 return cuts;
}
export function canSplitLongParagraph(b){return paragraphBreaks(b).length>0}
export function splitLongParagraph(b){
 const cuts=paragraphBreaks(b);if(!cuts.length)return [b];
 const root=document.createElement('div');root.innerHTML=clean(b.html);const text=root.textContent||'';
 const cloneSlice=(from,to)=>{let pos=0;function copy(node){if(node.nodeType===3){const start=pos,end=pos+node.data.length;pos=end;const left=Math.max(from,start),right=Math.min(to,end);return right>left?document.createTextNode(node.data.slice(left-start,right-start)):null}if(node.nodeType!==1)return null;const el=node.cloneNode(false);for(const child of node.childNodes){const part=copy(child);if(part)el.appendChild(part)}return el.hasChildNodes()?el:null}const holder=document.createElement('div');for(const child of root.childNodes){const part=copy(child);if(part)holder.appendChild(part)}return clean(holder.innerHTML)};
 return [0,...cuts,text.length].slice(0,-1).map((from,i)=>{const to=[...cuts,text.length][i];return {...b,id:i===0?b.id:uid(),html:cloneSlice(from,to)}});
}
export function splitArticleParagraphs(article){return {...article,blocks:article.blocks.flatMap(splitLongParagraph)}}
// 排版只改变呈现规则，保留所有文字、图片内容及顺序。
export function autoLayout(article,preset=DEFAULT_STYLE){
 const blocks=[];
 let title=article.title||'',subtitle=article.subtitle||'';
 for(const source of article.blocks){
  const b={...source};
  const plain=textOf(b.html).trim();
  if(!blocks.length&&b.role==='title'&&(!title||title===plain)){title=plain;continue;}
  if(!blocks.length&&!b.markdownKind&&/^标题[：:]/.test(plain)&&!title){title=plain.replace(/^标题[：:]\s*/,'');continue;}
  if(!blocks.length&&!b.markdownKind&&/^副标题[：:]/.test(plain)&&!subtitle){subtitle=plain.replace(/^副标题[：:]\s*/,'');continue;}
  if(b.type==='paragraph'&&!b.markdownKind&&plain.length>=3){
   if(plain.length<=90&&/^(?:[一二三四五六七八九十]+[、.．]|第[一二三四五六七八九十0-9]+[章节]|附[：:])/u.test(plain))b.type='heading';
   else if(isNumberedChapter(b))b.type='heading';
   else if(plain.length<=90&&/^(?:[0-9]{1,2}[、.．]\s*|法则[一二三四五六七八九十0-9]+[：:])/u.test(plain))b.type='subheading';
   else if(plain.length<=60&&/^(?:<strong>|<b>)[\s\S]+(?:<\/strong>|<\/b>)$/.test((b.html||'').trim())&&!/[。！？!?]$/.test(plain))b.type='subheading';
  }
  if(b.type==='images'){
   b.images=b.images.map(im=>({...im}));
   const previous=blocks[blocks.length-1];
   // Word 中连续图片视为一组；带独立说明的组保持分开。
   if(previous?.type==='images'&&!previous.caption&&!b.caption){previous.images.push(...b.images);continue;}
  }
  blocks.push(b);
 }
 if(blocks[0]?.type==='paragraph'&&!blocks[0].markdownKind&&textOf(blocks[0].html).length<=110&&blocks.length>=3)blocks[0]={...blocks[0],type:'lead'};
 return splitArticleParagraphs(layoutArticleImages({...article,title,subtitle,style:normalizeStyle({...preset,typography:article.style?.typography||'standard',headingSeries:article.style?.headingSeries||preset.headingSeries,fontFamily:article.style?.fontFamily||preset.fontFamily,wechatFontMode:article.style?.wechatFontMode??preset.wechatFontMode,customFont:article.style?.customFont??preset.customFont,subtitleSeries:article.style?.subtitleSeries||preset.subtitleSeries||DEFAULT_SUBTITLE_SERIES,...(article.style?.paletteId?{paletteId:article.style.paletteId,accent:article.style.accent}:{})}),blocks,status:'draft'}));
}
