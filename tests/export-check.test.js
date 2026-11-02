// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { prepareExport, copyRichText } from '../src/export-check';
import { newArticle, imageBlock } from '../src/model';

afterEach(()=>vi.restoreAllMocks());
describe('导出检查',()=>{
 it('定位读取失败的图片，并提示横滑与裁切',async()=>{
  const group={...imageBlock([{id:'a',src:'/media/a.png'},{id:'b',src:'/media/b.png'}]),layout:'horizontal',ratio:'wide'};
  const result=await prepareExport({...newArticle(),blocks:[group]},async url=>url.includes('a.png')?{ok:true,blob:async()=>new Blob(['x'],{type:'image/png'})}:{ok:false},async()=> 'data:image/png;base64,eA==');
  expect(result.issues.filter(i=>i.level==='warning')).toHaveLength(2);
  expect(result.issues.find(i=>i.level==='blocking')).toMatchObject({blockId:group.id,message:'第 1 组第 2 张图片无法读取，请重新上传。'});
  expect(result.assets['/media/a.png']).toBe('data:image/png;base64,eA==');
 });
 it('正文为空时阻止复制',async()=>{const result=await prepareExport(newArticle(),vi.fn(),vi.fn());expect(result.issues[0].level).toBe('blocking')});
 it('剪贴板 API 失败时使用复制事件写入两种格式',async()=>{
  const data={};const listener={clipboardData:{setData:(type,value)=>data[type]=value},preventDefault(){}};
  vi.stubGlobal('ClipboardItem',class {});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:vi.fn().mockRejectedValue(new Error('denied'))}});
  document.execCommand=vi.fn(()=>{document.dispatchEvent(Object.assign(new Event('copy'),{clipboardData:listener.clipboardData}));return true});
  await copyRichText('<p>正文</p>','正文');expect(data).toEqual({'text/html':'<p>正文</p>','text/plain':'正文'});vi.unstubAllGlobals();
 });
});
