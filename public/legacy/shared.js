const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
/* Brand identity: keep the same Reelhouse mark on every legacy page. */
(()=>{if(!document.querySelector('link[rel~="icon"]')){const l=document.createElement('link');l.rel='icon';l.type='image/svg+xml';l.href='/reelhouse-mark.svg';document.head.append(l)}})();
const ICO={back:'<path d="m15 5-7 7 7 7"/>',bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 8H4c0-1 2-2 2-8z"/><path d="M10 21a2 2 0 0 0 4 0"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 11 7.6-4M8.2 13l7.6 4"/>',check:'<path d="m5 12 5 5 9-10"/>',dice:'<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>'};
const svg=n=>`<svg class="ic" viewBox="0 0 24 24">${ICO[n]}</svg>`,esc=s=>String(s??'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
const SQ=[['What do you love watching?','m',[['Action',28],['Comedy',35],['Drama',18],['Horror',27],['Romance',10749],['Sci-Fi',878],['Thriller',53],['Animation',16]],'genres'],['Pick a mood for tonight','s',['Laugh out loud','Edge of my seat','Heartwarming','Mind-bending','Chill'],'mood'],['How long should a movie be?','s',['Under 90 min','About 2 hours','Any length'],'len'],['Which era do you prefer?','s',['Brand new','2010s','Classics','All eras'],'era'],['Where are your favourites from?','m',['Hollywood','Nollywood','Bollywood','Korea','Anime'],'origin'],['When do you usually watch?','s',['Weeknights','Weekends','Late night','Commutes'],'when'],['Who do you watch with?','s',['Just me','Partner','Friends','Family'],'who'],['How do you find movies?','s',['Trending lists','Friends','Trailers','Actors I follow'],'find'],['How often should we notify you?','s',['Only releases','Daily picks','Weekly digest','Never'],'notif'],['How much do you watch weekly?','s',['1-2 titles','3-5 titles','6+ titles'],'freq']];
const RH={
 G:[[28,'Action'],[35,'Comedy'],[18,'Drama'],[27,'Horror'],[878,'Sci-Fi'],[10749,'Romance'],[53,'Thriller'],[16,'Animation'],[80,'Crime'],[14,'Fantasy'],[12,'Adventure'],[99,'Documentary']],
 get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},
 set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}},
 S:()=>({haptics:true,cine:true,theme:'system',autoplay:true,adult:false,saver:false,alerts:true,push:false,lang:'en-US',region:'US',...RH.get('rh_set',{})}),
 key:()=>window.parent.RH_TMDB_API_KEY||localStorage.getItem('rh_tmdb'),
 user:()=>RH.get('rh_session',null),
 guard(){if(!RH.user())location.replace('index.html')},
 async api(p,q=''){const s=RH.S(),u=new URL('/api/tmdb',location.origin);u.searchParams.set('path',p);u.searchParams.set('language',s.lang);u.searchParams.set('include_adult',s.adult);if(/upcoming|now_playing/.test(p))u.searchParams.set('region',s.region);if(q){const x=new URLSearchParams(q.replace(/^&/,''));x.forEach((v,k)=>u.searchParams.set(k,v))}const r=await fetch(u);if(!r.ok){let m='Could not reach TMDB. Check your connection.';try{const d=await r.json();if(d.error)m=d.error;if(d.details)m+=' '+d.details}catch{}throw new Error(m)}return r.json()},
 img:(p,s='w342')=>p?`https://image.tmdb.org/t/p/${RH.S().saver&&s=='w342'?'w185':s}${p}`:'',
 card:m=>`<a class="card" href="player.html?id=${m.id}">${m.poster_path?`<img loading="lazy" src="${RH.img(m.poster_path)}" alt="">`:'<div class="ph"></div>'}<p>${esc(m.title)}</p></a>`,
 row:(t,a)=>a&&a.length?`<h2>${t}</h2><div class="row">${a.map(RH.card).join('')}</div>`:'',
 sk:n=>Array(n).fill('<div class="card"><div class="sk" style="aspect-ratio:2/3"></div></div>').join(''),
 err:m=>`<div class="state"><b>Something went wrong</b>${esc(m)}<br><br><button class="btn p" onclick="location.reload()">Try again</button></div>`,
 toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2200)},
 push(k,m,max=40){const a=RH.get(k,[]).filter(x=>x.id!==m.id);a.unshift({id:m.id,title:m.title,poster_path:m.poster_path,genres:(m.genres||[]).map(g=>g.id??g),runtime:m.runtime||0});RH.set(k,a.slice(0,max))},
 hdr(t,right=''){document.body.dataset.back=1;document.body.classList.add('nn');document.body.insertAdjacentHTML('afterbegin',`<header class="hd"><button class="ib" onclick="RH.back()" aria-label="Back">${svg('back')}</button><b>${t}</b><span style="flex:1"></span>${right}</header>`)},
 bellBtn:()=>`<a class="ib" href="notifs.html" aria-label="Notifications">${svg('bell')}<span class="bd"></span></a>`,
 nav(i){const I={0:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',1:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',2:'<path d="M6 3h12v18l-6-4-6 4z"/>',3:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'},L=[['home','Home'],['search','Search'],['library','Library'],['me','Me']];
  document.body.insertAdjacentHTML('beforeend','<nav class="nav">'+L.map((l,n)=>`<a href="${l[0]}.html" class="${n==i?'on':''}"><svg viewBox="0 0 24 24">${I[n]}</svg>${l[1]}</a>`).join('')+'</nav>');RH.badge();RH.check();RH.survey();RH.inbox();RH.cine()},
 back(){document.body.classList.add('out');setTimeout(()=>history.length>1?history.back():location.replace('home.html'),230)},
 /* notifications + reminders */
 banner(t,b,href){const d=document.createElement('a');d.className='ban';d.href=href;d.innerHTML=`<i>${svg('bell')}</i><div><b>${esc(t)}</b><span>${esc(b)}</span></div>`;document.body.append(d);setTimeout(()=>d.classList.add('in'),30);setTimeout(()=>{d.classList.remove('in');setTimeout(()=>d.remove(),400)},4500)},
 notify(t,b,href='notifs.html'){const a=RH.get('rh_notifs',[]);a.unshift({id:Date.now()+Math.random(),t,b,href,ts:Date.now(),r:0});RH.set('rh_notifs',a.slice(0,60));const s=RH.S();RH.vib([20,50,20]);if(s.alerts)RH.banner(t,b,href);if(s.push&&window.Notification&&Notification.permission==='granted')try{new Notification(t,{body:b})}catch{}if(RH.isNativeApp&&RH.isNativeApp()&&window.Android?.notify)try{window.Android.notify(String(t),String(b))}catch{}RH.badge()},
 badge(){const n=RH.get('rh_notifs',[]).filter(x=>!x.r).length;$$('.bd').forEach(e=>{e.textContent=n>9?'9+':n;e.style.display=n?'grid':'none'})},
 rem:()=>RH.get('rh_rem',{}),
 toggleRem(m){const r=RH.rem();if(r[m.id]){delete r[m.id];RH.set('rh_rem',r);RH.toast('Reminder removed');return false}
  r[m.id]={id:m.id,title:m.title,poster_path:m.poster_path,release_date:m.release_date};RH.set('rh_rem',r);RH.notify('Reminder set',m.title+' - we will alert you on release day.','library.html?t=rem');
  if(RH.S().push&&window.Notification&&Notification.permission==='default')Notification.requestPermission();return true},
 check(){const r=RH.rem(),dn=RH.get('rh_rdone',{}),now=Date.now();for(const id in r){const m=r[id],t=new Date(m.release_date+'T00:00:00').getTime();
  if(now>=t&&!dn[id+'a']){dn[id+'a']=1;RH.notify(m.title+' is out now','Released - tap to watch the trailer.','player.html?id='+id)}
  else if(t>now&&t-now<864e5&&!dn[id+'b']){dn[id+'b']=1;RH.notify(m.title+' arrives tomorrow','Get your popcorn ready.','player.html?id='+id)}}RH.set('rh_rdone',dn)},
 /* smart survey after 10s */
 survey(){if(RH.get('rh_svy',0))return;const t0=+sessionStorage.rh_t0||(sessionStorage.rh_t0=Date.now());setTimeout(RH.ask,Math.max(0,1e4-(Date.now()-t0)))},
 ask(){if($('.mod')||RH.get('rh_svy',0))return;let i=0;const A={},m=document.createElement('div');m.className='mod';document.body.append(m);
  const draw=()=>{const[q,t,o,k]=SQ[i],s=A[k]??(t=='m'?[]:null);m.innerHTML=`<div class="sh2"><div class="pb"><i style="width:${(i+1)/SQ.length*100}%"></i></div><small>Quick survey - ${i+1} of ${SQ.length}</small><h1>${q}</h1><div class="ops">${o.map(x=>{const[l,v]=Array.isArray(x)?x:[x,x];return`<button class="op${(t=='m'?s.includes(v):s===v)?' on':''}" data-v="${v}">${l}</button>`}).join('')}</div><button class="btn p" id="nx" style="width:100%;margin-top:16px">${i==SQ.length-1?'Finish':'Next'}</button><button class="lk" id="sk">Skip for now</button></div>`};
  const done=()=>{const mood={'Laugh out loud':35,'Edge of my seat':53,'Heartwarming':10749,'Mind-bending':878}[A.mood];A.genres=[...new Set([...(A.genres||[]),...(mood?[mood]:[])])];RH.set('rh_pref',A);RH.set('rh_svy',1);
   const n=((RH.user()||{}).name||'there').split(' ')[0];m.innerHTML=`<div class="sh2" style="text-align:center"><div style="font-size:54px">&#127916;</div><h1>Welcome to Reelhouse, ${esc(n)}!</h1><p style="color:var(--mut);line-height:1.5;margin-bottom:18px">Thanks for sharing your taste. Your home feed is now tuned to you, and we will tell you when your picks are about to premiere.</p><button class="btn p" id="ok" style="width:100%">Start exploring</button></div>`;RH.notify('Welcome to Reelhouse','Your feed is personalised. Tap the bell on any coming-soon title to get reminders.')};
  m.onclick=e=>{const o=e.target.closest('.op'),[,t,,k]=SQ[i];if(o){const v=isNaN(+o.dataset.v)?o.dataset.v:+o.dataset.v;if(t=='m'){const a=A[k]||(A[k]=[]);a.includes(v)?a.splice(a.indexOf(v),1):a.push(v)}else A[k]=v;draw()}
   else if(e.target.id=='nx'){if(!A[k]||!A[k].length)return RH.toast('Pick an option or skip');i<SQ.length-1?(i++,draw()):done()}
   else if(e.target.id=='sk'){RH.set('rh_svy',2);m.remove()}
   else if(e.target.id=='ok'){m.remove();if(/home/.test(location.pathname))location.reload()}};draw()}
};

