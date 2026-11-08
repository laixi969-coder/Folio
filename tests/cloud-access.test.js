// @vitest-environment node
import {it,expect} from 'vitest';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

it('PocketBay 无需访问码，本地局域网仍需访问码',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'folio-access-'));
 async function check(env,port,expected){
  const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),FOLIO_HOST:'0.0.0.0',FOLIO_DATA_DIR:dir,...env},stdio:'pipe'});
  try{
   await new Promise((resolve,reject)=>{child.stdout.on('data',d=>{if(d.toString().includes('localhost'))resolve()});child.on('error',reject);child.on('exit',c=>reject(new Error('Server exited '+c)))});
   expect((await fetch(`http://127.0.0.1:${port}/api/articles`)).status).toBe(expected);
  }finally{child.kill();await new Promise(resolve=>child.once('exit',resolve))}
 }
 try{await check({POCKETBAY_DATA_DIR:dir},4291,200);await check({POCKETBAY_DATA_DIR:''},4292,401)}finally{fs.rmSync(dir,{recursive:true,force:true})}
},15000); // 两个真实服务进程并行启动，全套并发时 5s 默认超时偶发误报
