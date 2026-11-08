// Deck (opening subtitle) typography. Six editorial layouts built from inline
// styles and presentation tables only, so the editor, preview and WeChat export
// all share one rendering path.
import {articleFont} from './article-fonts.js';
import {articlePalette} from './article-palettes.js';
import {headingSeriesStyles} from './heading-series.js';
import {escapeText} from './caption-type.js';

export const SUBTITLE_SERIES = [
  {id: 'eyebrow', name: '眉题竖线', description: '小字眉题、宋体题记与一道竖线'},
  {id: 'hanging', name: '悬挂引号', description: '大号引号起首，题记退后一行'},
  {id: 'broken', name: '断线题记', description: '上下断线收束，留白更从容'},
  {id: 'numbered', name: '序章编号', description: 'Georgia 大号 00 与题记并列'},
  {id: 'centered', name: '居中短题', description: '居中短线与大字距眉题'},
  {id: 'tinted', name: '浅笺题签', description: '浅色纸面承托，左沿强调色'},
  {id: 'accent-dot', name: '色点题记', description: '一枚色点引导，与色点章序成套'},
  {id: 'serif-slash', name: '宋体题记', description: '只有宋体与留白'},
  {id: 'full-rule', name: '通栏题记', description: '细线之后，居中题记'},
  {id: 'indent-block', name: '偏栏题记', description: '整段缩进 26px'},
  {id: 'framed-air', name: '带框题记', description: '细框与大留白'}
];
export const DEFAULT_SUBTITLE_SERIES = 'eyebrow';
export const normalizeSubtitleSeries = id => SUBTITLE_SERIES.some(s => s.id === id) ? id : DEFAULT_SUBTITLE_SERIES;

const hairline = (color, margin, width = '100%') =>
  `<p style="width:${width};height:1px;background:${color};font-size:0;line-height:0;letter-spacing:0;margin:${margin};max-width:none;">&nbsp;</p>`;
const broken = color =>
  `<table role="presentation" style="width:100%;border-collapse:collapse;table-layout:fixed;"><tr>` +
  `<td style="width:28%;border-top:1px solid ${color};font-size:0;line-height:0;">&nbsp;</td>` +
  `<td style="width:44%;font-size:0;line-height:0;">&nbsp;</td>` +
  `<td style="width:28%;border-top:1px solid ${color};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;

export function subtitleTypography(style = {}) {
  const p = articlePalette(style), base = headingSeriesStyles(style).subtitle;
  const size = Number(String(base.fontSize).replace('px', '')) || 15;
  const align = base.textAlign === 'center' ? 'center' : 'left';
  return {
    size, align, accent: p.accent, rule: p.rule, tint: p.tint, ink: p.ink,
    text: `margin:0;max-width:none;font-weight:400;font-family:${articleFont(style)||"'Songti SC','STSong','Noto Serif CJK SC',serif"};font-size:${size}px;line-height:1.9;letter-spacing:.6px;color:${p.ink};text-align:${align};`,
    inherited: [base.background && 'background:' + base.background, base.borderTop && 'border-top:' + base.borderTop].filter(Boolean).join(';')
  };
}

export function subtitleHTML(style = {}, text = '') {
  const value = String(text ?? '').trim();
  if (!value) return '';
  const s = subtitleTypography(style), id = normalizeSubtitleSeries(style.subtitleSeries);
  const center = id === 'centered' || id === 'full-rule', align = center ? 'center' : s.align;
  const main = `<p style="${s.text.replace(/text-align:[^;]+/, 'text-align:' + align)}">${escapeText(value)}</p>`;
  let body;

  if (id === 'accent-dot') {
    body = `<table role="presentation" style="border-collapse:collapse;"><tr><td style="width:7px;vertical-align:middle;padding:0 11px 0 0;"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${s.accent};font-size:0;line-height:0;">&nbsp;</span></td><td style="vertical-align:middle;">${main}</td></tr></table>`;
  } else if (id === 'serif-slash') {
    body = main;
  } else if (id === 'full-rule') {
    body = hairline(s.rule, '0 0 44px') + main;
  } else if (id === 'indent-block') {
    body = `<section style="padding-left:26px;">${main}</section>`;
  } else if (id === 'framed-air') {
    body = `<section style="border:1px solid ${s.rule};padding:32px 28px 34px;">${main}</section>`;
  } else if (id === 'eyebrow') {
    body = `<section style="padding:2px 0 2px 16px;border-left:3px solid ${s.accent};">${main}</section>` + hairline(s.rule, '18px 0 0');
  } else if (id === 'hanging') {
    body = `<table role="presentation" style="width:100%;border-collapse:collapse;"><tr>` +
      `<td style="width:1%;vertical-align:top;padding:0 14px 0 0;white-space:nowrap;font:58px/.75 Georgia,serif;color:${s.accent};">“</td>` +
      `<td style="vertical-align:top;">${main}</td></tr></table>` + hairline(s.accent, '18px 0 0', '26px');
  } else if (id === 'broken') {
    body = broken(s.rule) + `<section style="padding:21px 0 19px;">${main}</section>` + broken(s.rule);
  } else if (id === 'numbered') {
    body = `<table role="presentation" style="width:100%;border-collapse:collapse;"><tr>` +
      `<td style="width:1%;vertical-align:middle;padding:0 18px 0 0;white-space:nowrap;font:34px/.9 Georgia,serif;letter-spacing:-2px;color:${s.accent};">00</td>` +
      `<td style="vertical-align:middle;">${main}</td></tr></table>` + hairline(s.rule, '18px 0 0');
  } else if (center) {
    body = hairline(s.accent, '0 auto 17px', '26px') + main + hairline(s.accent, '17px auto 0', '26px');
  } else {
    body = `<section style="background:${s.tint};border:1px solid ${s.rule};border-left:3px solid ${s.accent};padding:20px 22px 21px;">${main}</section>`;
  }
  const inherited = s.inherited ? ';' + s.inherited + (s.inherited.includes('background') ? ';padding:16px 18px' : ';padding-top:16px') : '';
  return `<section class="folio-deck" data-deck="${id}" style="margin:0 0 28px;max-width:none;text-align:${center ? 'center' : s.align}${inherited}">${body}</section>`;
}