/* ===== v3: haptics, social, share, downloads, progress, cinematic ===== */
const DEMO=[{id:'d1',name:'Ada Okoro',av:'🦋',fb:1,g:[18,10749,35]},{id:'d2',name:'Tunde Bello',av:'🎧',fb:1,g:[28,53,878]},{id:'d3',name:'Chioma Nwosu',av:'🍿',fb:0,g:[35,10749,16]},{id:'d4',name:'Sam Carter',av:'🎸',fb:1,g:[27,53,80]},{id:'d5',name:'Lena Park',av:'🌙',fb:0,g:[18,878,14]},{id:'d6',name:'Kemi Adeyemi',av:'🔥',fb:1,g:[28,12,35]}];
const AVS=['🎬','🍿','🦋','🎧','🎸','🌙','🔥','🦁','🚀','👑','🌍','⚡'];
Object.assign(RH,{
 vib(p=10){if(RH.S().haptics===false)return;try{if(RH.isNativeApp&&RH.isNativeApp()&&window.Android?.vibrate){const ms=Array.isArray(p)?Math.max(...p.map(Number)):Number(p)||10;window.Android.vibrate(Math.min(500,Math.max(1,ms)));}else navigator.vibrate&&navigator.vibrate(p)}catch{}},
 me:()=>(RH.user()||{}).email||'guest',
 prof(){return{bio:'',av:'🎬',...RH.get('rh_prof_'+RH.me(),{})}},
 setProf(p){RH.set('rh_prof_'+RH.me(),{...RH.prof(),...p})},
 people(){const me=RH.me(),u=RH.get('rh_users',{});return[...Object.entries(u).filter(([e])=>e!==me).map(([e,x])=>({id:'u:'+e,email:e,name:x.name||e.split('@')[0],av:'👤',fb:0,g:[]})),...DEMO]},
 friends:()=>RH.get('rh_friends',{}),
 followers(){return RH.people().filter(p=>p.fb)},
 follow(p){const f=RH.friends();if(f[p.id]){delete f[p.id];RH.set('rh_friends',f);return false}f[p.id]=p;RH.set('rh_friends',f);RH.vib([10,30,10]);return true},
 match(p){const P=(RH.get('rh_pref',{}).genres||[]);if(!P.length||!(p.g||[]).length)return null;return Math.round(p.g.filter(g=>P.includes(g)).length/new Set([...P,...p.g]).size*100+35)},
 mini:m=>({id:m.id,title:m.title,poster_path:m.poster_path,runtime:m.runtime||0,genres:(m.genres||[]).map(g=>g.id||g)}),
 /* share to friends */
 shareSheet(m){const f=Object.values(RH.friends()),sel=new Set(),el=document.createElement('div');el.className='mod';document.body.append(el);RH.vib(12);
  const draw=()=>{el.innerHTML=`<div class="sh2"><h1>Share "${esc(m.title)}"</h1>${f.length?`<div class="fl">${f.map(p=>`<button class="fr${sel.has(p.id)?' on':''}" data-id="${p.id}"><i>${p.av||'👤'}</i><span>${esc(p.name)}</span><em>${sel.has(p.id)?'✓':''}</em></button>`).join('')}</div><input class="in" id="sm" placeholder="Add a message (optional)" style="margin:12px 0"><button class="btn p" id="go" style="width:100%" ${sel.size?'':'disabled'}>Send${sel.size?' to '+sel.size:''}</button>`:'<div class="state" style="padding:20px 0"><b>No friends yet</b>Follow people from your profile and they will show up here.<br><br><a class="btn p" href="me.html">Find people</a></div>'}<button class="lk" id="mo">More share options</button><button class="lk" id="cx">Close</button></div>`};
  el.onclick=async e=>{const t=e.target,r=t.closest('.fr');if(t===el||t.id=='cx')return el.remove();
   if(r){sel.has(r.dataset.id)?sel.delete(r.dataset.id):sel.add(r.dataset.id);RH.vib(8);const k=$('#sm',el)?.value;draw();if(k)$('#sm',el).value=k}
   else if(t.id=='mo'){const u=location.origin+location.pathname.replace(/[^/]*$/,'')+'player.html?id='+m.id;try{navigator.share?await navigator.share({title:m.title,text:'Watch '+m.title+' on Reelhouse',url:u}):(await navigator.clipboard.writeText(u),RH.toast('Link copied'))}catch{}}
   else if(t.id=='go'&&sel.size){const box=RH.get('rh_inbox',{}),from=(RH.user()||{}).name||'A friend',msg=$('#sm',el).value.trim();let n=0;
    sel.forEach(id=>{const p=f.find(x=>x.id==id);if(p&&p.email){(box[p.email]=box[p.email]||[]).push({from,m:RH.mini(m),msg,ts:Date.now()})}n++});
    RH.set('rh_inbox',box);RH.set('rh_sent',RH.get('rh_sent',0)+n);RH.vib([15,40,15,40,30]);el.remove();RH.toast('Shared with '+n+(n>1?' friends':' friend'))}};draw()},
 inbox(){const box=RH.get('rh_inbox',{}),mine=box[RH.me()];if(!mine||!mine.length)return;delete box[RH.me()];RH.set('rh_inbox',box);
  mine.forEach(x=>RH.notify(x.from+' shared a movie with you',x.m.title+(x.msg?' - "'+x.msg+'"':''),'player.html?id='+x.m.id))},
 /* progress + downloads */
 prog:id=>RH.get('rh_prog',{})[id]||{p:0},
 setProg(m,p){const a=RH.get('rh_prog',{});a[m.id]={p:Math.min(100,Math.max(0,Math.round(p))),t:a[m.id]?.t||0,d:a[m.id]?.d||0};RH.set('rh_prog',a);
  if(p>=100&&!RH.get('rh_seen',[]).some(x=>x.id===m.id))RH.push('rh_seen',m,500)},
 pct(id){const s=RH.get('rh_seen',[]).some(x=>x.id==id);return s?100:(RH.prog(id).p||0)},
 dl:()=>RH.get('rh_dl',{}),
 async download(m,btn){
  if(!RH.isNativeApp()){RH.toast('Offline downloads are available in the Android app.');return}
  const direct=m.authorized_media_url||m.download_url||m.file_url;
  if(!direct||!window.Android?.downloadAuthorized){
    RH.toast('This title does not have an authorized offline source yet.');return
  }
  if(!Android.downloadAuthorized(String(direct),String(m.title||'Reelhouse'))){
    RH.toast('Offline download could not be started.');return
  }
  const x=RH.dl();x[m.id]={...RH.mini(m),ts:Date.now(),mb:0};RH.set('rh_dl',x);
  RH.vib([20,60,20]);RH.toast('Download started');RH.notify('Download started',m.title+' is downloading on this device.','library.html?t=rh_dl');
},
/* cinematic coming-soon pop-up */
 cine(){const s=RH.S();if(s.cine===false||!RH.get('rh_svy',0)||sessionStorage.rh_cine)return;const t0=+sessionStorage.rh_t0||(sessionStorage.rh_t0=Date.now());
  const P=RH.cinePick().catch(()=>null);setTimeout(async()=>{if(sessionStorage.rh_cine||$('.mod'))return;const m=await P;if(m)RH.cinePlay(m)},Math.max(0,1e4-(Date.now()-t0)))},
 async cinePick(){const P=RH.get('rh_pref',{}),today=new Date().toISOString().slice(0,10),seen=RH.get('rh_cine',[]);
  let r=(await RH.api('/discover/movie','&sort_by=popularity.desc&primary_release_date.gte='+today+(P.genres&&P.genres.length?'&with_genres='+P.genres.join('|'):''))).results;
  if(!r.length)r=(await RH.api('/movie/upcoming','&page=1')).results.filter(m=>m.release_date>=today);
  for(const m of r.filter(m=>!seen.includes(m.id)&&(m.backdrop_path||m.poster_path)).slice(0,6)){const d=await RH.api('/movie/'+m.id,'&append_to_response=videos'),v=(d.videos.results||[]).find(x=>x.site==='YouTube'&&x.type==='Trailer');if(v)return{...d,tk:v.key}}return null},
 cinePlay(m){sessionStorage.rh_cine=1;RH.set('rh_cine',[m.id,...RH.get('rh_cine',[])].slice(0,30));
  const g=document.createElement('div');g.className='glass';document.body.append(g);RH.vib([30,80,30]);g.offsetWidth;g.classList.add('on');
  const pulse=setInterval(()=>RH.vib(10),450);
  setTimeout(()=>{clearInterval(pulse);RH.vib([40,70,40,70,120]);const c=document.createElement('div');c.className='cine';
   const on=!!RH.rem()[m.id],d=m.release_date?new Date(m.release_date+'T00:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}):'Soon';
   c.innerHTML=`<div class="cc"><small>COMING SOON - PICKED FOR YOU</small><h1>${esc(m.title)}</h1><p>${esc(d)}${m.genres&&m.genres.length?' | '+esc(m.genres.slice(0,2).map(x=>x.name).join(', ')):''}</p><div class="cv"></div><button class="btn p" id="ca" style="width:100%">${on?'Alert is on':'Set alert'}</button><a class="btn" href="soon.html?id=${m.id}" style="width:100%;margin-top:8px;color:#fff;border-color:rgba(255,255,255,.4)">Full details</a><button class="lk" id="cd" style="color:#cfe0ff">Dismiss</button></div>`;
   document.body.append(c);c.offsetWidth;c.classList.add('on');const cp=RH.Player($('.cv',c),{yt:m.tk,auto:1,mute:1});
   const close=()=>{cp.destroy();c.classList.remove('on');g.classList.remove('on');setTimeout(()=>{c.remove();g.remove()},600)};
   c.onclick=e=>{if(e.target.id=='cd'||e.target===c){RH.vib(10);close()}else if(e.target.id=='ca'){const x=RH.toggleRem(m);e.target.textContent=x?'Alert is on':'Set alert';RH.vib(x?[15,40,15]:8)}}},2800)}
});

// Browser/app boundary: downloads and app-only features are hidden on the website.
RH.isNativeApp=()=>/ReelhouseAndroid\\//i.test(navigator.userAgent);
RH.appDownloadUrl='https://github.com/kryonara-NG/R2/releases/latest/download/reelhouse.apk';
RH.appPrompt=()=>{
  if(RH.isNativeApp()||RH.get('rh_app_prompt_done',0)||RH.get('rh_app_prompt_dismissed',0))return;
  const started=Number(sessionStorage.rh_site_started||Date.now());sessionStorage.rh_site_started=started;
  const wait=Math.max(0,180000-(Date.now()-started));
  setTimeout(()=>{
    if(RH.isNativeApp()||RH.get('rh_app_prompt_done',0)||RH.get('rh_app_prompt_dismissed',0)||$('.mod'))return;
    const m=document.createElement('div');m.className='mod';m.innerHTML='<div class="sh2"><div style="font-size:38px">📱</div><h1>Get Reelhouse on Android</h1><p style="color:var(--mut);line-height:1.5">Download the native Android app for downloads, offline viewing, haptics, notifications and a smoother mobile experience.</p><a class="btn p" href="'+RH.appDownloadUrl+'" style="width:100%;text-align:center">Download Android app</a><button class="lk" id="appLater">Not now</button></div>';document.body.append(m);
    m.onclick=e=>{if(e.target===m||e.target.id==='appLater'){RH.set('rh_app_prompt_dismissed',1);m.remove()}else if(e.target.closest('a')){RH.set('rh_app_prompt_done',1)}};
  },wait);
};
RH.interestGenres=()=>{
  const score={};const add=(gs,w)=>{(gs||[]).forEach(g=>{const id=Number(g);if(Number.isFinite(id))score[id]=(score[id]||0)+w})};
  const p=RH.get('rh_pref',{});add(p.genres,5);
  RH.get('rh_seen',[]).forEach(m=>add(m.genres,6));
  RH.get('rh_list',[]).forEach(m=>add(m.genres,4));
  RH.get('rh_hist',[]).forEach(m=>add(m.genres,5));
  Object.values(RH.friends?RH.friends():{}).forEach(x=>add(x.g,1));
  return Object.entries(score).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id])=>id);
};
RH.recommendationQuery=()=>{const gs=RH.interestGenres();return gs.length?'&with_genres='+gs.join('|'):''};
RH.appPrompt();
document.addEventListener('click',e=>{if(e.target.closest('button,.btn,.chip,.nav a,.op,.ib,.bell,.fr,.sw'))RH.vib(8)},true);
addEventListener('storage',e=>{if(e.key=='rh_inbox')RH.inbox()});
addEventListener('rhshake',()=>{if(RH.S().shake!==false&&typeof RH.surprise==='function')RH.surprise()});
(()=>{const s=RH.S();if(s.theme!='system')document.documentElement.dataset.theme=s.theme;
let x0=null,y0=0;addEventListener('touchstart',e=>{const t=e.touches[0];x0=t.clientX<28?t.clientX:null;y0=t.clientY},{passive:true});
addEventListener('touchend',e=>{if(x0===null||!document.body.dataset.back)return;const t=e.changedTouches[0];if(t.clientX-x0>80&&Math.abs(t.clientY-y0)<60)RH.back();x0=null},{passive:true});
addEventListener('DOMContentLoaded',RH.badge)})();

