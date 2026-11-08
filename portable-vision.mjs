import path from 'node:path';
let instancePromise;
export function runPortableVision(items,{cacheDir,loadPipeline}={}){
 if(!items.length)return Promise.resolve([]);
 if(!instancePromise){
  instancePromise=(async()=>{
   if(loadPipeline)return loadPipeline();
   const {pipeline,env,RawImage}=await import('@huggingface/transformers');
   if(cacheDir)env.cacheDir=path.resolve(cacheDir);
   const modelPath=process.env.FOLIO_VISION_MODEL_PATH;
   if(modelPath)env.allowRemoteModels=false;
   const classify=await pipeline('image-classification',modelPath?path.resolve(modelPath):'onnx-community/mobilenet_v2_1.0_224',{dtype:'q8'});
   return {classify,read:RawImage.read.bind(RawImage)};
  })().catch(e=>{instancePromise=null;throw e});
 }
 return instancePromise.then(async({classify,read})=>{
  const results=[];
  for(const item of items){try{const image=await read(item.path);const labels=await classify(image,{topk:5});results.push({src:item.src,width:image.width,height:image.height,faces:0,labels:labels.map(x=>({id:x.label,confidence:x.score})),error:false})}catch{results.push({src:item.src,width:null,height:null,faces:0,labels:[],error:true})}}
  return results;
 });
}
export async function runVision(items,{platform=process.platform,cacheDir,local,portable=runPortableVision,timeoutMs=60000}={}){
 if(platform==='darwin'&&local){try{return {engine:'macos',results:await local(items)}}catch{}}
 let timer;try{const results=await Promise.race([portable(items,{cacheDir}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('图片分析超时，已使用基础排版')),timeoutMs)})]);return {engine:'portable',results}}finally{clearTimeout(timer)}
}
