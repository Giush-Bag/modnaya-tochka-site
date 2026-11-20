/* Модная точка — главная: прайс, лайтбокс, анимации, карусель (перенесено из concept/index.html) */
(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const smooth=()=>({behavior:reduce?'auto':'smooth'});

/* ---------- price: карточки категорий (разметка приходит с сервера и работает без JS) ----------
   лента/меню категорий со слежением за прокруткой, поиск, Ж/М, «Показать все», выбор услуги для записи */
const fs=$('#fs');
const pickService=id=>{ if(fs&&id&&fs.querySelector(`option[value="${CSS.escape(String(id))}"]`)) fs.value=id; };

// Переход из статьи блога: /?service=ID#book — услуга подставляется в форму.
const qs=new URLSearchParams(location.search);
pickService(qs.get('service'));
// Со страницы услуги: /?master=ID#book — мастер подставляется в форму.
(()=>{ const fm=$('#fm'), id=qs.get('master'); if(fm&&id&&fm.querySelector(`option[value="${CSS.escape(id)}"]`)) fm.value=id; })();

const pr=$('#pr');
if(pr){
  const bar=$('#prBar'), chipsBox=$('#chips'), chips=$$('.chip',chipsBox), q=$('#q'), sbtn=$('#prSbtn'), sx=$('#prSx'), empty=$('#prEmpty');
  const cats=$$('.pcat',pr).sort((a,b)=>a.dataset.order-b.dataset.order);
  const mobile=matchMedia('(max-width: 860px)');
  let active=cats[0]?.dataset.cat, lock=0;

  function setActive(id){
    active=id;
    chips.forEach(c=>{
      const on=c.dataset.id===id; c.setAttribute('aria-selected',on);
      if(on&&mobile.matches) chipsBox.scrollTo({left:c.offsetLeft-chipsBox.offsetLeft-12,...smooth()});
    });
  }
  function go(id){
    const el=document.getElementById('price-'+id);
    if(q.value){ q.value=''; filter(); }
    lock=Date.now()+900;
    (el||$('#price')).scrollIntoView({block:'start',...smooth()});
    if(el) setActive(id);
  }
  chips.forEach(c=>c.addEventListener('click',()=>go(c.dataset.id)));

  // активная категория — та, чей верх последним прошёл под лентой/шапкой
  let spyTick=false;
  function spy(){
    spyTick=false;
    if(pr.classList.contains('searching')||Date.now()<lock) return;
    const box=pr.getBoundingClientRect(); if(box.bottom<0||box.top>innerHeight) return;
    const line=mobile.matches?176:150; let cur=null, best=-Infinity;
    // в двух колонках на десктопе берём карточку, верх которой ближе всего к линии сверху
    cats.forEach(c=>{ const t=c.getBoundingClientRect().top; if(!c.hidden&&t<=line&&t>best){ best=t; cur=c; } });
    const id=(cur||cats[0]).dataset.cat; if(id!==active) setActive(id);
  }
  addEventListener('scroll',()=>{ if(!spyTick){ spyTick=true; requestAnimationFrame(spy); } },{passive:true});
  // Ж/М — только в категориях с таким делением (депиляция)
  cats.forEach(cat=>{
    const btns=$$('.toggle button',cat); if(!btns.length) return;
    const set=g=>{ cat.dataset.g=g; btns.forEach(b=>b.setAttribute('aria-pressed',b.dataset.g===g)); $$('.ppanel',cat).forEach(p=>p.hidden=p.dataset.g!==g); };
    btns.forEach(b=>b.addEventListener('click',()=>set(b.dataset.g))); set(btns[0].dataset.g);
  });

  // «Показать все (N)»
  $$('.pmore',pr).forEach(b=>b.addEventListener('click',()=>{
    const x=document.getElementById(b.getAttribute('aria-controls')), open=!x.classList.contains('open');
    x.classList.toggle('open',open); b.setAttribute('aria-expanded',open); b.textContent=open?b.dataset.less:b.dataset.more;
    if(!open) b.closest('.pcat').scrollIntoView({block:'nearest'});
  }));

  // поиск по всем категориям
  const rows=$$('.slist li',pr).map(li=>({li,text:li.querySelector('.n').textContent.toLowerCase()}));
  function filter(){
    const term=q.value.trim().toLowerCase(); let total=0;
    pr.classList.toggle('searching',!!term);
    rows.forEach(r=>r.li.hidden=!!term&&!r.text.includes(term));
    cats.forEach(cat=>{
      let n=0;
      $$('.ppanel',cat).forEach(p=>{
        const k=$$('li:not([hidden])',p).length; n+=k;
        p.hidden=term?!k:(cat.dataset.g!==undefined&&p.dataset.g!==cat.dataset.g);
      });
      cat.hidden=!!term&&!n; total+=n;
    });
    empty.hidden=!term||total>0;
    if(term){
      chips.forEach(c=>c.setAttribute('aria-selected',false));
      if(pr.getBoundingClientRect().top<0) scrollTo({top:scrollY+pr.getBoundingClientRect().top-(mobile.matches?84:104)});
    } else setActive(active);
  }
  q.addEventListener('input',filter);
  const openSearch=v=>{
    bar.classList.toggle('search-open',v); sbtn.setAttribute('aria-expanded',v);
    if(v) q.focus(); else { if(q.value){ q.value=''; filter(); } sbtn.focus(); }
  };
  sbtn.addEventListener('click',()=>openSearch(true));
  sx.addEventListener('click',()=>openSearch(false));
  q.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if(mobile.matches) openSearch(false); else { q.value=''; filter(); } });

  // вся строка — ссылка на #book; услуга подставляется в форму записи
  pr.addEventListener('click',e=>{ const r=e.target.closest('.srow'); if(r) pickService(r.dataset.sid); });
}

