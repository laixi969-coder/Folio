import {clean, normalizeStyle} from './model';

const count = value => Array.from(value.replace(/\s/g, '')).length;
const blockAnalysisCache=new Map();
function analyzeHTML(html=''){
 if(blockAnalysisCache.has(html))return blockAnalysisCache.get(html);
 const root=document.createElement('div');root.innerHTML=clean(html);
 const length=count(root.textContent||''),special=!!root.querySelector('table,pre,img');
 const walker=document.createTreeWalker(root,4);let node,emphasized=0;
 while((node=walker.nextNode()))if(node.parentElement.closest('strong,b'))emphasized+=count(node.textContent);
 const sizes=Array.from(root.querySelectorAll('span[style]'),el=>parseFloat(el.style.fontSize));
 const result={length,special,emphasized,sizes};
 if(blockAnalysisCache.size>=500)blockAnalysisCache.delete(blockAnalysisCache.keys().next().value);
 blockAnalysisCache.set(html,result);return result;
}
export function readingIssues(article, {paragraphLimit = 180, denseLimit = 600} = {}) {
  const issues = [], style = normalizeStyle(article.style);
  let hasHeading = false, run = [];
  const add = (block, kind, title, detail, context = '') => {
    // An ignored suggestion returns when its underlying content or style changes.
    const key = JSON.stringify([block.id, kind, block.html, block.fontSize, style.fontSize, context]);
    issues.push({key, blockId: block.id, kind, title, detail});
  };
  const flush = () => {
    const length = run.reduce((sum, item) => sum + item.length, 0);
    if (run.length >= 3 && length > denseLimit) add(run[0].block, 'density', '连续文字较密',
      `连续 ${run.length} 段共 ${length} 字。通读时留意节奏，可在内容转折处增加小标题或引语，不必为了分隔而插图。`, JSON.stringify(run));
    run = [];
  };
  for (const block of article.blocks) {
    if (block.type === 'heading') hasHeading = true;
    if (block.type === 'subheading' && !hasHeading) add(block, 'hierarchy', '二级标题前没有一级标题', '如果这是独立章节，可将段落类型调整为一级小标题；有意这样编排时可以忽略。');
    const analysis=analyzeHTML(block.html);
    const {length,emphasized}=analysis;
    const prose = block.type === 'paragraph' && !block.markdownKind && !block.role && !analysis.special;
    if (prose && length) run.push({block, length}); else flush();
    if (!prose) continue;
    if (length > paragraphLimit) add(block, 'length', '这一段较长', `本段 ${length} 字，超过当前 ${paragraphLimit} 字的提示线。建议在自然停顿处分段；这不是排版错误。`);
    if (length >= 40 && emphasized / length > 0.5) add(block, 'emphasis', '加粗占比较高', `约 ${Math.round(emphasized / length * 100)}% 的文字被加粗，重点可能不够突出。可只保留最需要读者记住的句子。`);
    const sizes = [Number(block.fontSize), ...analysis.sizes].filter(Number.isFinite).filter(n => n > 0);
    if (sizes.some(n => n < 14 || n > style.fontSize * 1.35)) add(block, 'size', '局部字号需要留意', `正文基准为 ${style.fontSize}px，本段包含 ${[...new Set(sizes)].join('、')}px 字号。请在手机上确认是否易读、是否符合强调意图。`);
  }
  flush();
  return issues;
}

export const publishingTitle = article => article.publishTitle === undefined ? article.title || '' : article.publishTitle;
export function publicationIssues(article) {
  const issues = [], title = publishingTitle(article);
  if (!title.trim()) issues.push('请填写发布标题');
  else if (title.length > 64) issues.push('发布标题请控制在 64 个字符以内');
  if (!article.cover?.src) issues.push('请上传封面');
  return issues;
}
