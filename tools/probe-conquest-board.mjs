#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D504 / LANE-019 Slice 1 real-menu browser probe.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, readFileSync, statSync } from "node:fs";

const __dirname=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(__dirname,"..");
const OUT=join(__dirname,"shots");
const ART=join(OUT,"probe-conquest-board.json");
const T0=Date.now();
mkdirSync(OUT,{recursive:true});
const cfg=JSON.parse(readFileSync(join(__dirname,"shots.json"),"utf8"));
const GL=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl","--disable-dev-shm-usage"];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function up(url){try{const r=await fetch(url,{method:"HEAD"});return r.ok||r.status===200;}catch{return false;}}

const result={ok:true,steps:[],errors:[],pageerrors:[],realErrors:[],screenshots:[]};
async function step(name,fn){
  try{const v=await fn();result.steps.push({name,ok:true,v:v===undefined?null:v});console.log("  OK "+name);}
  catch(e){result.ok=false;result.steps.push({name,ok:false,err:String(e&&e.message||e)});console.log("  FAIL "+name+" :: "+String(e&&e.message||e));}
}
function need(ok,msg){if(!ok)throw new Error(msg);}

const probe=`${cfg.baseUrl}/${cfg.file}`;
let srv=null,browser=null;
try{
  if(!(await up(probe))){srv=spawn("python3",["-m","http.server",String(cfg.port)],{cwd:ROOT,stdio:"ignore"});for(let i=0;i<80;i++){if(await up(probe))break;await sleep(150);}}
  try{browser=await chromium.launch({channel:"chrome",headless:true,args:GL});}
  catch(e){browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:GL});}
  const page=await browser.newPage({viewport:{width:1180,height:900}});
  page.setDefaultTimeout(8000);
  page.on("pageerror",e=>result.pageerrors.push(String(e&&e.message||e)));
  page.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource.*404/.test(m.text()))result.realErrors.push(m.text());});
  await page.goto(probe,{waitUntil:"domcontentloaded",timeout:60000}); await sleep(400);

  await step("registry normalizes to an immutable 36-row read-only value",async()=>page.evaluate(()=>{
    if(typeof conquestBoardNormalized!=="function"||typeof conquestBoardReady!=="function"||typeof conquestBoardOpen!=="function")throw new Error("board helpers missing");
    var p=conquestBoardNormalized(); if(!p||p.territories.length!==36||!conquestBoardReady())throw new Error("registry not ready");
    if(!Object.isFrozen(p)||!Object.isFrozen(p.territories)||!Object.isFrozen(p.territories[0]))throw new Error("normalized value not deeply frozen");
    if(p.enablement.status!=="read-only foundation; conquest play not yet enabled")throw new Error("status mismatch");
    return {territories:p.territories.length,status:p.enablement.status};
  }));

  await step("real H0 menu exposes exactly one named territory-board control",async()=>page.evaluate(()=>{
    G.campaign=null; openMainMenu();
    var b=document.querySelectorAll("#gnConquestBoard"); if(b.length!==1)throw new Error("entry count "+b.length);
    if(!/Conquest Territory Board/.test(b[0].textContent)||!/read-only/i.test(b[0].textContent))throw new Error("entry copy missing");
    return {entry:b.length,aria:b[0].getAttribute("aria-label")};
  }));

  await step("pointer activation opens complete 36-row list and schematic parity",async()=>{
    await page.evaluate(()=>document.getElementById("gnConquestBoard").dispatchEvent(new MouseEvent("click",{bubbles:true})));
    const v=await page.evaluate(()=>({list:document.querySelectorAll(".ct-row").length,schematic:document.querySelectorAll(".ct-node").length,listIds:Array.from(document.querySelectorAll("[data-ct-detail]"),e=>e.getAttribute("data-ct-detail")),schematicIds:Array.from(document.querySelectorAll("[data-ct-target]"),e=>e.getAttribute("data-ct-target"))}));
    need(v.list===36&&v.schematic===36,"36/36 parity failed");need(JSON.stringify(v.listIds)===JSON.stringify(v.schematicIds),"list/schematic ids differ");return v;
  });

  await step("headings, regions, names, anchors, uncertainty, provenance, and non-links are programmatic text",async()=>page.evaluate(()=>{
    var main=document.querySelector('main.ct-board[role="main"][aria-labelledby="ctBoardTitle"]'); if(!main)throw new Error("named main missing");
    if(document.querySelectorAll(".ct-board section[aria-labelledby]").length<3)throw new Error("named sections missing");
    if(document.querySelectorAll(".ct-prov").length!==36)throw new Error("provenance text count mismatch");
    if(document.querySelectorAll(".ct-detail h3").length!==36)throw new Error("non-link headings missing");
    var text=main.textContent||""; ["Exact source anchors","Uncertainty / caution","Explicit non-links and limits","[V] Verified","[I] Inferred","[D] Disputed"].forEach(x=>{if(text.indexOf(x)<0)throw new Error("missing "+x);});
    return {namedSections:document.querySelectorAll(".ct-board section[aria-labelledby]").length,nonLinkGroups:36};
  }));

  await step("schematic control opens and focuses the matching authoritative list detail",async()=>{
    await page.evaluate(()=>document.querySelector('[data-ct-target="CT-17"]').dispatchEvent(new MouseEvent("click",{bubbles:true})));
    const v=await page.evaluate(()=>{var d=document.querySelector('[data-ct-detail="CT-17"]');return{open:d.open,focus:document.activeElement&&document.activeElement.textContent};});
    need(v.open&&/CT-17/.test(v.focus||""),"CT-17 detail/focus mismatch");return v;
  });

  await step("no conquest start action, state form, or automatic motion exists",async()=>page.evaluate(()=>{
    var b=document.querySelector(".ct-board"),text=b.textContent||"";
    if(/start conquest|start campaign/i.test(text))throw new Error("start action present");
    if(b.querySelector("form,input,select,textarea"))throw new Error("state control present");
    var animated=Array.from(b.querySelectorAll("*")).filter(e=>{var s=getComputedStyle(e);return s.animationName!=="none"&&parseFloat(s.animationDuration)>0;});
    if(animated.length)throw new Error("automatic animation present");return{startActions:0,forms:0,animated:0};
  }));

  await page.evaluate(()=>document.getElementById("ctBoardTitle").scrollIntoView({block:"start"}));
  const desktopShot=join(OUT,"probe-conquest-board-desktop.png"); await page.screenshot({path:desktopShot,fullPage:false,timeout:30000}); result.screenshots.push(desktopShot);

  await step("close returns deterministic focus to the H0 entry",async()=>{
    await page.evaluate(()=>document.getElementById("ctBoardClose").click()); await page.waitForSelector("#gnConquestBoard"); await sleep(50);
    const id=await page.evaluate(()=>document.activeElement&&document.activeElement.id);need(id==="gnConquestBoard","focus returned to "+id);return{id};
  });

  await step("keyboard Enter opens and Escape closes with focus return",async()=>{
    await page.focus("#gnConquestBoard"); await page.keyboard.press("Enter"); await page.waitForSelector(".ct-board");
    let focused=await page.evaluate(()=>document.activeElement&&document.activeElement.id);need(focused==="ctBoardTitle","entry focus not on heading: "+focused);
    await page.keyboard.press("Escape"); await page.waitForSelector("#gnConquestBoard"); await sleep(50);
    focused=await page.evaluate(()=>document.activeElement&&document.activeElement.id);need(focused==="gnConquestBoard","Escape return focus "+focused);return{focus:focused};
  });

  await step("390px reflow has one-column schematic and no board overflow",async()=>{
    await page.setViewportSize({width:390,height:844}); await page.evaluate(()=>document.getElementById("gnConquestBoard").dispatchEvent(new MouseEvent("click",{bubbles:true}))); await page.waitForSelector(".ct-board");
    const v=await page.evaluate(()=>{var b=document.querySelector(".ct-board"),nodes=Array.from(document.querySelectorAll(".ct-node"));return{overflow:b.scrollWidth-b.clientWidth,first:nodes[0].getBoundingClientRect(),second:nodes[1].getBoundingClientRect()};});
    need(v.overflow<=1,"board horizontal overflow "+v.overflow);need(Math.abs(v.first.left-v.second.left)<2,"schematic not one-column at 390px");return{overflow:v.overflow};
  });
  const mobileShot=join(OUT,"probe-conquest-board-390.png");await page.screenshot({path:mobileShot,fullPage:false,timeout:30000});result.screenshots.push(mobileShot);

  await step("200 percent zoom preserves readable flexible content",async()=>{
    await page.setViewportSize({width:780,height:900});
    const v=await page.evaluate(()=>{document.documentElement.style.zoom="2";var b=document.querySelector(".ct-board"),h=document.querySelector("#ctBoardTitle");return{overflow:b.scrollWidth-b.clientWidth,font:parseFloat(getComputedStyle(h).fontSize),width:b.getBoundingClientRect().width};});
    need(v.overflow<=2,"zoom board overflow "+v.overflow);need(v.font>=24&&v.width>0,"zoom content unreadable");await page.evaluate(()=>document.documentElement.style.zoom="");return v;
  });

  await step("high-contrast mode uses black grounds and visible focus",async()=>page.evaluate(()=>{
    document.documentElement.setAttribute("data-a11y-contrast","high");
    var b=getComputedStyle(document.querySelector(".ct-board")),n=getComputedStyle(document.querySelector(".ct-node"));
    var css=document.getElementById("conquestBoardCss").textContent||"";
    if(!/rgb\(0, 0, 0\)/.test(b.backgroundColor)||!/rgb\(0, 0, 0\)/.test(n.backgroundColor))throw new Error("high contrast background not black");
    if(css.indexOf(":focus-visible")<0||css.indexOf("#ffe27a")<0)throw new Error("visible focus rule missing");
    document.documentElement.removeAttribute("data-a11y-contrast");return{board:b.backgroundColor,node:n.backgroundColor};
  }));

  await step("reduced-motion compatibility keeps all board motion disabled",async()=>{
    await page.emulateMedia({reducedMotion:"reduce"});
    const v=await page.evaluate(()=>{var bad=Array.from(document.querySelectorAll(".ct-board *")).filter(e=>{var s=getComputedStyle(e);return(s.animationName!=="none"&&parseFloat(s.animationDuration)>0)||parseFloat(s.transitionDuration)>0;});return{moving:bad.length};});
    need(v.moving===0,"motion remains under reduce: "+v.moving);await page.emulateMedia({reducedMotion:"no-preference"});return v;
  });

  await page.keyboard.press("Escape"); await page.waitForSelector("#gnConquestBoard");
  await step("FAIL CLOSED: absent, malformed, disabled, and helper-absent variants leave zero entry trace",async()=>page.evaluate(()=>{
    var original=GAME_DATA["conquest-territories"],norm=conquestBoardNormalized,ready=conquestBoardReady,open=conquestBoardOpen;
    function trace(label){openMainMenu();var body=document.body.innerText||"",entry=!!document.querySelector("#gnConquestBoard"),text=/Conquest Territory Board/.test(body),surface=!!document.querySelector("#conquestBoardCss,.ct-board");if(entry||text||surface)throw new Error(label+" leaked entry trace entry="+entry+" text="+text+" surface="+surface);}
    try{
      delete GAME_DATA["conquest-territories"];trace("absent data");
      GAME_DATA["conquest-territories"]={schema:"bad"};trace("malformed data");
      var disabled=JSON.parse(JSON.stringify(original));delete disabled.enablement;GAME_DATA["conquest-territories"]=disabled;trace("missing enablement");
      GAME_DATA["conquest-territories"]=original;conquestBoardNormalized=null;conquestBoardReady=null;conquestBoardOpen=null;trace("helper absence");
    } finally {GAME_DATA["conquest-territories"]=original;conquestBoardNormalized=norm;conquestBoardReady=ready;conquestBoardOpen=open;openMainMenu();}
    return{variants:4,trace:0};
  }));

  result.ok=result.ok&&result.pageerrors.length===0&&result.realErrors.length===0;
}catch(e){result.ok=false;result.errors.push("FATAL "+String(e&&e.message||e));}
finally{
  writeFileSync(ART,JSON.stringify(result,null,2)+"\n");
  if(browser)await Promise.race([browser.close(),sleep(5000)]);if(srv)srv.kill();
}

const failed=result.steps.filter(s=>!s.ok);
console.log(`probe-conquest-board: ${result.steps.length-failed.length}/${result.steps.length} steps ok, ${failed.length} fail, pageerrors=${result.pageerrors.length}, realErrors=${result.realErrors.length}`);
for(const f of failed)console.error("FAIL",f.name,"-",f.err);
if(!result.ok||failed.length||result.pageerrors.length||result.realErrors.length)process.exit(1);
console.log("ALL OK");
try{
  if(statSync(ART).mtimeMs<T0-2000)throw new Error("artifact not fresh");
  const j=JSON.parse(readFileSync(ART,"utf8"));
  if(j.ok!==true||j.steps.some(s=>s.ok===false)||(j.pageerrors||[]).length||(j.realErrors||[]).length)throw new Error("artifact not green");
}catch(e){console.error("probe-conquest-board: TEETH FAIL - "+e.message);process.exit(1);}
process.exit(0);
