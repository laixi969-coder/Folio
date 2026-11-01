import React from'react';
import{ARTICLE_SERIES,currentArticleSeries,applyArticleSeries,randomArticleSeries,articleSeriesPreview}from'../public/article-series.js';
export default function ArticleSeriesPicker({style,onChange}){
 const current=currentArticleSeries(style);
 return <section className="article-series-picker" aria-label="整篇系列">
  <div className="article-series-title"><b>整篇系列</b><button type="button" onClick={()=>onChange(applyArticleSeries(style,randomArticleSeries(style)))}>随机整篇换一套</button></div>
  <p>配色与副标题排法一起替换，全文使用同一系列。</p>
  <div className="article-series-options">{ARTICLE_SERIES.map(series=>{const{palette:p,heading}=articleSeriesPreview(series);return <button type="button" key={series.id} aria-pressed={current?.id===series.id} title={series.description} onClick={()=>onChange(applyArticleSeries(style,series.id))}>
   <span className={'article-series-specimen heading-'+series.headingSeries} style={{'--sample-accent':p.accent,'--sample-tint':p.tint,'--sample-paper':p.paper,'--sample-ink':p.ink}} aria-hidden="true"><i>01</i><b>章节标题</b><em/></span>
   <strong>{series.name}</strong><small>{heading.name}</small>
  </button>})}</div>
  <p className="article-series-status" role="status">{current?'当前：'+current.name+' · 全篇统一':'当前：自定义组合 · 全篇统一'}</p>
 </section>;
}
