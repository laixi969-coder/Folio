import {it,expect,vi} from 'vitest';
import {screen,fireEvent,waitFor,within} from '@testing-library/react';
import {newArticle} from '../src/model';
vi.mock('../src/export-check',async original=>({...await original(),copyRichText:vi.fn()}));
vi.mock('../src/wechat-font-export',async original=>({...await original(),prepareWechatExport:vi.fn(async()=>({mode:'all',html:'<section><img src="data:image/png;base64,iVBORw0KGgo=" alt="保留字形"></section>',images:[{name:'文字-001.png'}],count:1}))}));
import {copyRichText} from '../src/export-check';
import {prepareWechatExport} from '../src/wechat-font-export';
it('公众号复制使用生成后的图片正文，保留纯文本备用格式和可编辑原稿',async()=>{
 window.scrollTo=vi.fn();document.body.innerHTML='<div id="root"></div>';
 let stored={...newArticle(),id:'font-copy',title:'字体复制验收',revision:1,style:{...newArticle().style,fontFamily:'lxgw-wenkai'},blocks:[{id:'p',type:'paragraph',html:'保留字形'}]};
 global.fetch=vi.fn(async(url,o)=>{let data;if(url==='/api/articles')data={articles:[stored]};else if(url==='/api/articles/font-copy'){if(o?.method==='PUT')stored={...JSON.parse(o.body),revision:stored.revision+1};data=stored}else if(url.includes('/draft/status'))data={configured:false};else throw Error(url);return {ok:true,json:async()=>structuredClone(data)}});
 await import('../src/main.jsx');fireEvent.click(await screen.findByRole('heading',{name:'字体复制验收'}));fireEvent.click(await screen.findByRole('button',{name:'导出',exact:true}));
 const dialog=await screen.findByRole('dialog',{name:'导出文章'}),copy=within(dialog).getByRole('button',{name:/复制公众号正文/});await waitFor(()=>expect(copy.disabled).toBe(false));
 expect(within(dialog).getByLabelText('公众号字体处理').value).toBe('all');fireEvent.click(copy);
 await waitFor(()=>expect(copyRichText).toHaveBeenCalledWith(expect.stringContaining('<img src="data:image/png'), '保留字形'));
 expect(prepareWechatExport).toHaveBeenCalled();await waitFor(()=>expect(stored.deliveryEvents?.copied).toBeTruthy(),{timeout:3000});expect(stored.blocks[0].html).toBe('保留字形');
});