/* ---------- lightbox + master ---------- */
const lb=$('#lb');
if(lb){
  $$('.cert').forEach(c=>c.onclick=()=>{ const i=c.querySelector('img'); lb.querySelector('img').src=c.dataset.full||i.src; lb.querySelector('img').alt=i.alt; lb.showModal(); });
  lb.querySelector('.lb-x').onclick=()=>lb.close(); lb.addEventListener('click',e=>{ if(e.target===lb) lb.close(); });
}
$$('[data-master]').forEach(a=>a.addEventListener('click',()=>{ const fm=$('#fm'); if(fm) fm.value=a.dataset.master; }));

/* ---------- form: заявка на запись → POST /booking ----------
   Успех показываем только после ответа сервера о сохранении (201). */
const form=$('#form');
if(form) form.addEventListener('submit',async e=>{
  e.preventDefault();
  const ok=$('#ok'), btn=form.querySelector('button[type=submit]');
  if(!$('#fn').value.trim()||!$('#fp').value.trim()){ ok.textContent='Укажите имя и телефон.'; return; }
  if(!$('#fconsent').checked){ ok.textContent='Подтвердите согласие на обработку персональных данных.'; return; }
  btn.disabled=true; const label=btn.textContent; btn.textContent='Отправляем…'; ok.textContent='';
  try{
    const res=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json','X-Requested-With':'XMLHttpRequest'},credentials:'same-origin'});
    const data=await res.json().catch(()=>({}));
    if(res.status===201&&data.ok){ ok.textContent=data.message; form.reset(); }
    else if(res.status===422&&data.errors){ ok.textContent=Object.values(data.errors)[0][0]; }
    else if(res.status===419){ ok.textContent='Страница устарела — обновите её и отправьте заявку ещё раз.'; }
    else { ok.textContent=data.message||'Не удалось отправить заявку. Позвоните нам, пожалуйста.'; }
  }catch(err){ ok.textContent='Нет связи с сервером. Проверьте интернет или позвоните нам.'; }
  finally{ btn.disabled=false; btn.textContent=label; }
});

/* ---------- motion ---------- */
const hero=$('#hero'); if(hero) requestAnimationFrame(()=>requestAnimationFrame(()=>hero.classList.add('in')));
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{rootMargin:'0px 0px -10% 0px',threshold:.08});
$$('[data-reveal]').forEach(el=>io.observe(el));

