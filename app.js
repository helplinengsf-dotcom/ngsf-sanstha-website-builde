// Sanstha Builder authentication. Public publishable key only; never place service-role keys in browser code.
const SUPABASE_URL = "https://vzppatavaqgpkiyoenvp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XkcN2k0P0y9uFiF3pG9f6g_xB4X3Tb6";
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const dialog=document.getElementById('setup');
const form=document.getElementById('orgForm');
const msg=document.getElementById('message');
const authDialog=document.getElementById('authDialog');
const authForm=document.getElementById('authForm');
const method=document.getElementById('otpMethod');
const identity=document.getElementById('identity');
const identityLabel=document.getElementById('identityLabel');
const otpArea=document.getElementById('otpArea');
const otpCode=document.getElementById('otpCode');
const otpSend=document.getElementById('otpSend');
const otpVerify=document.getElementById('otpVerify');
const authMessage=document.getElementById('authMessage');
let pendingIdentity='';
let pendingMethod='email';
function openSetup(type){if(type)form.elements.type.value=type;msg.className='sub';msg.textContent='Sign in first to save your organization profile. Your data will be stored in your separate workspace.';dialog.showModal()}
function openAuth(){authMessage.className='sub';authMessage.textContent='Enter your email or mobile number to receive a one-time code.';otpArea.hidden=true;otpVerify.hidden=true;otpSend.hidden=false;authDialog.showModal()}
document.querySelectorAll('.open').forEach(b=>b.addEventListener('click',()=>openSetup()));
document.getElementById('login').addEventListener('click',openAuth);
document.querySelectorAll('.choose').forEach(b=>b.addEventListener('click',()=>openSetup(b.dataset.type)));
document.getElementById('close').addEventListener('click',()=>dialog.close());
document.getElementById('authClose').addEventListener('click',()=>authDialog.close());
document.getElementById('menu').addEventListener('click',()=>document.getElementById('nav').classList.toggle('mobile'));
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>document.getElementById('nav').classList.remove('mobile')));
method.addEventListener('change',()=>{
 const sms=method.value==='sms';
 identity.type=sms?'tel':'email';
 identity.autocomplete=sms?'tel':'email';
 identity.placeholder=sms?'+919876543210':'you@example.com';
 identityLabel.firstChild.textContent=sms?'Mobile number (include country code)':'Email address';
 identity.value='';
});
otpSend.addEventListener('click',async()=>{
 if(!supabaseClient){authMessage.textContent='Supabase client failed to load. Please refresh and try again.';return;}
 const value=identity.value.trim();
 if(!value){authMessage.textContent=method.value==='sms'?'Enter a mobile number with country code.':'Enter your email address.';return;}
 const sms=method.value==='sms';
 if(sms&&!/^\+[1-9]\d{7,14}$/.test(value)){authMessage.textContent='Use international format, e.g. +919876543210.';return;}
 if(!sms&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){authMessage.textContent='Enter a valid email address.';return;}
 otpSend.disabled=true;authMessage.textContent='Sending OTP…';
 try{
  const result=await supabaseClient.auth.signInWithOtp(sms?{phone:value,options:{channel:'sms'}}:{email:value,options:{shouldCreateUser:true}});
  if(result.error)throw result.error;
  pendingIdentity=value;pendingMethod=sms?'sms':'email';
  otpArea.hidden=false;otpVerify.hidden=false;otpSend.hidden=true;
  authMessage.textContent='OTP requested. Check your '+(sms?'SMS':'email')+'; delivery depends on your Supabase provider settings.';
  otpCode.focus();
 }catch(e){authMessage.textContent=e.message||'Could not send OTP. Check Supabase Auth settings.';}
 finally{otpSend.disabled=false;}
});
otpVerify.addEventListener('click',async()=>{
 const token=otpCode.value.trim();
 if(!/^\d{6}$/.test(token)){authMessage.textContent='Enter the 6-digit OTP.';return;}
 otpVerify.disabled=true;authMessage.textContent='Verifying OTP…';
 try{
  const result=await supabaseClient.auth.verifyOtp(pendingMethod==='sms'?{phone:pendingIdentity,token,type:'sms'}:{email:pendingIdentity,token,type:'email'});
  if(result.error)throw result.error;
  authMessage.textContent='You are signed in successfully.';
  otpVerify.hidden=true;otpArea.hidden=true; await showDashboard();
 }catch(e){authMessage.textContent=e.message||'OTP verification failed. Request a new code.';}
 finally{otpVerify.disabled=false;}
});
form.addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(form);const name=String(d.get('name')||'').trim();const type=String(d.get('type')||'').trim();const authorized_person_name=String(d.get('authorized_person_name')||'').trim();const address=String(d.get('address')||'').trim();const contact_phone=String(d.get('contact_phone')||'').trim();const registration_year=Number(d.get('registration_year'));let slug=String(d.get('slug')||'').trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');if(!slug)slug=name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');msg.className='sub';msg.id='message';msg.classList.remove('success');if(!supabaseClient){msg.textContent='Supabase client did not load. Refresh and try again.';return;}if(!name||!type||!authorized_person_name||!address||!contact_phone||!registration_year){msg.textContent='Please complete all required organization profile fields.';return;}if(registration_year<1800||registration_year>new Date().getFullYear()){msg.textContent='Please enter a valid registration year.';return;}if(!slug){msg.textContent='Please enter a preferred website address, or use an organization name that can form one.';return;}if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){msg.textContent='Use only lowercase letters, numbers and single hyphens in the website address.';return;}const {data:{user},error:userError}=await supabaseClient.auth.getUser();if(userError||!user){msg.textContent='Please log in with Email or Mobile OTP first. Close this form and select Log in.';return;}const submit=form.querySelector('button[type="submit"]');submit.disabled=true;msg.textContent='Saving your organization securely…';try{const {data,error}=await supabaseClient.from('organizations').insert({name,organization_type:type,slug,created_by:user.id,authorized_person_name,address,contact_phone,registration_year,profile_completed:true}).select('id,name,slug,organization_type,description,logo_url,contact_email,contact_phone,address,authorized_person_name,registration_year,profile_completed').single();if(error)throw error;activeOrganization=data;msg.classList.add('success');msg.textContent='Organization saved successfully: '+data.name+'.';form.reset();await showDashboard();}catch(err){msg.textContent=err.message||'Could not save organization. Check login and try another website address.';}finally{submit.disabled=false;}});

