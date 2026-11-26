import fs from "node:fs/promises";import path from "node:path";import {REGISTRIES,PURPOSE} from "./constants.js";
export const file=(...p)=>path.join(process.cwd(),...p);
export async function exists(p){try{await fs.access(p);return true}catch{return false}}
export async function read(p){return JSON.parse(await fs.readFile(p,"utf8"))}
export async function write(p,v){await fs.mkdir(path.dirname(p),{recursive:true});await fs.writeFile(p,JSON.stringify(v,null,2)+"\n")}
export async function init(){for(const d of ["CHAPTER_RECORDS","CHAPTERS","reports"])await fs.mkdir(file(d),{recursive:true});for(let i=0;i<REGISTRIES.length;i++){const p=file("CHAPTER_RECORDS",REGISTRIES[i]);if(!(await exists(p)))await write(p,{schemaVersion:1,registry:REGISTRIES[i],purpose:PURPOSE[i],entries:[]})}}
export async function registries(){const o={};for(const n of REGISTRIES){const p=file("CHAPTER_RECORDS",n);if(await exists(p))o[n]=await read(p)}return o}
export async function chapters(){const p=file("CHAPTERS");if(!(await exists(p)))return[];return(await fs.readdir(p)).filter(x=>/^CHAPTER_\d{4}\.json$/.test(x)).sort()}