import {ARTICLE_FONTS} from '../public/article-fonts.js';
import { safeSrc, textOf, embeddedImageSources } from './model';
// WeChat never receives rasterized text: exports stay editable; bundled fonts may fall back to system fonts on reader devices.

// Media URLs are immutable; only new image sources need loading on a later check.
const imageReaders=new WeakMap();
async function cachedImage(src,fetchImage,readImage){
 let readers=imageReaders.get(fetchImage);if(!readers){readers=new WeakMap();imageReaders.set(fetchImage,readers)}
 let cache=readers.get(readImage);if(!cache){cache={items:new Map(),bytes:0};readers.set(readImage,cache)}
 const local=/^\/media\/[a-zA-Z0-9-]+\.(png|jpeg|webp|gif)$/.test(src);
 if(local&&cache.items.has(src))return cache.items.get(src);
 const response=await fetchImage(src);if(!response.ok)throw Error('unavailable');
 const blob=await response.blob();if(!/^image\/(png|jpeg|webp|gif)$/i.test(blob.type))throw Error('invalid image');
 const result={data:await readImage(blob),size:blob.size,type:blob.type};
 if(local){while(cache.bytes+result.data.length>32*1024*1024&&cache.items.size){const key=cache.items.keys().next().value;cache.bytes-=cache.items.get(key).data.length;cache.items.delete(key)}if(result.data.length<=32*1024*1024){cache.items.set(src,result);cache.bytes+=result.data.length}}
 return result;
}

export async function prepareExport(article, fetchImage = fetch, readImage) {
  const assets = {}, issues = [];
  if (article.style?.fontFamily === 'custom' && article.style?.customFont) issues.push({level:'warning',message:'使用了自定义字体，微信或读者设备可能回退到其他字体，请真机核对。'});
  if (!article.blocks.some(b => b.type === 'images' ? b.images?.length : b.html && (textOf(b.html).trim() || embeddedImageSources(b.html).length))) {
    issues.push({ level: 'blocking', message: '正文为空，请先添加内容。' });
  }
  const webFonts=ARTICLE_FONTS.filter(f=>f.file&&(article.style?.fontFamily===f.id||article.blocks.some(b=>b.html?.includes(f.face))));
  if(webFonts.length)issues.push({level:'warning',message:`使用了内置字体（${webFonts.map(f=>f.name).join('、')}）。复制与同步保留可编辑图文，公众号不携带字体文件，读者设备可能回退为系统字体。`});
  let group = 0;
  for (const block of article.blocks) {
    if (block.type !== 'images' && !embeddedImageSources(block.html).length) continue;
    group++;
    if (block.layout === 'horizontal') issues.push({ level: 'warning', blockId: block.id, message: `第 ${group} 组图片：公众号正文会从横向滑动改为纵向排列。` });
    if (block.ratio && block.ratio !== 'original') issues.push({ level: 'warning', blockId: block.id, message: `第 ${group} 组图片：已输出裁切样式，公众号是否保留需粘贴后检查。` });
    for (const [index, image] of (block.type === 'images' ? (block.images || []) : embeddedImageSources(block.html).map(src=>({src}))).entries()) {
      const label = `第 ${group} 组第 ${index + 1} 张图片`;
      if (image.width > 0 && image.width < 300) issues.push({level:'warning',blockId:block.id,message:`${label}原图宽度只有 ${image.width}px，放大后可能模糊，请检查清晰度。`});
      try {
        if (!safeSrc(image.src)) throw new Error('invalid source');
        if (!assets[image.src]) {
          const imageData=await cachedImage(image.src,fetchImage,readImage);
          assets[image.src]=imageData.data;
          if (imageData.size > (imageData.type === 'image/gif' ? 8 : 5) * 1024 * 1024) issues.push({ level: 'warning', blockId: block.id, message: `${label}体积较大，粘贴后请检查是否正常显示。` });
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
