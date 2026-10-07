import React,{useEffect,useState}from'react';
import{Link}from'react-router-dom';
import{supabase}from'./lib/supabase.js';

export default function Payment(){
 const[settings,setSettings]=useState({}),[loading,setLoading]=useState(true);
 useEffect(()=>{supabase.from('site_settings').select('key,value').in('key',['payment_link_url','payment_enabled','enrollment_price_ngn']).then(({data})=>{
   setSettings(Object.fromEntries((data||[]).map(x=>[x.key,x.value])));
   setLoading(false);
 }).catch(()=>setLoading(false))},[]);
 const enabled=String(settings.payment_enabled||'false').toLowerCase()==='true'&&!!settings.payment_link_url;
 const price=Number(settings.enrollment_price_ngn||2000);
 return <section className="sec payment-page">
   <div className="hero inner">
     <p className="eyebrow">TAMP · ONLINE ENROLLMENT</p>
     <h1>{enabled?'Complete your enrollment payment.':'Online payments are coming soon.'}</h1>
     <p className="lead">{enabled?'Pay securely for your TAMP Data Analysis enrollment, then return to TAMP to complete your enrollment.':'TAMP is preparing direct online payment for course enrollment. The payment service is currently being reviewed and this page will activate automatically once the payment link is configured.'}</p>
   </div>
   <div className="card payment-card">
     <div className="payment-brand"><span>TAMP</span><small>by Kryonara</small></div>
     <div className="payment-price"><span>Data Analysis enrollment</span><strong>₦{price.toLocaleString('en-NG')}</strong></div>
     {loading?<div className="payment-status">Checking payment availability…</div>:enabled?<><div className="payment-status ready"><b>ONLINE PAYMENT AVAILABLE</b><span>You will be redirected to the payment service to complete your payment.</span></div><a className="btn" href={settings.payment_link_url} target="_blank" rel="noreferrer">Pay ₦{price.toLocaleString('en-NG')} online</a></>:<><div className="payment-status"><b>ONLINE PAYMENT WILL BE AVAILABLE SOON</b><span>Squad payment integration is being prepared while the payment account is under review.</span></div><button className="btn" disabled>Online payment is not available yet</button></>}
   </div>
   <div className="card">
     <h2>What happens after you pay?</h2>
     <ol><li>Complete the ₦{price.toLocaleString('en-NG')} payment through the approved TAMP payment service.</li><li>Keep your payment reference or receipt.</li><li>Return to TAMP and complete your student enrollment.</li><li>Your enrollment authorization will be connected to your TAMP account.</li></ol>
   </div>
   <div className="card payment-note"><b>Payment service</b><p className="mu">TAMP will use its approved payment-gateway account for online collections. Payment is not considered available until the gateway account and payment link have been activated.</p></div>
   <Link className="btn o" to="/courses/da">Back to Data Analysis</Link>
 </section>
}
