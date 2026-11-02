// Original editorial combinations inspired by Chinese traditional colour relationships.
// These values are curated for screen reading, not a transcription of the Figma colour library.
export const ARTICLE_PALETTES=[
 {id:'celadon',name:'青瓷 · 纸白',accent:'#426B64',paper:'#FAF8F2',tint:'#E9EEEA',ink:'#282D2A',muted:'#66716B',rule:'#CFD8D1',onAccent:'#FFFFFF'},
 {id:'cinnabar',name:'宫墙 · 米纸',accent:'#93443B',paper:'#FBF7F0',tint:'#F1E5DC',ink:'#302927',muted:'#786962',rule:'#DFCEC3',onAccent:'#FFFFFF'},
 {id:'indigo',name:'黛蓝 · 月白',accent:'#384E69',paper:'#F8F9F7',tint:'#E8EDF0',ink:'#282E35',muted:'#67717B',rule:'#CFD7DE',onAccent:'#FFFFFF'},
 {id:'ochre',name:'秋香 · 绢素',accent:'#786337',paper:'#FCF9F1',tint:'#EEE8D6',ink:'#302E26',muted:'#756E5A',rule:'#DBD2BC',onAccent:'#FFFFFF'},
 {id:'plum',name:'藕荷 · 素笺',accent:'#76566B',paper:'#FCF9F8',tint:'#F0E8EC',ink:'#322B30',muted:'#786A74',rule:'#DDD0D8',onAccent:'#FFFFFF'},
 {id:'ink',name:'墨色 · 留白',accent:'#353A38',paper:'#FFFFFF',tint:'#F2F3F1',ink:'#282B29',muted:'#6C716D',rule:'#D9DDD8',onAccent:'#FFFFFF'},
 {id:'teal',name:'松烟 · 青绿',accent:'#32635D',paper:'#F8FAF7',tint:'#E4EEE9',ink:'#25332F',muted:'#60736B',rule:'#CADAD1',onAccent:'#FFFFFF'},
 {id:'rust',name:'赭石 · 暖白',accent:'#92523D',paper:'#FCF8F2',tint:'#F3E7DB',ink:'#332B27',muted:'#7A685F',rule:'#E2D0C2',onAccent:'#FFFFFF'},
 {id:'slate',name:'黛石 · 雾白',accent:'#4A5D70',paper:'#F8FAFB',tint:'#E6EDF1',ink:'#29323A',muted:'#647580',rule:'#CFDCE2',onAccent:'#FFFFFF'},
 {id:'olive',name:'苔绿 · 细绢',accent:'#586440',paper:'#FAFAF3',tint:'#EAEEDA',ink:'#303528',muted:'#70775F',rule:'#D6DDC5',onAccent:'#FFFFFF'},
 {id:'berry',name:'绛紫 · 香灰',accent:'#795366',paper:'#FCF9FA',tint:'#F2E6EB',ink:'#352B31',muted:'#796A72',rule:'#DFD0D7',onAccent:'#FFFFFF'},
{id:'sea-salt',name:'海盐 · 冰川蓝',accent:'#3E7384',paper:'#F7FBFB',tint:'#E4F0F1',ink:'#25343A',muted:'#657A7E',rule:'#C9DEDF',onAccent:'#FFFFFF'},
{id:'mist-purple',name:'雾紫 · 月光白',accent:'#756581',paper:'#FBF9FC',tint:'#EEE8F1',ink:'#302B34',muted:'#786F7B',rule:'#DDD3E0',onAccent:'#FFFFFF'},
{id:'rose',name:'玫瑰 · 奶油白',accent:'#A65D68',paper:'#FFFAF7',tint:'#F6E8E7',ink:'#3A2D2E',muted:'#8B7374',rule:'#E8D1CE',onAccent:'#FFFFFF'},
{id:'cocoa',name:'可可 · 燕麦',accent:'#795A49',paper:'#FBF8F1',tint:'#EEE7DA',ink:'#322C27',muted:'#7C7166',rule:'#DCCFC0',onAccent:'#FFFFFF'},
{id:'amber',name:'琥珀 · 暖砂',accent:'#9B6B31',paper:'#FFFAF1',tint:'#F4E9D3',ink:'#392F24',muted:'#897865',rule:'#E6D3B3',onAccent:'#FFFFFF'},
{id:'forest',name:'森林 · 云白',accent:'#41684C',paper:'#F8FBF7',tint:'#E6EFE4',ink:'#29352B',muted:'#6C7D6E',rule:'#CEDFCD',onAccent:'#FFFFFF'},
{id:'deep-sea',name:'夜海 · 银雾',accent:'#275A6E',paper:'#F6FAFC',tint:'#DFEDF1',ink:'#26343B',muted:'#617884',rule:'#C6DAE2',onAccent:'#FFFFFF'},
{id:'raspberry',name:'莓果 · 雪白',accent:'#8A405A',paper:'#FFF9FA',tint:'#F5E6EA',ink:'#382A30',muted:'#806B73',rule:'#E6CDD6',onAccent:'#FFFFFF'},
{id:'terracotta',name:'陶土 · 杏白',accent:'#A65E46',paper:'#FFF9F2',tint:'#F6E6DA',ink:'#3A2B25',muted:'#897167',rule:'#EACFC0',onAccent:'#FFFFFF'},
{id:'charcoal-gold',name:'炭金 · 象牙',accent:'#806E4A',paper:'#FCFAF3',tint:'#EFEBDF',ink:'#302F2A',muted:'#78766A',rule:'#DDD8C8',onAccent:'#FFFFFF'},
{id:'sage',name:'鼠尾草 · 雾米',accent:'#6C806B',paper:'#FAFAF5',tint:'#E9EEE5',ink:'#303830',muted:'#788277',rule:'#D5DED2',onAccent:'#FFFFFF'},
{id:'pomegranate',name:'石榴 · 绢白',accent:'#984A42',paper:'#FFF9F6',tint:'#F5E7E2',ink:'#382C2A',muted:'#846F6A',rule:'#E8D0CA',onAccent:'#FFFFFF'}
];
export const NEW_PALETTE_IDS=['sea-salt','mist-purple','rose','cocoa','amber','forest','deep-sea','raspberry','terracotta','charcoal-gold','sage','pomegranate'];
export const DEFAULT_PALETTE='celadon';
export function articlePalette(s={}){
 const p=ARTICLE_PALETTES.find(p=>p.id===s.paletteId)||ARTICLE_PALETTES[0];
 // Old brand-blue defaults were never an editorial palette. Keep other user-chosen colours.
 const accent=/^#[0-9a-f]{6}$/i.test(s.accent||'')&&!(s.paletteId===undefined&&s.accent.toLowerCase()==='#1749d2')?s.accent:p.accent;
 return {...p,accent};
}
export function applyArticlePalette(s,id){const p=ARTICLE_PALETTES.find(p=>p.id===id)||ARTICLE_PALETTES[0];return {...s,preset:'magazine',paletteId:p.id,accent:p.accent};}

export function randomArticlePalette(style,random=Math.random){const current=articlePalette(style).id,options=ARTICLE_PALETTES.filter(p=>p.id!==current);return options[Math.min(options.length-1,Math.max(0,Math.floor(random()*options.length)))].id;}
