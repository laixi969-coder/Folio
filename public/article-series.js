import{ARTICLE_PALETTES,articlePalette,applyArticlePalette}from'./article-palettes.js';
import{HEADING_SERIES,normalizeSeries}from'./heading-series.js';
// An article uses one combination throughout. Individual adjustments remain possible.
export const ARTICLE_SERIES=[
 {id:'celadon-editorial',name:'青瓷章序',paletteId:'celadon',headingSeries:'editorial',description:'青绿纸白 · 大号章序'},
 {id:'cinnabar-rule',name:'宫墙细线',paletteId:'cinnabar',headingSeries:'rule',description:'宫墙米纸 · 细线分节'},
 {id:'indigo-label',name:'黛蓝标签',paletteId:'indigo',headingSeries:'label',description:'黛蓝月白 · 标签引导'},
 {id:'ochre-centered',name:'秋香题记',paletteId:'ochre',headingSeries:'centered',description:'秋香绢素 · 居中题记'},
 {id:'plum-band',name:'藕荷浅笺',paletteId:'plum',headingSeries:'band',description:'藕荷素笺 · 浅底标题'},
 {id:'ink-rule',name:'墨色留白',paletteId:'ink',headingSeries:'rule',description:'黑白留白 · 细线分节'}
];
export function currentArticleSeries(style={}){
 const p=articlePalette(style),base=ARTICLE_PALETTES.find(x=>x.id===p.id);
 if(p.accent.toLowerCase()!==base.accent.toLowerCase())return null;
 return ARTICLE_SERIES.find(s=>s.paletteId===p.id&&s.headingSeries===normalizeSeries(style.headingSeries))||null;
}
export function applyArticleSeries(style,id){const series=ARTICLE_SERIES.find(s=>s.id===id);if(!series)return {...style};return {...applyArticlePalette(style,series.paletteId),headingSeries:series.headingSeries};}
export function randomArticleSeries(style,random=Math.random){const current=currentArticleSeries(style),options=ARTICLE_SERIES.filter(s=>s.id!==current?.id);return options[Math.min(options.length-1,Math.max(0,Math.floor(random()*options.length)))].id;}
export function articleSeriesPreview(series){const palette=ARTICLE_PALETTES.find(p=>p.id===series.paletteId),heading=HEADING_SERIES.find(h=>h.id===series.headingSeries);return{palette,heading};}
