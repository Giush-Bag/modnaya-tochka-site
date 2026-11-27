/* Модная точка — общий скрипт: корзина + анимации появления (из concept/cart.js).
   Корзина хранится в localStorage, но цены и наличие сверяются с сервером (/cart/sync),
   а заказ оформляется через POST /orders — сервер заново считает все цены по БД. */
(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const fmt=n=>Math.round(n).toLocaleString('ru-RU').replace(/ | /g,' ');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csrf=()=>document.querySelector('meta[name=csrf-token]')?.content||'';
const SHOP=document.body.dataset.shopUrl||'/shop';
const PRIVACY=document.body.dataset.privacyUrl||'/privacy';
document.documentElement.classList.add('js');

/* Магазин выключен в настройках — корзина не создаётся, остаются только анимации появления. */
if(document.body.dataset.shop==='1'){
/* ---------- storage: [{id: variantId, name, cat, opt, price, img, q}] ---------- */
const KEY='mt_cart_v2'; let mem=[];
try{ localStorage.removeItem('mt_cart_v1'); }catch(e){} // демо-корзина концепта
const load=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'[]').filter(i=>i&&+i.id>0&&+i.q>0) }catch(e){ return mem } };
const save=c=>{ mem=c; try{ localStorage.setItem(KEY,JSON.stringify(c)) }catch(e){} render(); };

