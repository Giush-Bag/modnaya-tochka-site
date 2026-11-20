/* Модная точка — страница товара: галерея, варианты, количество, аккордеон (из concept/product.html) */
(function(){
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const fmt=n=>Math.round(n).toLocaleString('ru-RU').replace(/ | /g,' ');
const add=$('#addBtn'), price=$('#price'), stock=$('#stock'), qv=$('#qv');

$$('.thumbs button').forEach(b=>b.onclick=()=>{ $$('.thumbs button').forEach(x=>x.setAttribute('aria-current',x===b)); $$('.gmain>*').forEach((p,i)=>p.classList.toggle('on',i==b.dataset.i)); });

price.style.transition='opacity .25s';
$$('#opts button').forEach(b=>b.onclick=()=>{
  $$('#opts button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  price.style.opacity=0; setTimeout(()=>{ price.textContent=fmt(+b.dataset.price)+' ₽'; price.style.opacity=1; },200);
  const ok=b.dataset.stock==='1';
  stock.textContent=ok?'В наличии в студии':'Нет в наличии'; stock.classList.toggle('out',!ok);
  add.disabled=!ok; add.dataset.add=b.dataset.vid; add.dataset.price=b.dataset.price; add.dataset.opt=b.dataset.v;
});
$('#qm').onclick=()=>{ qv.textContent=Math.max(1,+qv.textContent-1); };
$('#qp').onclick=()=>{ qv.textContent=Math.min(99,+qv.textContent+1); };
$$('.acc-q').forEach(q=>q.onclick=()=>{ const i=q.parentElement,o=!i.classList.contains('open'); i.classList.toggle('open',o); q.setAttribute('aria-expanded',o); });
})();
