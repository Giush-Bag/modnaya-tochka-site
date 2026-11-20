/* Модная точка — статья: прогресс чтения и подсветка оглавления (из concept/post.html).
   Время чтения считается на сервере. */
(function(){
const body=document.getElementById('body'), rp=document.getElementById('rp');
if(!body||!rp) return;
addEventListener('scroll',()=>{ const r=body.getBoundingClientRect(); const p=Math.min(1,Math.max(0,(innerHeight*.3-r.top)/(r.height-innerHeight*.5))); rp.style.transform='scaleX('+p+')'; },{passive:true});
const links=[...document.querySelectorAll('.toc a')];
if(links.length){
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)); } }),{rootMargin:'-20% 0px -70% 0px'});
  document.querySelectorAll('.body h2[id]').forEach(h=>io.observe(h));
}
})();
