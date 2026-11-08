import React,{useState} from 'react';
import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {DEFAULT_STYLE,textOf} from '../src/model';
import {planAutomation,applyAutomation,previewAutomation,restoreAutomation,distributedSources,baselineEntries,adoptJob} from '../src/automation-model';
import {contentSignature} from '../src/editorial-model';
import AutomationDesk from '../src/AutomationDesk';
const article=()=>({id:'a',title:'安静的书店',subtitle:'',style:{...DEFAULT_STYLE},blocks:[{id:'a1',type:'paragraph',html:'我们在城市里寻找一间书店。'+('沿街走着，观察旧屋和树影。').repeat(3)},{id:'a2',type:'paragraph',html:'01 午后的来客'},{id:'a3',type:'paragraph',html:('一位读者静静坐在窗边，翻开一本书。').repeat(20)},{id:'a4',type:'images',layout:'vertical',images:[{id:'im',src:'/media/a.png',width:1200,height:800},{id:'im2',src:'/media/b.png',width:600,height:900}]},{id:'a5',type:'paragraph',html:'图注：窗边的书桌'}]});
const library={presets:[],assets:[],snippets:[],revision:0};
it('集中审阅保持文字图片顺序；局部选择、重复运行和原稿恢复',()=>{
 const a=article(),plan=planAutomation(a,library);const ids=plan.changes.map(c=>c.id);
 expect(plan.changes.some(c=>c.label.includes('章节'))).toBe(true);
 const next=applyAutomation(a,plan,ids);
 expect(next.blocks.filter(b=>b.type!=='images').map(b=>textOf(b.html)).join('')).toBe(a.blocks.filter(b=>b.type!=='images').map(b=>textOf(b.html)).join(''));
 expect(next.blocks.find(b=>b.type==='images').images).toEqual(a.blocks[3].images);
 const again=planAutomation(next,library);expect(again.changes).toHaveLength(0);expect(again.unchanged).toHaveLength(next.blocks.length);
 expect(restoreAutomation(next).blocks).toEqual(a.blocks);expect(restoreAutomation(next).style).toEqual(a.style);
 expect(()=>restoreAutomation({...next,title:'之后修改'})).toThrow('又做了修改');
 const only=previewAutomation(a,plan,['a2']);expect(only.blocks[1].type).toBe('heading');expect(only.style).toEqual(a.style);
 expect(()=>previewAutomation({...a,title:'新稿'},plan,ids)).toThrow('已变化');
});
it('保护手工局部样式、图组与上次整理后修改的块',()=>{
 const a=article();a.blocks[2].fontSize=19;a.blocks[3].layout='horizontal';a.blocks[0].automationLocked=true;
 const plan=planAutomation(a,library);expect(plan.protectedIds).toEqual(expect.arrayContaining(['a1','a3','a4']));
 const next=applyAutomation(a,plan,plan.changes.map(c=>c.id));next.blocks[1].html='02 手工改过的章题';
 expect(planAutomation(next,library).protectedIds).toContain('a2');expect(next.blocks[2].fontSize).toBe(19);
});
it('长文取材覆盖结尾且不超过服务端预算；保留证据出处',()=>{
 const a=article();a.blocks=Array.from({length:700},(_,i)=>({id:'p'+i,type:'paragraph',html:('第'+i+'段事实。').repeat(300)}));
 const sources=distributedSources(a);expect(sources[0].id).toBe('p0');expect(sources.at(-1).id).toBe('p699');expect(sources.length).toBeLessThanOrEqual(200);expect(JSON.stringify(sources).length).toBeLessThan(30000);
 for(const s of sources)expect(textOf(a.blocks.find(b=>b.id===s.id).html)).toContain(s.text);
 expect(baselineEntries(a)).toHaveLength(3);
});
it('后台结果只收取一次，正文变化后不能采用，纯排版变化不重复付费',()=>{
 const a=article(),job={id:'j',articleId:'a',kind:'candidates',status:'completed',sourceSignature:contentSignature(a),result:{candidates:[{title:'标题',digest:'摘要'}],provenance:{createdAt:'today'}}};
 const next=adoptJob(a,job);expect(next.entryCandidates).toHaveLength(1);expect(adoptJob(next,job)).toBe(next);
 expect(contentSignature({...a,style:{...a.style,fontSize:18},blocks:a.blocks.map(b=>({...b,gap:20}))})).toBe(contentSignature(a));
 expect(()=>adoptJob({...a,title:'正文变化'},job)).toThrow('正文已变化');expect(adoptJob({...a,id:'b'},job).entryCandidates).toBeUndefined();
});
it('从工作台完成检查、选择、采用、三组候选和恢复，不调用发布接口',async()=>{
 const api=vi.fn(async()=>({status:'queued'}));let current;
 function Harness(){const[a,setA]=useState(article());current=a;return <AutomationDesk article={a} onChange={fn=>setA(prev=>typeof fn==='function'?fn(prev):{...prev,...fn})} library={library} saveLibrary={vi.fn()} api={api} onLocate={vi.fn()} onTab={vi.fn()}/>}
 render(<Harness/>);fireEvent.click(screen.getByText('检查并生成整理建议'));await waitFor(()=>expect(screen.getByText('采用所选建议，整理成待审稿')).toBeTruthy());
 fireEvent.click(screen.getByText('采用所选建议，整理成待审稿'));await waitFor(()=>expect(current.entryCandidates).toHaveLength(3));expect(current.automationCheckpoint).toBeTruthy();
 expect(api.mock.calls).toHaveLength(1);expect(JSON.parse(api.mock.calls[0][1].body).kind).toBe('assets');
 fireEvent.click(screen.getByText('恢复最近一次整理前的原稿'));expect(current.blocks).toEqual(article().blocks);cleanup();
});
