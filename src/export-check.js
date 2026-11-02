import { safeSrc, textOf } from './model';

export async function prepareExport(article, fetchImage = fetch, readImage) {
  const assets = {}, issues = [];
  if (!article.blocks.some(b => b.type === 'images' ? b.images?.length : b.html && textOf(b.html).trim())) {
    issues.push({ level: 'blocking', message: '正文为空，请先添加内容。' });
  }
  let group = 0;
  for (const block of article.blocks) {
    if (block.type !== 'images') continue;
    group++;
    if (block.layout === 'horizontal') issues.push({ level: 'warning', blockId: block.id, message: `第 ${group} 组图片：公众号正文会从横向滑动改为纵向排列。` });
    if (block.ratio && block.ratio !== 'original') issues.push({ level: 'warning', blockId: block.id, message: `第 ${group} 组图片：已输出裁切样式，公众号是否保留需粘贴后检查。` });
    for (const [index, image] of (block.images || []).entries()) {
      const label = `第 ${group} 组第 ${index + 1} 张图片`;
      try {
        if (!safeSrc(image.src)) throw new Error('invalid source');
        if (!assets[image.src]) {
          const response = await fetchImage(image.src);
          if (!response.ok) throw new Error('unavailable');
          const blob = await response.blob();
          if (!/^image\/(png|jpeg|webp|gif)$/i.test(blob.type)) throw new Error('invalid image');
          assets[image.src] = await readImage(blob);
          if (blob.size > (blob.type === 'image/gif' ? 8 : 5) * 1024 * 1024) issues.push({ level: 'warning', blockId: block.id, message: `${label}体积较大，粘贴后请检查是否正常显示。` });
        }
      } catch {
        issues.push({ level: 'blocking', blockId: block.id, message: `${label}无法读取，请重新上传。` });
      }
    }
  }
  return { assets, issues };
}

export async function copyRichText(html, plainText) {
  if (navigator.clipboard?.write && globalThis.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plainText], { type: 'text/plain' }) })]);
      return;
    } catch { /* Try the copy event when browser permissions reject Clipboard API. */ }
  }
  let copied = false;
  const onCopy = event => {
    if (!event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData('text/html', html);
    event.clipboardData.setData('text/plain', plainText);
    copied = true;
  };
  document.addEventListener('copy', onCopy);
  try {
    if (!document.execCommand?.('copy') || !copied) throw new Error('复制未成功，请下载兼容 HTML，打开后手动复制正文。');
  } finally { document.removeEventListener('copy', onCopy); }
}
