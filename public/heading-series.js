import{articleFont}from'./article-fonts.js';
import{articlePalette}from'./article-palettes.js';
export const HEADING_SERIES=[
 {id:'bookish',name:'书刊章题',description:'小章号、宋体标题与纤细分隔线'},
 {id:'editorial',name:'杂志章号',description:'大号数字与标题并列'},
 {id:'rule',name:'细线分隔',description:'细线划分章节，数字收小'},
 {id:'label',name:'标签引导',description:'深色编号标签，层级清楚'},
 {id:'centered',name:'居中题记',description:'编号在上，标题居中'},
 {id:'band',name:'浅底标题',description:'浅灰底承托章节标题'},
 {id:'side',name:'侧线章题',description:'细竖线衬托章节'},
 {id:'stack',name:'上下章序',description:'编号在上，标题靠左'},
 {id:'underline',name:'短线收束',description:'细线托起章节标题'},
 {id:'frame',name:'留白边框',description:'细边框围合章节'},
 {id:'dot',name:'小圆点',description:'圆点和短编号轻巧引导'},
 {id:'margin-note',name:'竖线旁注',description:'竖线与小号章序'},
 {id:'short-lines',name:'上下短线',description:'居中短线与留白'},
 {id:'large-number',name:'大小字组合',description:'大号章序与细线'},
 {id:'large-frame',name:'留白大框',description:'完整细框与宽留白'},
 {id:'open-frame',name:'开口大框',description:'轻盈开口与宽留白'},
 {id:'tinted-frame',name:'浅底宽框',description:'柔和浅底与宽留白'},
 {id:'accent-left',name:'居左色点',description:'大章号与色点，标题和短线左对齐'},
 {id:'accent-dot',name:'色点章序',description:'大编号与色点，粗标题配短色带'},
 {id:'serif-slash',name:'宋体留白框',description:'细边大框、框内留白与宋体章题'},
 {id:'full-rule',name:'通栏细线',description:'通栏细线隔开，居中宋体标题'},
 {id:'indent-block',name:'偏栏留白',description:'整段缩进，靠留白与字号差'},
 {id:'framed-air',name:'带框留白',description:'细框加大留白，标题收在框内'}
];
export const NEW_CHAPTER_IDS=['accent-dot','serif-slash','full-rule','indent-block','framed-air'];
export const DESIGNED_HEADING_IDS=['side','accent-left','bookish','margin-note','short-lines','large-number','large-frame','open-frame','tinted-frame',...NEW_CHAPTER_IDS];
// Curated distinct choices; keep saved articles and backups compatible.
export const SELECTABLE_HEADING_SERIES=['bookish','accent-left','accent-dot','serif-slash','side'].map(id=>HEADING_SERIES.find(s=>s.id===id));
export const normalizeSeries=id=>HEADING_SERIES.some(s=>s.id===id)?id:'editorial';
export function randomSeries(current,random=Math.random){const ids=SELECTABLE_HEADING_SERIES.map(s=>s.id).filter(id=>id!==normalizeSeries(current));return ids[Math.min(ids.length-1,Math.max(0,Math.floor(random()*ids.length)))];}
export const styleText=obj=>Object.entries(obj).map(([k,v])=>k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+':'+v).join(';')+';';
export function headingSeriesStyles(s={}){
 const id=normalizeSeries(s.headingSeries),p=articlePalette(s),color=p.accent;
 const subtitle={fontSize:(s.subtitleSize||15)+'px',fontWeight:400,lineHeight:1.85,color:p.muted,margin:'0 0 28px',maxWidth:'100%'};
 const heading={fontSize:(s.headingSize||19)+'px',fontWeight:600,lineHeight:1.7,letterSpacing:'0.5px',color:p.ink,margin:'57px 0 29px',display:'flex',alignItems:'flex-end',gap:'17px'};
 const number={fontFamily:'Georgia,serif',fontSize:'61px',fontWeight:400,lineHeight:1,letterSpacing:'-5px',color,flexShrink:0};
 const subheading={fontSize:(s.subheadingSize||17)+'px',fontWeight:600,lineHeight:1.7,margin:'32px 0 18px',color:p.ink};
 if(id==='rule'){Object.assign(subtitle,{borderTop:'1px solid '+p.rule,paddingTop:'13px'});Object.assign(heading,{borderTop:'1px solid '+p.rule,paddingTop:'16px',alignItems:'baseline',gap:'12px'});Object.assign(number,{fontSize:'18px',letterSpacing:0});Object.assign(subheading,{borderBottom:'1px solid '+p.rule,paddingBottom:'10px'});}
 if(id==='label'){Object.assign(subtitle,{color,fontWeight:500});Object.assign(heading,{alignItems:'center',gap:'12px'});Object.assign(number,{fontFamily:'inherit',fontSize:'13px',letterSpacing:0,color:p.onAccent,background:color,padding:'10px 8px',lineHeight:1.2});Object.assign(subheading,{color,letterSpacing:'0.6px'});}
 if(id==='centered'){Object.assign(subtitle,{textAlign:'center'});Object.assign(heading,{flexDirection:'column',alignItems:'center',textAlign:'center',gap:'12px'});Object.assign(number,{fontSize:'36px',letterSpacing:'-1px'});Object.assign(subheading,{textAlign:'center',color});}
 if(id==='band'){Object.assign(subtitle,{background:p.tint,padding:'12px 14px'});Object.assign(heading,{background:p.tint,padding:'18px 16px',alignItems:'center',gap:'13px'});Object.assign(number,{fontSize:'30px',letterSpacing:'-1px'});Object.assign(subheading,{background:p.tint,padding:'10px 14px'});}
 if(id==='side'){Object.assign(heading,{borderLeft:'3px solid '+color,paddingLeft:'16px',alignItems:'baseline',gap:'12px'});Object.assign(number,{fontSize:'18px',letterSpacing:0});Object.assign(subheading,{borderLeft:'2px solid '+color,paddingLeft:'12px'});}
 if(id==='stack'){Object.assign(heading,{flexDirection:'column',alignItems:'flex-start',gap:'10px'});Object.assign(number,{fontSize:'31px',letterSpacing:'-1px'});Object.assign(subheading,{letterSpacing:'1px'});}
 if(id==='underline'){Object.assign(heading,{borderBottom:'1px solid '+p.rule,paddingBottom:'14px',alignItems:'baseline',gap:'12px'});Object.assign(number,{fontSize:'18px',letterSpacing:0});Object.assign(subheading,{borderBottom:'1px solid '+p.rule,paddingBottom:'8px'});}
 if(id==='frame'){Object.assign(heading,{border:'1px solid '+p.rule,padding:'16px',alignItems:'center',gap:'12px'});Object.assign(number,{fontSize:'27px',letterSpacing:'-1px'});Object.assign(subheading,{borderLeft:'2px solid '+color,paddingLeft:'12px'});}
 if(id==='dot'){Object.assign(heading,{alignItems:'baseline',gap:'12px'});Object.assign(number,{fontFamily:'inherit',fontSize:'13px',fontWeight:700,letterSpacing:0,color, borderBottom:'3px solid '+color,paddingBottom:'4px'});Object.assign(subheading,{color});}
 if(NEW_CHAPTER_IDS.includes(id)||id==='accent-left'){
  Object.assign(heading,{display:'block',margin:'96px 0 48px',fontSize:'28px',fontWeight:700,lineHeight:1.42,letterSpacing:'0.01em',color:p.ink});
  if(id==='accent-left')Object.assign(heading,{textAlign:'left',fontSize:'30px',margin:'80px 0 44px'});
  if(id==='serif-slash')Object.assign(heading,{margin:'64px 0 32px',fontSize:Math.min(28,Math.max(22,Number(s.headingSize)||26))+'px',fontWeight:600,fontFamily:'Songti SC,STSong,serif'});
  if(id==='full-rule')Object.assign(heading,{margin:'34px 0 48px',fontSize:'28px',fontWeight:600,fontFamily:'Songti SC,STSong,serif',textAlign:'center'});
  if(id==='indent-block')Object.assign(heading,{margin:'96px 0 56px',paddingLeft:'26px',fontSize:'26px',fontWeight:600,fontFamily:'Songti SC,STSong,serif'});
  if(id==='framed-air')Object.assign(heading,{margin:'96px 0 56px',fontSize:'26px',fontWeight:600,fontFamily:'Songti SC,STSong,serif'});
  Object.assign(number,{fontFamily:'Helvetica Neue,Arial,sans-serif',fontSize:'64px',fontWeight:700,letterSpacing:'-3px',color:p.ink});
  Object.assign(subheading,{fontSize:'18px',fontWeight:600,margin:'48px 0 22px',letterSpacing:'0.02em',fontFamily:'Songti SC,STSong,serif'});
  if(id==='full-rule')Object.assign(subheading,{textAlign:'center'});
  if(id==='indent-block')Object.assign(subheading,{paddingLeft:'26px'});
 }
 if(DESIGNED_HEADING_IDS.includes(id)&&!NEW_CHAPTER_IDS.includes(id)&&id!=='accent-left'){
  Object.assign(heading,{display:'block',margin:'52px 0',lineHeight:1.6,fontFamily:'Songti SC,STSong,serif',letterSpacing:'1px'});
  if(id==='margin-note')Object.assign(heading,{borderLeft:'3px solid '+color,padding:'3px 0 3px 15px'});
  if(id==='short-lines')Object.assign(heading,{textAlign:'center',padding:'4px 0'});
  if(id==='large-number')Object.assign(heading,{borderBottom:'1px solid '+p.rule,paddingBottom:'16px'});
  if(id==='large-frame')Object.assign(heading,{border:'1px solid '+p.rule,padding:'27px 22px 29px',textAlign:'center'});
  if(id==='open-frame')Object.assign(heading,{borderLeft:'1px solid '+p.rule,borderRight:'1px solid '+p.rule,padding:'0 22px',textAlign:'center'});
  if(id==='tinted-frame')Object.assign(heading,{background:p.tint,borderLeft:'3px solid '+color,padding:'29px 24px'});
 }
 if(id==='bookish'){Object.assign(heading,{display:'block',fontFamily:'Songti SC,STSong,Noto Serif CJK SC,serif',fontSize:(s.headingSize||23)+'px',fontWeight:600,lineHeight:1.55,letterSpacing:'0.4px',margin:'48px 0 26px'});Object.assign(subheading,{fontSize:(s.subheadingSize||17)+'px',fontWeight:600,lineHeight:1.7,margin:'30px 0 16px',letterSpacing:'0.2px'});}
 const font=articleFont(s);if(font){heading.fontFamily=font;subheading.fontFamily=font;}
 return{subtitle,heading,number,subheading};
}
// Shared by editing, reading and clipboard HTML; no stylesheet or layout table required.
export function chapterTitleMetrics(style={},html=''){
 const text=html.replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,'字').trim();
 const length=Array.from(text).length,base=Number(style.headingSize)||23,id=normalizeSeries(style.headingSeries);
 const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
 let fontSize=clamp(base,21,28),lineHeight=1.6;
 if(id==='accent-dot'){fontSize=clamp(base+13,30,36);if(length>18)fontSize=Math.max(26,fontSize-6);if(length>32)fontSize=Math.max(24,fontSize-2);lineHeight=1.45}
 if(id==='accent-left'){fontSize=clamp(base+7,26,32);if(length>18)fontSize=Math.max(24,fontSize-4);if(length>32)fontSize=Math.max(23,fontSize-2);lineHeight=1.5}
 if(id==='serif-slash'){fontSize=clamp(base,22,28);if(length>24)fontSize=Math.max(22,fontSize-1)}
 if(id==='side')fontSize=clamp(base,20,26);
 return {length,fontSize,lineHeight};
}
function readableChapterTitle(html){
 return html.split(/(<[^>]*>)/g).map(part=>{
  if(part.startsWith('<'))return part.replace(/^<(strong|b)>$/i,'<$1 style="font-weight:inherit;color:inherit;">');
  return part.replace(/\d+(?:[.,]\d+)*(?:万|亿)?(?:港元|美元|澳元|人民币|元|%|％|万|亿)/g,match=>match.length<=14?`<span style="white-space:nowrap;">${match}</span>`:match);
 }).join('');
}
function selectedHeadingHTML(s,num,html){
 const id=normalizeSeries(s.headingSeries),p=articlePalette(s),m=chapterTitleMetrics(s,html);
 const serif="'Songti SC','STSong','Noto Serif CJK SC',serif",sans="'Helvetica Neue',Arial,sans-serif";
 const font=articleFont(s)||(id==='accent-dot'||id==='accent-left'?sans:serif);
 const centered=id==='accent-dot'||id==='serif-slash',align=centered?'center':'left';
 const title=`<h2 data-folio-heading-title style="box-sizing:border-box;max-width:100%;margin:0;font-family:${font};font-size:${m.fontSize}px;font-weight:600;line-height:${m.lineHeight};letter-spacing:.02em;color:${p.ink};text-align:${align};white-space:normal;word-break:break-word;overflow-wrap:break-word;">${readableChapterTitle(html)}</h2>`;
 const outer='box-sizing:border-box;max-width:100%;min-width:0;font-family:'+font+';';
 const smallNumber=`<p style="margin:0 0 12px;font-family:Georgia,serif;font-size:12px;font-weight:400;line-height:1.5;letter-spacing:2px;color:${p.accent};">${num}</p>`;
 if(id==='bookish')return `<section style="${outer}margin:44px 0 24px;border-top:1px solid ${p.rule};padding-top:18px;">${smallNumber}${title}</section>`;
 if(id==='side')return `<section style="${outer}margin:44px 0 24px;border-left:2px solid ${p.accent};padding:2px 0 2px 14px;">${smallNumber}${title}</section>`;
 if(id==='serif-slash')return `<section style="${outer}margin:56px 0 32px;"><section style="${outer}border:1px solid ${p.rule};padding:32px 20px 34px;text-align:center;">${smallNumber}${title}</section></section>`;
 const left=id==='accent-left',numberSize=left?52:56,ruleWidth=left?64:96;
 const number=`<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:${numberSize}px;font-weight:600;line-height:1.1;letter-spacing:-2px;color:${p.ink};text-align:${align};">${num}<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${p.accent};margin-left:6px;vertical-align:baseline;font-size:0;line-height:0;">&nbsp;</span></p>`;
 const rule=`<p style="width:${ruleWidth}px;max-width:100%;height:3px;background:${p.accent};font-size:0;line-height:0;margin:22px ${left?'0':'auto'} 0;">&nbsp;</p>`;
 return `<section style="${outer}margin:${left?'56px':'64px'} 0 32px;text-align:${align};">${number}${title}${rule}</section>`;
}

