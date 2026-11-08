import React from 'react';
import {LAYOUTS,layoutStyle} from './editorial-model';
import {ArticleSample} from './EditorialLibrary';

export default function LayoutOptions({article,onChange}) {
  return <><p className="desk-intro">用当前文章比较三种阅读节奏。预览使用公众号兼容正文，横滑图片在此按纵向显示。</p><p className="muted">只替换全文配色、标题排法、字号和留白；保留图片排法、顺序、图注及局部文字格式。应用后可撤销。</p><p role="status">{article.layoutChoice?'当前采用：'+article.layoutChoice:'选择前可以滚动预览完整正文。'}</p><div className="layout-options">{LAYOUTS.map(option=><section className="desk-card" key={option.id}><h3>{option.name}</h3><p>{option.reason}</p><small>{option.patch.fontSize}px 正文 · {option.patch.lineHeight} 倍行距 · {option.patch.paragraphGap}px 段距</small><ArticleSample article={{...article,style:layoutStyle(article.style,option)}}/><button className="button primary" onClick={()=>onChange(a=>({...a,style:layoutStyle(a.style,option),layoutChoice:option.name}))}>应用{option.name}</button></section>)}</div></>;
}
