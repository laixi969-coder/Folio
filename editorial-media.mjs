import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {storeMedia} from './media-store.mjs';
export async function organizeAssets(dir,assets,onProgress=()=>{}) {
 if(!Array.isArray(assets)||assets.length>200)throw Error('每次最多整理 200 张素材');
 const result=[],errors=[],seen=new Map();let duplicates=0;
 for(const [i,asset] of assets.entries()){
  try {
   if(!/^\/media\/[a-zA-Z0-9-]+\.(png|jpeg|gif|webp)$/.test(asset.src||''))throw Error('仅整理已上传本机的素材');
   const file=path.join(dir,'media',path.basename(asset.src)),bytes=await fs.promises.readFile(file);
   if(bytes.length>12*1024*1024)throw Error('原图超过 12 MB');
   const hash=crypto.createHash('sha256').update(bytes).digest('hex');
   if(seen.has(hash)){duplicates++;continue}seen.set(hash,true);
   const meta=await sharp(bytes,{limitInputPixels:40_000_000}).metadata(),rotated=[5,6,7,8].includes(meta.orientation);
   const width=rotated?meta.height:meta.width,height=rotated?meta.width:meta.height;
   const screenshot=/截图|截屏|图表|数据|报告|screenshot|screen[ _-]?shot/i.test((asset.name||'')+' '+(asset.alt||''));
   const category=screenshot?'截图 / 图表':meta.pages>1?'动图':width/height>2.5?'横幅':height/width>2.5?'长图':width>height?'横向配图':'竖向 / 方形配图';
   const item={...asset,name:String(asset.name||'文章配图').slice(0,120),id:asset.id||crypto.randomUUID(),hash,width,height,bytes:bytes.length,category,clarity:width<600?'分辨率偏低，请人工检查':'尺寸充足，仍需目测清晰度',source:asset.source||'',license:asset.license||'',originalSrc:asset.originalSrc||asset.src};
   // Screenshots/charts and animated media keep their exact pixels. Derivatives are optional candidates.
   if(!screenshot&&!(meta.pages>1)&&(width>1600||height>2400||bytes.length>800000)){
    const cache=path.join(dir,'media',hash+'-optimized.json');let derived;
    if(fs.existsSync(cache))derived=JSON.parse(fs.readFileSync(cache,'utf8'));
    else {const pipeline=sharp(bytes,{limitInputPixels:40_000_000}).rotate().resize({width:1600,height:2400,fit:'inside',withoutEnlargement:true});
     const out=await (meta.hasAlpha?pipeline.png({compressionLevel:9}):pipeline.jpeg({quality:88,mozjpeg:true})).toBuffer({resolveWithObject:true});
     if(out.data.length<bytes.length){derived={...storeMedia(dir,{data:`data:image/${out.info.format};base64,${out.data.toString('base64')}`,name:(asset.name||'配图')+'（轻量版）'}),width:out.info.width,height:out.info.height,originalSrc:item.originalSrc};fs.writeFileSync(cache+'.tmp',JSON.stringify(derived));fs.renameSync(cache+'.tmp',cache)}
    }
    if(derived)item.derivative=derived;
   }
   result.push(item);
  }catch(e){errors.push({src:asset.src,name:asset.name,message:'素材无法整理：'+e.message})}
  onProgress({done:i+1,total:assets.length});
 }
 return {assets:result,duplicates,errors};
}
