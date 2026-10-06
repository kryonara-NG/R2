import React,{useEffect,useMemo,useRef,useState}from'react';
import{Link,useParams}from'react-router-dom';
import{supabase}from'./lib/supabase.js';

const fmt=d=>d?new Date(d).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'}):'—';

export function QuizList({levelId}){
 const[items,setItems]=useState([]);
 useEffect(()=>{supabase.from('quizzes').select('id,title,kind,time_limit_minutes').eq('course_level_id',levelId).eq('active',true).order('kind').then(({data})=>setItems(data||[]))},[levelId]);
 if(!items.length)return null;
 return <div className="quiz-list"><h3>Quizzes</h3>{items.map(q=><Link className="quiz-link" key={q.id} to={'/quiz/'+q.id}><span><b>{q.title}</b><small>{q.kind==='graded'?'Graded · result released after 24 hours':'Practice · immediate feedback'}{q.time_limit_minutes?' · '+q.time_limit_minutes+' min':''}</small></span><strong>→</strong></Link>)}</div>;
}

function QuizPage(){
 const{quizId}=useParams(),[data,setData]=useState(null),[answers,setAnswers]=useState({}),[busy,setBusy]=useState(true),[msg,setMsg]=useState(''),[left,setLeft]=useState(null),[result,setResult]=useState(null);
 const submittedRef=useRef(false);
 const load=async()=>{setBusy(true);setMsg('');try{
  await supabase.rpc('release_my_due_quiz_results');
  let{data:q,error}=await supabase.rpc('get_student_quiz',{p_quiz_id:quizId});if(error)throw error;
  if(!q.attempt){const r=await supabase.rpc('start_quiz',{p_quiz_id:quizId});if(r.error)throw r.error;({data:q,error}=await supabase.rpc('get_student_quiz',{p_quiz_id:quizId}));if(error)throw error}
  setData(q);if(q.attempt?.score_percent!=null&&q.attempt.status==='released')setResult(q.attempt.score_percent);
 }catch(e){setMsg(e.message||'Quiz could not be loaded.')}finally{setBusy(false)}};
 useEffect(()=>{load()},[quizId]);
 const elapsed=useMemo(()=>data?.attempt?Math.max(0,Math.floor((Date.now()-new Date(data.attempt.started_at).getTime())/1000)):0,[data,left]);
 const submit=async auto=>{if(!data?.attempt||data.attempt.status!=='in_progress')return;setBusy(true);setMsg('');
  try{const fn=data.quiz.kind==='graded'?'submit_graded_quiz':'submit_practice_quiz';const r=await supabase.rpc(fn,{p_attempt_id:data.attempt.id,p_answers:answers,p_pacing_seconds:elapsed});if(r.error)throw r.error;submittedRef.current=true;setResult(r.data?.score_percent??null);setData(v=>({...v,attempt:{...v.attempt,status:r.data?.status,score_percent:r.data?.score_percent,release_at:r.data?.release_at}}));setMsg(auto?'Time expired. Your answers were submitted.':'Submitted successfully.')}catch(e){submittedRef.current=false;setMsg(e.message||'Could not submit quiz.')}finally{setBusy(false)}};
 useEffect(()=>{if(!data?.attempt||data.attempt.status!=='in_progress')return;
  const started=new Date(data.attempt.started_at).getTime(),limit=data.quiz.time_limit_minutes?data.quiz.time_limit_minutes*60*1000:null;
  const tick=()=>{const elapsedNow=Date.now()-started;setLeft(limit?Math.max(0,limit-elapsedNow):null);if(limit&&elapsedNow>=limit&&!submittedRef.current){submit(true)}};
  tick();const t=setInterval(tick,1000),hb=setInterval(()=>supabase.rpc('quiz_heartbeat',{p_attempt_id:data.attempt.id}),10000);
  const hidden=()=>{if(document.hidden&&!submittedRef.current)supabase.rpc('record_quiz_event',{p_attempt_id:data.attempt.id,p_event_type:'hidden'})};
  const pagehide=()=>{if(!submittedRef.current)supabase.rpc('record_quiz_event',{p_attempt_id:data.attempt.id,p_event_type:'pagehide'})};
  const before=ev=>{if(!submittedRef.current){ev.preventDefault();ev.returnValue='';supabase.rpc('record_quiz_event',{p_attempt_id:data.attempt.id,p_event_type:'beforeunload'})}};
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',pagehide);window.addEventListener('beforeunload',before);
  return()=>{clearInterval(t);clearInterval(hb);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',pagehide);window.removeEventListener('beforeunload',before);if(!submittedRef.current)supabase.rpc('record_quiz_event',{p_attempt_id:data.attempt.id,p_event_type:'interrupted'})};
 },[data]);
 const timer=left==null?null:(Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0'));
 if(busy&&!data)return <section className="sec"><div className="card">Loading quiz…</div></section>;
 if(msg&&!data)return <section className="sec"><div className="card"><p className="err">{msg}</p><Link className="btn" to="/learn">Back to learning</Link></div></section>;
 if(!data)return null;const a=data.attempt;
 if(a?.status==='interrupted')return <section className="sec"><div className="card quiz-locked"><span className="pill">Attempt interrupted</span><h1>Quiz not submitted</h1><p>You left the graded quiz page. This attempt has been invalidated and cannot be submitted.</p><p className="mu">This is part of TAMP's assessment integrity rule.</p><Link className="btn" to="/learn">Back to learning</Link></div></section>;
 if(a?.status==='submitted_pending')return <section className="sec"><div className="card success-card"><h1>Submitted</h1><p>Your graded quiz has been received. The result will be released after 24 hours.</p><p className="mu">Result release: {fmt(a.release_at)}</p><Link className="btn" to="/grades">Go to Grades</Link></div></section>;
 if(a?.status==='released')return <section className="sec"><div className="card success-card"><span className="pill">Result released</span><h1>{Number(a.score_percent||0).toFixed(2)}%</h1><p>{data.quiz.title}</p><Link className="btn" to="/grades">View Grades</Link></div></section>;
 return <section className="sec quiz-page"><div className="hero inner"><p className="eyebrow">{data.quiz.kind==='graded'?'GRADED QUIZ':'PRACTICE QUIZ'}</p><h1>{data.quiz.title}</h1><p className="lead">{data.quiz.instructions}</p>{timer&&<div className="quiz-timer"><b>{timer}</b><span>remaining</span></div>}</div><div className="card quiz-rules"><b>Assessment rule</b><p>Stay on this page until you submit. Switching away, closing the page or leaving the quiz records an interruption.</p></div><div className="card">{data.questions.map(q=><div className="quiz-question" key={q.id}><small>Question {q.question_number} · {q.points} point{q.points===1?'':'s'}</small><h3>{q.prompt}</h3>{q.options.map(option=><label className="quiz-option" key={option}><input type="radio" name={q.id} checked={answers[q.id]===option} onChange={()=>setAnswers(v=>({...v,[q.id]:option}))}/><span>{option}</span></label>)}</div>)}<button className="btn" disabled={busy||data.questions.some(q=>!answers[q.id])} onClick={()=>submit(false)}>{busy?'Submitting…':'Submit quiz'}</button>{msg&&<p className="status">{msg}</p>}{result!=null&&data.quiz.kind==='practice'&&<div className="result"><b>Practice score: {Number(result).toFixed(2)}%</b><p>This practice score is not added to your official Grades table.</p></div>}</div></section>;
}

export function GradeTile(){
 const[s,setS]=useState({average_percent:0,graded_count:0,fast_attempts:0});
 useEffect(()=>{supabase.rpc('release_my_due_quiz_results').then(()=>supabase.rpc('get_my_grade_summary')).then(({data})=>data&&setS(data))},[]);
 return <Link className="grade-tile" to="/grades"><span><small>QUIZ PERFORMANCE</small><b>{Number(s.average_percent||0).toFixed(2)}%</b></span><span><strong>{s.graded_count||0}</strong><small>graded quizzes</small></span></Link>;
}

export function Grades({user}){
 const[rows,setRows]=useState([]),[summary,setSummary]=useState({average_percent:0,graded_count:0,fast_attempts:0}),[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{setLoading(true);await supabase.rpc('release_my_due_quiz_results');const[g,s]=await Promise.all([supabase.rpc('get_my_grades'),supabase.rpc('get_my_grade_summary')]);setRows(g.data||[]);setSummary(s.data||{average_percent:0,graded_count:0,fast_attempts:0});setLoading(false)})()},[user?.id]);
 return <section className="sec grades-page"><div className="hero inner"><p className="eyebrow">ME · GRADES</p><h1>My Grades</h1><p className="lead">Every official graded quiz is shown as a percentage.</p></div><div className="stats"><div><b>{Number(summary.average_percent||0).toFixed(2)}%</b><span>average performance</span></div><div><b>{summary.graded_count||0}</b><span>graded quizzes</span></div><div><b>{summary.fast_attempts||0}</b><span>speed flags</span></div></div>{loading?<div className="card">Loading grades…</div>:rows.length?<div className="card grades-table-wrap"><table className="grades-table"><thead><tr><th>Assessment</th><th>Week / Day</th><th>Score</th><th>Date</th></tr></thead><tbody>{rows.map(r=><tr key={r.attempt_id}><td><b>{r.quiz_title}</b><small>Graded Quiz</small></td><td>Week {r.journey_number} · Day {r.day_number||'—'}<small>{r.journey_title}</small></td><td><strong>{Number(r.score_percent||0).toFixed(2)}%</strong></td><td>{fmt(r.released_at)}</td></tr>)}</tbody></table></div>:<div className="card empty"><h3>No released grades yet</h3><p className="mu">Complete a graded quiz. Results become visible after the 24-hour release period.</p></div>}</section>;
}

export default QuizPage;