/* ===== v4: previews, tenure badges, series, full-page social ===== */
Object.assign(RH,{
 S:()=>({haptics:true,cine:true,theme:'system',autoplay:true,adult:false,saver:false,alerts:true,push:false,lang:'en-US',region:'US',preview:true,psound:false,...RH.get('rh_set',{})}),
 isTv:m=>m.mt=='tv'||m.media_type=='tv'||(!m.title&&!!m.name),
 href:m=>(RH.isTv(m)?'series':'player')+'.html?id='+m.id,
 card:m=>{const tv=RH.isTv(m);return `<a class="card" data-id="${m.id}" data-mt="${tv?'tv':'movie'}" href="${RH.href(m)}">${m.poster_path?`<img loading="lazy" src="${RH.img(m.poster_path)}" alt="">`:'<div class="ph"></div>'}${tv?'<em class="rb tvb">SERIES</em>':''}<p>${esc(m.title||m.name)}</p></a>`},
 rank:(m,k)=>RH.card(m).replace('</a>',`<em class="rb">${k}</em></a>`),
 mini:m=>({id:m.id,title:m.title||m.name,poster_path:m.poster_path,runtime:m.runtime||(m.episode_run_time||[])[0]||0,genres:(m.genres||[]).map(g=>g.id||g),mt:RH.isTv(m)?'tv':'movie'}),
 push(k,m,max=40){const a=RH.get(k,[]).filter(x=>x.id!==m.id);a.unshift(RH.mini(m));RH.set(k,a.slice(0,max))},
 shareSheet(m){sessionStorage.rh_sharing=JSON.stringify(RH.mini(m));location.href='share.html'},
 inbox(){const box=RH.get('rh_inbox',{}),mine=box[RH.me()];if(!mine||!mine.length)return;delete box[RH.me()];RH.set('rh_inbox',box);
  mine.forEach(x=>RH.notify(x.from+' shared a '+(x.m.mt=='tv'?'series':'movie')+' with you',x.m.title+(x.msg?' - "'+x.msg+'"':''),RH.href(x.m)))},
 /* tenure badges */
 joined(){const k='rh_join_'+RH.me();let t=RH.get(k,0);if(!t){t=Date.now();RH.set(k,t)}return t},
 days(){const q=+new URLSearchParams(location.search).get('age');return q>0?q:Math.floor((Date.now()-RH.joined())/864e5)},
 TN:[[365,'1 year','👑'],[180,'6 months','💎'],[60,'2 months','🥇'],[30,'1 month','🥈'],[0,'New','🌱']],
 tag(d){const t=RH.TN.find(x=>d>=x[0]);return `<em class="tn">${t[2]} ${t[1]}</em>`},
 visit(){const a=RH.get('rh_days',[]),t=new Date().toISOString().slice(0,10);if(!a.includes(t)){a.push(t);RH.set('rh_days',a.slice(-400))}},
 streak(){const a=new Set(RH.get('rh_days',[]));let n=0,d=new Date();while(a.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}return n},
 confetti(){const c=document.createElement('div');c.className='cf';const C=['#ff6a1a','#fff','#16120e','#ffb27a'];for(let i=0;i<46;i++){const s=document.createElement('span');s.style.cssText=`left:${Math.random()*100}%;background:${C[i%4]};animation-delay:${Math.random()*.5}s;--x:${(Math.random()-.5)*160}px`;c.append(s)}document.body.append(c);setTimeout(()=>c.remove(),2600)},
 /* hover / press preview: 10s, muted unless enabled in Settings */
 pv:{c:{},n:0,t:0,el:null,held:0},
 async pvKey(mt,id){const k=mt+id;if(k in RH.pv.c)return RH.pv.c[k];try{const d=await RH.api(`/${mt}/${id}/videos`),r=d.results||[],v=r.find(x=>x.site==='YouTube'&&x.type==='Trailer')||r.find(x=>x.site==='YouTube');return RH.pv.c[k]=v?v.key:null}catch{return RH.pv.c[k]=null}},
 pvStop(){RH.pv.n++;clearTimeout(RH.pv.t);if(RH.pv.el)RH.pv.el.remove();RH.pv.el=null},
 async pvStart(c){RH.pvStop();const n=RH.pv.n,key=await RH.pvKey(c.dataset.mt,c.dataset.id);if(!key||n!==RH.pv.n)return;const s=RH.S(),st=10+Math.floor(Math.random()*50),o=document.createElement('div');o.className='pv';
  o.innerHTML=`<iframe src="https://www.youtube.com/embed/${key}?autoplay=1&mute=${s.psound?0:1}&controls=0&playsinline=1&start=${st}&end=${st+10}&modestbranding=1&rel=0" allow="autoplay;encrypted-media"></iframe><span class="pt">${s.psound?'Sound on':'Preview'}</span>`;
  c.append(o);RH.pv.el=o;RH.vib(8);RH.pv.t=setTimeout(RH.pvStop,10500)}
});
(()=>{let h=0,tx=0,ty=0;const cd=e=>e.target.closest&&e.target.closest('.card[data-id]');
 document.addEventListener('mouseover',e=>{if(!matchMedia('(hover:hover)').matches||!RH.S().preview)return;const c=cd(e);if(!c||c.contains(e.relatedTarget))return;clearTimeout(h);h=setTimeout(()=>RH.pvStart(c),600)});
 document.addEventListener('mouseout',e=>{const c=cd(e);if(!c||c.contains(e.relatedTarget))return;clearTimeout(h);RH.pvStop()});
 document.addEventListener('touchstart',e=>{if(!RH.S().preview)return;const c=cd(e);if(!c)return;tx=e.touches[0].clientX;ty=e.touches[0].clientY;clearTimeout(h);h=setTimeout(()=>{RH.pv.held=Date.now();RH.pvStart(c)},450)},{passive:true});
 document.addEventListener('touchmove',e=>{const t=e.touches[0];if(Math.abs(t.clientX-tx)>8||Math.abs(t.clientY-ty)>8){clearTimeout(h);RH.pvStop()}},{passive:true});
 document.addEventListener('touchend',()=>{clearTimeout(h);RH.pvStop()},{passive:true});
 document.addEventListener('contextmenu',e=>{if(cd(e))e.preventDefault()});
 document.addEventListener('click',e=>{if(RH.pv.held&&Date.now()-RH.pv.held<900&&cd(e)){e.preventDefault();e.stopPropagation()}},true);
 const _n=RH.nav;RH.nav=function(i){_n.call(RH,i);RH.visit()}})();

