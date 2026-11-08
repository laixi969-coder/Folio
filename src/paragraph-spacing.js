import {textOf} from './model';

export const canAdjustSpacing=b=>!!b&&['paragraph','list','lead','quote','subheading'].includes(b.type);
export function referenceBlockIds(blocks){
 const start=blocks.findIndex(b=>/^(参考资料|参考文献|资料来源|参考来源)[：:]?$/.test(textOf(b.html).trim()));
 if(start<0)return [];
 const ids=[];
 for(const b of blocks.slice(start+1)){
  const text=textOf(b.html).trim();
  if(['heading','subheading','divider'].includes(b.type)||/^(发布配套|分享摘要|读者也想知道|相关阅读|延伸阅读|作者简介|关于作者|免责声明|附录)[：:]?$/.test(text))break;
  if(canAdjustSpacing(b)&&text)ids.push(b.id);
 }
 return ids;
}
export function applyParagraphSpacing(article,ids,patch){
 const selected=new Set(ids),valid={};
 for(const [key,min,max] of [['lineHeight',1,3],['paragraphGap',0,80]]){
  if(patch[key]===null)valid[key]=null;
  else if(patch[key]!==''&&Number.isFinite(Number(patch[key]))&&Number(patch[key])>=min&&Number(patch[key])<=max)valid[key]=Number(patch[key]);
 }
 return {...article,blocks:article.blocks.map(b=>{
  if(!selected.has(b.id)||!canAdjustSpacing(b))return b;
  const spacing={...b.spacing};for(const [key,value] of Object.entries(valid)){if(value===null)delete spacing[key];else spacing[key]=value}
  return {...b,spacing};
 })};
}
