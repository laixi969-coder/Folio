import React from'react';
import{SUBTITLE_SERIES,normalizeSubtitleSeries}from'../public/subtitle-series.js';
export default function SubtitleSeriesPicker({value,onChange}){
 const current=normalizeSubtitleSeries(value);
 return <section className="series-picker deck-picker" aria-label="开篇题记版式">
  <div className="series-picker-title"><b>开篇题记 · 版式</b><span className="deck-current">全篇统一</span></div>
  <p>只作用于文章开头的副标题；章节标题仍跟随「副标题系列」。</p>
  <div className="deck-options">{SUBTITLE_SERIES.map(s=><button type="button" key={s.id} aria-pressed={current===s.id} data-deck-choice={s.id} title={s.description} onClick={()=>onChange(s.id)}>
   <span className={'deck-mini deck-'+s.id} aria-hidden="true"><i/><b/><em/></span><span>{s.name}</span>
  </button>)}</div>
 </section>;
}