/* ===== v5: native player (YouTube chrome hidden, own controls) ===== */
RH.fmt=s=>{s=Math.max(0,Math.floor(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=String(s%60).padStart(2,0);return h?h+':'+String(m).padStart(2,0)+':'+x:m+':'+x};
RH.Player=function(box,o={}){
 const K=+RH.S().skip||10,I={play:'<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',pause:'<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>',b:'<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><text x="8.2" y="15.6" font-size="7" fill="currentColor" stroke="none" font-weight="700">'+K+'</text>',f:'<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/><text x="8.2" y="15.6" font-size="7" fill="currentColor" stroke="none" font-weight="700">'+K+'</text>',vol:'<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6"/>',mute:'<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="m17 9 4 6M21 9l-4 6"/>',fs:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',re:'<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>'},
 ic=n=>`<svg viewBox="0 0 24 24" class="ic">${I[n]}</svg>`;
 box.classList.add('np');box.classList.toggle('yt',!!o.yt);
 box.innerHTML=`<div class="npm"></div><div class="npt"></div><div class="npc on"><div class="npa"><button data-a="b" aria-label="Back 10 seconds">${ic('b')}</button><button data-a="p" class="big" aria-label="Play or pause"></button><button data-a="f" aria-label="Forward 10 seconds">${ic('f')}</button></div><div class="npr"><button data-a="t" class="sp">Sleep</button><button data-a="s" class="sp">1x</button><button data-a="m"></button></div><div class="npb"><span class="t1">0:00</span><input type="range" min="0" max="1000" value="0" aria-label="Seek"><span class="t2">0:00</span><button data-a="z" aria-label="Fullscreen">${ic('fs')}</button></div><i class="nfl l"></i><i class="nfl r"></i></div>`;
 const m=$('.npm',box),c=$('.npc',box),rg=$('input',box),pb=$('[data-a=p]',box),mb=$('[data-a=m]',box);let A={},ready=0,sp0=0,slt=0,st,drag=0,tm,ended=0,ps=[1,1.25,1.5,2,.75],pi=0,muted=!!o.mute,dead=0;
 const R=()=>{try{return A.ok&&A.ok()}catch{return 0}};
 if(o.iframe){
  const fr=document.createElement('iframe');
  fr.src=o.iframe;
  fr.allow='autoplay; fullscreen; picture-in-picture; encrypted-media';
  fr.allowFullscreen=true;
  fr.referrerPolicy='origin';
  m.append(fr);
  ready=1;
  let vsTime=0,vsDuration=0,vsPlaying=false,vsInfo={};
  const vsSrc=()=>{
   const u=new URL(o.iframe,location.href);
   if(vsTime>0)u.searchParams.set('startAt',String(Math.max(0,vsTime)));
   return u.toString();
  };
  const reloadVs=t=>{
   vsTime=Math.max(0,Number(t)||0);
   const fr=$('iframe',box);
   if(fr)fr.src=vsSrc();
   ended=0;
   show();
  };
  const onMessage=e=>{
   if(e.origin!=='https://vidsrc.sh'||!e.data||e.data.type!=='PLAYER_EVENT'||!e.data.data)return;
   const d=e.data.data,info=d.player_info||{},status=d.player_status,progress=d.player_progress,duration=d.player_duration;
   vsInfo=info;
   if(typeof progress==='number')vsTime=Math.max(0,progress);
   if(typeof duration==='number'&&duration>0)vsDuration=duration;
   vsPlaying=status==='playing';
   if(typeof o.onVidSrcEvent==='function')o.onVidSrcEvent(info,status,progress,duration);
   if(status==='completed')ended=1;
   ui();
  };
  // Keep the cross-origin listener scoped to this player instance so reopening
  // the player does not stack duplicate progress/event handlers.
  addEventListener('message',onMessage);
  A={
   ok:()=>1,
   play:()=>{},
   pause:()=>{},
   seek:t=>reloadVs(t),
   cur:()=>vsTime,
   dur:()=>vsDuration,
   mute:x=>{},
   rate:r=>{},
   playing:()=>vsPlaying
  };
  box.classList.add('vidsrc-iframe');
  box.dataset.playerSource='vidsrc';
 }else if(o.yt){const load=()=>new Promise(r=>{if(window.YT&&YT.Player)return r();const p=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{p&&p();r()};if(!document.getElementById('yta')){const s=document.createElement('script');s.id='yta';s.src='https://www.youtube.com/iframe_api';document.head.append(s)}});
  let y;A={ok:()=>y&&y.playVideo&&ready,play:()=>{ended=0;y.playVideo()},pause:()=>y.pauseVideo(),seek:t=>y.seekTo(t,true),cur:()=>y.getCurrentTime(),dur:()=>y.getDuration(),mute:x=>x?y.mute():y.unMute(),rate:r=>y.setPlaybackRate(r),playing:()=>y.getPlayerState()==1||y.getPlayerState()==3};
  load().then(()=>{if(dead)return;const d=document.createElement('div');m.append(d);y=new YT.Player(d,{videoId:o.yt,playerVars:{controls:0,disablekb:1,modestbranding:1,rel:0,iv_load_policy:3,fs:0,playsinline:1,autoplay:o.auto?1:0,mute:o.mute?1:0,cc_load_policy:0,origin:location.origin},events:{onReady:()=>{ready=1;if(o.start)y.seekTo(o.start,true);if(o.mute)y.mute()},onStateChange:e=>{if(e.data===0){y.seekTo(0,true);y.pauseVideo();ended=1;o.onEnd&&o.onEnd();ui()}}}})})}
 else{const v=document.createElement('video');v.playsInline=true;v.preload='metadata';v.src=o.src;v.muted=muted;if(o.auto)v.autoplay=true;m.append(v);ready=1;
  v.onloadedmetadata=()=>{if(o.start)v.currentTime=o.start};v.onended=()=>{ended=1;o.onEnd&&o.onEnd();ui()};v.onerror=()=>RH.toast('This video could not be loaded');
  A={ok:()=>1,play:()=>{ended=0;v.play()},pause:()=>v.pause(),seek:t=>v.currentTime=t,cur:()=>v.currentTime,dur:()=>v.duration||0,mute:x=>v.muted=x,rate:r=>v.playbackRate=r,playing:()=>!v.paused&&!v.ended}}
 const show=()=>{c.classList.add('on');clearTimeout(tm);tm=setTimeout(()=>{if(R()&&A.playing())c.classList.remove('on')},3200)};
 function ui(){if(!R())return;const cu=A.cur(),du=A.dur(),pl=A.playing(),vs=box.classList.contains('vidsrc-iframe');pb.innerHTML=ic(ended?'re':pl?'pause':'play');mb.innerHTML=ic(muted?'mute':'vol');if(vs){pb.innerHTML=ic('play');mb.innerHTML=ic('vol');$('.sp[data-a=s]',box).textContent='Native';$('.sp[data-a=t]',box).textContent='Player controls'}if(!drag){rg.value=du?cu/du*1000:0;rg.style.setProperty('--p',(du?cu/du*100:0)+'%')}$('.t1',box).textContent=RH.fmt(cu);$('.t2',box).textContent=RH.fmt(du);if(!pl&&!ended)c.classList.add('on')}
 const iv=setInterval(()=>{if(!document.body.contains(box)){clearInterval(iv);return}if(!R())return;if(!sp0){sp0=1;const sv=+RH.S().speed||1;if(sv!=1){A.rate(sv);pi=Math.max(0,ps.indexOf(sv));$('.sp[data-a=s]',box).textContent=sv+'x'}}ui();o.onTime&&A.playing()&&o.onTime(A.cur(),A.dur())},300);
 const skip=n=>{if(!R())return;const next=Math.min(Math.max(0,A.cur()+n),A.dur()||1e9);A.seek(next);RH.vib(8);const f=$('.nfl.'+(n>0?'r':'l'),box);f.textContent=(n>0?'+':'-')+Math.abs(n)+'s';f.classList.remove('go');f.offsetWidth;f.classList.add('go');ui()};
 const fs=()=>{const on=box.classList.toggle('fs');document.documentElement.style.overflow=on?'hidden':'';try{if(on){(box.requestFullscreen||box.webkitRequestFullscreen||(()=>0)).call(box);screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}else{document.fullscreenElement&&document.exitFullscreen();screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock()}}catch{}};
 const onFullscreenChange=()=>{if(!document.fullscreenElement&&box.classList.contains('fs')&&dead===0&&document.body.contains(box)){box.classList.remove('fs');document.documentElement.style.overflow=''}};
 document.addEventListener('fullscreenchange',onFullscreenChange);
 const act=a=>{if(!R())return;if(a=='p')A.playing()?A.pause():(ended&&A.seek(0),A.play());else if(a=='b')skip(-K);else if(a=='f')skip(K);else if(a=='t'){slt=(slt+1)%4;clearTimeout(st);const mm=[0,15,30,60][slt];$('[data-a=t]',box).textContent=mm?mm+'m':'Sleep';if(mm){RH.toast('Sleep timer: '+mm+' min');st=setTimeout(()=>{A.pause();RH.toast('Sleep timer: paused')},mm*6e4)}}else if(a=='m'){muted=!muted;A.mute(muted)}else if(a=='s'){pi=(pi+1)%ps.length;A.rate(ps[pi]);$('.sp',box).textContent=ps[pi]+'x'}else if(a=='z')fs();RH.vib(8);setTimeout(ui,60);show()};
 let lt=0,ls=0;c.addEventListener('click',e=>{const b=e.target.closest('button');if(b)return act(b.dataset.a);if(e.target.closest('input'))return;const r=box.getBoundingClientRect(),x=e.clientX-r.left,sd=x<r.width/3?-1:x>r.width*2/3?1:0,n=Date.now();
  if(n-lt<320&&sd&&sd==ls){skip(sd*K);lt=0}else{c.classList.contains('on')&&R()&&A.playing()?c.classList.remove('on'):show();lt=n;ls=sd}});
 rg.addEventListener('input',()=>{drag=1;clearTimeout(tm);const d=R()?A.dur():0;$('.t1',box).textContent=RH.fmt(rg.value/1000*d);rg.style.setProperty('--p',rg.value/10+'%')});
 rg.addEventListener('change',()=>{if(R()){A.seek(rg.value/1000*A.dur());ended=0}drag=0;show()});
 pb.innerHTML=ic('play');mb.innerHTML=ic(muted?'mute':'vol');show();
 return{destroy(){
  dead=1;
  clearTimeout(st);
  clearInterval(iv);
  if(o.iframe&&typeof onMessage==='function')removeEventListener('message',onMessage);
  removeEventListener('fullscreenchange',onFullscreenChange);
  box.classList.remove('np','yt','fs');
  document.documentElement.style.overflow='';
  box.innerHTML='';
},play:()=>R()&&A.play(),pause:()=>R()&&A.pause(),seek:t=>R()&&A.seek(t),A};
};

/* ===== Licensed stream adapter =====
   Configure RH.S().streamApi to an endpoint you control or are licensed to use.
   Expected response: {sources:[{url,format,resolution}], hls:[...]} or {url:"..."}.
   The app deliberately does not hard-code third-party movie-host extraction. ===== */
RH.stream=async function(m,opts={}){
 const base=(RH.S().streamApi||'').trim();
 if(!base) return null;
 const q=new URLSearchParams({tmdb_id:String(m.id),title:m.title||'',type:m.media_type||'movie',season:String(opts.season||''),episode:String(opts.episode||'')});
 const r=await fetch(base.replace(/\/$/,'')+'/stream?'+q.toString(),{headers:{Accept:'application/json'}});
 if(!r.ok) throw new Error('Streaming service returned '+r.status);
 const d=await r.json();
 const sources=Array.isArray(d.sources)?d.sources:[];
 const first=sources.find(x=>x&&x.url)||d.url||(Array.isArray(d.hls)&&d.hls.find(Boolean));
 return first?(typeof first==='string'?{url:first}:first):null;
};

/* ===== v7: settings + extras ===== */
Object.assign(RH,{
 S:()=>{const s={haptics:true,cine:true,theme:'system',autoplay:true,adult:false,saver:false,alerts:true,push:false,lang:'en-US',region:'US',preview:true,psound:false,accent:'#ff6a1a',tsize:'100',rmotion:false,speed:'1',skip:'10',qs:'off',qe:'off',motd:true,kids:false,shake:true,svc:'',streamApi:'',autonext:true,spoil:true,...RH.get('rh_set',{})};if(s.kids)s.adult=false;return s},
 skin(){const s=RH.S(),d=document.documentElement;d.style.setProperty('--o',s.accent);d.style.zoom=s.tsize=='100'?'':(+s.tsize/100);
  if(s.theme=='system')delete d.dataset.theme;else d.dataset.theme=s.theme=='amoled'?'dark':s.theme;
  d.classList.toggle('amoled',s.theme=='amoled');d.classList.toggle('rm',!!s.rmotion)},
 async surprise(){if(!RH.key())return;const P=RH.get('rh_pref',{}),pg=1+Math.floor(Math.random()*5);RH.toast('Picking something for you...');RH.vib([15,40,15]);
  try{const d=await RH.api('/discover/movie','&sort_by=vote_average.desc&vote_count.gte=1500&vote_average.gte=6.8&page='+pg+(P.genres&&P.genres.length&&Math.random()<.7?'&with_genres='+P.genres.join('|'):'')),seen=new Set(RH.get('rh_seen',[]).map(x=>x.id)),r=d.results.filter(m=>!seen.has(m.id)),m=(r.length?r:d.results)[Math.floor(Math.random()*(r.length||d.results.length))];
   RH.confetti();setTimeout(()=>location.href=RH.href(m),900)}catch(e){RH.toast(e.message)}},
 motd(){const s=RH.S(),t=new Date().toISOString().slice(0,10);if(!s.motd||!RH.key()||RH.get('rh_motd','')==t)return;RH.set('rh_motd',t);
  RH.api('/trending/movie/day').then(d=>{const m=d.results[new Date().getDate()%d.results.length];RH.notify('Movie of the day',m.title+' - tap to see it',RH.href(m))}).catch(()=>{})}
});
(()=>{const _n=RH.notify;RH.notify=function(...a){const s=RH.S();if(s.qs!='off'&&s.qe!='off'){const h=new Date().getHours(),x=+s.qs,y=+s.qe;if(x<y?(h>=x&&h<y):(h>=x||h<y)){const sb=RH.banner,sv=RH.vib;RH.banner=()=>{};RH.vib=()=>{};try{return _n.apply(RH,a)}finally{RH.banner=sb;RH.vib=sv}}}return _n.apply(RH,a)};
 const _a=RH.api;RH.api=function(p,q=''){if(RH.S().kids&&/^\/discover/.test(p))q+='&without_genres=27,53,80,10752&certification_country=US&certification.lte=PG-13';return _a.call(RH,p,q)};
 const _v=RH.visit;RH.visit=function(){_v.call(RH);RH.motd()};
 let last=0,ask=0;addEventListener('devicemotion',e=>{const a=e.accelerationIncludingGravity;if(!a||!RH.S().shake)return;const f=Math.abs(a.x)+Math.abs(a.y)+Math.abs(a.z);if(f>38&&Date.now()-last>3000&&!/player|series|soon/.test(location.pathname)){last=Date.now();RH.surprise()}});
 addEventListener('click',()=>{if(ask||!RH.S().shake)return;ask=1;try{window.DeviceMotionEvent&&DeviceMotionEvent.requestPermission&&DeviceMotionEvent.requestPermission().catch(()=>{})}catch{}},{once:true});
 addEventListener('offline',()=>RH.toast('You are offline - your saved lists still work'));addEventListener('online',()=>RH.toast('Back online'));
 RH.skin()})();

/* ===== v8: story-style guided tour ===== */
RH.tour=function(key,steps,force){const dn=RH.get('rh_tour',{});if(dn[key]&&!force)return;
 steps=steps.filter(s=>{if(!s.sel)return true;const e=document.querySelector(s.sel);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0});if(!steps.length)return;
 let i=0;const o=document.createElement('div');o.className='tr';o.innerHTML='<div class="trb"></div><div class="trh"></div><div class="trc lg"></div><div class="trp"></div>';document.body.append(o);
 const hole=$('.trh',o),card=$('.trc',o),bar=$('.trp',o),end=()=>{o.remove();const d=RH.get('rh_tour',{});d[key]=1;RH.set('rh_tour',d)};
 const next=()=>{RH.vib(8);if(++i>=steps.length)end();else show()};
 function show(){const s=steps[i],el=s.sel&&document.querySelector(s.sel);
  bar.innerHTML=steps.map((_,k)=>`<i class="${k<i?'d':k==i?'a':''}"></i>`).join('');const a=$('i.a',bar);a&&a.addEventListener('animationend',next);
  card.innerHTML=`<span class="tri">${s.i||'✨'}</span><h3>${s.t}</h3><p>${s.d}</p><div class="row2"><button class="sk2">Skip tour</button><button class="nx">${i==steps.length-1?'Got it':'Next'}</button></div>`;
  $('.sk2',card).onclick=end;$('.nx',card).onclick=next;
  if(el){el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();Object.assign(hole.style,{display:'block',left:r.left-8+'px',top:r.top-8+'px',width:r.width+16+'px',height:r.height+16+'px'});$('.trb',o).style.background='transparent';
   card.classList.remove('mid');card.style.top='0px';const h=card.offsetHeight,below=innerHeight-r.bottom;card.style.top=(below>h+40?r.bottom+22:Math.max(64,r.top-h-22))+'px'}
  else{hole.style.display='none';$('.trb',o).style.background='';card.classList.add('mid');card.style.top=''}}
 o.addEventListener('pointerdown',()=>o.classList.add('hold'));['pointerup','pointercancel'].forEach(e=>o.addEventListener(e,()=>o.classList.remove('hold')));
 show()};
RH.TOURS={
 home:[{i:'👋',t:'Welcome to Reelhouse',d:'A 30-second tour of the best hidden features. Tap Next, or just wait.'},
  {sel:'#dc',i:'🎲',t:'Surprise me',d:'Tap the dice and we will pick a great movie you have not seen.'},
  {i:'📱',t:'Shake for a surprise',d:'Shake your phone anywhere in the app and we will choose a movie for you. You can turn this off in Settings.'},
  {sel:'.card',i:'👆',t:'Hold for a preview',d:'Press and hold (or hover) any poster to watch a 10-second preview. It is muted until you switch sound on in Settings.'},
  {sel:'.nav a:nth-child(2)',i:'🔎',t:'Search like a pro',d:'Filters, moods, voice search and theme search all live here.'},
  {sel:'.nav a:nth-child(4)',i:'🏅',t:'Your profile',d:'Collect badges, keep a streak, see your stats and manage followers.'}],
 search:[{sel:'#fb',i:'⚙️',t:'Filters',d:'Narrow by genre, year, rating, language, runtime, streaming service, actor and more.'},
  {sel:'#mic',i:'🎤',t:'Voice search',d:'Tap the mic and just say a title.'},
  {sel:'.stabs',i:'🎞️',t:'Switch what you search',d:'Movies, series, actors, or Themes like "time loop" or "heist".'},
  {sel:'#rec',i:'🎭',t:'Moods and surprises',d:'Open Pick a mood for ideas that fit how you feel, or tap Surprise me.'}],
 me:[{sel:'#cn',i:'👥',t:'Followers and following',d:'Tap any number to open a full page of people. You can follow back and share movies with them.'},
  {sel:'#bg',i:'🏅',t:'Badges',d:'Earn badges for streaks and for staying 1, 2 and 6 months, and a year. There is a secret one too.'}]};
RH.autoTour=function(n=0){const k=location.pathname.split('/').pop().replace('.html','')||'home';if(!RH.TOURS[k]||RH.get('rh_tour',{})[k]||n>10)return;
 if(document.querySelector('.mod,.cine,.tr'))return setTimeout(()=>RH.autoTour(n+1),2500);RH.tour(k,RH.TOURS[k])};
(()=>{const _n=RH.nav;RH.nav=function(i){_n.call(RH,i);setTimeout(()=>RH.autoTour(),1800)}})();
