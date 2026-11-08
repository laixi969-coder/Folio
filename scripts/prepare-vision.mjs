import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pipeline,env} from '@huggingface/transformers';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=process.env.FOLIO_DATA_DIR||process.env.POCKETBAY_DATA_DIR||path.join(root,'data');
env.cacheDir=path.join(data,'vision-model-cache');
try{await pipeline('image-classification','onnx-community/mobilenet_v2_1.0_224',{dtype:'q8'});console.log('图片识别模型已缓存，可在此数据目录中离线使用。')}
catch{console.error('模型缓存失败，请检查模型下载网络。Folio 仍可使用基础排版。');process.exitCode=1}
