import {chooseImageLayout} from './model';
const labelGroups={portrait:/^(people|person|portrait|face|human_face|suit|groom|bride|wedding dress|cowboy hat)$/i,scene:/^(outdoor|landscape|nature|sky|city|building|structure|street|architecture|seashore|lakeside|valley|mountain|seacoast|container ship|liner|castle|palace)$/i,screenshot:/^(screenshot|screen_shot|webpage|web_site)$/i};
export function classifyVision(result){
 if(!result||result.error)return {kind:'unknown',confidence:0};
 if(result.faces>0)return {kind:'portrait',confidence:1};
 for(const kind of ['screenshot','portrait','scene']){const label=(result.labels||[]).find(x=>x.confidence>=.7&&labelGroups[kind].test(String(x.id).split(',')[0].trim()));if(label)return {kind,confidence:label.confidence}}
 return {kind:'unknown',confidence:0};
}
export function recommendVisionLayouts(article,analysis){
 const bySrc=new Map(analysis.map(r=>[r.src,r]));
 return article.blocks.filter(b=>b.type==='images').map(b=>{
  const images=b.images.map(im=>{const info=bySrc.get(im.src),subject=classifyVision(info);return {...im,width:info?.width||im.width,height:info?.height||im.height,subject}});
  const first=images[0],kinds=images.map(im=>im.subject.kind);
  const namedScreenshot=first&&/(截图|截屏|screenshot|screen[ _-]?shot)/i.test((first.name||'')+' '+(first.alt||''));
  let layout=chooseImageLayout(images);let treatment='plain';
  if(images.length===1&&(namedScreenshot||kinds[0]==='screenshot'))treatment='browser';
  if(images.length===2&&kinds.includes('portrait')&&kinds.includes('scene'))layout=kinds[0]==='scene'?'wide-left':'wide-right';
  if(images.length===3&&kinds[0]==='portrait')layout='pair';
  return {blockId:b.id,sources:b.images.map(im=>im.src),layout,treatment,kinds,images:images.map(({src,width,height,subject})=>({src,width,height,kind:subject.kind,confidence:subject.confidence})),failed:images.some(im=>!bySrc.has(im.src)||bySrc.get(im.src)?.error)};
 });
}
export function applyVisionLayouts(article,recommendations){
 const byId=new Map(recommendations.map(r=>[r.blockId,r]));
 return {...article,blocks:article.blocks.map(b=>{const rec=byId.get(b.id);if(b.type!=='images'||!rec||b.images.map(i=>i.src).join('\n')!==rec.sources.join('\n')||rec.failed)return b;return {...b,layout:rec.layout,treatment:rec.treatment,gap:b.images.length===1?0:8,ratio:'original'};})};
}