/* ---------- drawer markup ---------- */
const d=document.createElement('div');
d.innerHTML=`
<div class="cart-ov" data-cart-close></div>
<aside class="cart" role="dialog" aria-modal="true" aria-label="Корзина" aria-hidden="true">
  <div class="cart-h"><h3>Корзина <span class="cart-c"></span></h3><button class="cart-x" data-cart-close aria-label="Закрыть">×</button></div>
  <div class="cart-step s1">
    <ul class="cart-list"></ul>
    <div class="cart-empty"><p>Корзина пока пуста</p><a href="${esc(SHOP)}" class="btn btn-line" data-cart-close>Перейти в магазин</a></div>
    <div class="cart-f">
      <div class="cart-sum"><span>Итого</span><b class="cart-total">0 ₽</b></div>
      <p class="cart-note">Самовывоз из студии. Оплата при получении.</p>
      <button class="btn btn-main cart-go">Оформить заказ</button>
    </div>
  </div>
  <form class="cart-step s2" novalidate>
    <button type="button" class="cart-back">← Назад к корзине</button>
    <div class="hp" aria-hidden="true"><label>Сайт<input name="website" tabindex="-1" autocomplete="off"></label></div>
    <label>Имя<input name="n" required maxlength="100" autocomplete="name" placeholder="Как к вам обращаться"></label>
    <label>Телефон<input name="p" type="tel" required maxlength="30" autocomplete="tel" placeholder="+7 ___ ___-__-__"></label>
    <label>Получение<select name="g"><option>Самовывоз из студии</option></select></label>
    <label>Комментарий<textarea name="c" maxlength="1000" placeholder="Удобное время, вопросы"></textarea></label>
    <label class="consent"><input type="checkbox" name="consent" value="1" required><span>Я даю согласие на обработку персональных данных и ознакомлен(а) с <a href="${esc(PRIVACY)}" target="_blank">политикой</a></span></label>
    <div class="cart-sum"><span>К оплате при получении</span><b class="cart-total">0 ₽</b></div>
    <button class="btn btn-main" type="submit">Отправить заказ</button>
    <p class="cart-msg" aria-live="polite"></p>
  </form>
  <div class="cart-step s3"><div class="cart-done"><span>✓</span><h4>Заказ принят</h4><p class="cart-done-t"></p><button class="btn btn-line" data-cart-close>Закрыть</button></div></div>
</aside>`;
document.body.append(...d.children);
const drawer=$('.cart'), ov=$('.cart-ov'), note=$('.cart-note'), noteText=note.textContent;
function step(n){ drawer.dataset.step=n; }
function open(){ step(1); drawer.classList.add('on'); ov.classList.add('on'); drawer.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; setTimeout(()=>$('.cart-x').focus(),50); sync(); }
function close(){ drawer.classList.remove('on'); ov.classList.remove('on'); drawer.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
document.addEventListener('click',e=>{
  if(e.target.closest('[data-cart-open]')){ e.preventDefault(); open(); }
  else if(e.target.closest('[data-cart-close]')){ close(); }
});
addEventListener('keydown',e=>{ if(e.key==='Escape' && drawer.classList.contains('on')) close(); });
$('.cart-go').onclick=()=>step(2);
$('.cart-back').onclick=()=>step(1);

/* ---------- сверка с сервером: актуальные цены, убрать то, чего нет в наличии ---------- */
async function sync(){
  const c=load(); if(!c.length) return;
  try{
    const res=await fetch('/cart/sync',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':csrf()},credentials:'same-origin',body:JSON.stringify({ids:c.map(i=>i.id)})});
    if(!res.ok) return;
    const {variants}=await res.json(); let removed=0;
    const next=c.filter(i=>{ const v=variants[i.id]; if(!v||!v.available){ removed++; return false; } Object.assign(i,{name:v.name,opt:v.opt||'',cat:v.cat||'',price:v.price,img:v.img||''}); return true; });
    save(next);
    note.textContent=removed?'Некоторых товаров уже нет в наличии — мы убрали их из корзины.':noteText;
  }catch(e){}
}

/* ---------- оформление ---------- */
$('.s2').addEventListener('submit',async e=>{
  e.preventDefault(); const f=e.target, msg=$('.cart-msg'), btn=f.querySelector('button[type=submit]');
  if(!f.n.value.trim()||!f.p.value.trim()){ msg.textContent='Укажите имя и телефон.'; return; }
  if(!f.consent.checked){ msg.textContent='Подтвердите согласие на обработку персональных данных.'; return; }
  const c=load(); if(!c.length){ step(1); return; }
  btn.disabled=true; const label=btn.textContent; btn.textContent='Отправляем…'; msg.textContent='';
  try{
    const res=await fetch('/orders',{method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':csrf()},
      body:JSON.stringify({name:f.n.value,phone:f.p.value,comment:f.c.value,website:f.website.value,consent:f.consent.checked?1:0,items:c.map(i=>({variant_id:+i.id,qty:+i.q}))})});
    const data=await res.json().catch(()=>({}));
    if(res.status===201&&data.ok){ f.reset(); save([]); $('.cart-done-t').textContent=data.message; step(3); }
    else if(res.status===422&&data.errors){
      if(data.errors.unavailable){ const bad=data.errors.unavailable.map(String); save(load().filter(i=>!bad.includes(String(i.id)))); step(1); note.textContent=data.errors.items[0]; }
      else msg.textContent=Object.values(data.errors)[0][0];
    }
    else if(res.status===419){ msg.textContent='Страница устарела — обновите её и отправьте заказ ещё раз.'; }
    else { msg.textContent=data.message||'Не удалось отправить заказ. Позвоните нам, пожалуйста.'; }
  }catch(err){ msg.textContent='Нет связи с сервером. Проверьте интернет или позвоните нам.'; }
  finally{ btn.disabled=false; btn.textContent=label; }
});

/* ---------- render ---------- */
function render(){
  const c=load(), n=c.reduce((s,i)=>s+i.q,0), total=c.reduce((s,i)=>s+i.q*i.price,0);
  $$('.cart-n').forEach(el=>{ el.textContent=n; el.hidden=!n; });
  $('.cart-c').textContent=n?`· ${n}`:'';
  $$('.cart-total').forEach(el=>el.textContent=fmt(total)+' ₽');
  drawer.classList.toggle('is-empty',!n);
  $('.cart-list').innerHTML=c.map((i,k)=>`<li class="ci">${i.img?`<div class="ci-img photo"><img src="${esc(i.img)}" alt=""></div>`:'<div class="ci-img ph"></div>'}<div class="ci-b"><p class="ci-c">${esc(i.cat)}</p><h4>${esc(i.name)}</h4>${i.opt?`<p class="ci-o">${esc(i.opt)}</p>`:''}<div class="ci-r"><div class="qty"><button data-k="${k}" data-d="-1" aria-label="Меньше">−</button><span>${i.q}</span><button data-k="${k}" data-d="1" aria-label="Больше">+</button></div><b>${fmt(i.q*i.price)} ₽</b></div></div><button class="ci-x" data-rm="${k}" aria-label="Удалить">×</button></li>`).join('');
}
$('.cart-list').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return; const c=load();
  if(b.dataset.rm!==undefined){ c.splice(+b.dataset.rm,1); return save(c); }
  const k=+b.dataset.k; c[k].q=Math.min(99,Math.max(1,c[k].q+ +b.dataset.d)); save(c);
});
/* ---------- add to cart ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-add]'); if(!b||b.disabled) return; e.preventDefault();
  const qEl=b.dataset.qtyFrom?$(b.dataset.qtyFrom):null;
  const item={id:+b.dataset.add,name:b.dataset.name,cat:b.dataset.cat||'',price:+b.dataset.price,opt:b.dataset.opt||'',img:b.dataset.img||'',q:qEl?+qEl.textContent:1};
  if(!item.id) return;
  const c=load(), ex=c.find(i=>i.id===item.id); ex?ex.q=Math.min(99,ex.q+item.q):c.push(item); save(c);
  const t=b.innerHTML; b.classList.add('added'); b.innerHTML='Добавлено ✓'; setTimeout(()=>{ b.classList.remove('added'); b.innerHTML=t; },1400);
  $$('.cart-btn').forEach(x=>{ x.classList.remove('bump'); void x.offsetWidth; x.classList.add('bump'); });
});
render();
}

/* ---------- motion (subpages; home has its own) ---------- */
if(!document.body.dataset.home){
  const hdr=$('#hdr'); addEventListener('scroll',()=>hdr&&hdr.classList.toggle('small',scrollY>40),{passive:true});
  const io=new IntersectionObserver(es=>es.forEach(x=>{ if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target);} }),{rootMargin:'0px 0px -8% 0px',threshold:.06});
  $$('[data-reveal]').forEach(el=>io.observe(el));
}
})();