// Five chapter layouts from the author's reference screenshots: wide gaps, a large
// numeral, a 26-28px title and one small mark. Inline styles and tables only.
function chapterHTML(s,num,html,id){
 const p=articlePalette(s),serif=id==='accent-dot'?"'Helvetica Neue',Arial,sans-serif":"'Songti SC','STSong',serif";
 const title=`<h2 data-folio-heading-title style="margin:0;font-family:${serif};font-size:${id==='accent-dot'?'28px':'26px'};font-weight:${id==='accent-dot'?700:600};line-height:1.45;letter-spacing:.02em;color:${p.ink};">${html}</h2>`;
 const band=(w,h,margin)=>`<p style="width:${w}px;height:${h}px;background:${p.accent};font-size:0;line-height:0;margin:${margin};">&nbsp;</p>`;
 if(id==='accent-left')return `<section style="margin:72px 0 44px;text-align:left;"><p style="height:1px;background:${p.rule};font-size:0;line-height:0;margin:0 0 64px;">&nbsp;</p><p style="margin:0;font-family:Georgia,serif;font-size:64px;font-weight:700;line-height:1;letter-spacing:-3px;color:${p.ink};">${num}<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${p.accent};margin-left:7px;vertical-align:baseline;font-size:0;line-height:0;">&nbsp;</span></p><h2 data-folio-heading-title style="margin:20px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:30px;font-weight:600;line-height:1.35;letter-spacing:0;color:${p.ink};overflow-wrap:anywhere;text-align:left;">${html}</h2>${band(72,4,'24px 0 0')}</section>`;
 if(id==='accent-dot')return `<section style="margin:0 0 52px;text-align:center;"><p style="height:1px;background:${p.rule};font-size:0;line-height:0;margin:0 0 112px;">&nbsp;</p><p style="margin:0;font-family:Georgia,serif;font-size:64px;font-weight:700;line-height:1;letter-spacing:-3px;color:${p.ink};">${num}<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${p.accent};margin-left:7px;vertical-align:baseline;font-size:0;line-height:0;">&nbsp;</span></p><h2 data-folio-heading-title style="max-width:270px;margin:20px auto 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:36px;font-weight:600;line-height:1.25;letter-spacing:0;color:${p.ink};overflow-wrap:anywhere;text-wrap:balance;">${html}</h2>${band(140,4,'24px auto 0')}</section>`;
 if(id==='serif-slash')return `<section style="margin:64px 0 32px;text-align:center;"><p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:48px;font-weight:400;line-height:1.1;letter-spacing:-1px;color:${p.accent};">${num}.<span aria-hidden="true" style="display:inline-block;margin-left:14px;font-size:34px;line-height:1;color:${p.rule};vertical-align:baseline;">/</span></p><h2 data-folio-heading-title style="margin:16px 0 0;font-family:'Songti SC',STSong,serif;font-size:${Math.min(28,Math.max(22,Number(s.headingSize)||26))}px;font-weight:600;line-height:1.6;letter-spacing:.02em;color:${p.ink};text-align:center;overflow-wrap:anywhere;">${html}</h2></section>`;
 if(id==='full-rule')return `<section style="margin:34px 0 48px;"><p style="height:1px;background:${p.rule};font-size:0;line-height:0;margin:0 0 88px;">&nbsp;</p><p style="margin:0;text-align:center;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;color:${p.muted};">${num}</p><section style="margin:18px 0 0;text-align:center;">${title}</section>${band(44,3,'26px auto 0')}</section>`;
 if(id==='indent-block')return `<section style="margin:96px 0 56px;padding-left:26px;"><p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:56px;font-weight:700;line-height:1;letter-spacing:-2px;color:${p.ink};">${num}</p><section style="margin:16px 0 0;">${title}</section></section>`;
 return `<section style="margin:96px 0 56px;"><section style="border:1px solid ${p.rule};padding:40px 34px 42px;"><p style="margin:0 0 20px;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;color:${p.muted};">${num}</p>${title}</section></section>`;
}
// Choosing one of the five also sets the matching opening-deck layout.
export function applyHeadingSeries(style={},id){const next={...style,preset:'magazine',headingSeries:normalizeSeries(id)};if(NEW_CHAPTER_IDS.includes(next.headingSeries))next.subtitleSeries=next.headingSeries;if(next.headingSeries==='accent-left')next.subtitleSeries='accent-dot';return next;}
export function seriesHeadingHTML(s,num,html){const id=normalizeSeries(s.headingSeries);if(SELECTABLE_HEADING_SERIES.some(choice=>choice.id===id))return selectedHeadingHTML(s,num,html);if(NEW_CHAPTER_IDS.includes(id)||id==='accent-left'){const markup=chapterHTML(s,num,html,id),font=articleFont(s);return font?markup.replace(/(<h2 data-folio-heading-title style=")([^"]*)/g,(_,start,styles)=>start+styles+'font-family:'+font+';'):markup;}const v=headingSeriesStyles(s);if(id==='bookish'){const p=articlePalette(s);return `<section style="${styleText(v.heading)}"><p style="font-family:Georgia,serif;font-size:12px;line-height:1.4;letter-spacing:2px;font-weight:400;color:${p.accent};margin:0 0 14px;padding-top:16px;border-top:1px solid ${p.rule};">${num}</p><h2 data-folio-heading-title style="font-family:inherit;font-size:inherit;line-height:inherit;font-weight:inherit;letter-spacing:inherit;color:${p.ink};margin:0;">${html}</h2></section>`;}const outer={...v.heading};delete outer.display;delete outer.alignItems;delete outer.gap;delete outer.flexDirection;const number={...v.number};delete number.flexShrink;if(DESIGNED_HEADING_IDS.includes(id)){
 const p=articlePalette(s),caption=`<p style="margin:0 0 8px;font-family:Georgia,serif;font-size:10px;line-height:1.5;font-weight:400;letter-spacing:1.8px;color:${p.muted};">CHAPTER ${num}</p>`;
 const title=`<h2 data-folio-heading-title style="font-family:inherit;font-size:inherit;font-weight:600;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;">${html}</h2>`;
 const line=`<p style="width:27px;height:1px;background:${p.rule};font-size:0;line-height:0;margin:0 auto 15px;">&nbsp;</p>`;
 const endLine=`<p style="width:27px;height:1px;background:${p.rule};font-size:0;line-height:0;margin:15px auto 0;">&nbsp;</p>`;
 const brokenLine=`<table role="presentation" style="width:100%;border-collapse:collapse;table-layout:fixed;"><tr><td style="width:28%;border-top:1px solid ${p.rule};font-size:0;line-height:0;">&nbsp;</td><td style="width:44%;font-size:0;line-height:0;">&nbsp;</td><td style="width:28%;border-top:1px solid ${p.rule};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
 let content=caption+title;
 if(id==='short-lines')content=line+content+endLine;
 if(id==='open-frame')content=brokenLine+`<section style="padding:25px 0 27px;">${content}</section>`+brokenLine;
 if(id==='large-number')content=`<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td style="width:1%;white-space:nowrap;vertical-align:middle;padding:0 16px 0 0;font:52px/1 Georgia,serif;letter-spacing:-3px;color:${p.accent};">${num}</td><td style="vertical-align:middle;">${caption}${title}</td></tr></table>`;
 return `<section style="${styleText(outer)}">${content}</section>`;
 }const mark=id==='editorial'?'/':'';const numberHTML=`<span style="${styleText(number)}">${num}${mark}</span>`;if(id==='centered'||id==='stack')return `<section style="${styleText(outer)}"><p style="margin:0 0 12px;text-align:${id==='centered'?'center':'left'};">${numberHTML}</p><h2 style="font-size:inherit;font-weight:inherit;line-height:inherit;margin:0;text-align:${id==='centered'?'center':'left'};">${html}</h2></section>`;return `<section style="${styleText(outer)}"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td style="vertical-align:${id==='editorial'?'bottom':'middle'};width:1%;white-space:nowrap;padding:0 17px 0 0;">${numberHTML}</td><td style="font-size:inherit;font-weight:inherit;line-height:inherit;">${html}</td></tr></table></section>`;}
