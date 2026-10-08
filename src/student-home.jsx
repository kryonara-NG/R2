import React,{useEffect,useMemo,useState}from'react';
import{Link}from'react-router-dom';
import{supabase}from'./lib/supabase.js';
import{getEnrollment,getProgress,getAssignments,getMySubmissions}from'./lib/api.js';

const Icon=({name,size=20})=>{const p={viewBox:'0 0 24 24',width:size,height:size,fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round',strokeLinejoin:'round'};const x={book:<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20"/></>,check:<><path d="m5 12 4 4L19 6"/></>,quiz:<><path d="M4 5h16v12H4z"/><path d="m8 21 4-4 4 4"/></>,arrow:<><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>};return <svg className="i" {...p}>{x[name]||x.arrow}</svg>};

const lagosDate=()=>new Intl.DateTimeFormat('en-NG',{timeZone:'Africa/Lagos',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
const dayKey=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos'}).format(new Date(d));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

function streakFromProgress(rows){const days=new Set((rows||[]).filter(x=>x.completed_at).map(x=>dayKey(x.completed_at)));let cursor=new Date();let streak=0;while(true){const k=dayKey(cursor);if(!days.has(k))break;streak++;cursor.setDate(cursor.getDate()-1)}return streak}

export default function StudentHome({user,profile}){
 const[loading,setLoading]=useState(true),[en,setEn]=useState(null),[levels,setLevels]=useState([]),[progress,setProgress]=useState([]),[assignments,setAssignments]=useState([]),[subs,setSubs]=useState([]),[grade,setGrade]=useState({average_percent:0,graded_count:0}),[notifications,setNotifications]=useState(0);
 useEffect(()=>{let alive=true;(async()=>{try{
   await supabase.rpc('activate_due_enrollments',{p_course_id:'da'});
   const[a,l,p,as,ss,g,n]=await Promise.all([
    getEnrollment(user.id,'da'),
    supabase.from('course_levels').select('*').eq('course_id','da').order('level_number'),
    getProgress(user.id,'da'),
    getAssignments('da'),
    getMySubmissions(user.id),
    supabase.rpc('get_my_grade_summary'),
    supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).is('read_at',null)
   ]);
   if(!alive)return;
   setEn(a);setLevels(l.data||[]);setProgress(p);setAssignments(as);setSubs(ss);setGrade(g.data||{average_percent:0,graded_count:0});setNotifications(n.count||0);
  }catch{}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[user.id]);
 const completed=new Set(progress.map(x=>x.lesson_id));
 const current=useMemo(()=>{const now=Date.now();const active=levels.find(l=>now>=new Date(l.opens_at).getTime()&&now<=new Date(l.closes_at).getTime());return active||levels.find(l=>(Array.isArray(l.content)?l.content:[]).some(x=>!completed.has(x.id)))||levels[0]||null},[levels,progress]);
 const days=Array.isArray(current?.content)?current.content:[];const firstIncomplete=days.findIndex(x=>!completed.has(x.id));const dayNo=firstIncomplete<0?days.length||1:firstIncomplete+1;const totalDays=days.length||5;const doneDays=days.filter(x=>completed.has(x.id)).length;const pct=clamp(Math.round((doneDays/totalDays)*100),0,100);const overallTotal=levels.reduce((n,l)=>n+(Array.isArray(l.content)?l.content.length:0),0)||5;const overallDone=progress.filter(x=>x.lesson_id).length;const overallPct=clamp(Math.round((overallDone/overallTotal)*100),0,100);
 const todayAssignment=assignments.find(a=>Number(a.week_number)===Number(current?.journey_number||current?.level_number)&&Number(a.day_number)===dayNo)||assignments.find(a=>new Date(a.due_at).getTime()>Date.now());
 const todayQuiz=useMemo(()=>{if(!current)return null;return null},[current]);
 const streak=streakFromProgress(progress);const displayName=profile?.full_name?.split(' ')[0]||'learner';const day=days[dayNo-1];const due=todayAssignment?.due_at?new Date(todayAssignment.due_at):null;
 if(loading)return <section className="student-home loading-student"><div className="student-loading"><span className="loading-dot"/><p>Preparing your campus…</p></div></section>;
 if(!en||en.status!=='active')return <section className="student-home student-empty"><div className="student-empty-card"><span className="student-kicker">YOUR TAMP CAMPUS</span><h1>Your course access is being prepared.</h1><p>Your enrollment is not active yet. Once access unlocks, your home screen will become your daily learning dashboard.</p><Link className="student-primary" to="/courses/da">View Data Analysis</Link><Link className="student-secondary" to="/enroll/da">Open enrollment</Link></div></section>;
 return <section className="student-home">
  <div className="student-header"><div><span className="student-kicker">TAMP CAMPUS</span><h1>Hello, {displayName}</h1><p>{lagosDate()}</p></div><Link className="student-notify" to="/notifications" aria-label="Notifications"><Icon name="bell"/>{notifications>0&&<i>{notifications>9?'9+':notifications}</i>}</Link></div>
  <div className="journey-hero" style={{'--journey-progress':pct+'%'}}>
   <div className="journey-copy"><span className="student-kicker inverse">JOURNEY {current?.journey_number||current?.level_number||1} · DAY {dayNo}</span><h2>{day?.title||current?.title||'Your next lesson'}</h2><p>{current?.description||'Continue your current learning journey.'}</p><Link className="hero-continue" to={day&&current?'/reader/'+current.id+'/'+dayNo:'/learn'}>Continue <Icon name="arrow" size={17}/></Link></div>
   <div className="progress-ring"><span>{pct}%</span></div><div className="hero-orbit"/>
  </div>
  <div className="student-overall"><div><div className="student-progress-label"><span>Course progress</span><b>{overallPct}%</b></div><div className="student-bar"><i style={{width:overallPct+'%'}}/></div></div><Link to="/learn">View journey <Icon name="arrow" size={16}/></Link></div>
  <div className="student-stats"><div><b>{overallDone}</b><span>days done</span></div><div><b>{Number(grade.average_percent||0).toFixed(0)}%</b><span>avg grade</span></div><div><b>{streak}</b><span>day streak</span></div></div>
  <div className="student-section-head"><div><span className="student-kicker">TODAY</span><h2>Keep your momentum</h2></div></div>
  <div className="today-stack">
   <Link className="today-card" to={current&&day?'/reader/'+current.id+'/'+dayNo:'/learn'}><div className="today-icon"><Icon name="book"/></div><div><span className="today-type">DAILY READING</span><h3>{day?.title||'Continue your reading'}</h3><p>Deep study · about 30 minutes</p></div><Icon name="arrow"/></Link>
   <Link className="today-card" to={todayQuiz?'/quiz/'+todayQuiz.id:'/learn'}><div className="today-icon quiz"><Icon name="quiz"/></div><div><span className="today-type">PRACTICE QUIZ</span><h3>Check what you know</h3><p>Instant feedback · today's topic</p></div><Icon name="arrow"/></Link>
   <Link className="today-card" to="/assignments/da"><div className="today-icon assignment"><Icon name="check"/></div><div><span className="today-type">DAILY ASSIGNMENT</span><h3>{todayAssignment?.title||'No assignment scheduled'}</h3><p>{due?'Due '+due.toLocaleTimeString('en-NG',{hour:'numeric',minute:'2-digit'}):'Your next task appears here automatically'}</p></div><Icon name="arrow"/></Link>
  </div>
  <div className="student-course-note"><div><span className="student-kicker">CURRENT COURSE</span><h3>Data Analysis</h3><p>{current?.title||'Beginner journey'} · Journey {current?.journey_number||current?.level_number||1}</p></div><Link to="/courses/da">Course details <Icon name="arrow" size={16}/></Link></div>
 </section>
}
