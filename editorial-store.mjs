import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

export function createEditorialStore({dir, getArticles = () => []}) {
  const router = express.Router(), file = path.join(dir, 'editorial-library.json');
  let library = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {revision: 0, presets: [], snippets: [], assets: []};
  router.get('/library', (req, res) => res.json(library));
  router.put('/library', (req, res, next) => {
    const body = req.body;
    if (body?.revision !== library.revision) return res.status(409).json({error:'另一台设备更新了素材库，请重新读取后再保存。', current:library});
    const list = (items, predicate) => Array.isArray(items) && items.length <= 500 && new Set(items.map(x=>x?.id)).size === items.length && items.every(x=>x && typeof x.id==='string' && x.id.length<=100 && predicate(x));
    const name = x => typeof x.name==='string' && x.name.trim() && x.name.length<=120;
    if (!list(body.presets,x=>name(x)&&x.style&&typeof x.style==='object'&&Array.isArray(x.opening)&&Array.isArray(x.closing)) || !list(body.snippets,x=>name(x)&&Array.isArray(x.blocks)&&x.blocks.length<=100) || !list(body.assets,x=>name(x)&&typeof x.src==='string'&&/^\/media\/[a-zA-Z0-9-]+\.(png|jpeg|gif|webp)$/.test(x.src)) || JSON.stringify(body).length>4000000) return res.status(400).json({error:'素材库格式不正确或内容过大。'});
    const nextLibrary = {revision:library.revision+1,presets:body.presets,snippets:body.snippets,assets:body.assets};
    try {fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(nextLibrary),{mode:0o600});fs.renameSync(file+'.tmp',file);library=nextLibrary;res.json(library);} catch(e) {next(e);}
  });
  router.get('/asset-usage', (req,res) => {
    const usage = {};
    for (const article of getArticles()) {
      const sources = new Set([article.cover?.src,...article.blocks.flatMap(b=>b.images?.map(i=>i.src)||[])]);
      for (const asset of library.assets) if(sources.has(asset.src)||article.blocks.some(b=>b.html?.includes(asset.src))) (usage[asset.id] ||= []).push({id:article.id,title:article.title});
    }
    res.json(usage);
  });
  router.get('/reviews', (req,res) => res.json(getArticles().filter(a=>a.review?.publishedAt&&a.review?.recordedAt).map(a=>({id:a.id,title:a.publishTitle??a.title,columnName:a.columnName||'',review:a.review}))));
  return router;
}
