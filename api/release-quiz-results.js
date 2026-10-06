export default async function handler(req,res){
  const auth=req.headers.authorization||'';
  if(auth!==`Bearer ${process.env.CRON_SECRET}`)return res.status(401).json({error:'Unauthorized'});
  const base=process.env.VITE_SUPABASE_URL;
  if(!base||!process.env.CRON_SECRET)return res.status(500).json({error:'Cron configuration missing'});
  try{
    const r=await fetch(base+'/rest/v1/rpc/cron_release_quiz_results',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        apikey:process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'',
        Authorization:'Bearer '+(process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'')
      },
      body:JSON.stringify({p_secret:process.env.CRON_SECRET})
    });
    const body=await r.text();
    if(!r.ok)return res.status(502).json({error:'Supabase release job failed',detail:body});
    return res.status(200).json({ok:true,released:Number(body)||0});
  }catch(e){
    return res.status(500).json({error:e.message||'Cron failed'});
  }
}