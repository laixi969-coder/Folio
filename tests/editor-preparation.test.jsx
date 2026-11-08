import {it, expect, vi} from 'vitest';
import {screen, fireEvent, waitFor, within} from '@testing-library/react';
import {newArticle} from '../src/model';

it('编辑器体检可定位，发布标题和摘要保存后重新打开仍独立于正文', async () => {
  window.scrollTo=vi.fn();Element.prototype.scrollIntoView=vi.fn();
  document.body.innerHTML='<div id="root"></div>';
  let stored={...newArticle(),id:'editor-check',title:'测试原稿',revision:1,updatedAt:'2026-11-07T10:00:00Z',blocks:[{id:'long',type:'paragraph',html:'文'.repeat(181)}]};
  global.fetch=vi.fn(async(url,options)=>{
    let data;
    if(url==='/api/articles')data={articles:[stored]};
    else if(url==='/api/articles/editor-check'){
      if(options?.method==='PUT')stored={...JSON.parse(options.body),revision:stored.revision+1};
      data=stored;
    }else if(url==='/api/connections/wechat/draft/status?articleId=editor-check')data={configured:true,revision:1,at:'2026-11-07T10:00:00Z'};
    else throw Error('unexpected '+url);
    return {ok:true,json:async()=>structuredClone(data)};
  });
  await import('../src/main.jsx');
  fireEvent.click(await screen.findByRole('heading',{name:'测试原稿'}));
  fireEvent.click(await screen.findByRole('button',{name:'阅读体检'}));
  fireEvent.click(screen.getByRole('button',{name:'定位到正文'}));
  await waitFor(()=>expect(document.querySelector('.article-block.selected')?.id).toBe('block-long'));
  fireEvent.click(screen.getByRole('button',{name:'导出'}));
  const dialog=await screen.findByRole('dialog',{name:'导出文章'});
  await within(dialog).findByText('当前版本已同步到公众号草稿箱。');
  expect(within(dialog).getByRole('button',{name:/同步到公众号草稿箱/}).disabled).toBe(true);
  await waitFor(()=>expect(within(dialog).getByRole('button',{name:/复制公众号正文/}).disabled).toBe(false));
  fireEvent.change(within(dialog).getByLabelText('发布标题'),{target:{value:'对外发布标题'}});
  fireEvent.change(within(dialog).getByLabelText('发布摘要'),{target:{value:'这是小编填写的独立摘要'}});
  expect(within(dialog).getByText('本地有新修改，尚未同步。')).toBeTruthy();
  await waitFor(()=>expect(stored.digest).toBe('这是小编填写的独立摘要'),{timeout:2000});
  expect(stored.title).toBe('测试原稿');expect(stored.publishTitle).toBe('对外发布标题');expect(stored.blocks[0].html).toBe('文'.repeat(181));
  fireEvent.click(within(dialog).getByRole('button',{name:'关闭弹窗'}));
  fireEvent.click(screen.getByRole('button',{name:'返回文章库'}));
  fireEvent.click(await screen.findByRole('heading',{name:'测试原稿'}));
  fireEvent.click(await screen.findByRole('button',{name:'导出'}));
  expect(screen.getByLabelText('发布标题').value).toBe('对外发布标题');
  expect(screen.getByLabelText('发布摘要').value).toBe('这是小编填写的独立摘要');
  await screen.findByText('本地有新修改，尚未同步。');
});
