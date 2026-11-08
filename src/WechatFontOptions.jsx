import React from 'react';
import {wechatFontMode,fontModeDescription} from './wechat-font-export';

export default function WechatFontOptions({article,onChange,disabled=false}){
 const mode=wechatFontMode(article);
 return <fieldset className="wechat-font-options" disabled={disabled}><legend>公众号字体处理</legend>
  <label className="field">导出时如何保留字体<select aria-label="公众号字体处理" value={mode} onChange={e=>onChange({style:{...article.style,wechatFontMode:e.target.value}})}>
   <option value="all">保留全文字体 · 逐段高清图</option>
   <option value="headings">只保留章题字体 · 章题高清图</option>
   <option value="text">保留可编辑文字 · 字体可能替换</option>
  </select></label><p>{fontModeDescription(mode)}</p>
  {mode!=='text'&&<p>按 375px 手机宽度、3 倍清晰度输出；其他宽度等比例缩放。公众号自己的文章标题仍由微信控制。</p>}
 </fieldset>;
}
