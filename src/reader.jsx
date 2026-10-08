import React,{useEffect,useMemo,useState}from'react';
import{Link,useNavigate,useParams}from'react-router-dom';
import{supabase}from'./lib/supabase.js';

export default function ReaderPage({user,readingContent,readingDeepDive,readingExpansion,readingVideos}){
 const{levelId,day}=useParams(),nav=useNavigate(),dayNo=Number(day||1);const[loading,setLoading]=useState(true),[level,setLevel]=useState(null),[db,setDb]=useState(null),[saved,setSaved]=useState(0),[completed,setCompleted]=useState(false),[font,setFont]=useState(1),[toc,setToc]=useState(false),[notice,setNotice]=useState('');
 const saveTimer=React.useRef(null);
 useEffect(()=>{(async()=>{try{const[{data:l},{data:p},{data:r}]=await Promise.all([
  supabase.from('course_levels').select('*').eq('id',levelId).maybeSingle(),
  supabase.from('topic_reading_progress').select('completed_at,scroll_top').eq('student_id',user?.id).eq('course_level_id',levelId).eq('day_number',dayNo).maybeSingle(),
  supabase.from('course_readings').select('id').eq('course_level_id',levelId).eq('day_number',dayNo).maybeSingle()
 ]);setLevel(l);setSaved(Number(p?.scroll_top||0));setCompleted(Boolean(p?.completed_at));if(r){const{data:v}=await supabase.from('course_reading_versions').select('intro,sections,videos,attribution').eq('reading_id',r.id).eq('status','published').maybeSingle();if(v)setDb(v)}}catch{}finally{setLoading(false)}})()},[levelId,dayNo,user?.id]);
 const journey=Number(level?.journey_number||level?.level_number||1);const fallback=(readingContent[journey]||readingContent[1])?.[Math.max(0,Math.min(dayNo-1,(readingContent[journey]||readingContent[1]).length-1))];const content=db?{...fallback,intro:db.intro,sections:db.sections||[],videos:db.videos||[],attribution:db.attribution}:fallback;const sections=useMemo(()=>[...(content?.sections||[]),...(readingDeepDive[journey]?.[dayNo]||[]),...(readingExpansion[journey]?.[dayNo]||[])].flat(),[content,journey,dayNo,readingDeepDive,readingExpansion]);const videos=db?.videos?.length?db.videos.map(v=>({title:v.title,id:v.id||v.url?.split('v=')[1]})):readingVideos[journey]||readingVideos[1];
 const onScroll=e=>{if(!user)return;const el=e.currentTarget;const top=Math.round(el.scrollTop);setSaved(top);clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>supabase.rpc('save_topic_reading_position',{p_course_id:'da',p_course_level_id:levelId,p_day_number:dayNo,p_scroll_top:top}),700)};
 useEffect(()=>{const el=document.querySelector('[data-reader-scroll]');if(el&&saved)el.scrollTop=saved},[loading]);
 const complete=async()=>{setNotice('');if(!completed){const{error}=await supabase.rpc('complete_topic_reading',{p_course_id:'da',p_course_level_id:levelId,p_day_number:dayNo});if(error){setNotice(error.message);return}setCompleted(true)}setNotice('Reading saved. Continue to today’s assessment when you are ready.');};
 if(loading)return <section className="reader-page"><div className="reader-loading">Opening your reading room…</div></section>;
 if(!level||!content)return <section className="reader-page"><div className="reader-error"><h1>Reading unavailable</h1><p>This lesson could not be loaded.</p><Link to="/learn">Back to learning</Link></div></section>;
 return <section className="reader-page">
  <header className="reader-top"><button className="reader-back" onClick={()=>nav(-1)}>← <span>Learning</span></button><div className="reader-tools"><button onClick={()=>setToc(v=>!v)} className={toc?'active':''}>Contents</button><button onClick={()=>setFont(v=>Math.max(.88,Number((v-.08).toFixed(2))))}>A−</button><button onClick={()=>setFont(v=>Math.min(1.28,Number((v+.08).toFixed(2))))}>A+</button><button onClick={()=>window.print()}>Print</button></div></header>
  <div className="reader-layout">
   {toc&&<aside className="reader-toc"><span className="student-kicker">ON THIS PAGE</span>{sections.map((s,i)=><a key={i} href={'#reader-'+i}>{(Array.isArray(s)?s[0]:s?.heading)||'Section '+(i+1)}</a>)}</aside>}
   <article className="reader-paper" style={{'--reader-scale':font}}>
    <div className="reader-meta"><span>JOURNEY {journey} · DAY {dayNo}</span><span>~30 MIN</span>{completed&&<span className="reader-done">COMPLETED</span>}</div>
    <h1>{content.title}</h1><p className="reader-intro">{content.intro}</p>
    {sections.map((s,i)=>{const h=Array.isArray(s)?s[0]:s?.heading||'';const p=Array.isArray(s)?s[1]:s?.body||'';return <React.Fragment key={i}><section id={'reader-'+i} className="reader-section"><h2>{h}</h2><p>{p}</p></section>{(i+1)%3===0&&videos[(i+1)/3-1]?<figure className="reader-video"><div><iframe src={'https://www.youtube.com/embed/'+videos[(i+1)/3-1].id} title={videos[(i+1)/3-1].title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/></div><figcaption>{videos[(i+1)/3-1].title}</figcaption></figure>:null}</React.Fragment>})}
    <aside className="reader-checkpoint"><span className="student-kicker">STUDY CHECKPOINT</span><h2>Pause before you continue.</h2><p>Explain the main idea in your own words, identify the evidence that supports it, and write down one question you still have.</p></aside>
    <div className="reader-finish"><h2>Ready for today’s assessment?</h2><p>Make sure you can explain the key ideas without looking back. Reading completion is saved separately from the graded quiz.</p><button className="reader-complete" onClick={complete}>{completed?'Reading completed ✓':'Mark reading as complete'}</button>{notice&&<p className="reader-notice">{notice}</p>}</div>
   </article>
  </div>
 </section>
}
