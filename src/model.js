import{articlePalette}from'../public/article-palettes.js';
import DOMPurify from 'dompurify';
import{normalizeSeries,headingSeriesStyles,styleText,seriesHeadingHTML}from'../public/heading-series.js';
export const DEFAULT_STYLE={preset:'magazine',headingSeries:'editorial',paletteId:'celadon',fontSize:16,lineHeight:1.98,paragraphGap:24,sidePadding:30,accent:'#426B64',imageGap:34,titleSize:31,subtitleSize:15,headingSize:19,subheadingSize:17,leadSize:14,quoteSize:23};
export const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const clean=html=>DOMPurify.sanitize(html||'',{ALLOWED_TAGS:['strong','b','em','i','u','s','a','br','span','code'],ALLOWED_ATTR:['href'],ALLOW_DATA_ATTR:false});
export const textOf=html=>{const d=document.createElement('div');d.innerHTML=clean(html);return d.textContent||''};
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const inline=s=>clean(escape(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2">$1</a>'));
export function parseMarkdown(s){return s.replace(/\r\n/g,'\n').split(/\n/).filter(x=>x.trim()).map(line=>{const t=line.trim();let type='paragraph',content=t;if(/^#{1,2}\s/.test(t)){type='heading';content=t.replace(/^#+\s/,'')}else if(/^#{3,6}\s/.test(t)){type='subheading';content=t.replace(/^#+\s/,'')}else if(/^>\s?/.test(t)){type='quote';content=t.replace(/^>\s?/,'')}else if(/^([-*+] |\d+\. )/.test(t)){type='list';content=t.replace(/^([-*+] |\d+\. )/,'')}else if(/^(-{3,}|\*{3,})$/.test(t)){type='divider';content=''}return{id:uid(),type,html:inline(content),...(/^#\s/.test(t)?{role:'title'}:{})}})}
export function parseHTML(html){const dom=new DOMParser().parseFromString(DOMPurify.sanitize(html,{ADD_TAGS:['img'],ADD_ATTR:['src']}),'text/html');const out=[];function walk(node){if(node.nodeType===3){if(node.textContent.trim())out.push({id:uid(),type:'paragraph',html:escape(node.textContent)});return}if(node.nodeType!==1)return;const tag=node.tagName.toLowerCase();if(tag==='img'){if(node.getAttribute('src')?.startsWith('/media/'))out.push(imageBlock([{id:uid(),src:node.getAttribute('src'),name:node.alt||'Word 图片',alt:node.alt||'',caption:'',position:50}]));return}if(node.querySelector('img')||['div','section','article','ul','ol','table','tbody','tr','td'].includes(tag)){[...node.childNodes].forEach(walk);return}out.push({id:uid(),type:tag==='h1'||tag==='h2'?'heading':/^h[3-6]$/.test(tag)?'subheading':tag==='blockquote'?'quote':tag==='li'?'list':'paragraph',html:clean(node.innerHTML),...(tag==='h1'?{role:'title'}:{})})} [...dom.body.childNodes].forEach(walk);return out.filter(b=>b.type==='images'||textOf(b.html).trim())}
export const imageBlock=images=>({id:uid(),type:'images',images,layout:'vertical',gap:8,ratio:'original',caption:''});
export const newArticle=style=>({title:'',subtitle:'',author:'',cover:null,blocks:[],style:{...DEFAULT_STYLE,...style},status:'draft',dismissed:[]});
export function normalizeStyle(s={}){const magazine=s.preset==='magazine',palette=articlePalette(s);const fallback=magazine?DEFAULT_STYLE:{fontSize:16,lineHeight:1.95,paragraphGap:22,sidePadding:24,imageGap:28,titleSize:32,subtitleSize:17,headingSize:23,subheadingSize:19,leadSize:17,quoteSize:19,accent:'#333333'};const n=(key,min,max)=>Math.min(max,Math.max(min,Number(s[key])||fallback[key]));return{preset:magazine?'magazine':'classic',headingSeries:normalizeSeries(s.headingSeries),paletteId:palette.id,fontSize:n('fontSize',14,22),lineHeight:n('lineHeight',1.4,2.4),paragraphGap:n('paragraphGap',8,36),sidePadding:n('sidePadding',12,36),imageGap:n('imageGap',8,40),titleSize:n('titleSize',26,40),subtitleSize:n('subtitleSize',13,22),headingSize:n('headingSize',18,28),subheadingSize:n('subheadingSize',16,23),leadSize:n('leadSize',14,20),quoteSize:n('quoteSize',17,28),accent:magazine?palette.accent:(/^#[0-9a-f]{6}$/i.test(s.accent)?s.accent:fallback.accent)}}
export function headingNumber(blocks,index){return String(blocks.slice(0,index+1).filter(b=>b.type==='heading').length).padStart(2,'0')}
export function headingDisplayHTML(html){return clean(html).replace(/^((?:<(?:strong|b)>)*)(?:[一二三四五六七八九十]+[、.．]\s*)/u,'$1')}

export function blockTypography(b,s){
 if(s.preset==='magazine'){
  const p=articlePalette(s);
  if(b.type==='heading')return styleText(headingSeriesStyles(s).heading);
  if(b.type==='subheading')return styleText(headingSeriesStyles(s).subheading);
  if(b.type==='lead')return `font-size:${s.leadSize}px;font-weight:400;line-height:2.05;margin:32px 0 0;padding:25px 21px;background:${p.tint};color:${p.ink};`;
  if(b.type==='quote')return `font-family:'Songti SC','STSong',serif;font-size:${s.quoteSize}px;font-weight:600;line-height:1.8;letter-spacing:1px;color:${s.accent};margin:38px 0 36px;padding:24px 0 25px;border-top:1px solid ${p.rule};border-bottom:1px solid ${p.rule};`;
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
export function exportHTML(a,{compatible=true,assets={}}={}){const s=normalizeStyle(a.style),p=articlePalette(s);const image=im=>{const src=safeSrc(assets[im.src]||im.src);return `<img src="${escape(src)}" alt="${escape(im.alt||im.name||'')}" style="display:block;width:100%;height:auto;margin:0;"/>${im.caption?`<p style="font-size:12px;line-height:1.6;color:#888888;margin:8px 0 0;">${escape(im.caption)}</p>`:''}`};const blocks=a.blocks.map((b,index)=>{if(b.type==='divider')return '<hr style="border:0;border-top:1px solid #e5e5e5;margin:32px 0;"/>';if(b.type==='images'){const cols=b.layout==='pair'?2:b.layout==='grid'?3:1;const gap=b.layout==='seamless'?0:Number(b.gap)||0;let body;if(cols>1){body='<table role="presentation" style="width:100%;table-layout:fixed;border-collapse:separate;border-spacing:'+gap+'px;"><tbody>';for(let i=0;i<b.images.length;i+=cols){body+='<tr>'+b.images.slice(i,i+cols).map(im=>'<td style="vertical-align:top;padding:0;width:'+100/cols+'%;">'+image(im)+'</td>').join('')+'</tr>'}body+='</tbody></table>'}else if(b.layout==='horizontal'&&!compatible){body=`<section style="display:flex;overflow-x:auto;gap:${gap}px;scroll-snap-type:x mandatory;">`+b.images.map(im=>`<section style="flex:0 0 88%;scroll-snap-align:start;">${image(im)}</section>`).join('')+'</section><p style="font-size:12px;color:#666666;">左右滑动查看</p>'}else body=b.images.map(im=>`<section style="margin:0 0 ${gap}px;">${image(im)}</section>`).join('');return `<section style="margin:${s.imageGap}px 0;">${body}${b.caption?(s.preset==='magazine'&&b.treatment==='feature'?'<p style="padding:23px 21px 26px;background:'+s.accent+';color:'+p.onAccent+';font-family:Songti SC,serif;font-size:24px;line-height:1.55;margin:0;">'+escape(b.caption)+'</p>':'<p style="font-size:12px;line-height:1.6;color:#888888;margin:8px 0 0;">'+escape(b.caption)+'</p>'):''}</section>`}const h=clean(b.html);
if(s.preset==='magazine'&&b.type==='heading')return seriesHeadingHTML(s,headingNumber(a.blocks,index),headingDisplayHTML(h));
if(s.preset==='magazine'&&b.type==='lead')return `<section style="${blockTypography(b,s)}"><p style="font-family:Georgia,serif;font-size:48px;line-height:0.8;color:${s.accent};margin:0 0 19px;">“</p><p style="margin:0;">${h}</p><p style="font-family:Georgia,serif;text-align:right;font-size:42px;line-height:0.8;color:${s.accent};margin:21px 0 0;">”</p></section>`;
const tag=b.type==='heading'?'h2':b.type==='subheading'?'h3':b.type==='quote'?'blockquote':'p';return `<${tag} style="${blockTypography(b,s)}">${b.type==='list'?'• ':''}${h}</${tag}>`}).join('');return `<section style="box-sizing:border-box;padding:0 ${s.sidePadding}px;background:${s.preset==='magazine'?p.paper:'#ffffff'};color:${s.preset==='magazine'?p.ink:'#333333'};font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;font-size:${s.fontSize}px;line-height:${s.lineHeight};word-wrap:break-word;">${a.subtitle?`<p style="${styleText(headingSeriesStyles(s).subtitle)}">${escape(a.subtitle)}</p>`:''}${blocks}</section>`}
export const demo=()=>({...newArticle(),title:'把日子，过回自己的节奏',subtitle:'一篇示例文章，试着调整它的留白与节奏。',author:'简序 · 示例',blocks:parseMarkdown('周末，我又走进了那条很久没去的街。\n\n沿街的梧桐还在，修鞋的小店也还在。门口摆着一把旧椅子，阳光从树叶的缝隙落下来，正好停在椅背上。\n\n## 有些事情，慢一点才看得见\n\n以前经过这里，我总是低着头看手机。导航告诉我还剩几分钟，消息提醒我下一件事。我知道自己要去哪里，却很少知道自己正经过什么。\n\n那天没有着急回的消息，我坐下来，听老板讲起这条街的变化。他说起一间关掉的书店，说起搬走的邻居，又说今年秋天来得晚。\n\n> 留一点没有安排的时间，让生活自己走进来。\n\n## 重新找回自己的步幅\n\n我们习惯了把一天填满，仿佛空下来就意味着落后。可很多真正记得住的时刻，并不是计划表上的一格。\n\n是一次没赶时间的散步，是与朋友多聊的十分钟，是把一顿饭认真吃完。\n\n不必急着改变全部生活。就从今天开始，给自己留下一小段空白。')});

// 排版只改变呈现规则，保留所有文字、图片内容及顺序。
export function autoLayout(article,preset=DEFAULT_STYLE){
 const blocks=[];
 let title=article.title||'',subtitle=article.subtitle||'';
 for(const source of article.blocks){
  const b={...source};
  const plain=textOf(b.html).trim();
  if(!blocks.length&&b.role==='title'&&(!title||title===plain)){title=plain;continue;}
  if(!blocks.length&&/^标题[：:]/.test(plain)&&!title){title=plain.replace(/^标题[：:]\s*/,'');continue;}
  if(!blocks.length&&/^副标题[：:]/.test(plain)&&!subtitle){subtitle=plain.replace(/^副标题[：:]\s*/,'');continue;}
  if(b.type==='paragraph'&&plain.length>=3){
   if(plain.length<=90&&/^(?:[一二三四五六七八九十]+[、.．]|第[一二三四五六七八九十0-9]+[章节]|附[：:])/u.test(plain))b.type='heading';
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
 for(const b of blocks)if(b.type==='images'){
  b.layout=b.images.length===2?'pair':'vertical';
  b.gap=b.images.length===2?8:16;
  b.ratio='original';
  if(normalizeStyle(preset).preset==='magazine'&&!b.treatment)b.treatment=b.images.length===2?'staggered':b.caption?'feature':'plain';
 }
 if(blocks[0]?.type==='paragraph'&&textOf(blocks[0].html).length<=110&&blocks.length>=3)blocks[0]={...blocks[0],type:'lead'};
 return {...article,title,subtitle,style:normalizeStyle({...preset,headingSeries:article.style?.headingSeries||preset.headingSeries,...(article.style?.paletteId?{paletteId:article.style.paletteId,accent:article.style.accent}:{})}),blocks,status:'draft'};
}
