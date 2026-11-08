// Font names are restricted before they enter an inline style in exported HTML.
export const ARTICLE_FONTS = [
  {id:'default', name:'版式默认'},
  {id:'sans', name:'黑体', family:"'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',sans-serif"},
  {id:'serif', name:'宋体', family:"'Songti SC','STSong','SimSun','Noto Serif CJK SC',serif"},
  {id:'kai', name:'楷体', family:"'Kaiti SC','STKaiti','KaiTi',serif"},
  {id:'noto-sans-sc', name:'Noto 黑体', face:'Noto Sans SC', family:"'Noto Sans SC','Noto Sans CJK SC','PingFang SC','Microsoft YaHei',sans-serif", file:'/fonts/noto-sans-sc/font.ttf', license:'/fonts/noto-sans-sc/OFL.txt', source:'https://github.com/google/fonts/tree/main/ofl/notosanssc', usage:'清晰耐读，适合正文、说明与信息密集文章。'},
  {id:'noto-serif-sc', name:'Noto 宋体', face:'Noto Serif SC', family:"'Noto Serif SC','Noto Serif CJK SC','Songti SC','SimSun',serif", file:'/fonts/noto-serif-sc/font.ttf', license:'/fonts/noto-serif-sc/OFL.txt', source:'https://github.com/google/fonts/tree/main/ofl/notoserifsc', usage:'书刊气质，适合人文长文、章题与引用。'},
  {id:'lxgw-wenkai', name:'霞鹜文楷', face:'LXGW WenKai', family:"'LXGW WenKai','Kaiti SC','STKaiti','KaiTi',serif", file:'/fonts/lxgw-wenkai/font.ttf', license:'/fonts/lxgw-wenkai/OFL.txt', source:'https://github.com/lxgw/LxgwWenKai', usage:'自然舒展，适合随笔、故事与温和的长文。'},
  {id:'smiley-sans', name:'得意黑', face:'Smiley Sans', family:"'Smiley Sans','Smiley Sans Oblique','Noto Sans SC','PingFang SC',sans-serif", file:'/fonts/smiley-sans/font.woff2', license:'/fonts/smiley-sans/OFL.txt', source:'https://github.com/atelier-anchor/smiley-sans', usage:'窄斜、有表现力，建议用于章题或短句，不建议整篇长文。'},
  {id:'zcool-xiaowei', name:'站酷小薇', face:'ZCOOL XiaoWei', family:"'ZCOOL XiaoWei','Songti SC','STSong',serif", file:'/fonts/zcool-xiaowei/font.ttf', license:'/fonts/zcool-xiaowei/OFL.txt', source:'https://github.com/google/fonts/tree/main/ofl/zcoolxiaowei', usage:'字形温润，适合标题、题记与短篇故事。'},
  {id:'custom', name:'自定义字体'}
];
export const DEFAULT_FONT_FAMILY = "-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif";
export function normalizeFontId(id){return ARTICLE_FONTS.some(font=>font.id===id)?id:'default'}
export function normalizeCustomFont(value){return typeof value==='string' && /^[\p{L}\p{N} _.-]{1,80}$/u.test(value.trim()) ? value.trim() : ''}
export function articleFont(style={}){
  const id=normalizeFontId(style.fontFamily);
  if(id==='custom'){
    const name=normalizeCustomFont(style.customFont);
    return name ? `'${name}',${DEFAULT_FONT_FAMILY}` : '';
  }
  return ARTICLE_FONTS.find(font=>font.id===id)?.family || '';
}

// Only plain font-family names and generic families are allowed in article HTML.
export function safeFontFamily(value){
  if(typeof value!=='string'||value.length>500)return '';
  const names=value.split(',').map(part=>part.trim());
  if(!names.length||names.length>10)return '';
  for(const item of names){
    const name=(item.startsWith("'")&&item.endsWith("'"))||(item.startsWith('"')&&item.endsWith('"'))?item.slice(1,-1):item;
    if(!normalizeCustomFont(name)||name!==name.trim())return '';
  }
  return value;
}
