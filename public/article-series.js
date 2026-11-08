import{ARTICLE_PALETTES,articlePalette,applyArticlePalette}from'./article-palettes.js';
import{HEADING_SERIES,normalizeSeries,applyHeadingSeries}from'./heading-series.js';
// An article uses one combination throughout. Individual adjustments remain possible.
export const ARTICLE_SERIES=[
 {id:'book-ivory',name:'燕麦书页',paletteId:'cocoa',headingSeries:'bookish',description:'暖白纸面 · 宋体章题 · 细线留白',typography:'book'},
 {id:'book-ink',name:'素白书刊',paletteId:'ink',headingSeries:'bookish',description:'黑白书刊 · 安静导语 · 清晰层级',typography:'book'},
 {id:'book-celadon',name:'青瓷手记',paletteId:'celadon',headingSeries:'bookish',description:'青瓷点色 · 小号章序 · 从容阅读',typography:'book'},
 {id:'reference-accent-left',name:'居左色点',paletteId:'ochre',headingSeries:'accent-left',description:'大章号与色点 · 标题左对齐 · 短线收束'},
 {id:'reference-accent',name:'色点章序',paletteId:'ochre',headingSeries:'accent-dot',description:'参考图 1 · 居中大字与色点'},
 {id:'reference-serif',name:'宋体留白框',paletteId:'cocoa',headingSeries:'serif-slash',description:'细边大框 · 宋体章题 · 框内从容留白'},
 {id:'celadon-editorial',name:'青瓷章序',paletteId:'celadon',headingSeries:'editorial',description:'青绿纸白 · 大号章序'},
 {id:'cinnabar-rule',name:'宫墙细线',paletteId:'cinnabar',headingSeries:'rule',description:'宫墙米纸 · 细线分节'},
 {id:'indigo-label',name:'黛蓝标签',paletteId:'indigo',headingSeries:'label',description:'黛蓝月白 · 标签引导'},
 {id:'ochre-centered',name:'秋香题记',paletteId:'ochre',headingSeries:'centered',description:'秋香绢素 · 居中题记'},
 {id:'plum-band',name:'藕荷浅笺',paletteId:'plum',headingSeries:'band',description:'藕荷素笺 · 浅底标题'},
 {id:'ink-rule',name:'墨色留白',paletteId:'ink',headingSeries:'rule',description:'黑白留白 · 细线分节'},
 {id:'teal-side',name:'松烟侧线',paletteId:'teal',headingSeries:'side',description:'松烟青绿 · 侧线章题'},
 {id:'rust-stack',name:'赭石章序',paletteId:'rust',headingSeries:'stack',description:'赭石暖白 · 上下章序'},
 {id:'slate-underline',name:'黛石短线',paletteId:'slate',headingSeries:'underline',description:'黛石雾白 · 短线收束'},
 {id:'olive-frame',name:'苔绿边框',paletteId:'olive',headingSeries:'frame',description:'苔绿细绢 · 留白边框'},
 {id:'berry-dot',name:'绛紫小点',paletteId:'berry',headingSeries:'dot',description:'绛紫香灰 · 小圆点'}
];
export const SELECTABLE_ARTICLE_SERIES=['book-ivory','reference-accent-left','reference-accent','reference-serif','teal-side'].map(id=>ARTICLE_SERIES.find(s=>s.id===id));
export function currentArticleSeries(style={}){
 const p=articlePalette(style),base=ARTICLE_PALETTES.find(x=>x.id===p.id);
 if(p.accent.toLowerCase()!==base.accent.toLowerCase())return null;
 return ARTICLE_SERIES.find(s=>s.paletteId===p.id&&s.headingSeries===normalizeSeries(style.headingSeries)&&(!s.id.startsWith('reference-')||style.subtitleSeries===(s.headingSeries==='accent-left'?'accent-dot':s.headingSeries)))||null;
}
export function applyArticleSeries(style,id){const series=ARTICLE_SERIES.find(s=>s.id===id);if(!series)return {...style};const next=applyHeadingSeries(applyArticlePalette(style,series.paletteId),series.headingSeries);return series.typography==='book'?{...next,typography:'book',fontFamily:'default',customFont:'',subtitleSeries:'serif-slash',fontSize:16,lineHeight:1.95,paragraphGap:24,sidePadding:26,headingSize:23,subheadingSize:17,quoteSize:21,leadSize:16,imageGap:30}:{...next,...(style.typography?{typography:'standard'}:{})};}
export function randomArticleSeries(style,random=Math.random){const current=currentArticleSeries(style),options=SELECTABLE_ARTICLE_SERIES.filter(s=>s.id!==current?.id);return options[Math.min(options.length-1,Math.max(0,Math.floor(random()*options.length)))].id;}
export function articleSeriesPreview(series){const palette=ARTICLE_PALETTES.find(p=>p.id===series.paletteId),heading=HEADING_SERIES.find(h=>h.id===series.headingSeries);return{palette,heading};}
