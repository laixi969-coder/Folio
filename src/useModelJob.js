import {useEffect,useRef,useState} from 'react';
export default function useModelJob(api,metadata={}) {
 const active=useRef(true),pending=useRef(false),[running,setRunning]=useState(false),[error,setError]=useState('');
 useEffect(()=>{active.current=true;return()=>{active.current=false}},[]);
 async function run(kind,body,extra={}){if(pending.current)return null;pending.current=true;setRunning(true);setError('');try{return await api('/connections/jobs',{method:'POST',body:JSON.stringify({kind,body,...metadata,...extra})})}catch(e){if(active.current)setError(e.message);return null}finally{pending.current=false;if(active.current)setRunning(false)}}
 return {run,running,error};
}
