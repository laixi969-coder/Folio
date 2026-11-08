// @vitest-environment node
import {it,expect,vi} from 'vitest';
import {runEditorialGeneration} from '../editorial-ai.mjs';
const profile={baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',apiKey:'private',model:'qwen-image-2.0'};
it('Qwen-Image 走原生接口并下载官方结果，不转发密钥，复用图片校验',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({output:{choices:[{message:{content:[{image:'https://dashscope-result-sh.oss-cn-shanghai.aliyuncs.com/a.png?Expires=x'}]}}]}}))).mockResolvedValueOnce(new Response(Buffer.from('iVBORw0KGgo=','base64')));
 const result=await runEditorialGeneration({kind:'image',body:{prompt:'插画'},profile,fetcher});expect(result.data).toContain('data:image/png;base64,');expect(fetcher.mock.calls[0][0]).toContain('/api/v1/services/aigc/');expect(JSON.parse(fetcher.mock.calls[0][1].body).parameters.n).toBe(1);expect(fetcher.mock.calls[1][1].headers).toBeUndefined();expect(fetcher.mock.calls[1][1].redirect).toBe('error');
});
it('拒绝外部结果地址与超大图片，错误不伪装完成',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({output:{choices:[{message:{content:[{image:'http://127.0.0.1/private'}]}}]}})));
 await expect(runEditorialGeneration({kind:'image',body:{prompt:'插画'},profile,fetcher})).rejects.toThrow('官方结果域名');expect(fetcher).toHaveBeenCalledTimes(1);
});
it('支持实际返回的 OSS 加速域名，下载失败后复用缓存而不重新生图',async()=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'folio-image-cache-'));
 const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({output:{choices:[{message:{content:[{image:'https://dashscope-0484.oss-accelerate.aliyuncs.com/a.png?Expires=x'}]}}]}}))).mockResolvedValueOnce(new Response('',{status:503})).mockResolvedValueOnce(new Response(Buffer.from('iVBORw0KGgo=','base64')));
 try{await expect(runEditorialGeneration({kind:'image',body:{prompt:'插画'},profile,fetcher,imageCacheDir:dir})).rejects.toThrow('下载');const result=await runEditorialGeneration({kind:'image',body:{prompt:'插画'},profile,fetcher,imageCacheDir:dir});expect(result.data).toContain('data:image/png');expect(fetcher.mock.calls.filter(([,options])=>options.method==='POST')).toHaveLength(1);expect(fetcher.mock.calls).toHaveLength(3);expect(fs.readFileSync(path.join(dir,fs.readdirSync(dir)[0]),'utf8')).not.toContain('private')}finally{fs.rmSync(dir,{recursive:true,force:true})}
});
