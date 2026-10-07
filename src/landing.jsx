import React,{useEffect,useState}from'react';
import{Link}from'react-router-dom';
import{supabase}from'./lib/supabase.js';

const Icon=({children})=><span className="landing-icon">{children}</span>;

export function StudentVoices(){
 const[rows,setRows]=useState([]);
 useEffect(()=>{supabase.from('student_feedback').select('id,rating,comment,journey_number,day_number,created_at').eq('approved',true).order('created_at',{ascending:false}).limit(40).then(({data})=>setRows(data||[]))},[]);
 return <section className="sec voices-page"><div className="hero inner"><p className="eyebrow">TAMP · STUDENT VOICES</p><h1>What learners say</h1><p className="lead">Real feedback from students as they move through the learning journey.</p></div>{rows.length?<div className="voice-grid">{rows.map(x=><article className="voice-card" key={x.id}><div className="voice-stars">{'★'.repeat(x.rating)}{'☆'.repeat(5-x.rating)}</div><p>“{x.comment}”</p><small>Journey {x.journey_number||'—'} · Day {x.day_number}</small></article>)}</div>:<div className="card empty"><h3>Student feedback will appear here soon</h3><p className="mu">Approved feedback will appear here as students share their learning experiences.</p></div>}</section>
}

export default function Landing(){
 const[stats,setStats]=useState({enrolled:0,countries:0});
 useEffect(()=>{supabase.rpc('course_enrollment_stats',{p_course_id:'da'}).then(({data})=>{if(data)setStats({enrolled:data.enrolled||0,countries:(data.countries||[]).length})})},[]);
 return <div className="landing">
  <section className="landing-hero">
   <div className="landing-orb orb-one"/><div className="landing-orb orb-two"/>
   <div className="landing-kicker">TECHNICAL CAMPUS · TAMP</div>
   <h1>Learn skills.<br/><em>Build proof.</em></h1>
   <p>Structured technical learning built around daily practice, real submissions, assessment and verifiable achievement.</p>
   <div className="landing-actions"><Link className="btn" to="/courses">Explore the Data Analysis programme</Link><Link className="btn o" to="/students">What students say</Link></div>
   <div className="landing-scroll">SCROLL TO EXPLORE ↓</div>
  </section>
  <section className="landing-section"><div><span className="eyebrow">HOW TAMP LEARNING WORKS</span><h2>More than lessons.<br/>A structured path to practical skills.</h2></div><div className="landing-steps"><article><b>01</b><h3>Learn each day</h3><p>Five-day learning journeys keep the work focused and measurable.</p></article><article><b>02</b><h3>Practice</h3><p>Practice quizzes and daily assignments turn concepts into evidence.</p></article><article><b>03</b><h3>Receive feedback</h3><p>Submit work for human review, scores and actionable feedback.</p></article><article><b>04</b><h3>Build your record</h3><p>Complete the requirements and receive a certificate with public verification.</p></article></div></section>
  <section className="landing-stat-band"><div><strong>{stats.enrolled}</strong><span>Learners enrolled</span></div><div><strong>{stats.countries}</strong><span>Countries represented</span></div><div><strong>₦2,000</strong><span>Course enrollment</span></div></section>\n  <section className="landing-section"><div><span className="eyebrow">COHORT-BASED LEARNING</span><h2>One cohort. One shared academic journey.</h2><p>TAMP releases courses by cohort. A cohort is a defined group of students who begin around the same time and follow a planned academic schedule together.</p><div className="landing-steps"><article><b>01</b><h3>Join the next cohort</h3><p>Enrollment opens for a specific cohort instead of allowing unlimited start dates.</p></article><article><b>02</b><h3>Learn together</h3><p>Course activities are released according to the cohort schedule.</p></article><article><b>03</b><h3>About 1–2 months</h3><p>A TAMP cohort can run for approximately one to two months, depending on the programme schedule.</p></article><article><b>04</b><h3>Finish with evidence</h3><p>Progress through learning, assessment, practical work and the final completion requirements.</p></article></div></div></section>
  <section className="landing-section course-landing"><div className="course-landing-copy"><span className="eyebrow">CURRENT PROGRAM</span><h2>Data Analysis</h2><p>Start with the Beginner phase, progress through five-day journeys, complete assessments and build a practical portfolio of evidence.</p><Link className="btn" to="/courses/da">View the course</Link></div><div className="landing-course-card"><span>BEGINNER</span><strong>Daily learning</strong><small>Lessons · quizzes · assignments · feedback</small><i>↗</i></div></section>
  <section className="landing-section"><div className="landing-proof"><span className="eyebrow">BUILT FOR CONFIDENCE</span><h2>Keep every achievement clear and verifiable.</h2><p>Each certificate is issued with a unique certificate ID and a public verification path. TAMP can also preserve the student’s assessed work and results.</p><Link className="btn o" to="/verify">Certificate verification</Link></div></section>
  <section className="landing-cta"><span className="eyebrow">READY TO BEGIN?</span><h2>Start building practical technical skills.</h2><Link className="btn" to="/courses">Explore TAMP</Link></section>
 </div>
}
