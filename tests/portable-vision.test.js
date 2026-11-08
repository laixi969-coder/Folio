// @vitest-environment node
import{it,expect,vi}from'vitest';
import{runVision,runPortableVision}from'../portable-vision.mjs';
it('Linux 自动使用跨平台模型，不调用 macOS 接口',async()=>{
 const local=vi.fn(),portable=vi.fn(async items=>items.map(x=>({src:x.src,labels:[],error:false})));
 const result=await runVision([{src:'/media/a.png',path:'/tmp/a'}],{platform:'linux',local,portable});
 expect(result.engine).toBe('portable');expect(result.results).toHaveLength(1);expect(local).not.toHaveBeenCalled();
});
it('图片逐张在服务端分析，单张失败不会丢失其他结果',async()=>{
 const loadPipeline=async()=>({read:async file=>{if(file==='bad')throw Error();return {width:100,height:50}},classify:async()=>[{label:'outdoor',score:.91}]});
 const result=await runPortableVision([{src:'/media/a.png',path:'ok'},{src:'/media/b.png',path:'bad'}],{loadPipeline});
 expect(result[0]).toMatchObject({width:100,height:50,labels:[{id:'outdoor',confidence:.91}],error:false});expect(result[1].error).toBe(true);
});
it('跨平台模型不可用时可及时返回错误',async()=>{await expect(runVision([{src:'a',path:'a'}],{platform:'linux',portable:()=>new Promise(()=>{}),timeoutMs:10})).rejects.toThrow('超时')});
