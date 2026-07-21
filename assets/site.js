(function(){
  var prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* if the browser's animation clock is not running, render everything statically */
  var rafTicked = false;
  requestAnimationFrame(function(){ rafTicked = true; });
  setTimeout(function(){
    if(!rafTicked){
      document.documentElement.classList.add('no-anim');
      document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    }
  }, 600);

  /* nav background on scroll */
  var nav = document.getElementById('nav');
  function onScroll(){ nav.classList.toggle('scrolled', nav.hasAttribute('data-solid') || scrollY > 24); }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* mobile menu */
  var btn = document.getElementById('menuBtn'), links = document.getElementById('navLinks');
  btn.addEventListener('click', function(){
    var open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', function(e){
    if(e.target.tagName === 'A'){ links.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  });
  addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(links.classList.contains('open')){
      links.classList.remove('open'); btn.setAttribute('aria-expanded','false'); btn.focus();
    } else if(postOverlay && !postOverlay.hidden){
      closePost();
    }
  });

  /* journal post reader */
  var postOverlay = document.getElementById('postOverlay'),
      postBody = document.getElementById('postBody'),
      postClose = document.getElementById('postClose'),
      lastFocus = null;
  function openPost(slug){
    var tpl = document.getElementById('post-' + slug);
    if(!tpl) return;
    postBody.innerHTML = '';
    postBody.appendChild(tpl.content.cloneNode(true));
    lastFocus = document.activeElement;
    postOverlay.hidden = false;
    postOverlay.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    postClose.focus();
  }
  function closePost(){
    postOverlay.hidden = true;
    document.body.style.overflow = '';
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if(postOverlay){
    document.querySelectorAll('.post-row').forEach(function(row){
      row.addEventListener('click', function(){ openPost(row.dataset.post); });
    });
    postClose.addEventListener('click', closePost);
    postOverlay.addEventListener('click', function(e){ if(e.target === postOverlay) closePost(); });
  }

  /* reveal on scroll + scroll-spy (static fallback when IntersectionObserver is unavailable) */
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, {threshold:.16, rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll('.reveal, .enso-fig, .mission').forEach(function(el){ io.observe(el); });
    document.querySelectorAll('section').forEach(function(s){ io.observe(s); });

    var map = {};
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function(a){
      map[a.getAttribute('href').slice(1)] = a;
    });
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var a = map[en.target.id];
        if(a && !a.classList.contains('btn')){
          if(en.isIntersecting){
            Object.keys(map).forEach(function(k){ map[k].classList.remove('active'); });
            a.classList.add('active');
          }
        }
      });
    }, {rootMargin:'-38% 0px -52% 0px'});
    Object.keys(map).forEach(function(id){
      var el = document.getElementById(id);
      if(el) spy.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal, section').forEach(function(el){ el.classList.add('in'); });
  }

  /* smooth in-page anchor scrolling (self-contained; no reliance on css scroll-behavior) */
  function smoothTo(targetY){
    if(prefersReduced){ scrollTo(0, targetY); return; }
    var startY = scrollY, diff = targetY - startY, t0 = null, started = false,
        dur = Math.min(900, 350 + Math.abs(diff) * .12);
    function ease(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }
    function step(ts){
      started = true;
      if(t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      scrollTo(0, startY + diff * ease(p));
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    /* environments without rAF (or with it throttled) still navigate */
    setTimeout(function(){ if(!started) scrollTo(0, targetY); }, 120);
  }
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="#"]');
    if(!a) return;
    var id = a.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if(!el) return;
    e.preventDefault();
    if(postOverlay && !postOverlay.hidden) closePost();
    history.pushState(null, '', '#' + id);
    smoothTo(id === 'top' ? 0 : el.getBoundingClientRect().top + scrollY - 72);
  });

  /* subtle hero parallax (on the media container; the img keeps its ken-burns transform) */
  var media = document.getElementById('heroMedia');
  if(!prefersReduced && media){
    var ticking = false;
    addEventListener('scroll', function(){
      if(ticking) return; ticking = true;
      requestAnimationFrame(function(){
        var y = Math.min(scrollY, innerHeight);
        media.style.transform = 'translateY(' + y * .12 + 'px)';
        ticking = false;
      });
    }, {passive:true});
  }

  /* hero video: fades in over the photo placeholder once a real hero.mp4 exists */
  var video = document.getElementById('heroVideo'), hero = document.querySelector('.hero');
  function goLive(){
    hero.classList.add('video-live');
    var p = video.play();
    if(p && p.catch) p.catch(function(){ hero.classList.remove('video-live'); });
  }
  if(video){
    video.addEventListener('canplay', goLive);
    if(video.readyState >= 3) goLive();
  }
})();
