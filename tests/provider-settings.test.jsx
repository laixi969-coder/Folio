import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import Connections from '../src/Connections';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
const initial={text:{baseURL:'https://api.deepseek.com',model:'deepseek-flash',models:[],keyConfigured:true,lastGenerationTest:{ok:true,message:'验证成功',at:new Date().toISOString()}},image:{models:[]},wechat:{}};
it('切换服务商不携带旧密钥，新输入密钥保存时不会被clearKey误删',async()=>{
 const calls=[];vi.stubGlobal('fetch',vi.fn(async(url,options)=>{calls.push([url,options]);return {ok:true,json:async()=>options?.method==='PUT'?{...initial,text:{...initial.text,...JSON.parse(options.body),apiKey:undefined}}:initial}}));
 render(<Connections onClose={()=>{}}/>);await screen.findByText('文字生成已验证');fireEvent.click(screen.getByRole('button',{name:'通义千问 · 北京 qwen3.8-flash'}));
 expect(screen.getByText('配置已修改，保存后生效')).toBeTruthy();expect(screen.queryByText('文字生成已验证')).toBeNull();
 fireEvent.change(screen.getByLabelText(/^API Key/),{target:{value:'test-new-key'}});fireEvent.click(screen.getByRole('button',{name:'保存配置'}));
 await waitFor(()=>expect(calls.some(([,o])=>o?.method==='PUT')).toBe(true));const body=JSON.parse(calls.find(([,o])=>o?.method==='PUT')[1].body);
 expect(body).toMatchObject({baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',model:'qwen3.8-flash',apiKey:'test-new-key',clearKey:false});
});
it('保存校验失败时保留用户刚输入的配置与密钥，方便更正重试',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(url,o)=>({ok:o?.method!=='PUT',json:async()=>o?.method==='PUT'?{error:'地址无效'}:initial})));
 render(<Connections onClose={()=>{}}/>);await screen.findByText('文字生成已验证');fireEvent.change(screen.getByLabelText('API 基础地址'),{target:{value:'bad'}});fireEvent.change(screen.getByLabelText(/^API Key/),{target:{value:'test-new-key'}});fireEvent.click(screen.getByRole('button',{name:'保存配置'}));
 await screen.findByRole('alert');expect(screen.getByLabelText('API 基础地址').value).toBe('bad');expect(screen.getByLabelText(/^API Key/).value).toBe('test-new-key');
});
