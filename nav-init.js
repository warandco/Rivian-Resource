// nav-init.js — include on every page after the site-nav div

// ─── Google Analytics 4 ───
(function() {
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-SB8DBC8NBQ');

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-SB8DBC8NBQ';
  document.head.appendChild(script);

  // Track clicks on any referral link (reprCode) site-wide
  document.addEventListener('click', function(e) {
    var a = e.target.closest && e.target.closest('a[href*="reprCode="]');
    if (a) gtag('event', 'referral_link_click', { page_path: location.pathname, link_text: (a.textContent || '').trim().slice(0, 60) });
    // Track Amazon affiliate clicks site-wide
    var amz = e.target.closest && e.target.closest('a[href*="amzn.to"], a[href*="link.amazon"], a[href*="amazon.com"]');
    if (amz) gtag('event', 'affiliate_click', { page_path: location.pathname, link_url: amz.href, link_text: (amz.textContent || '').trim().slice(0, 60) });
  });
})();

// ─── Nav ───
fetch('/nav.html')
  .then(r => r.text())
  .then(html => {
    document.getElementById('site-nav').innerHTML = html;
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === '/' ? path === '/' : path.startsWith(href)) a.classList.add('active');
    });
    const btn     = document.getElementById('navHamburger');
    const links   = document.getElementById('navLinks');
    const menuIc  = document.getElementById('navIconMenu');
    const closeIc = document.getElementById('navIconClose');
    if (btn && links) {
      btn.addEventListener('click', () => {
        const isOpen = links.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
        menuIc.style.display  = isOpen ? 'none'  : 'block';
        closeIc.style.display = isOpen ? 'block' : 'none';
      });
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          links.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          menuIc.style.display  = 'block';
          closeIc.style.display = 'none';
        });
      });
    }
  })
  .catch(() => {});
