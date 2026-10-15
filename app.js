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
function openSetup(type){if(type)form.elements.type.value=type;msg.className='sub';msg.textContent='Organization setup preview; authentication is being connected.';dialog.showModal()}
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
  authMessage.textContent='You are signed in successfully. The organization dashboard is the next setup step.';
  otpVerify.hidden=true;otpArea.hidden=true;
 }catch(e){authMessage.textContent=e.message||'OTP verification failed. Request a new code.';}
 finally{otpVerify.disabled=false;}
});
form.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(form);const name=String(d.get('name')||'').trim();const type=String(d.get('type')||'');const slug=String(d.get('slug')||'').trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');msg.className='sub';msg.id='message';msg.classList.add('success');msg.textContent='Preview ready for “'+name+'” ('+type+'). '+(slug?'Suggested address: '+slug+'.example.com. ':'')+'This setup is still a preview and has not been saved to the database.'});
