import {clean, textOf} from './model';
import {safeFontFamily} from '../public/article-fonts.js';

// Apply a size to text nodes only, preserving all other markup and text exactly.
function formatTextRange(html, start, end, property, value) {
  if (start < 0 || end <= start) return html;
  const root = document.createElement('div');
  root.innerHTML = clean(html);
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let position = 0;
  for (const node of nodes) {
    const text = node.data, left = Math.max(0, start - position), right = Math.min(text.length, end - position);
    position += text.length;
    if (right <= left) continue;
    const span = document.createElement('span');
    span.style[property] = value;
    span.textContent = text.slice(left, right);
    const replacement = document.createDocumentFragment();
    if (left) replacement.append(document.createTextNode(text.slice(0, left)));
    replacement.append(span);
    if (right < text.length) replacement.append(document.createTextNode(text.slice(right)));
    node.replaceWith(replacement);
  }
  return clean(root.innerHTML);
}

export function sizeTextRange(html,start,end,size){
  return Number.isInteger(size)&&size>=10&&size<=72?formatTextRange(html,start,end,'fontSize',size+'px'):html;
}
export function fontTextRange(html,start,end,family){
  return safeFontFamily(family)?formatTextRange(html,start,end,'fontFamily',family):html;
}

// Capture stable text offsets before a toolbar control takes focus.
export function captureTextRanges(selection, article, paper) {
  if (!selection || selection.isCollapsed || !selection.rangeCount || !paper) return [];
  const range = selection.getRangeAt(0), result = [];
  if (!paper.contains(range.startContainer) || !paper.contains(range.endContainer)) return [];
  for (const root of paper.querySelectorAll('[contenteditable="true"]')) {
    if (!range.intersectsNode(root)) continue;
    const block = root.closest('[data-block-id]');
    const model = article.blocks.find(item => item.id === block?.dataset.blockId);
    if (!model || typeof model.html !== 'string') continue;
    const prefix = document.createRange(); prefix.selectNodeContents(root);
    let start = 0, end = root.textContent.length;
    if (root.contains(range.startContainer)) { prefix.setEnd(range.startContainer, range.startOffset); start = prefix.toString().length; }
    if (root.contains(range.endContainer)) { const part=document.createRange();part.selectNodeContents(root);part.setEnd(range.endContainer,range.endOffset);end=part.toString().length; }
    const displayed = root.textContent, original = textOf(model.html);
    const offset = model.type === 'heading' && original.endsWith(displayed) ? original.length - displayed.length : 0;
    if (end > start) result.push({id:model.id,start:start+offset,end:end+offset,html:model.html});
  }
  return result;
}
