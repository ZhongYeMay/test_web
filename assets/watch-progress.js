(() => {
  const loadScript = (src, onload) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = onload || null;
    script.onerror = () => console.warn(`NOVA VIDEO: failed to load ${src}`);
    document.body.appendChild(script);
  };

  const communityStyle = document.createElement('link');
  communityStyle.rel = 'stylesheet';
  communityStyle.href = 'assets/community-tags.css';
  document.head.appendChild(communityStyle);

  loadScript('assets/watch-progress-core-072.js', () => {
    loadScript('assets/community-tags.js');
  });
})();