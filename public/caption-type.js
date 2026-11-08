// Caption typography: four distinct sizes, derived from the article's body size.
// Used by the editor, the reading preview and the inline-style export alike.
import {articleFont} from './article-fonts.js';
import {articlePalette} from './article-palettes.js';

export const escapeText = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

export function mixHex(a, b, t) {
  const channel = (hex, i) => parseInt(hex.slice(i, i + 2), 16);
  return '#' + [1, 3, 5].map(i => Math.round(channel(a, i) * (1 - t) + channel(b, i) * t).toString(16).padStart(2, '0')).join('');
}

function mix(a, b, t) {
  const channel = (hex, i) => parseInt(hex.slice(i, i + 2), 16);
  return '#' + [1, 3, 5].map(i => Math.round(channel(a, i) * (1 - t) + channel(b, i) * t).toString(16).padStart(2, '0')).join('');
}

export function captionTypography(style = {}) {
  const body = Number(style.fontSize) || 16;
  return {
    note: Math.max(11, body - 4),      // source, credit, swipe hint
    item: Math.max(13, body - 2),      // caption under a single picture
    group: Math.max(14, body),         // caption for a whole picture group
    feature: Math.max(20, body + 8),   // full-bleed statement caption
    kicker: 10                        // running label above a feature caption
  };
}

// "说明 ｜ 来源或补充" splits into a lead line and a smaller credit line.
// A caption without a separator keeps its original text untouched.
export function captionHTML(style, text, kind = 'item') {
  const raw = String(text ?? '').trim();
  if (!raw) return '';
  const p = articlePalette(style), t = captionTypography(style);
  const [lead, ...more] = raw.split(/\s*(?:\||｜|\n)\s*/).filter(Boolean);
  const credit = more.join(' · ');
  const soft = mix(p.muted, p.paper, 0.38);
  const reset = 'max-width:none;font-weight:400;';
  const leadLine = escapeText(lead);
  const mono = "font-family:"+(articleFont(style)||"ui-monospace,SFMono-Regular,Menlo,Consolas,monospace")+";";
  const creditLine = credit ? `<p style="margin:6px 0 0;${reset}${mono}font-size:${t.note}px;line-height:1.7;letter-spacing:.06em;color:${kind === 'feature' ? p.onAccent : soft};">${escapeText(credit)}</p>` : '';

  if (kind === 'feature') {
    return `<section style="padding:23px 21px 26px;background:${p.accent};color:${p.onAccent};margin:0;">` +
      `<p style="margin:0 0 12px;${reset}font-family:Georgia,serif;font-size:${t.kicker}px;line-height:1.6;letter-spacing:2.4px;color:${p.onAccent};">CAPTION / 图注</p>` +
      `<p style="margin:0;${reset}font-family:${articleFont(style)||"'Songti SC','STSong',serif"};font-size:${t.feature}px;line-height:1.55;letter-spacing:.5px;color:${p.onAccent};">${leadLine}</p>` +
      creditLine + `</section>`;
  }
  if (kind === 'group') {
    return `<section style="margin:18px 0 0;">` +
      `<p style="width:26px;height:2px;background:${p.accent};font-size:0;line-height:0;margin:0 0 13px;max-width:none;">&nbsp;</p>` +
      `<p style="margin:0;${reset}font-family:${articleFont(style)||"'Songti SC','STSong',serif"};font-size:${t.group}px;font-weight:600;line-height:1.75;letter-spacing:.5px;color:${p.ink};">${leadLine}</p>` +
      creditLine + `</section>`;
  }
  if (kind === 'note') {
    return `<p style="margin:8px 0 0;${reset}${mono}font-size:${t.note}px;line-height:1.7;letter-spacing:.06em;color:${soft};">${leadLine}</p>`;
  }
  return `<section style="margin:10px 0 0;padding:1px 0 1px 11px;border-left:2px solid ${p.accent};">` +
    `<p style="margin:0;${reset}font-size:${t.item}px;line-height:1.7;letter-spacing:.2px;color:${p.muted};">${leadLine}</p>` +
    creditLine + `</section>`;
}
