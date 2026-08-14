(() => {
  const loadScript = (src, onload) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = onload || null;
    script.onerror = () => console.warn(`NOVA VIDEO: failed to load ${src}`);
    document.body.appendChild(script);
  };

  const loadStyle = href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  loadStyle('assets/community-tags.css');
  loadStyle('assets/release-playcount.css');

  loadScript('assets/watch-progress-core-072.js', () => {
    loadScript('assets/community-tags.js', () => {
      loadScript('assets/release-playcount.js', () => {
        loadScript('assets/contribute.js');
      });
    });
  });
})();
