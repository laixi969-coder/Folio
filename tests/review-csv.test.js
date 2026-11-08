import {it,expect} from 'vitest';
import {parseCSV,guessMapping,previewReviewImport} from '../src/review-csv';
const a={id:'a',title:'原稿',publishTitle:'发布标题',review:{url:'https://example.test/p',snapshot:{title:'发布标题'},account:'账号',publishedAt:'2026-11-01T12:00:00Z'},columnName:'每周观点'};
it('处理 BOM、引号内逗号换行和转义；区分零与缺失值',()=>{
 const csv=parseCSV('\uFEFF标题,阅读,点赞,备注\r\n发布标题,0,,"包含,逗号\n和""引号"""');
 const [row]=previewReviewImport(csv,guessMapping(csv.headers),[a],{windowHours:24});expect(row.errors).toEqual([]);expect(row.review.reads).toBe(0);expect(row.review.likes).toBeNull();expect(row.review.notes).toBe('包含,逗号\n和"引号"');expect(row.review.snapshot).toEqual(a.review.snapshot);
});
it('歧义标题、非法计数、无效窗口与坏 CSV 会阻止导入',()=>{
 const csv=parseCSV('标题,阅读,观察小时\n发布标题,-1,0'),mapping=guessMapping(csv.headers);
 const [row]=previewReviewImport(csv,mapping,[a,{...a,id:'b'}]);expect(row.errors.join()).toContain('多篇');expect(row.errors.join()).toContain('非负整数');expect(row.errors.join()).toContain('观察小时');
 expect(()=>parseCSV('标题,标题\na,b')).toThrow('重复');expect(()=>parseCSV('标题,阅读\n"abc,5')).toThrow('未闭合');expect(()=>parseCSV('标题,阅读\na,5,6')).toThrow('列数');
});
it('ID 优先匹配；日期与账号缺失不可假定已发布',()=>{
 const csv=parseCSV('文章ID,标题,阅读,发布时间\na,旧标题,42,invalid');const [row]=previewReviewImport(csv,guessMapping(csv.headers),[{id:'a',title:'新标题'}],{windowHours:24});expect(row.article.id).toBe('a');expect(row.errors).toEqual(expect.arrayContaining(['缺少账号','发布时间无效']));
});
it('未匹配链接回退到唯一标题，歧义可以手动指定；未提供的指标保留历史值',()=>{
 const csv=parseCSV('标题,发布链接,阅读\n发布标题,https://example.test/new,20'),mapping=guessMapping(csv.headers),old={...a,review:{...a.review,likes:8}};
 expect(previewReviewImport(csv,mapping,[old],{windowHours:24})[0].article.id).toBe('a');
 const result=previewReviewImport(csv,mapping,[old,{...old,id:'b'}],{windowHours:24},{0:'b'})[0];expect(result.errors).toEqual([]);expect(result.article.id).toBe('b');expect(result.review.likes).toBe(8);
});
