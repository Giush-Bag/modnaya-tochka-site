/* Модная точка — общие мелочи: мобильное меню (кнопка «Меню» из концепта). */
(function(){
const hdr=document.getElementById('hdr'), btn=hdr&&hdr.querySelector('.menu');
if(!btn) return;
const set=v=>{ hdr.classList.toggle('open',v); btn.setAttribute('aria-expanded',v); };
btn.addEventListener('click',()=>set(!hdr.classList.contains('open')));
hdr.querySelectorAll('.mnav a').forEach(a=>a.addEventListener('click',()=>set(false)));
addEventListener('keydown',e=>{ if(e.key==='Escape') set(false); });
document.addEventListener('click',e=>{ if(!hdr.contains(e.target)) set(false); });
})();

/* Нижняя панель на телефоне: после первого экрана; прячется у формы записи и при открытом меню/корзине. */
(function(){
const bar=document.getElementById('mbar'); if(!bar) return;
const hdr=document.getElementById('hdr'), book=document.getElementById('book');
let nearForm=false, tick=false;
const upd=()=>{ tick=false;
  bar.classList.toggle('on', scrollY>innerHeight*.7 && !nearForm && !(hdr&&hdr.classList.contains('open')) && !document.querySelector('.cart.on'));
};
const ask=()=>{ if(!tick){ tick=true; requestAnimationFrame(upd); } };
if(book&&'IntersectionObserver' in window) new IntersectionObserver(es=>{ nearForm=es[0].isIntersecting; ask(); },{rootMargin:'0px 0px -12% 0px'}).observe(book);
addEventListener('scroll',ask,{passive:true}); addEventListener('resize',ask);
document.addEventListener('click',()=>setTimeout(ask,0)); addEventListener('keydown',()=>setTimeout(ask,0));
upd();
})();

/* «До/после»: вертикальная шторка. Перетаскивание мышью и пальцем, клавиши ←/→/Home/End.
   Без JS — два фото рядом (стили html:not(.js)). */
(function(){
document.querySelectorAll('[data-ba]').forEach(stage=>{
  const handle=stage.querySelector('.ba-handle'); if(!handle) return;
  let pos=50, drag=false;
  const set=v=>{ pos=Math.max(0,Math.min(100,v)); stage.style.setProperty('--pos',pos+'%');
    handle.setAttribute('aria-valuenow',Math.round(pos)); handle.setAttribute('aria-valuetext',Math.round(pos)+'% — до слева, после справа'); };
  const fromEvent=e=>{ const r=stage.getBoundingClientRect(); set((e.clientX-r.left)/r.width*100); };
  stage.addEventListener('pointerdown',e=>{ e.stopPropagation(); if(e.button>0) return; drag=true; stage.classList.add('dragging'); stage.setPointerCapture(e.pointerId); fromEvent(e); });
  stage.addEventListener('pointermove',e=>{ if(drag){ e.preventDefault(); fromEvent(e); } });
  const end=()=>{ drag=false; stage.classList.remove('dragging'); };
  stage.addEventListener('pointerup',end); stage.addEventListener('pointercancel',end);
  stage.addEventListener('click',e=>e.stopPropagation());
  handle.addEventListener('keydown',e=>{
    const step=e.shiftKey?20:5, k={ArrowLeft:-step,ArrowDown:-step,ArrowRight:step,ArrowUp:step}[e.key];
    if(k!==undefined){ e.preventDefault(); set(pos+k); }
    else if(e.key==='Home'){ e.preventDefault(); set(0); }
    else if(e.key==='End'){ e.preventDefault(); set(100); }
  });
});
})();

/* Отзывы: длинный текст свёрнут до 5 строк — кнопка «Читать полностью» появляется, только если текст не влез. */
(function(){
const items=[...document.querySelectorAll('.review')]; if(!items.length) return;
const check=()=>items.forEach(r=>{
  const t=r.querySelector('.rv-text'), b=r.querySelector('.rv-more'); if(!t||!b||r.classList.contains('open')) return;
  b.hidden=t.scrollHeight<=t.clientHeight+2;
});
items.forEach(r=>{ const b=r.querySelector('.rv-more'); if(b) b.addEventListener('click',()=>{
  const open=!r.classList.contains('open'); r.classList.toggle('open',open); b.setAttribute('aria-expanded',open); b.textContent=open?'Свернуть':'Читать полностью';
}); });
check(); addEventListener('load',check); addEventListener('resize',check);
})();

