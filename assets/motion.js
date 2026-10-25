/* Labinat V4: unobtrusive, dependency-free motion. All controls remain usable without JS. */
(()=>{
  'use strict';
  const values={
    respect:{num:'01 / 04',icon:'✧',title:'دوائر الاحترام',desc:'يختار الفريق مواقف واقعية، ثم يناقش كيف تتحوّل الكلمة الصغيرة إلى سلوك يبني الاحترام.',result:'النتيجة: إنصات • تقدير • حوار',idx:0},
    responsibility:{num:'02 / 04',icon:'◈',title:'مهمة الفريق',desc:'يتسلّم المشاركون مهامًا مترابطة لا تنجح إلا عندما يتحمّل كل فرد مسؤوليته بوضوح.',result:'النتيجة: مبادرة • التزام • ثقة',idx:1},
    cooperation:{num:'03 / 04',icon:'✳',title:'جسر التعاون',desc:'تحدٍّ جماعي يجمع أفكار الجميع لبناء حل لا يمكن الوصول إليه بالمجهود الفردي وحده.',result:'النتيجة: مشاركة • تعاون • تكامل',idx:2},
    honesty:{num:'04 / 04',icon:'◇',title:'مفترق الصدق',desc:'قصة قصيرة تتفرّع إلى اختيارات، ويكتشف المشاركون كيف تؤثّر الصراحة في الثقة والعلاقات.',result:'النتيجة: أمانة • شجاعة • وضوح',idx:3}
  };
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let observer=null, scrollTick=false, listeners=[];
  function listen(node,event,fn,options){node.addEventListener(event,fn,options);listeners.push([node,event,fn,options])}
  function cleanup(){observer?.disconnect();observer=null;listeners.forEach(([node,event,fn,opts])=>node.removeEventListener(event,fn,opts));listeners=[]}
  function init(){
    cleanup();
    const root=document.querySelector('#app');if(!root)return;
    const hero=root.querySelector('.hero,.pagehero'), header=root.querySelector('#stickyNav'), progress=root.querySelector('#readingFill'), back=root.querySelector('#backTop');
    const updateScroll=()=>{
      const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight), y=window.scrollY;
      if(progress)progress.style.width=(Math.min(1,y/max)*100).toFixed(1)+'%';
      if(hero&&header)header.classList.toggle('is-stuck',hero.getBoundingClientRect().bottom<=12);
      if(back)back.classList.toggle('visible',y>430);
      scrollTick=false;
    };
    const schedule=()=>{if(!scrollTick){scrollTick=true;requestAnimationFrame(updateScroll)}};
    listen(window,'scroll',schedule,{passive:true});listen(window,'resize',schedule,{passive:true});updateScroll();
    if(back)listen(back,'click',()=>window.scrollTo({top:0,behavior:reduced()?'auto':'smooth'}));
    if(header){
      const menu=header.querySelector('#mainNav'), toggle=header.querySelector('#toggleMenu');
      if(menu&&toggle){listen(menu,'click',e=>{if(e.target.closest('a')){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false')}})}
    }
    // Scroll-in animation: observer adds class only to elements actually observed.
    const revealTargets=root.querySelectorAll('.section-head,.split>div,.grid-cards>.item-card,.stat,.value,.journey-step,.explorer-shell,.quote-section .wrap,.pagehero .wrap,.article-shell,.footer-grid>div');
    if(reduced()||!('IntersectionObserver' in window)){
      root.classList.remove('motion-ready');
    }else{
      root.classList.add('motion-ready');
      observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}
      }),{threshold:.10,rootMargin:'0px 0px -25px 0px'});
      revealTargets.forEach((node,index)=>{
        node.classList.add('reveal');node.style.setProperty('--reveal-delay',((index%3)*85)+'ms');observer.observe(node);
      });
    }
    // Buttons for exploring values (no backend and no external data).
    const buttons=root.querySelectorAll('[data-choice]');
    if(buttons.length){buttons.forEach(button=>listen(button,'click',()=>{
      const selected=values[button.dataset.choice];if(!selected)return;
      buttons.forEach(btn=>{const active=btn===button;btn.classList.toggle('is-selected',active);btn.setAttribute('aria-pressed',String(active))});
      const card=root.querySelector('.stage-paper');
      if(card){card.classList.remove('is-changing');void card.offsetWidth;card.classList.add('is-changing')}
      for(const [id,val] of [['stageNumber',selected.num],['stageIcon',selected.icon],['stageTitle',selected.title],['stageDesc',selected.desc],['stageResult',selected.result]]){
        const n=root.querySelector('#'+id);if(n)n.textContent=val;
      }
      root.querySelectorAll('.stage-dots span').forEach((dot,i)=>dot.classList.toggle('active',i===selected.idx));
    }))}
    const toggleVideo=root.querySelector('#heroVideoToggle'), film=root.querySelector('#heroVideo');
    if(toggleVideo&&film){
      const status=root.querySelector('#heroVideoState');
      const say=(message)=>{if(status){status.textContent=message||'';status.hidden=!message}};
      const sync=()=>{
        const paused=film.paused;
        toggleVideo.setAttribute('aria-pressed',String(paused));
        toggleVideo.setAttribute('aria-label',paused?'تشغيل فيديو الخلفية':'إيقاف فيديو الخلفية مؤقتًا');
        toggleVideo.querySelector('.toggle-symbol').textContent=paused?'▶':'Ⅱ';
        toggleVideo.querySelector('.toggle-label').textContent=paused?'تشغيل الفيديو':'إيقاف الحركة';
      };
      const startVideo=async()=>{
        try{
          film.muted=true;
          film.defaultMuted=true;
          await film.play();
          say('');
        }catch(error){
          sync();
          say('المتصفح لم يسمح بالتشغيل التلقائي؛ اضغط «تشغيل الفيديو».');
        }
      };
      listen(toggleVideo,'click',()=>{if(film.paused){startVideo()}else{film.pause();say('تم إيقاف الفيديو مؤقتًا.')}});
      listen(film,'error',()=>{sync();say('تعذر تحميل الفيديو. تحقق من المسار أو جرّبه من صفحة الفحص.')});
      listen(film,'playing',()=>{say('');sync()});
      listen(film,'play',sync);listen(film,'pause',sync);
      if(reduced()){
        film.pause();say('الحركة متوقفة حسب إعدادات تقليل الحركة؛ اضغط لتشغيل الفيديو.');
      }else{
        // Autoplay can be denied by individual browser settings, especially when opening a local file.
        startVideo();
      }
      sync();
    }
    // Subtle movement on non-touch pointers; avoid shifting links under pointer.
    const pointerFine=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if(pointerFine&&!reduced()){
      const art=root.querySelector('.hero-orbit');
      if(hero&&art){listen(hero,'pointermove',e=>{
        const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;
        art.style.translate=`${Math.round(x*22)}px ${Math.round(y*18)}px`;
      },{passive:true});listen(hero,'pointerleave',()=>art.style.translate='0px 0px')}
      // Only a restrained pointer spotlight; no constant mouse-following canvas.
      root.querySelectorAll('.item-card').forEach(card=>{
        listen(card,'pointermove',e=>{
          const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
          card.style.setProperty('--pointer-x',Math.round(x*100)+'%');card.style.setProperty('--pointer-y',Math.round(y*100)+'%');
        },{passive:true});
      });
    }
    // Numeric counters animate only when actually on screen.
    const stats=root.querySelectorAll('.stats .stat>b');
    if(stats.length&&!reduced()&&'IntersectionObserver' in window){
      const counterObs=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        const node=entry.target, original=node.textContent||'';
        const n=Number(original.replace(/[^\d]/g,''));
        if(!Number.isFinite(n)||n<1)return counterObs.unobserve(node);
        const keepPlus=original.includes('+'),useArabic=/[٠-٩]/.test(original), formatter=new Intl.NumberFormat(useArabic?'ar-EG':'en-US',{useGrouping:false});
        const duration=1150,start=performance.now();
        const frame=now=>{
          if(!node.isConnected)return;
          const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,3),v=Math.round(n*ease);
          node.textContent=(keepPlus?'+':'')+formatter.format(v);
          if(t<1)requestAnimationFrame(frame);else node.textContent=original;
        };
        requestAnimationFrame(frame);counterObs.unobserve(node);
      }),{threshold:.6});stats.forEach(s=>counterObs.observe(s));
    }
  }
  window.LabinatMotion={init};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
