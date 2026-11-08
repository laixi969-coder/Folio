import {it,expect,vi} from 'vitest';
import {screen,fireEvent,waitFor,within} from '@testing-library/react';
import {newArticle} from '../src/model';
import {publicationSignature} from '../src/editorial-model';
vi.mock('../src/export-check',async(importOriginal)=>({...await importOriginal(),copyRichText:vi.fn()}));
import {copyRichText} from '../src/export-check';
it('只有剪贴板写入成功才记录复制版本，失败不留成功记录，正文修改后标记之前版本',async()=>{
 window.scrollTo=vi.fn();document.body.innerHTML='<div id="root"></div>';
 let stored={...newArticle(),id:'copy-check',title:'复制测试',revision:1,blocks:[{id:'p',type:'paragraph',html:'保留完整正文'}]};
 global.fetch=vi.fn(async(url,o)=>{let data;if(url==='/api/articles')data={articles:[stored]};else if(url==='/api/articles/copy-check'){if(o?.method==='PUT')stored={...JSON.parse(o.body),revision:stored.revision+1};data=stored}else if(url.includes('/draft/status'))data={configured:false};else throw Error(url);return {ok:true,json:async()=>structuredClone(data)}});
 await import('../src/main.jsx');fireEvent.click(await screen.findByRole('heading',{name:'复制测试'}));fireEvent.click(await screen.findByRole('button',{name:'导出',exact:true}));const dialog=await screen.findByRole('dialog',{name:'导出文章'});const copy=within(dialog).getByRole('button',{name:/复制公众号正文/});await waitFor(()=>expect(copy.disabled).toBe(false));
 copyRichText.mockRejectedValueOnce(Error('剪贴板不可用'));fireEvent.click(copy);await screen.findByRole('alert');expect(stored.deliveryEvents).toBeUndefined();await waitFor(()=>expect(copy.disabled).toBe(false));
 copyRichText.mockResolvedValueOnce();const expected=publicationSignature(stored);fireEvent.click(copy);await waitFor(()=>expect(stored.deliveryEvents?.copied?.signature).toBe(expected),{timeout:3000});expect(stored.blocks[0].html).toBe('保留完整正文');
 fireEvent.change(within(dialog).getByLabelText('发布标题'),{target:{value:'更新标题'}});expect(within(dialog).getByText(/之前版本/)).toBeTruthy();
});
