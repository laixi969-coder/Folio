import{describe,it,expect}from'vitest';
import{newArticle,imageBlock,exportHTML,normalizeStyle,autoLayout}from'../src/model';
import{SUBTITLE_SERIES,DEFAULT_SUBTITLE_SERIES,normalizeSubtitleSeries,subtitleHTML}from'../public/subtitle-series.js';
import{captionTypography,captionHTML}from'../public/caption-type.js';
import React from'react';
import{render,screen,fireEvent,cleanup}from'@testing-library/react';
import SubtitleSeriesPicker from'../src/SubtitleSeriesPicker.jsx';

describe('图注字号层级',()=>{
 it('四级字号随正文缩放，且始终彼此区隔',()=>{
  for(const body of [14,16,20,22]){
   const t=captionTypography({fontSize:body});
   expect(t.note).toBeLessThan(t.item);
   expect(t.item).toBeLessThan(t.group);
   expect(t.group).toBeLessThan(t.feature);
   expect(t.item).toBeLessThan(body);
  }
 });
 it('同一篇里单图图注、整组说明、特写说明各用不同字号',()=>{
  const a=newArticle();
  a.blocks=[
   {...imageBlock([{id:'a',src:'/media/a.png',caption:'单图说明 ｜ 摄影：作者'}]),caption:'整组说明'},
   {...imageBlock([{id:'b',src:'/media/b.png'}]),treatment:'feature',caption:'特写说明'}];
  const html=exportHTML(a),t=captionTypography(normalizeStyle(a.style));
  for(const size of [t.note,t.item,t.group,t.feature])expect(html).toContain('font-size:'+size+'px');
  for(const text of ['单图说明','摄影：作者','整组说明','特写说明'])expect(html).toContain(text);
  expect(html).toContain('background:#426B64');
 });
 it('分隔符才生成次级小字，无分隔符时原文字完整、不产生多余字号',()=>{
  const plain=captionHTML({fontSize:16},'一句说明','item');
  expect(plain).toContain('一句说明');
  expect((plain.match(/font-size:/g)||[])).toHaveLength(1);
  const split=captionHTML({fontSize:16},'一句说明 ｜ 来源：某某','item');
  expect(split).toContain('一句说明');expect(split).toContain('来源：某某');
  expect(split).toContain('font-size:'+captionTypography({fontSize:16}).note+'px');
 });
 it('图注与题记都转义尖括号',()=>{
  expect(captionHTML({fontSize:16},'<script>x</script>','group')).not.toContain('<script');
  expect(subtitleHTML(newArticle().style,'<img src=x onerror=1>')).not.toContain('<img');
 });
});

describe('开篇题记版式',()=>{
 it('十一款版式各不相同，非法值回退默认',()=>{
  expect(SUBTITLE_SERIES).toHaveLength(11);
  expect(new Set(SUBTITLE_SERIES.map(s=>subtitleHTML({subtitleSeries:s.id},'题记'))).size).toBe(11);
  expect(normalizeSubtitleSeries('nope')).toBe(DEFAULT_SUBTITLE_SERIES);
 });
 it('每款保留原文、主字号与可识别的版式标记，并进入导出',()=>{
  for(const series of SUBTITLE_SERIES){
   const style={...newArticle().style,subtitleSeries:series.id};
   const html=subtitleHTML(style,'这是真实副标题');
   expect(html).toContain('这是真实副标题');
   expect(html).toContain('font-size:15px');
   expect(html).toContain('data-deck="'+series.id+'"');
   expect(exportHTML({...newArticle(),subtitle:'这是真实副标题',style})).toContain('data-deck="'+series.id+'"');
  }
 });
 it('一键排版保留所选版式，重复排版稳定',()=>{
  const a={...newArticle(),subtitle:'题记'};
  a.style.subtitleSeries='tinted';
  const b=autoLayout(a);
  expect(b.style.subtitleSeries).toBe('tinted');
  expect(exportHTML(b)).toContain('data-deck="tinted"');
  expect(autoLayout(b,b.style)).toEqual(b);
 });
 it('编辑态与导出使用同一个渲染结果',()=>{
  const style=normalizeStyle(newArticle().style),text='同一段题记';
  expect(exportHTML({...newArticle(),subtitle:text,blocks:[]})).toContain(subtitleHTML(style,text));
 });
 it('样式面板提供可点选的题记版式',()=>{
  const changed=[];
  render(React.createElement(SubtitleSeriesPicker,{value:'eyebrow',onChange:id=>changed.push(id)}));
  expect(screen.getAllByRole('button',{pressed:false})).toHaveLength(10);
  fireEvent.click(screen.getByRole('button',{name:/浅笺题签/}));
  expect(changed).toEqual(['tinted']);
  cleanup();
 });
});
