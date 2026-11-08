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
 it('检查并嵌入表格里的图片',async()=>{const block={id:'table',type:'paragraph',markdownKind:'table',html:'<table><tbody><tr><td><img src="/media/table.png" alt="图"></td></tr></tbody></table>'};const result=await prepareExport({...newArticle(),blocks:[block]},async()=>({ok:true,blob:async()=>new Blob(['x'],{type:'image/png'})}),async()=>'data:image/png;base64,eA==');expect(result.issues).toEqual([]);expect(result.assets['/media/table.png']).toBe('data:image/png;base64,eA==');const failed=await prepareExport({...newArticle(),blocks:[block]},async()=>({ok:false}),vi.fn());expect(failed.issues[0]).toMatchObject({level:'blocking',blockId:'table'})});
 it('正文为空时阻止复制',async()=>{const result=await prepareExport(newArticle(),vi.fn(),vi.fn());expect(result.issues[0].level).toBe('blocking')});
 it('全文和局部使用内置字体时说明微信的回退行为，但仍允许复制',async()=>{
  for(const [style,html,name] of [[{fontFamily:'lxgw-wenkai',wechatFontMode:'text'},'正文','霞鹜文楷'],[{wechatFontMode:'text'},'<span style="font-family:ZCOOL XiaoWei,serif">标题</span>','站酷小薇']]){
   const result=await prepareExport({...newArticle(),style,blocks:[{id:'p',type:'paragraph',html}]},vi.fn(),vi.fn());
   expect(result.issues).toHaveLength(1);expect(result.issues[0].level).toBe('warning');expect(result.issues[0].message).toContain(name);expect(result.issues[0].message).toContain('不携带字体文件');
  }
 });
 it('小图与自定义字体只提示核对，不阻止导出',async()=>{const a={...newArticle(),style:{fontFamily:'custom',customFont:'My Font'},blocks:[imageBlock([{id:'small',src:'/media/small.png',width:120}])]};const result=await prepareExport(a,async()=>({ok:true,blob:async()=>new Blob(['image'],{type:'image/png'})}),async()=>'data:image/png;base64,eA==');expect(result.issues).toHaveLength(2);expect(result.issues.every(i=>i.level==='warning')).toBe(true)});
 it('剪贴板 API 失败时使用复制事件写入两种格式',async()=>{
  const data={};const listener={clipboardData:{setData:(type,value)=>data[type]=value},preventDefault(){}};
  vi.stubGlobal('ClipboardItem',class {});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:vi.fn().mockRejectedValue(new Error('denied'))}});
  document.execCommand=vi.fn(()=>{document.dispatchEvent(Object.assign(new Event('copy'),{clipboardData:listener.clipboardData}));return true});
  await copyRichText('<p>正文</p>','正文');expect(data).toEqual({'text/html':'<p>正文</p>','text/plain':'正文'});vi.unstubAllGlobals();
 });
});
it('修改文字后复用同一图片，只读取新增的本机图片，不缓存失败',async()=>{
 const fetcher=vi.fn(async()=>({ok:true,blob:async()=>new Blob(['image'],{type:'image/png'})})),reader=vi.fn(async()=>'data:image/png;base64,eA==');
 const a={...newArticle(),blocks:[imageBlock([{src:'/media/cache-a.png'}])]};await prepareExport(a,fetcher,reader);
 await prepareExport({...a,title:'仅修改标题',blocks:[...a.blocks,imageBlock([{src:'/media/cache-b.png'}])]},fetcher,reader);expect(fetcher).toHaveBeenCalledTimes(2);expect(reader).toHaveBeenCalledTimes(2);
});
