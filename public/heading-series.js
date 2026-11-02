import{articlePalette}from'./article-palettes.js';
export const HEADING_SERIES=[
 {id:'editorial',name:'杂志章号',description:'大号数字与标题并列'},
 {id:'rule',name:'细线分隔',description:'细线划分章节，数字收小'},
 {id:'label',name:'标签引导',description:'深色编号标签，层级清楚'},
 {id:'centered',name:'居中题记',description:'编号在上，标题居中'},
 {id:'band',name:'浅底标题',description:'浅灰底承托章节标题'},
 {id:'side',name:'侧线章题',description:'细竖线衬托章节'},
 {id:'stack',name:'上下章序',description:'编号在上，标题靠左'},
 {id:'underline',name:'短线收束',description:'细线托起章节标题'},
 {id:'frame',name:'留白边框',description:'细边框围合章节'},
 {id:'dot',name:'小圆点',description:'圆点和短编号轻巧引导'}
];
export const SELECTABLE_HEADING_SERIES=HEADING_SERIES.filter(s=>!['rule','label','underline','dot'].includes(s.id));
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
 return{subtitle,heading,number,subheading};
}
export function seriesHeadingHTML(s,num,html){const id=normalizeSeries(s.headingSeries),v=headingSeriesStyles(s);const outer={...v.heading};delete outer.display;delete outer.alignItems;delete outer.gap;delete outer.flexDirection;const number={...v.number};delete number.flexShrink;const mark=id==='editorial'?'/':'';const numberHTML=`<span style="${styleText(number)}">${num}${mark}</span>`;if(id==='centered'||id==='stack')return `<section style="${styleText(outer)}"><p style="margin:0 0 12px;text-align:${id==='centered'?'center':'left'};">${numberHTML}</p><h2 style="font-size:inherit;font-weight:inherit;line-height:inherit;margin:0;text-align:${id==='centered'?'center':'left'};">${html}</h2></section>`;return `<section style="${styleText(outer)}"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td style="vertical-align:${id==='editorial'?'bottom':'middle'};width:1%;white-space:nowrap;padding:0 17px 0 0;">${numberHTML}</td><td style="font-size:inherit;font-weight:inherit;line-height:inherit;">${html}</td></tr></table></section>`;}