const ig=$('#ignite');
if(ig) (function wrap(n){[...n.childNodes].forEach(c=>{ if(c.nodeType===3){ const f=document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(w=>{ if(!w)return; if(/^\s+$/.test(w)) f.append(w); else { const s=document.createElement('span'); s.className='w'; s.textContent=w; f.append(s);} }); c.replaceWith(f);} else wrap(c); })})(ig);
const words=ig?$$('.w',ig):[];
const hdr=$('#hdr'), banner=$('#banner'), bclip=$('#bclip'), bimg=$('#bimg');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)); let tick=false;
const lite=matchMedia('(max-width: 860px)'); // телефон: баннер без параллакса и раскрытия
function onScroll(){ tick=false; const vh=innerHeight;
  hdr.classList.toggle('small',scrollY>40);
  if(ig){ const r=ig.getBoundingClientRect(); const p=reduce?1:clamp((vh*.85-r.top)/(r.height+vh*.45)); const lit=Math.round(p*words.length); words.forEach((w,i)=>w.classList.toggle('on',i<lit)); }
  if(reduce||!banner||lite.matches) return;
  const br=banner.getBoundingClientRect(); const maxI=Math.max(16,(innerWidth-1240)/2); const bp=clamp((vh-br.top)/(vh*.85));
  bclip.style.setProperty('--bi',(maxI*(1-bp)).toFixed(1)+'px'); bclip.style.setProperty('--br',(24*(1-bp)).toFixed(1)+'px');
  bimg.style.setProperty('--py',((clamp((vh-br.top)/(vh+br.height))-.5)*-10).toFixed(2)+'%');
}
addEventListener('scroll',()=>{ if(!tick){tick=true;requestAnimationFrame(onScroll)} },{passive:true}); addEventListener('resize',onScroll); onScroll();

/* ---------- works carousel: вкладки направлений («Волосы», «Ногти»), без JS видны все карточки ---------- */
const track=$('#track');
if(track){
  const all=$$('.work',track), prev=$('#prev'), next=$('#next'), count=$('#count'), bar=$('#prog'), tabs=$$('.wtabs .chip');
  let cards=all;
  const step=()=>(cards[0]?cards[0].offsetWidth:300)+18;
  function upd(){ const max=track.scrollWidth-track.clientWidth, x=track.scrollLeft; const vis=Math.max(1,Math.round(track.clientWidth/step()));
    count.innerHTML=`<b>${String(Math.min(cards.length,Math.round(x/step())+1)).padStart(2,'0')}</b> / ${String(cards.length).padStart(2,'0')}`;
    prev.disabled=x<4; next.disabled=x>max-4; const w=Math.min(1,vis/Math.max(1,cards.length)); bar.style.width=w*100+'%'; bar.style.transform=`translateX(${(max>0?x/max:0)*(100/w-100)}%)`; }
  function show(g){
    tabs.forEach(t=>t.setAttribute('aria-selected',t.dataset.group===g));
    all.forEach(c=>c.hidden=!!g&&!!c.dataset.group&&c.dataset.group!==g);
    cards=all.filter(c=>!c.hidden); track.scrollLeft=0; upd();
  }
  tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.group)));
  if(tabs.length) show(track.dataset.group||tabs[0].dataset.group);
  let mvT; track.addEventListener('scroll',()=>{ upd(); track.classList.add('moving'); clearTimeout(mvT); mvT=setTimeout(()=>track.classList.remove('moving'),250); },{passive:true});
  addEventListener('resize',upd); upd();
  prev.onclick=()=>track.scrollBy({left:-step(),...smooth()}); next.onclick=()=>track.scrollBy({left:step(),...smooth()});
  let down=false,sx=0,sl=0,moved=false;
  track.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse')return; down=true;moved=false;sx=e.clientX;sl=track.scrollLeft; });
  addEventListener('pointermove',e=>{ if(!down)return; const dx=e.clientX-sx; if(Math.abs(dx)>4){moved=true;track.classList.add('drag')} track.scrollLeft=sl-dx; });
  addEventListener('pointerup',()=>{ if(!down)return; down=false; if(moved){ track.classList.remove('drag'); track.scrollTo({left:Math.round(track.scrollLeft/step())*step(),behavior:'smooth'}); } });
}
})();
