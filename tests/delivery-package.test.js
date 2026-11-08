import {it,expect,vi} from 'vitest';
import {buildDeliveryPackage,makeZip} from '../src/delivery-package';
import {DEFAULT_STYLE} from '../src/model';
const read=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsArrayBuffer(blob)});
function zipEntries(bytes){const d=new DataView(bytes),entries={};let offset=0;while(d.getUint32(offset,true)===0x04034b50){const length=d.getUint32(offset+18,true),nameLength=d.getUint16(offset+26,true),name=new TextDecoder().decode(new Uint8Array(bytes,offset+30,nameLength));entries[name]=new Uint8Array(bytes,offset+30+nameLength,length);offset+=30+nameLength+length}expect(d.getUint32(offset,true)).toBe(0x02014b50);return entries}
it('ZIP 使用 UTF-8 文件名并保留二进制字节',async()=>{const data=await read(makeZip({'中文.txt':'可读正文','image.png':Uint8Array.from([1,2,3,255])}));const entries=zipEntries(data);expect(new TextDecoder().decode(entries['中文.txt'])).toBe('可读正文');expect([...entries['image.png']]).toEqual([1,2,3,255])});
it('交稿包包含独立正文、封面、发布信息、待审清单和可恢复备份',async()=>{
 const image='data:image/png;base64,iVBORw0KGgo=',fetchImage=vi.fn(async()=>({ok:true,blob:async()=>new Blob(['image'],{type:'image/png'})}));
 const article={id:'a',title:'标题',publishTitle:'发布标题',author:'作者',digest:'摘要',style:{...DEFAULT_STYLE},cover:{src:'/media/c.png'},blocks:[{id:'b',type:'paragraph',html:'<strong>原文</strong>'},{id:'i',type:'images',images:[{src:'/media/a.png'}]}],entryCandidates:[{cover:{src:'/media/unused.png'}}],automationCheckpoint:{before:{blocks:[{id:'before',type:'images',images:[{src:'/media/before.png'}]}]}}};
 const result=await buildDeliveryPackage(article,{fetchImage,readImage:async()=>image});const files=zipEntries(await read(result.blob));expect(Object.keys(files)).toEqual(expect.arrayContaining(['正文.html','发布信息.txt','封面.png','审阅清单.md','可编辑备份.folio.json']));
 const backup=JSON.parse(new TextDecoder().decode(files['可编辑备份.folio.json']));expect(backup.format).toBe('folio-v1');expect(backup.article.entryCandidates[0].cover.src).toBe(image);expect(backup.article.automationCheckpoint.before.blocks[0].images[0].src).toBe(image);
 expect(result.files['正文.html']).not.toContain('/media/');expect(result.files['发布信息.txt']).toContain('发布标题');expect(result.files['审阅清单.md']).toContain('未自动发布');expect(article.cover.src).toBe('/media/c.png');
});
it('正文图片丢失时不产生看似完整的交稿包',async()=>{await expect(buildDeliveryPackage({title:'稿件',style:{},blocks:[{id:'i',type:'images',images:[{src:'/media/lost.png'}]}]},{fetchImage:async()=>({ok:false}),readImage:async()=>''})).rejects.toThrow('无法读取')});
it('交稿正文始终为可编辑图文，不携带字体图片素材',async()=>{
 const article={title:'字体稿',style:{fontFamily:'lxgw-wenkai'},blocks:[{id:'p',type:'paragraph',html:'仍可编辑的原文'}]};
 const result=await buildDeliveryPackage(article);
 expect(result.files['正文.html']).toContain('仍可编辑的原文');expect(result.files['正文.html']).not.toContain('<img');expect(Object.keys(result.files).every(name=>!name.startsWith('字体素材/'))).toBe(true);expect(result.files['可编辑备份.folio.json']).toContain('仍可编辑的原文');expect(article.blocks[0].html).toBe('仍可编辑的原文');
});
