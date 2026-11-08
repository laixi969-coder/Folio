// RFC-style quoted cells, including commas/newlines and BOM; never evaluate cells.
export function parseCSV(input){
 if(input.length>2_000_000)throw Error('CSV 请控制在 2 MB 以内');
 const text=input.replace(/^\uFEFF/,''),sep=text.split(/\r?\n/,1)[0].includes('\t')?'\t':',',rows=[];let row=[],cell='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else cell+=c;continue}
  if(c==='"'&&!cell&&!closed){quoted=true;continue}
  if(c===sep){row.push(cell);cell='';closed=false;continue}
  if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';closed=false;continue}
  if(closed&&c.trim())throw Error('CSV 引号后的内容不正确');cell+=c;
 }
 if(quoted)throw Error('CSV 有未闭合的引号');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 if(rows.length<2)throw Error('CSV 需要表头和至少一条数据');if(rows.length>1001)throw Error('单次最多导入 1000 条记录');
 const [headers,...data]=rows;if(new Set(headers.map(h=>h.trim())).size!==headers.length)throw Error('CSV 表头不能重复');
 if(data.some(r=>r.length!==headers.length))throw Error('CSV 每行列数须与表头一致');
 return {headers:headers.map(h=>h.trim()),rows:data};
}
export const CSV_FIELDS=[['id','文章 ID',['id','articleId','文章ID','文章 ID']],['title','标题',['标题','文章标题','title']],['url','发布链接',['发布链接','文章链接','url']],['account','账号',['账号','公众号名称','account']],['columnName','栏目',['栏目','columnName']],['topic','主题',['主题','主题标签','topic']],['publishedAt','发布时间',['发布时间','publishedAt']],['windowHours','观察小时',['观察小时','windowHours']],['reads','阅读',['阅读','阅读数','图文页阅读人数','reads']],['likes','点赞',['点赞','点赞数','likes']],['shares','分享',['分享','分享数','shares']],['favorites','收藏',['收藏','收藏数','favorites']],['notes','备注',['备注','notes']]];
export const guessMapping=headers=>Object.fromEntries(CSV_FIELDS.map(([key,,aliases])=>[key,headers.find(h=>aliases.includes(h))||'']));
export function previewReviewImport(csv,mapping,articles,defaults={},overrides={}){
 return csv.rows.map((cells,index)=>{
  const values=Object.fromEntries(CSV_FIELDS.map(([k])=>[k,mapping[k]?String(cells[csv.headers.indexOf(mapping[k])]??'').trim():'']));
  const urlMatches=values.url?articles.filter(a=>a.review?.url===values.url):[];
  const candidates=overrides[index]?articles.filter(a=>a.id===overrides[index]):values.id?articles.filter(a=>a.id===values.id):urlMatches.length?urlMatches:articles.filter(a=>[a.review?.snapshot?.title,a.publishTitle,a.title].includes(values.title));
  const matched=candidates.length===1?candidates[0]:null,errors=[];
  if(!matched)errors.push(candidates.length?'匹配到多篇文章，请指定文章 ID':'未找到文章，请指定文章 ID 或唯一标题');
  const review={...matched?.review};
  for(const k of ['account','topic','url','notes'])if(values[k])review[k]=values[k];
  review.account=review.account||defaults.account||'';
  if(!review.account)errors.push('缺少账号');
  const date=values.publishedAt||review.publishedAt;
  if(date&&Number.isFinite(new Date(date).getTime()))review.publishedAt=new Date(date).toISOString();else errors.push('发布时间无效');
  const window=Number(values.windowHours||defaults.windowHours||review.windowHours);
  if(!Number.isInteger(window)||window<1||window>8760)errors.push('观察小时须为 1–8760 的整数');else review.windowHours=window;
  for(const k of ['reads','likes','shares','favorites']){if(!mapping[k]){if(!(k in review))review[k]=null;continue}const raw=values[k].replaceAll(',','');if(!raw){review[k]=null;continue}if(!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw)))errors.push(k+' 应为非负整数');else review[k]=Number(raw)}
  const columnName=values.columnName||matched?.columnName||'';
  return {row:index+2,article:matched,review,columnName,errors,title:values.title||matched?.title||'',snapshotMissing:!matched?.review?.snapshot};
 });
}
