// @vitest-environment node
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ARTICLE_FONTS} from '../public/article-fonts.js';

it('五款字体随应用完整分发，保留原始二进制、授权与可追溯来源',()=>{
 const fonts=ARTICLE_FONTS.filter(f=>f.file),sources=JSON.parse(readFileSync(new URL('../public/fonts/sources.json',import.meta.url)));
 const css=readFileSync(new URL('../public/fonts/fonts.css',import.meta.url),'utf8');
 expect(fonts).toHaveLength(5);expect(sources).toHaveLength(5);
 for(const font of fonts){
  const bytes=readFileSync(new URL('../public'+font.file,import.meta.url)),source=sources.find(s=>s.id===font.id);
  expect(bytes.length).toBe(source.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
  expect(['00010000','4f54544f','774f4632']).toContain(bytes.subarray(0,4).toString('hex'));
  expect(readFileSync(new URL('../public'+font.license,import.meta.url),'utf8')).toMatch(/SIL OPEN FONT LICENSE Version 1\.1/i);
  expect(source.url).toMatch(/^https:\/\/(github\.com|raw\.githubusercontent\.com)\//);
  expect(css).toContain(`font-family:'${font.face}'`);expect(css).toContain(`url('${font.file}')`);
 }
 expect(readFileSync(new URL('../index.html',import.meta.url),'utf8')).toContain('/fonts/fonts.css');
});
