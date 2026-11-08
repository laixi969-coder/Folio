import React,{useState} from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import {newArticle,parseMarkdown,exportHTML} from '../src/model';
import {applyPreset,BUILTIN_PRESETS,duplicateBlocks,LAYOUTS,layoutStyle,localCandidates,publicationSignature,comparableReviews,insertAsset} from '../src/editorial-model';
import ReadingNotes from '../src/ReadingNotes';
import EntryCandidates from '../src/EntryCandidates';
import EditorialLibrary from '../src/EditorialLibrary';
import PublicationChecks from '../src/PublicationChecks';
import ImageWorksheet from '../src/ImageWorksheet';
import ReviewDesk from '../src/ReviewDesk';
import {mapEditorialAssets} from '../src/editorial-assets';
afterEach(cleanup);
const article=()=>({...newArticle(),id:'a',title:'故事标题',blocks:parseMarkdown('故事开头。\n\n## 第一章\n\n人物走进街道。\n\n## 第二章\n\n故事结束。')});
it('栏目与三种方案保留所有原文和图片；组件独立复制',()=>{
 const a=article();a.blocks.push({id:'image',type:'images',layout:'horizontal',ratio:'original',images:[{id:'im',src:'/media/a.png',caption:'原图注'}]});
 const before=JSON.stringify(a.blocks),preset={...BUILTIN_PRESETS[0],opening:parseMarkdown('开头'),closing:parseMarkdown('结尾')};
 expect(JSON.stringify(applyPreset(a,preset).blocks)).toBe(before);
 for(const l of LAYOUTS){const candidate={...a,style:layoutStyle(a.style,l)};expect(JSON.stringify(candidate.blocks)).toBe(before);expect(exportHTML(candidate)).toContain('原图注')}
 const next=applyPreset(a,preset,true);expect(next.blocks).toHaveLength(a.blocks.length+2);next.blocks[0].html='修改';expect(preset.opening[0].html).toBe('开头');
 const copy=duplicateBlocks(a.blocks);expect(copy[0].id).not.toBe(a.blocks[0].id);expect(copy.at(-1).images[0].id).not.toBe('im');
});
it('通读和复盘元数据不改变发布版本；原文与封面变化会改变',()=>{
 const a=article(),signature=publicationSignature(a);
 expect(publicationSignature({...a,readingNotes:[{body:'备注'}],review:{reads:5},deliveryEvents:{copied:{at:'today'}}})).toBe(signature);
 expect(publicationSignature({...a,digest:'摘要'})).not.toBe(signature);
 expect(publicationSignature({...a,cover:{src:'/media/cover.png'}})).not.toBe(signature);
});
it('通读标记可保存、处理，删除原段后保留备注并显示失效位置',()=>{
 let current;function Harness(){const[a,setA]=useState(article());current=a;return <><ReadingNotes article={a} onChange={p=>setA(a=>typeof p==='function'?p(a):{...a,...p})} onLocate={vi.fn()}/><button onClick={()=>setA(a=>({...a,blocks:a.blocks.slice(1)}))}>模拟删除原段</button></>}
 render(<Harness/>);fireEvent.change(screen.getByLabelText('修改备注'),{target:{value:'补充转折'}});fireEvent.click(screen.getByText('保存通读标记'));expect(current.readingNotes[0].body).toBe('补充转折');expect(exportHTML(current)).not.toContain('补充转折');fireEvent.click(screen.getByText('标记已处理'));expect(current.readingNotes[0].resolved).toBe(true);fireEvent.click(screen.getByText('模拟删除原段'));expect(screen.getByText(/原段落已删除/)).toBeTruthy();expect(current.readingNotes).toHaveLength(1);
});
it('整组候选需核对才可应用；编辑候选会撤销核对，正文不变',()=>{
 let current;function Harness(){const[a,setA]=useState(article());current=a;return <EntryCandidates article={a} onChange={p=>setA(a=>typeof p==='function'?p(a):{...a,...p})} api={vi.fn()} library={{assets:[]}} onSettings={vi.fn()} onLocate={vi.fn()}/>}
 render(<Harness/>);fireEvent.click(screen.getByText('从原文建立候选'));expect(current.entryCandidates).toHaveLength(3);
 const apply=screen.getAllByText('采用这组发布信息')[0],verify=screen.getAllByRole('checkbox')[0];expect(apply.disabled).toBe(true);fireEvent.click(verify);expect(apply.disabled).toBe(false);fireEvent.change(screen.getByLabelText('候选标题 1'),{target:{value:'新的发布标题'}});expect(apply.disabled).toBe(true);fireEvent.click(verify);const before=JSON.stringify(current.blocks);fireEvent.click(apply);expect(current.publishTitle).toBe('新的发布标题');expect(JSON.stringify(current.blocks)).toBe(before);
});
it('栏目预览不改稿，显式应用可带入独立组件',()=>{
 const a=article(),change=vi.fn(),preset={...BUILTIN_PRESETS[0],id:'custom',name:'周刊',opening:parseMarkdown('开头说明'),closing:[]};
 render(<EditorialLibrary article={a} onChange={change} library={{revision:1,presets:[preset],snippets:[],assets:[]}} saveLibrary={vi.fn()} selectedIds={[]}/>);
 fireEvent.click(screen.getByRole('button',{name:/周刊/}));expect(change).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByText('应用这个栏目'));const next=change.mock.calls[0][0](a);expect(next.columnName).toBe('周刊');expect(next.blocks[0].html).toBe('开头说明');expect(a.blocks[0].html).toBe('故事开头。');
});
it('真机确认随内容变化失效，不冒充自动验收',()=>{
 const a=article(),change=vi.fn();const {rerender}=render(<PublicationChecks article={a} onChange={change}/>);fireEvent.click(screen.getByRole('checkbox'));const checked={...a,...change.mock.calls[0][0]};rerender(<PublicationChecks article={checked} onChange={change}/>);expect(screen.getByRole('checkbox').checked).toBe(true);rerender(<PublicationChecks article={{...checked,digest:'新摘要'}} onChange={change}/>);expect(screen.getByRole('checkbox').checked).toBe(false);expect(screen.getByText(/内容或版式已改变/)).toBeTruthy();
});
it('配图在指定段后插入副本，位置失效不写入',()=>{
 const a=article(),asset={id:'img',src:'/media/a.png',name:'照片',source:'自摄'};const next=insertAsset(a,a.blocks[0].id,asset);expect(next.blocks[1].images[0].source).toBe('自摄');expect(a.blocks).toHaveLength(5);expect(()=>insertAsset(a,'deleted',asset)).toThrow('原位置已删除');
});
it('配图单可建立并选择已有素材，生成不会在打开面板时自动请求',()=>{
 const api=vi.fn();let current;function Harness(){const[a,setA]=useState(article());current=a;return <ImageWorksheet article={a} onChange={p=>setA(a=>typeof p==='function'?p(a):{...a,...p})} api={api} library={{assets:[{id:'asset',src:'/media/a.png',name:'旧图'}]}} saveLibrary={vi.fn()} onLocate={vi.fn()} onSettings={vi.fn()}/>}
 render(<Harness/>);fireEvent.click(screen.getByText('建立配图工作单'));expect(current.imageTasks).toHaveLength(1);expect(api).not.toHaveBeenCalled();fireEvent.change(screen.getByLabelText('选择已有素材'),{target:{value:'/media/a.png'}});expect(current.blocks[1].type).toBe('images');expect(current.imageTasks[0].status).toBe('已插入');
});
it('复盘仅比较同条件，空数据不变成零，CSV 可导出',async()=>{
 const a={...article(),columnName:'周刊',review:{account:'账号',topic:'生活',windowHours:24,reads:null}},r={id:'other',title:'旧稿',columnName:'周刊',review:{account:'账号',topic:'生活',windowHours:24,reads:30}};
 expect(comparableReviews([r,{...r,id:'different',review:{...r.review,windowHours:48}}],a)).toHaveLength(1);
 const download=vi.fn();render(<ReviewDesk article={a} onChange={vi.fn()} api={vi.fn().mockResolvedValue([r])} download={download}/>);await screen.findByText('找到 1 篇可比较的历史文章。');expect(screen.getByLabelText('阅读数').value).toBe('');fireEvent.click(screen.getByText('导出当前比较 CSV'));expect(download.mock.calls[0][0]).toContain('旧稿');expect(download.mock.calls[0][0]).toContain('30');
});
it('未采用的候选封面和生成图也能备份并恢复，原文档不变',async()=>{
 const a={...article(),entryCandidates:[{id:'c',cover:{src:'/media/c.png',name:'候选封面'}}],imageTasks:[{id:'t',generatedAsset:{src:'/media/t.png',origin:'AI 生成',prompt:'画面'}}]};
 const packed=await mapEditorialAssets(a,async im=>({...im,src:'data:image/png;base64,'+im.name}));expect(packed.entryCandidates[0].cover.src).toMatch(/^data:/);expect(a.entryCandidates[0].cover.src).toBe('/media/c.png');
 const restored=await mapEditorialAssets(packed,async im=>({...im,src:'/media/restored.png'}));expect(restored.imageTasks[0].generatedAsset.prompt).toBe('画面');expect(restored.blocks).toEqual(a.blocks);
});