/* Organization dashboard: all queries are scoped to the signed-in user's memberships. */
let activeOrganization=null;
let activeView='overview';
const dash=document.getElementById('dashboard');
const dashView=document.getElementById('dashView');
const landing=document.querySelector('main > section.hero');
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n||0));
function safe(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function showDashboard(){
 if(!supabaseClient)return;
 const {data:{user}}=await supabaseClient.auth.getUser();
 if(!user)return;
 const {data:memberships,error}=await supabaseClient.from('organization_members').select('organization_id,role,organizations(id,name,slug,organization_type,description,logo_url,contact_email,contact_phone,address,authorized_person_name,registration_year,profile_completed)').eq('user_id',user.id);
 if(error){authMessage.textContent='Signed in, but workspace could not load: '+error.message;return;}
 if(!memberships?.length){authMessage.textContent='You are signed in. Create your organization profile to open your workspace.';return;}
 activeOrganization=memberships[0].organizations;
 if(!activeOrganization){authMessage.textContent='Organization membership is not ready yet. Refresh in a moment.';return;}
 dash.hidden=false;
 document.querySelectorAll('main > section:not(#dashboard)').forEach(s=>s.hidden=true);
 document.querySelector('.cta')?.setAttribute('hidden','');
 document.getElementById('dashOrgName').textContent=activeOrganization.name;
 document.getElementById('dashStatus').textContent=activeOrganization.profile_completed?'Profile saved · '+activeOrganization.organization_type:'Complete your profile to publish your website';
 dash.scrollIntoView({behavior:'smooth',block:'start'});
 await renderDashboard();
}
async function fetchRows(table,fields='*'){const {data,error}=await supabaseClient.from(table).select(fields).eq('organization_id',activeOrganization.id);if(error)throw error;return data||[];}
function card(title,description,button,view){return '<article class="dashcard"><div class="dashicon">✦</div><h3>'+safe(title)+'</h3><p>'+safe(description)+'</p><button class="btn primary" data-view="'+view+'">'+safe(button)+' →</button></article>';}
async function renderDashboard(){
 if(!activeOrganization)return;
 const nav=document.getElementById('dashNav');nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.view===activeView));
 try{
 if(activeView==='overview'){
 const [members,news,team,projects,donors]=await Promise.all([
 fetchRows('members','id,verification_status'),fetchRows('news_events','id,content_type,status'),fetchRows('team_members','id'),fetchRows('projects','id,status'),fetchRows('donors','id,amount,verification_status')]);
 dashView.innerHTML='<div class="dashstats"><div><b>'+members.length+'</b><span>Members</span></div><div><b>'+news.length+'</b><span>Activities / News</span></div><div><b>'+team.length+'</b><span>Team Members</span></div><div><b>'+projects.length+'</b><span>Projects</span></div><div><b>'+money(donors.reduce((s,d)=>s+Number(d.amount||0),0))+'</b><span>Donations recorded</span></div></div><div class="dashgrid">'+card('Members','Add and manage member records','Add member','members')+card('Activities / News','Post organization updates and events','Add activity','content')+card('Management Team','Manage public team profiles','Add team member','team')+card('Projects','Track your organization projects','Add project','projects')+card('Donors & Donations','Keep donation records organized','Add donor','donors')+card('Organization Profile','Update your organization information','Edit profile','profile')+'</div>';
 }else if(activeView==='profile'){
 const o=activeOrganization;
 dashView.innerHTML='<div class="dashpanel"><h3>Organization Profile</h3><form id="profileEdit" class="dashform"><label>Organization name<input name="name" required value="'+safe(o.name)+'"></label><label>Organization type<input name="organization_type" required value="'+safe(o.organization_type)+'"></label><label>Website address / slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value="'+safe(o.slug)+'"></label><label>Authorized person<input name="authorized_person_name" required value="'+safe(o.authorized_person_name||'')+'"></label><label>Address<textarea name="address" required>'+safe(o.address||'')+'</textarea></label><label>Mobile<input name="contact_phone" value="'+safe(o.contact_phone||'')+'"></label><label>Email<input name="contact_email" type="email" value="'+safe(o.contact_email||'')+'"></label><label>Registration year<input name="registration_year" type="number" min="1800" max="'+new Date().getFullYear()+'" value="'+safe(o.registration_year||'')+'"></label><label>About organization<textarea name="description">'+safe(o.description||'')+'</textarea></label><button class="btn primary" type="submit">Save profile</button><p id="profileMsg" class="sub"></p></form></div>';
 document.getElementById('profileEdit').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const d=Object.fromEntries(new FormData(f));d.registration_year=d.registration_year?Number(d.registration_year):null;d.profile_completed=Boolean(d.name&&d.organization_type&&d.slug&&d.authorized_person_name&&d.address&&d.contact_phone);const m=document.getElementById('profileMsg');try{const {data,error}=await supabaseClient.from('organizations').update(d).eq('id',activeOrganization.id).select('id,name,slug,organization_type,description,logo_url,contact_email,contact_phone,address,authorized_person_name,registration_year,profile_completed').single();if(error)throw error;activeOrganization=data;document.getElementById('dashOrgName').textContent=data.name;m.textContent='Profile saved successfully.';document.getElementById('dashStatus').textContent=data.profile_completed?'Profile saved · '+data.organization_type:'Profile saved · some details are still required';}catch(err){m.textContent=err.message||'Could not save profile.';}});
 }else{
 const config={
 members:{table:'members',title:'Members',fields:[['full_name','Full name','text'],['member_id','Member ID','text'],['mobile','Mobile','tel'],['email','Email','email'],['city','City','text'],['address','Address','text']],columns:['full_name','member_id','mobile','city','verification_status']},
 content:{table:'news_events',title:'Activities / News / Events',fields:[['content_type','Type','select'],['title','Title','text'],['body','Description','textarea'],['event_date','Date (optional)','date']],columns:['content_type','title','status','event_date']},
 team:{table:'team_members',title:'Management Team',fields:[['full_name','Full name','text'],['position','Position','text'],['bio','Short biography','textarea']],columns:['full_name','position','bio']},
 projects:{table:'projects',title:'Projects',fields:[['title','Project title','text'],['description','Description','textarea'],['status','Status','select']],columns:['title','status','description']},
 donors:{table:'donors',title:'Donors & Donations',fields:[['full_name','Donor name','text'],['mobile','Mobile','tel'],['email','Email','email'],['amount','Donation amount (₹)','number'],['donation_date','Donation date','date'],['purpose','Purpose','text']],columns:['full_name','mobile','amount','purpose','verification_status']}
 }[activeView];
 const rows=await fetchRows(config.table);
 const fieldHtml=config.fields.map(([name,label,type])=>'<label>'+safe(label)+(type==='select'?'<select name="'+name+'">'+(name==='content_type'?'<option value="activity">Activity</option><option value="news">News</option><option value="event">Event</option>':'<option value="active">Active</option><option value="planned">Planned</option><option value="completed">Completed</option><option value="archived">Archived</option>')+'</select>':type==='textarea'?'<textarea name="'+name+'"></textarea>':'<input name="'+name+'" type="'+type+'" '+(['full_name','title'].includes(name)?'required':'')+' '+(name==='amount'?'min="0" step="0.01"':'')+'>')+'</label>').join('');
 dashView.innerHTML='<div class="dashpanel"><div class="panelhead"><div><h3>'+safe(config.title)+'</h3><p>'+rows.length+' record(s)</p></div><button class="btn primary" id="toggleAdd">+ Add new</button></div><form id="recordForm" class="dashform" hidden>'+fieldHtml+'<button class="btn primary" type="submit">Save record</button><p id="recordMsg" class="sub"></p></form><div class="tablewrap"><table><thead><tr>'+config.columns.map(c=>'<th>'+safe(c.replaceAll('_',' '))+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+config.columns.map(c=>'<td>'+safe(c==='amount'?money(r[c]):r[c]||'—')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></div>';
 document.getElementById('toggleAdd').addEventListener('click',()=>{document.getElementById('recordForm').hidden=!document.getElementById('recordForm').hidden;});
 document.getElementById('recordForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const d=Object.fromEntries(new FormData(f));d.organization_id=activeOrganization.id;if(config.table==='members'){d.verification_status='unverified';if(!d.member_id)d.member_id='MEM-'+Date.now().toString().slice(-8);}if(config.table==='news_events'){d.status='draft';if(d.event_date)d.event_date=new Date(d.event_date+'T12:00:00').toISOString();else delete d.event_date;}if(config.table==='team_members')d.is_public=true;if(config.table==='donors'){d.amount=Number(d.amount||0);d.verification_status='unverified';}const m=document.getElementById('recordMsg');try{const {error}=await supabaseClient.from(config.table).insert(d);if(error)throw error;await renderDashboard();}catch(err){m.textContent=err.message||'Could not save record.';}});
 }
 }catch(err){dashView.innerHTML='<div class="dashpanel"><h3>Could not load this section</h3><p>'+safe(err.message||'Check table permissions and connection.')+'</p></div>';}
}
document.getElementById('dashNav').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(!b)return;activeView=b.dataset.view;renderDashboard();});
document.getElementById('signOut').addEventListener('click',async()=>{await supabaseClient.auth.signOut();activeOrganization=null;dash.hidden=true;document.querySelectorAll('main > section').forEach(s=>s.hidden=false);document.querySelector('.cta')?.removeAttribute('hidden');openAuth();});

if(supabaseClient){supabaseClient.auth.getSession().then(({data})=>{if(data?.session)showDashboard();});supabaseClient.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'&&session)setTimeout(()=>showDashboard(),0);});}