/* Онлайн-запись YCLIENTS: если в настройках есть ссылка (body[data-yc]), кнопки [data-book] открывают окно с iframe.
   Телефон — на весь экран, компьютер — 480×720 по центру. Закрытие: ✕, Escape, клик по фону.
   Фокус не уходит из окна и возвращается на кнопку. Iframe не загрузился за 8 с — ссылка «в новой вкладке».
   Мастер и услуга подставляются параметром YCLIENTS ?o=m{ID мастера}s{ID услуги} (data-yc-staff / data-yc-service у кнопки). */
(function(){
const base=document.body.dataset.yc; if(!base) return;
const linkFor=el=>{
  const o=(el.dataset.ycStaff?'m'+el.dataset.ycStaff:'')+(el.dataset.ycService?'s'+el.dataset.ycService:'');
  if(!o) return base;
  const u=new URL(base); u.searchParams.set('o',o); return u.toString();
};
let url=base;
let modal, frame, fallback, timer, opener;
function build(){
  modal=document.createElement('div'); modal.className='ycm'; modal.hidden=true;
  modal.innerHTML='<div class="ycm-box" role="dialog" aria-modal="true" aria-label="Онлайн-запись">'
    +'<div class="ycm-h"><b>Онлайн-запись</b><button type="button" class="ycm-x" aria-label="Закрыть">×</button></div>'
    +'<div class="ycm-body"><p class="ycm-load">Загружаем запись…</p><iframe title="Онлайн-запись YCLIENTS" allow="payment"></iframe>'
    +'<p class="ycm-fb" hidden>Окно записи не загрузилось. <a target="_blank" rel="noopener">Открыть запись в новой вкладке</a></p></div></div>';
  document.body.append(modal);
  frame=modal.querySelector('iframe'); fallback=modal.querySelector('.ycm-fb');
  frame.addEventListener('load',()=>{ if(frame.src){ clearTimeout(timer); modal.classList.add('loaded'); } });
  modal.querySelector('.ycm-x').addEventListener('click',close);
  modal.addEventListener('click',e=>{ if(e.target===modal) close(); });
  modal.addEventListener('keydown',e=>{
    if(e.key==='Escape'){ e.preventDefault(); close(); return; }
    if(e.key!=='Tab') return;
    const f=[...modal.querySelectorAll('button,a[href],iframe')].filter(el=>!el.closest('[hidden]'));
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
  });
}
function open(from){
  if(!modal) build();
  opener=from; modal.hidden=false; document.documentElement.classList.add('ycm-on');
  url=linkFor(from);
  fallback.querySelector('a').href=url;
  // другая ссылка (другой мастер/услуга) — перезагрузить окно записи
  if(frame.getAttribute('src')!==url){
    clearTimeout(timer); modal.classList.remove('loaded'); fallback.hidden=true; frame.setAttribute('src',url);
    timer=setTimeout(()=>{ if(!modal.classList.contains('loaded')) fallback.hidden=false; },8000);
  }
  requestAnimationFrame(()=>modal.classList.add('on'));
  modal.querySelector('.ycm-x').focus();
}
function close(){
  modal.classList.remove('on'); modal.hidden=true; document.documentElement.classList.remove('ycm-on');
  if(opener&&opener.focus) opener.focus();
}
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-book]'); if(!a||e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey) return;
  e.preventDefault(); open(a);
});
})();

/* Страница отзывов: фильтр по направлению и «Показать ещё» по N — в браузере, без параметров в адресе. */
(function(){
const list=document.querySelector('[data-rv-list]'); if(!list) return;
const per=+list.dataset.perPage||12, items=[...list.querySelectorAll('.review')];
const more=document.querySelector('[data-rv-more]'), none=document.querySelector('[data-rv-none]'), chips=[...document.querySelectorAll('[data-rv-filter]')];
// /otzyvy#hair — сразу выбрать направление (ссылка «Все отзывы» со страницы услуги)
let group=chips.some(c=>c.dataset.rvFilter&&'#'+c.dataset.rvFilter===location.hash)?location.hash.slice(1):'', shown=per;
chips.forEach(x=>x.setAttribute('aria-pressed',x.dataset.rvFilter===group));
function render(){
  const match=items.filter(r=>!group||r.dataset.group===group);
  items.forEach(r=>r.hidden=true);
  match.slice(0,shown).forEach(r=>{ r.hidden=false; r.classList.add('in'); });
  if(more) more.hidden=match.length<=shown;
  if(none) none.hidden=match.length>0;
  window.dispatchEvent(new Event('resize')); // пересчитать «Читать полностью»
}
chips.forEach(c=>c.addEventListener('click',()=>{ group=c.dataset.rvFilter; shown=per; chips.forEach(x=>x.setAttribute('aria-pressed',x===c)); render(); }));
if(more) more.addEventListener('click',()=>{ shown+=per; render(); });
render();
})();
