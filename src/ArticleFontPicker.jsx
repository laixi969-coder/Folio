import React,{useEffect,useState} from 'react';
import {ARTICLE_FONTS,articleFont,normalizeFontId,normalizeCustomFont} from '../public/article-fonts.js';
import WechatFontOptions from './WechatFontOptions';

export default function ArticleFontPicker({style,onChange,blocks=[]}) {
  const value=normalizeFontId(style.fontFamily),font=ARTICLE_FONTS.find(f=>f.id===value),[status,setStatus]=useState('');
  useEffect(()=>{
    let active=true;setStatus('');
    if(font?.file&&document.fonts?.load){setStatus('loading');document.fonts.load(`16px "${font.face}"`,'文字排版').then(faces=>{if(active)setStatus(faces.length?'ready':'error')}).catch(()=>{if(active)setStatus('error')})}
    return()=>{active=false};
  },[value]);
  return <section className="font-picker" aria-label="文章字体设置">
    <label className="field">文章字体
      <select aria-label="文章字体" value={value} onChange={e=>onChange({...style,fontFamily:e.target.value})}>
        <optgroup label="系统字体">{ARTICLE_FONTS.filter(f=>!f.file&&f.id!=='custom').map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</optgroup>
        <optgroup label="内置免费商用字体">{ARTICLE_FONTS.filter(f=>f.file).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</optgroup>
        <option value="custom">自定义字体</option>
      </select>
    </label>
    <a className="font-gallery-link" href="/font-study/index.html" target="_blank" rel="noreferrer">对比五款字体效果 ↗</a>
    {font?.file&&<div className="font-preview-card"><p className="font-specimen" style={{fontFamily:articleFont(style)}}>让文字，有自己的气质。<br/>山川与日常 · Aa 0123</p><p>{font.usage}</p><p className="font-load-state" role="status">{status==='loading'?'正在载入字体，首次选用可能需要稍等…':status==='ready'?'字体已载入，可在 Folio 内直接预览。':status==='error'?'字体载入失败，暂用后备字体；请刷新后重试。':'字体已内置，无需安装。'}</p><p><span>免费商用 · SIL OFL 1.1</span> · <a href={font.license} target="_blank" rel="noreferrer">查看授权</a> · <a href={font.source} target="_blank" rel="noreferrer">官方来源</a></p><p>公众号不能直接嵌入字体。下方可选择逐段转图保留字形，或保留可编辑文字并接受系统字体替换。</p></div>}
    <WechatFontOptions article={{style,blocks}} onChange={patch=>onChange(patch.style)}/>
    {value==='custom'&&<label className="field">自定义字体名称<input aria-label="自定义字体名称" value={style.customFont||''} maxLength={80} placeholder="例如 Noto Serif CJK SC" onChange={e=>onChange({...style,customFont:e.target.value})}/></label>}
    {value==='custom'&&style.customFont&&!normalizeCustomFont(style.customFont)&&<p role="alert">字体名称只能包含文字、数字、空格、点、连字符或下划线。</p>}
    {!font?.file&&<p>字体效果取决于阅读设备是否安装；微信可能使用替代字体，请以真机预览为准。</p>}
  </section>;
}
