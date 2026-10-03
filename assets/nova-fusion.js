(() => {
  const menu = document.getElementById('menuToggle');
  menu.addEventListener('click', () => {
    const collapsed = document.body.classList.toggle('nav-collapsed');
    menu.setAttribute('aria-expanded', String(innerWidth <= 900 ? collapsed : !collapsed));
  });
  const updateMenu = () => menu.setAttribute('aria-expanded', String(innerWidth <= 900 ? document.body.classList.contains('nav-collapsed') : !document.body.classList.contains('nav-collapsed')));
  addEventListener('resize', updateMenu);
  updateMenu();
  document.querySelector('.side').addEventListener('click', event => {
    if (event.target.closest('a') && innerWidth <= 900) {
      document.body.classList.remove('nav-collapsed'); updateMenu();
    }
  });
  // Extension styles load asynchronously; keep the visual layer last in the cascade.
  const theme = document.querySelector('link[href^="assets/nova-fusion.css"]');
  const observer = new MutationObserver(() => {
    if (document.head.lastElementChild !== theme) document.head.appendChild(theme);
  });
  observer.observe(document.head, {childList:true});
})();
