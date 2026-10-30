const $=s=>document.querySelector(s);
let topZ=10;
const mobile=()=>matchMedia('(max-width:760px)').matches;
function openWindow(id){
  const w=document.getElementById(id);
  if(!w)return;
  w.classList.remove('is-hidden');
  w.style.zIndex=++topZ;
  $('#start-menu').hidden=true;
  $('#start').setAttribute('aria-expanded','false');
  if(mobile())w.scrollIntoView({
    behavior:'smooth',block:'center'
  }
  );
}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openWindow(b.dataset.open)));
document.querySelectorAll('[data-min],[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.min||b.dataset.close).classList.add('is-hidden')));
$('#start').onclick=()=>{
  const m=$('#start-menu');
  m.hidden=!m.hidden;
  $('#start').setAttribute('aria-expanded',String(!m.hidden));
}
;
document.addEventListener('click',e=>{
  if(!e.target.closest('#start-menu,#start')){
    $('#start-menu').hidden=true;
    $('#start').setAttribute('aria-expanded','false')
  }
}
);
document.querySelectorAll('.window').forEach(w=>{
  w.addEventListener('pointerdown',()=>w.style.zIndex=++topZ);
  const bar=w.querySelector('.titlebar');
  bar.addEventListener('pointerdown',e=>{
    if(mobile()||e.target.closest('button'))return;
    const desk=$('#desktop').getBoundingClientRect(),r=w.getBoundingClientRect();
    const dx=e.clientX-r.left,dy=e.clientY-r.top;
    w.style.left=(r.left-desk.left)+'px';
    w.style.top=(r.top-desk.top)+'px';
    w.style.right='auto';
    w.style.bottom='auto';
    bar.setPointerCapture(e.pointerId);
    bar.style.cursor='grabbing';
    function move(p){
      w.style.left=Math.min(Math.max(0,p.clientX-desk.left-dx),desk.width-w.offsetWidth)+'px';
      w.style.top=Math.min(Math.max(0,p.clientY-desk.top-dy),desk.height-35)+'px'
    }
    function end(){
      bar.removeEventListener('pointermove',move);
      bar.removeEventListener('pointerup',end);
      bar.removeEventListener('pointercancel',end);
      bar.style.cursor='move'
    }
    bar.addEventListener('pointermove',move);
    bar.addEventListener('pointerup',end);
    bar.addEventListener('pointercancel',end)
  }
  )
}
);
const captions=['밥 앞에선 진지한 보리','빼꼼, 뭐 하고 있어?','동그란 볼 가득 귀여움','작고 소중한 두 발','까만 눈으로 바라보기','오늘도 탐험 중','카메라가 궁금한 보리','맛있는 건 놓칠 수 없지','포근한 보리의 옆모습','가까이서 인사하기','산책할 준비 완료','느긋한 오후의 보리'];
const photos=captions.map((caption,i)=>({
  src:`assets/photo-${String(i+1).padStart(2,'0')}.jpg`,caption
}
));
let photoIndex=0;
function showPhoto(i){
  photoIndex=(i+photos.length)%photos.length;
  const p=photos[photoIndex];
  $('#large-photo').src=p.src;
  $('#large-photo').alt=p.caption;
  $('#photo-title').textContent=`bori_${String(photoIndex+1).padStart(2,'0')}.jpg - ${p.caption}`;
  $('#photo-count').textContent=`${photoIndex+1} / ${photos.length}`;
}
photos.forEach((p,i)=>{
  const b=document.createElement('button'),im=document.createElement('img');
  im.src=p.src;
  im.alt=p.caption;
  im.loading=i<6?'eager':'lazy';
  b.append(im);
  b.setAttribute('aria-label',p.caption+' 확대');
  b.onclick=()=>{
    showPhoto(i);
    $('#lightbox').showModal()
  }
  ;
  $('#album-grid').append(b)
}
);
$('#close-photo').onclick=()=>$('#lightbox').close();
$('#prev-photo').onclick=()=>showPhoto(photoIndex-1);
$('#next-photo').onclick=()=>showPhoto(photoIndex+1);
$('#lightbox').addEventListener('click',e=>{
  if(e.target===$('#lightbox')){
    const r=e.target.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()
  }
}
);
$('#lightbox').addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft')showPhoto(photoIndex-1);
  if(e.key==='ArrowRight')showPhoto(photoIndex+1)
}
);
const audio=$('#bgm');
audio.volume=.35;
function updatePlayer(){
  const active=!audio.paused;
  $('#music').classList.toggle('playing',active);
  $('#play').textContent=active?'Ⅱ':'▶';
  $('#play').setAttribute('aria-label',active?'배경 음악 일시정지':'배경 음악 재생');
  $('#play-status').textContent=active?'NOW PLAYING · LOOP':'PRESS PLAY TO LISTEN'
}
$('#play').onclick=async()=>{
  if(audio.paused){
    try{
      await audio.play()
    }
    catch{
      $('#play-status').textContent='재생하지 못했어요. 다시 눌러 주세요.'
    }
  }
  else audio.pause();
  updatePlayer()
}
;
$('#stop').onclick=()=>{
  audio.pause();
  audio.currentTime=0;
  updatePlayer()
}
;
$('#volume').oninput=e=>audio.volume=Number(e.target.value);
audio.addEventListener('play',updatePlayer);
audio.addEventListener('pause',updatePlayer);
audio.addEventListener('timeupdate',()=>{
  const t=Math.floor(audio.currentTime);
  $('#track-time').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')
}
);
audio.addEventListener('error',()=>$('#play-status').textContent='음악 파일을 불러오지 못했어요.');
let messages=[];
try{
  const data=JSON.parse(localStorage.getItem('bori-guestbook')||'[]');
  if(Array.isArray(data))messages=data.filter(x=>x&&typeof x.name==='string'&&typeof x.text==='string').slice(0,30)
}
catch{
}
function renderMessages(){
  const el=$('#guest-messages');
  el.replaceChildren();
  if(!messages.length){
    const p=document.createElement('p');
    p.className='empty-message';
    p.textContent='첫 번째 인사를 기다리고 있어요.';
    el.append(p)
  }
  messages.forEach(m=>{
    const a=document.createElement('article'),b=document.createElement('strong'),p=document.createElement('p'),t=document.createElement('small');
    b.textContent=m.name;
    p.textContent=m.text;
    t.textContent=m.date||'';
    a.append(b,p,t);
    el.append(a)
  }
  )
}
renderMessages();
$('#guest-form').onsubmit=e=>{
  e.preventDefault();
  const f=e.target,name=f.nickname.value.trim(),text=f.message.value.trim();
  if(!name||!text)return;
  messages.unshift({
    name,text,date:new Date().toLocaleDateString('ko-KR')
  }
  );
  messages=messages.slice(0,30);
  try{
    localStorage.setItem('bori-guestbook',JSON.stringify(messages))
  }
  catch{
  }
  renderMessages();
  f.reset()
}
;
function tick(){
  $('#clock').textContent=new Date().toLocaleTimeString('en-US',{
    hour:'2-digit',minute:'2-digit'
  }
  )
}
tick();
setInterval(tick,10000);
/* Draggable Bori characters and optional wall-bouncing motion. */
(function setupBoriMotion(){
  const desk=document.getElementById('desktop');
  const characters=[...desk.querySelectorAll('.character')];
  const controls=document.createElement('div');
  controls.className='bori-motion-controls';
  controls.setAttribute('aria-label','보리 움직임 설정');
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.id='bori-float';
  toggle.textContent='보리 둥둥: OFF';
  toggle.setAttribute('aria-pressed','false');
  const reset=document.createElement('button');
  reset.type='button';
  reset.textContent='원래 자리';
  reset.setAttribute('aria-label','보리 위치 초기화');
  const hint=document.createElement('span');
  hint.textContent='보리를 잡아서 옮겨 봐!';
  controls.append(hint,toggle,reset);
  desk.append(controls);
  let states=[],floating=false,initialized=false,frame=0,lastTime=0;
  const key='bori-character-positions-v1';
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function bounds(s){
    return {
      x:Math.max(0,desk.clientWidth-s.el.offsetWidth),y:Math.max(0,desk.clientHeight-s.el.offsetHeight)
    }
  }
  function paint(s){
    s.el.style.left=s.x+'px';
    s.el.style.top=s.y+'px'
  }
  function fit(s){
    const b=bounds(s);
    s.x=clamp(s.x,0,b.x);
    s.y=clamp(s.y,0,b.y);
    paint(s)
  }
  function save(){
    if(!initialized)return;
    try{
      localStorage.setItem(key,JSON.stringify(states.map(s=>{
        const b=bounds(s);
        return {
          x:b.x?s.x/b.x:0,y:b.y?s.y/b.y:0
        }
      }
      )))
    }
    catch{
    }
  }
  function initialize(){
    if(initialized)return;
    const dr=desk.getBoundingClientRect();
    states=characters.map((el,i)=>{
      const r=el.getBoundingClientRect();
      return {
        el,x:r.left-dr.left+(r.width-el.offsetWidth)/2,y:r.top-dr.top+(r.height-el.offsetHeight)/2,vx:[65,-55,45][i],vy:[42,58,-50][i],dragging:false
      }
    }
    );
    states.forEach(s=>{
      s.el.style.transform='none';
      s.el.style.right='auto';
      s.el.style.bottom='auto';
      fit(s)
    }
    );
    initialized=true;
  }
  function animate(time){
    frame=0;
    if(!floating)return;
    const dt=lastTime?Math.min((time-lastTime)/1000,.04):0;
    lastTime=time;
    states.forEach(s=>{
      if(s.dragging)return;
      const b=bounds(s);
      s.x+=s.vx*dt;
      s.y+=s.vy*dt;
      if(s.x<=0){
        s.x=0;
        s.vx=Math.abs(s.vx)
      }
      else if(s.x>=b.x){
        s.x=b.x;
        s.vx=-Math.abs(s.vx)
      }
      if(s.y<=0){
        s.y=0;
        s.vy=Math.abs(s.vy)
      }
      else if(s.y>=b.y){
        s.y=b.y;
        s.vy=-Math.abs(s.vy)
      }
      paint(s)
    }
    );
    frame=requestAnimationFrame(animate);
  }
  function setFloating(on){
    floating=on;
    toggle.textContent='보리 둥둥: '+(on?'ON':'OFF');
    toggle.setAttribute('aria-pressed',String(on));
    lastTime=0;
    if(on){
      initialize();
      states.forEach((s,i)=>{
        if(Math.hypot(s.vx,s.vy)<20){
          s.vx=i%2?-55:65;
          s.vy=45
        }
      }
      );
      if(!frame)frame=requestAnimationFrame(animate)
    }
    else{
      cancelAnimationFrame(frame);
      frame=0;
      save()
    }
  }
  toggle.addEventListener('click',()=>setFloating(!floating));
  reset.addEventListener('click',()=>{
    setFloating(false);
    characters.forEach(el=>{
      ['left','top','right','bottom','transform','z-index'].forEach(p=>el.style.removeProperty(p))
    }
    );
    states=[];
    initialized=false;
    try{
      localStorage.removeItem(key)
    }
    catch{
    }
  }
  );
  characters.forEach((el,i)=>{
    el.tabIndex=0;
    el.setAttribute('aria-label',el.alt+' — 드래그하거나 방향키로 이동');
    el.title='드래그해서 이동 · 방향키로 이동';
    el.addEventListener('pointerdown',e=>{
      if(e.button!==0&&e.pointerType==='mouse')return;
      e.preventDefault();
      initialize();
      const s=states[i];
      s.dragging=true;
      s.el.style.zIndex=++topZ;
      s.el.classList.add('is-dragging');
      const r=desk.getBoundingClientRect(),dx=e.clientX-r.left-s.x,dy=e.clientY-r.top-s.y;
      let px=e.clientX,py=e.clientY,pt=performance.now(),moved=false;
      s.el.setPointerCapture(e.pointerId);
      function move(p){
        const dr=desk.getBoundingClientRect(),b=bounds(s),now=performance.now(),dt=Math.max((now-pt)/1000,.008);
        moved=true;
        s.vx=clamp((p.clientX-px)/dt,-500,500);
        s.vy=clamp((p.clientY-py)/dt,-500,500);
        px=p.clientX;
        py=p.clientY;
        pt=now;
        s.x=clamp(p.clientX-dr.left-dx,0,b.x);
        s.y=clamp(p.clientY-dr.top-dy,0,b.y);
        paint(s)
      }
      function end(p){
        s.dragging=false;
        s.el.classList.remove('is-dragging');
        if(!moved||performance.now()-pt>120||p.type==='pointercancel'){
          s.vx=55;
          s.vy=45
        }
        if(s.el.hasPointerCapture(e.pointerId))s.el.releasePointerCapture(e.pointerId);
        s.el.removeEventListener('pointermove',move);
        s.el.removeEventListener('pointerup',end);
        s.el.removeEventListener('pointercancel',end);
        save()
      }
      s.el.addEventListener('pointermove',move);
      s.el.addEventListener('pointerup',end);
      s.el.addEventListener('pointercancel',end);
    }
    );
    el.addEventListener('keydown',e=>{
      const dirs={
        ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]
      }
      ;
      if(!dirs[e.key]||matchMedia('(max-width:1100px)').matches)return;
      e.preventDefault();
      initialize();
      const s=states[i],step=e.shiftKey?30:12;
      s.x+=dirs[e.key][0]*step;
      s.y+=dirs[e.key][1]*step;
      s.el.style.zIndex=++topZ;
      fit(s);
      save()
    }
    );
  }
  );
  let resizeTimer;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      if(initialized){
        states.forEach(fit);
        save()
      }
    }
    ,120)
  }
  );
  document.addEventListener('visibilitychange',()=>{
    lastTime=0
  }
  );
  // Restore only saved positions; movement is always OFF on a fresh page load.
  Promise.all(characters.map(el=>el.complete?Promise.resolve():new Promise(resolve=>{
    el.addEventListener('load',resolve,{
      once:true
    }
    );
    el.addEventListener('error',resolve,{
      once:true
    }
    )
  }
  ))).then(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(key)||'null');
      if(Array.isArray(saved)&&saved.length===characters.length&&saved.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y))){
        initialize();
        states.forEach((s,i)=>{
          const b=bounds(s);
          s.x=clamp(saved[i].x,0,1)*b.x;
          s.y=clamp(saved[i].y,0,1)*b.y;
          paint(s)
        }
        )
      }
    }
    catch{
    }
  }
  );
}
)();

