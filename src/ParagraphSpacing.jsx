import React,{useState} from 'react';
export default function ParagraphSpacing({count,onApply}){
 const [line,setLine]=useState('1.4'),[gap,setGap]=useState('4');
 const valid=line!==''&&gap!==''&&Number(line)>=1&&Number(line)<=3&&Number(gap)>=0&&Number(gap)<=80;
 return <div className="text-size-control paragraph-spacing" aria-label="局部段落间距"><span>间距 · {count} 段</span><label>局部行距<input aria-label="局部行距" type="number" min="1" max="3" step="0.05" value={line} onChange={e=>setLine(e.target.value)}/><span>倍</span></label><label>局部段距<input aria-label="局部段距" type="number" min="0" max="80" step="1" value={gap} onChange={e=>setGap(e.target.value)}/><span>px</span></label><button disabled={!count||!valid} onClick={()=>onApply({lineHeight:Number(line),paragraphGap:Number(gap)})}>应用间距</button><button disabled={!count} onClick={()=>onApply({lineHeight:null,paragraphGap:null})}>恢复全文间距</button></div>;
}
