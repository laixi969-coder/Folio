import {normalizeStyle, DEFAULT_STYLE, uid, clean, textOf, parseMarkdown, imageBlock} from './model';
import {applyArticleSeries} from '../public/article-series.js';
import {publishingTitle} from './reading-check';

export const clone = value => value === undefined ? null : JSON.parse(JSON.stringify(value));
export function fingerprint(value) {
  const str=JSON.stringify(value);let a=2166136261,b=5381;
  for(let i=0;i<str.length;i++){a=Math.imul(a^str.charCodeAt(i),16777619);b=Math.imul(b,33)^str.charCodeAt(i)}
  return (a>>>0).toString(16)+(b>>>0).toString(16);
}
export const contentSignature = a => fingerprint([a.title,a.blocks.map(({id,type,html,role,images,caption})=>({id,type,html,role,caption,images:images?.map(({src,caption,alt})=>({src,caption,alt}))}))]);
export const publicationSignature = a => fingerprint([publishingTitle(a),a.digest,a.author,a.subtitle,a.cover,a.coverFocus,a.blocks,a.style]);
export const duplicateBlocks = blocks => clone(blocks).filter(b=>['paragraph','heading','subheading','quote','lead','list','divider','images'].includes(b.type)).map(b=>({...b,id:uid(),...(b.html?{html:clean(b.html)}:{}),...(b.images?{images:b.images.map(im=>({...im,id:uid()}))}:{})}));
export const LAYOUTS = [
  {id:'calm',name:'克制阅读',reason:'素白书刊、宋体章题和小号章序，让观点与信息成为阅读重点。',series:'book-ink',patch:{fontSize:16,lineHeight:1.9,paragraphGap:22,sidePadding:24}},
  {id:'story',name:'杂志叙事',reason:'燕麦纸面、安静导语与宋体引文，让故事转场有停顿。',series:'book-ivory',patch:{fontSize:16,lineHeight:2,paragraphGap:28,sidePadding:30}},
  {id:'scan',name:'重点速读',reason:'居左章号与色点、较紧凑的段距，适合分节浏览；不会自动加粗原文。',series:'reference-accent-left',patch:{fontSize:17,lineHeight:1.8,paragraphGap:18,sidePadding:22}}
];
export const layoutStyle = (style, option) => normalizeStyle({...applyArticleSeries(style,option.series),...option.patch});
export const BUILTIN_PRESETS = [
  {id:'builtin-opinion',name:'观点长文',layout:'calm'}, {id:'builtin-story',name:'人物故事',layout:'story'},
  {id:'builtin-event',name:'活动回顾',layout:'story'}, {id:'builtin-product',name:'产品介绍',layout:'scan'}
].map(p=>({...p,style:layoutStyle(DEFAULT_STYLE,LAYOUTS.find(l=>l.id===p.layout)),opening:[],closing:[]}));
export function applyPreset(article,preset,withComponents=false) {
  return {...article,columnId:preset.id,columnName:preset.name,style:normalizeStyle(clone(preset.style)),blocks:withComponents?[...duplicateBlocks(preset.opening),...article.blocks,...duplicateBlocks(preset.closing)]:article.blocks};
}
export function insertAsset(article,blockId,asset) {
  const index=article.blocks.findIndex(b=>b.id===blockId);
  if(index<0)throw Error('原位置已删除，请重新选择插入位置。');
  const blocks=[...article.blocks];blocks.splice(index+1,0,imageBlock([{...clone(asset),id:uid()}]));
  return {...article,blocks};
}
export function imageTask(article, blockId) {
  const block=article.blocks.find(b=>b.id===blockId),text=block?textOf(block.html):'';
  const evidence=/\d|数据|调查|研究|报告|统计/.test(text),person=/人物|他|她|采访|故事/.test(text);
  return {id:uid(),blockId,purpose:evidence?'提供证据':person?'展示人物场景':'解释信息',description:evidence?'整理本段已有数据为信息图，保留单位与来源；不要补造缺失数值。':person?'选择与本段人物及环境有关的真实照片；插画需明确标注。':'选择能解释本段关系、过程或细节的画面。',ratio:evidence?'保留完整图表':'横向 3:2',alternative:'可使用已有素材，或保留文字与留白。',prompt:'',status:'待选图',sourceQuote:text.slice(0,240)};
}
export function localCandidates(article) {
  const sources=article.blocks.filter(b=>b.html&&textOf(b.html).trim()),headings=sources.filter(b=>b.type==='heading');
  const digest=sources.find(b=>b.type==='paragraph'||b.type==='lead');
  return [null,...headings.slice(0,2)].map((block,i)=>({id:uid(),title:i===0?publishingTitle(article):textOf(block.html).slice(0,64),digest:article.digest||textOf(digest?.html||'').slice(0,100),cover:clone(article.cover),audience:i===0?'已有读者':'关注本节主题的读者',reason:i===0?'沿用当前标题，作为比较基线。':'直接摘取章节标题，需确认能否代表整篇文章。',evidenceBlockId:(block||digest)?.id||'',evidenceQuote:textOf((block||digest)?.html||'').slice(0,160),sourceSignature:contentSignature(article),origin:'原文摘录',createdAt:new Date().toISOString()}));
}
export function comparableReviews(rows,current) {
  const r=current.review;
  if(!r?.account?.trim()||!current.columnName?.trim()||!r.topic?.trim()||!r.windowHours)return [];
  return rows.filter(row=>row.id!==current.id&&row.review.account===r.account&&(row.review.snapshot?.columnName??row.columnName)===(r.snapshot?.columnName??current.columnName)&&row.review.topic===r.topic&&Number(row.review.windowHours)===Number(r.windowHours));
}
export const snippetBlocks = text => parseMarkdown(text);
