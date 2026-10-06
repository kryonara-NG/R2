import { supabase } from './supabase';

export async function getProfile(userId){
  const {data,error}=await supabase.from('profiles').select('*').eq('id',userId).single();
  if(error) throw error;
  return data;
}
export async function getCourses(){
  const {data,error}=await supabase.from('courses').select('*').order('title');
  if(error) throw error;
  return data||[];
}
export async function getEnrollment(userId,courseId){
  const {data,error}=await supabase.from('enrollments').select('*').eq('user_id',userId).eq('course_id',courseId).maybeSingle();
  if(error) throw error;
  return data;
}
export async function getProgress(userId,courseId){
  const {data,error}=await supabase.from('progress').select('lesson_id,completed_at').eq('user_id',userId).eq('course_id',courseId);
  if(error) throw error;
  return data||[];
}
export async function completeLesson(userId,courseId,lessonId){
  const {error}=await supabase.from('progress').upsert({user_id:userId,course_id:courseId,lesson_id:lessonId,completed_at:new Date().toISOString()},{onConflict:'user_id,course_id,lesson_id'});
  if(error) throw error;
}
export async function getAssignments(courseId){
  const {data,error}=await supabase.from('assignments').select('*').eq('course_id',courseId).order('week_number').order('created_at');
  if(error) throw error;
  return data||[];
}
export async function getMySubmissions(userId){
  const {data,error}=await supabase.from('submissions').select('*, assignments(*), assessment_results(*)').eq('student_id',userId).order('submitted_at',{ascending:false});
  if(error) throw error;
  return data||[];
}
export async function submitAssignment({assignmentId,userId,text,url,file}){
  let filePath=null;
  if(file){if(file.size>20*1024*1024)throw new Error('Files must be 20 MB or smaller.');
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
    filePath=userId+'/'+assignmentId+'/'+Date.now()+'-'+safe;
    const {error}=await supabase.storage.from('submissions').upload(filePath,file,{contentType:file.type||undefined,upsert:false});
    if(error) throw error;
  }
  const payload={assignment_id:assignmentId,student_id:userId,status:'submitted',text_content:text||null,submission_url:url||null,submission_note:text||null,file_path:filePath,submitted_at:new Date().toISOString()};
  const {data,error}=await supabase.from('submissions').upsert(payload,{onConflict:'assignment_id,student_id'}).select().single();
  if(error) throw error;
  return data;
}
export async function adminIssueCertificate(submissionId){
  const {data,error}=await supabase.rpc('admin_issue_certificate',{p_submission_id:submissionId});
  if(error) throw error;
  return data;
}
export async function markNotificationRead(id){
  const {error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id);
  if(error) throw error;
}
export async function downloadSubmission(path){
  const {data,error}=await supabase.storage.from('submissions').createSignedUrl(path,3600);
  if(error) throw error;
  return data.signedUrl;
}
