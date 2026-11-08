// Figure layouts: editorial picture blocks built only from inline styles and
// presentation tables, so the editor, preview and WeChat export stay identical.
import {articlePalette} from './article-palettes.js';
import {captionHTML, captionTypography, escapeText as esc, mixHex} from './caption-type.js';

const safeSrc = src => /^\/media\/[a-zA-Z0-9.-]+$/.test(src || '') || /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\r\n]+$/.test(src || '') ? src : '';

export function renderImageGroup(b,style,{compatible=true,assets={},figureStart=1,followedByCaption=false}={}){
 const s=style,t=captionTypography(s),p=articlePalette(s),treat=b.treatment||'plain';
 const gap=b.layout==='seamless'?0:Number(b.gap)||0;
 const mono="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;";
 const plainImg=(im,ratio='original')=>{const src=safeSrc(assets[im.src]||im.src),position=Math.max(0,Math.min(100,Number(im.position??50)||0)),crop=ratio==='square'?'aspect-ratio:1;object-fit:cover;object-position:'+position+'% 50%;':ratio==='wide'?'aspect-ratio:16/9;object-fit:cover;object-position:'+position+'% 50%;':'';return `<img src="${esc(src)}" alt="${esc(im.alt||im.name||'')}" style="display:block;width:100%;height:auto;margin:0;${crop}"/>`};
 // Screenshot shell: paper-toned stage with a hairline, optionally a browser chrome bar.
 const stage=mixHex(p.tint,p.ink,.10),dotColor=mixHex(p.accent,p.tint,.55);
 const shadow='box-shadow:0 6px 18px rgba(18,20,22,.07);';
 const shot=html=>treat==='frame'?`<section style="background:${stage};outline:1px solid ${p.rule};padding:0;${shadow}">${html}</section>`:treat==='browser'?`<section style="outline:1px solid ${p.rule};background:${stage};${shadow}">`+`<section style="padding:8px 12px;border-bottom:1px solid ${p.rule};font-size:0;line-height:0;">`+[0,1,2].map(()=>`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${dotColor};margin-right:5px;vertical-align:middle;">&nbsp;</span>`).join('')+`<span style="float:right;${mono}font-size:9px;line-height:1.4;letter-spacing:.1em;color:${p.muted};vertical-align:middle;">CAPTURE</span></section>`+`<section style="padding:0;">${html}</section></section>`:html;
 const blockImage=im=>shot(plainImg(im,b.ratio))+captionHTML(s,im.caption,'item');
 const cols=b.layout==='pair'?2:b.layout==='grid'?3:1;
 const tableRow=(images,widths)=>'<table role="presentation" style="width:100%;table-layout:fixed;border-collapse:collapse;"><tbody><tr>'+images.map((im,i)=>'<td style="vertical-align:top;border:0;padding:0 '+(i<images.length-1?gap:0)+'px 0 0;width:'+widths[i]+'%;">'+blockImage(im)+'</td>').join('')+'</tr></tbody></table>';
 // 图文说明纵向排在图片下方，图片始终与正文两侧对齐。
 if(treat==='split'&&b.images.length===1&&b.caption){
  return `<section style="margin:${s.imageGap}px 0;">${blockImage(b.images[0])}${captionHTML(s,b.caption,'item')}</section>`;
 }
 let body;
 if(b.layout==='lead-pair'&&b.images.length){body='<section style="margin:0 0 '+gap+'px;">'+blockImage(b.images[0])+'</section>';for(let i=1;i<b.images.length;i+=2){const row=b.images.slice(i,i+2);body+=tableRow(row,row.length===1?[100]:[50,50])}}
 else if(b.layout==='wide-left'||b.layout==='wide-right'){body='';for(let i=0;i<b.images.length;i+=2){const row=b.images.slice(i,i+2);body+=tableRow(row,row.length===1?[100]:b.layout==='wide-left'?[62,38]:[38,62])}}
 else if(b.layout==='inset'){body=b.images.map(im=>'<section style="width:100%;margin:0 0 '+gap+'px;">'+blockImage(im)+'</section>').join('')}
 else if(b.layout==='numbered'){body=b.images.map((im,i)=>'<section style="margin:0 0 '+gap+'px;"><p style="margin:0 0 8px;font-family:Georgia,serif;font-size:'+(t.item-2)+'px;line-height:1.4;letter-spacing:1px;color:'+s.accent+';">'+String(i+1).padStart(2,'0')+' /</p>'+blockImage(im)+'</section>').join('')}
 else if(cols>1){body='';for(let i=0;i<b.images.length;i+=cols){const row=b.images.slice(i,i+cols);body+=tableRow(row,row.map(()=>100/row.length))}}
 else if(b.layout==='horizontal'&&!compatible){body=`<section style="display:flex;overflow-x:auto;gap:${gap}px;scroll-snap-type:x mandatory;">`+b.images.map(im=>`<section style="flex:0 0 88%;scroll-snap-align:start;">${blockImage(im)}</section>`).join('')+'</section>'+captionHTML(s,'左右滑动查看','note')}
 else body=b.images.map(im=>`<section style="margin:0 0 ${gap}px;">${blockImage(im)}</section>`).join('');
 return `<section style="margin:${s.imageGap}px 0 ${followedByCaption?10:s.imageGap}px;">${body}${captionHTML(s,b.caption,s.preset==='magazine'&&treat==='feature'?'feature':'group')}</section>`;
}
