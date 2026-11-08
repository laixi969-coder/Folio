import {it,expect,vi} from 'vitest';
import {screen,fireEvent,waitFor,within} from '@testing-library/react';
import {newArticle} from '../src/model';
vi.mock('../src/export-check',async original=>({...await original(),copyRichText:vi.fn()}));
import {copyRichText} from '../src/export-check';
it('复制公众号正文始终为可编辑图文，旧文章存的转图方式不再生效',async()=>{
 window.scrollTo=vi.fn();document.body.innerHTML='<div id="root"></div>';
 let stored={...newArticle(),id:'font-copy',title:'字体复制验收',revision:1,style:{...newArticle().style,fontFamily:'lxgw-wenkai',wechatFontMode:'all'},blocks:[{id:'p',type:'paragraph',html:'保留字形'},{id:'pic',type:'images',images:[{id:'i',src:'/media/pic.png',width:800}]}]};
 global.fetch=vi.fn(async(url,o)=>{let data;if(url==='/api/articles')data={articles:[stored]};else if(url==='/api/articles/font-copy'){if(o?.method==='PUT')stored={...JSON.parse(o.body),revision:stored.revision+1};data=stored}else if(url.includes('/draft/status'))data={configured:false};else if(url==='/media/pic.png')return {ok:true,blob:async()=>new Blob(['x'],{type:'image/png'})};else throw Error(url);return {ok:true,json:async()=>structuredClone(data)}});
 await import('../src/main.jsx');fireEvent.click(await screen.findByRole('heading',{name:'字体复制验收'}));fireEvent.click(await screen.findByRole('button',{name:'导出',exact:true}));
 const dialog=await screen.findByRole('dialog',{name:'导出文章'}),copy=within(dialog).getByRole('button',{name:/复制公众号正文/});await waitFor(()=>expect(copy.disabled).toBe(false));
 expect(within(dialog).queryByLabelText('公众号字体处理')).toBeNull();fireEvent.click(copy);
 await waitFor(()=>expect(copyRichText).toHaveBeenCalled());
 const [html,plain]=copyRichText.mock.calls[0];
 expect(html).toContain('保留字形');expect(html).toMatch(/data:image\/png;base64,/);expect(html).not.toContain('文字-001');expect(html.toLowerCase()).not.toContain('@font-face');
 expect(plain).toContain('保留字形');
 await waitFor(()=>expect(stored.deliveryEvents?.copied).toBeTruthy(),{timeout:3000});expect(stored.blocks[0].html).toBe('保留字形');
});
