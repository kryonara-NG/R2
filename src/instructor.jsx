import React,{useEffect,useMemo,useState}from'react';
import{supabase}from'./lib/supabase.js';

const escVideo=v=>({title:v.title||'',url:v.url||'',description:v.description||''});
const fallbackVideos=(READING_VIDEOS,j)=> (READING_VIDEOS[j]||READING_VIDEOS[1]||[]).map(v=>({title:v.title,url:'https://www.youtube.com/watch?v='+v.id,description:''}));

export default function InstructorStudio({profile,readingContent,readingVideos}) {
 const[readings,setReadings]=useState([]),[selected,setSelected]=useState(null),[editor,setEditor]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[msg,setMsg]=useState(''),[preview,setPreview]=useState(false);
 const isAdmin=profile?.role==='admin';
 const load=async()=>{
  setLoading(true);setMsg('');
  try{
   const{data:levels,error:le}=await supabase.from('course_levels').select('id,journey_number,level_number,title').eq('course_id','da').order('level_number');if(le)throw le;
   const seeds=[];
   for(const l of levels||[]){const j=Number(l.journey_number||l.level_number||1);const days=readingContent[j]||[];for(let d=0;d<days.length;d++){const x=days[d];seeds.push({course_id:'da',course_level_id:l.id,journey_number:j,day_number:d+1,slug:(x.title||('day-'+(d+1))).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),title:x.title,estimated_minutes:30,attribution:'TAMP Curriculum Team'});}}
   for(const seed of seeds){await supabase.from('course_readings').upsert(seed,{onConflict:'course_level_id,day_number'});}
   const{data:rs,error:re}=await supabase.from('course_readings').select('*').eq('course_id','da').order('journey_number').order('day_number');if(re)throw re;
   setReadings(rs||[]);if(selected){const fresh=(rs||[]).find(x=>x.id===selected.id);if(fresh)setSelected(fresh);}
  }catch(e){setMsg(e.message||'Could not load the instructor studio.')}finally{setLoading(false);}
 };
 useEffect(()=>{load()},[]);
 const choose=async r=>{
  setSelected(r);setPreview(false);setMsg('');
  try{
   const{data,error}=await supabase.rpc('get_instructor_reading',{p_reading_id:r.id});if(error)throw error;
   const source=data?.draft||data?.live;
   if(source){setEditor({id:source.id,version_number:source.version_number,status:source.status,intro:source.intro||'',sections:Array.isArray(source.sections)?source.sections:[],videos:Array.isArray(source.videos)?source.videos:[],editor_note:source.editor_note||''});}
   else{const base=(readingContent[r.journey_number]||[])[r.day_number-1]||{};setEditor({id:null,version_number:null,status:'draft',intro:base.intro||'',sections:(base.sections||[]).map(x=>({heading:x[0]||'',body:x[1]||''})),videos:fallbackVideos(readingVideos,r.journey_number),editor_note:''});}
  }catch(e){setMsg(e.message||'Could not open this reading.');}
 };
 const normalizeSections=arr=>arr.map(x=>({heading:String(x.heading||'').trim(),body:String(x.body||'').trim()})).filter(x=>x.heading||x.body);
 const save=async status=>{
  if(!selected||!editor)return;
  setSaving(true);setMsg('');
  try{
   const sections=normalizeSections(editor.sections),videos=editor.videos.map(escVideo).filter(v=>v.title&&v.url);
   const{data,error}=await supabase.rpc('save_instructor_reading',{p_reading_id:selected.id,p_intro:editor.intro,p_sections:sections,p_videos:videos,p_editor_note:editor.editor_note,p_status:status});
   if(error)throw error;
   setEditor(v=>({...v,status,version_number:(v.version_number||0)+1,id:data}));setMsg(status==='review'?'Saved and submitted for academic review.':'Draft saved.');
  }catch(e){setMsg(e.message||'Could not save the reading.')}finally{setSaving(false);}
 };
 const publish=async()=>{
  if(!editor?.id)return;setSaving(true);setMsg('');
  try{const{error}=await supabase.rpc('admin_publish_reading_version',{p_version_id:editor.id});if(error)throw error;setMsg('Version published. Students will now see this reading.');await choose(selected);}catch(e){setMsg(e.message||'Could not publish this version.')}finally{setSaving(false);}
 };
 const addSection=()=>setEditor(v=>({...v,sections:[...(v.sections||[]),{heading:'New heading',body:''}]}));
 const addVideo=()=>setEditor(v=>({...v,videos:[...(v.videos||[]),{title:'',url:'',description:''}]}));
 return <section className="sec instructor-studio">
  <div className="hero inner"><p className="eyebrow">TAMP · INSTRUCTOR STUDIO</p><h1>Course content workspace</h1><p className="lead">Build the study experience without putting your name on student-facing material. Your work is attributed to the TAMP Curriculum Team.</p></div>
  {msg&&<div className="card status ok">{msg}</div>}
  <div className="studio-grid">
   <aside className="card studio-library"><div className="section-head"><div><span className="eyebrow">READINGS</span><h2>Data Analysis</h2></div><span className="mu">{readings.length} topics</span></div>{loading?<p className="mu">Preparing content library…</p>:readings.map(r=><button key={r.id} className={'studio-reading '+(selected?.id===r.id?'active':'')} onClick={()=>choose(r)}><span><b>Week {r.journey_number} · Day {r.day_number}</b><small>{r.title}</small></span><strong>→</strong></button>)}</aside>
   <div className="studio-main">
    {!editor?<div className="card studio-empty"><span className="pill">EDITOR</span><h2>Select a daily reading</h2><p className="mu">Open any existing TAMP reading, deepen it, add headings, examples, explanations and YouTube resources, then save it as a draft or submit it for review.</p></div>:<>
      <div className="card studio-editor-head"><div><span className="eyebrow">WEEK {selected.journey_number} · DAY {selected.day_number}</span><h2>{selected.title}</h2><p className="mu">Target study time: about {selected.estimated_minutes} minutes · Attribution: TAMP Curriculum Team</p></div><span className="pill">{editor.status}</span></div>
      <div className="card"><label>Opening explanation</label><textarea className="studio-textarea large" value={editor.intro} onChange={e=>setEditor(v=>({...v,intro:e.target.value}))} placeholder="Give the learner the big picture before the headings."/></div>
      <div className="card"><div className="section-head"><div><span className="eyebrow">STUDY NOTES</span><h2>Headings & explanations</h2></div><button className="btn o" onClick={addSection}>+ Add heading</button></div>{editor.sections.map((x,i)=><article className="studio-block" key={i}><div className="studio-block-head"><b>Section {i+1}</b><button className="text-btn" onClick={()=>setEditor(v=>({...v,sections:v.sections.filter((_,n)=>n!==i)}))}>Remove</button></div><input value={x.heading} onChange={e=>setEditor(v=>({...v,sections:v.sections.map((a,n)=>n===i?{...a,heading:e.target.value}:a)}))} placeholder="Subheading"/><textarea className="studio-textarea" value={x.body} onChange={e=>setEditor(v=>({...v,sections:v.sections.map((a,n)=>n===i?{...a,body:e.target.value}:a)}))} placeholder="Teach this idea deeply. Add examples, reasoning, common mistakes and practical context."/></article>)}{!editor.sections.length&&<p className="mu">No sections yet. Add the first heading.</p>}</div>
      <div className="card"><div className="section-head"><div><span className="eyebrow">VIDEO STUDY</span><h2>YouTube resources</h2></div><button className="btn o" onClick={addVideo}>+ Add video</button></div>{editor.videos.map((v,i)=><article className="studio-block" key={i}><div className="studio-block-head"><b>Video {i+1}</b><button className="text-btn" onClick={()=>setEditor(x=>({...x,videos:x.videos.filter((_,n)=>n!==i)}))}>Remove</button></div><input value={v.title} onChange={e=>setEditor(x=>({...x,videos:x.videos.map((a,n)=>n===i?{...a,title:e.target.value}:a)}))} placeholder="Video title"/><input value={v.url} onChange={e=>setEditor(x=>({...x,videos:x.videos.map((a,n)=>n===i?{...a,url:e.target.value}:a)}))} placeholder="https://www.youtube.com/watch?v=..."/><input value={v.description||''} onChange={e=>setEditor(x=>({...x,videos:x.videos.map((a,n)=>n===i?{...a,description:e.target.value}:a)}))} placeholder="What should the student watch for?"/></article>)}</div>
      <div className="card"><label>Internal editor note</label><textarea className="studio-textarea" value={editor.editor_note} onChange={e=>setEditor(v=>({...v,editor_note:e.target.value}))} placeholder="Optional note for the academic team. Not shown to students."/></div>
      <div className="studio-actions"><button className="btn o" disabled={saving} onClick={()=>save('draft')}>Save draft</button><button className="btn" disabled={saving} onClick={()=>save('review')}>{saving?'Saving…':'Submit for review'}</button>{isAdmin&&editor.status!=='published'&&<button className="btn publish-btn" disabled={saving||!editor.id} onClick={publish}>Publish to students</button>}<button className="btn o" onClick={()=>setPreview(v=>!v)}>{preview?'Close preview':'Preview'}</button></div>
      {preview&&<div className="card studio-preview"><span className="eyebrow">STUDENT PREVIEW</span><h2>{selected.title}</h2><p className="reading-intro">{editor.intro}</p>{editor.sections.map((x,i)=><section className="reading-section" key={i}><h3>{x.heading}</h3><p>{x.body}</p></section>)}{editor.videos.length>0&&<div className="reading-videos"><h3>Watch alongside the reading</h3>{editor.videos.map((v,i)=><div className="reading-video" key={i}><b>{v.title}</b><p className="mu">{v.description}</p><a href={v.url} target="_blank" rel="noreferrer">{v.url}</a></div>)}</div>}<p className="reading-study-note"><b>TAMP Curriculum Team</b><br/>Course material is presented as TAMP curriculum content.</p></div>}
    </>}
   </div>
  </div>
 </section>
}
