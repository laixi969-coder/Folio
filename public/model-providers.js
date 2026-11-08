// Official pay-as-you-go endpoints, checked 2026-11-07. Account model lists
// remain authoritative; these are starting points, not access guarantees.
export const TEXT_PROVIDERS = [
  {id:'deepseek',name:'DeepSeek',baseURL:'https://api.deepseek.com',model:'deepseek-flash',docs:'https://api-docs.deepseek.com/quick_start/pricing/',note:'使用 DeepSeek 开放平台 API Key。'},
  {id:'qwen',name:'通义千问 · 北京',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',model:'qwen3.8-flash',docs:'https://help.aliyun.com/en/model-studio/qwen3-8-flash',note:'使用百炼北京地域的按量付费 API Key；如控制台提供专属工作空间地址，可在下方替换。'},
  {id:'glm',name:'智谱 GLM',baseURL:'https://open.bigmodel.cn/api/paas/v4',model:'glm-5.3-flash',docs:'https://huggingface.co/zai-org/GLM-5.3-Flash',note:'使用智谱开放平台 API Key；模型权限可通过文字试运行验证。若使用中转服务，请按该服务的地址和 ID 手动填写。'}
];
export function matchingProvider(baseURL='') {return TEXT_PROVIDERS.find(p=>p.baseURL===baseURL.replace(/\/+$/,''));}
export function modelConfigurationError(profile,slot='text') {
  if(!profile?.model?.trim())return '请先在连接设置中填写模型 ID。';
  let url;try{url=new URL(profile.baseURL)}catch{return '请先填写有效的 API 基础地址。'}
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&!profile.apiKey)return '尚未填写 API Key。请在「连接与发布」中保存对应服务商的密钥。';
  if(slot==='image'&&/^(deepseek-|qwen3|glm-?[345])/i.test(profile.model))return '当前选择的是文字模型，不能用于生成配图。请为图片单独配置支持 Images 接口的绘图模型。';
  return '';
}
export function textRequestOptions(profile,{probe=false}={}) {
  const url=new URL(profile.baseURL),model=profile.model;
  if(url.hostname==='api.deepseek.com'&&/^(deepseek-flash|deepseek-v4)/.test(model))return {thinking:{type:'disabled'},response_format:{type:'json_object'},max_tokens:probe?128:4096};
  if(url.hostname==='open.bigmodel.cn'&&model==='glm-5.3')return {thinking:{type:'enabled'},reasoning_effort:'low',response_format:{type:'json_object'},max_tokens:probe?2048:8192};
  // Leave provider-specific parameters out of custom gateways.
  return {max_tokens:probe?1024:4096};
}
