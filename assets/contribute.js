(() => {
  const submissionUrl = 'https://github.com/ZhongYeMay/novavideos/issues/new?template=video_submission.yml';

  const topSubmit = document.querySelector('.topbar a[aria-label="管理视频源"]');
  if (topSubmit) {
    topSubmit.href = submissionUrl;
    topSubmit.setAttribute('aria-label', '投稿视频');
    topSubmit.title = '投稿视频';
  }

  const sourceButtons = document.querySelector('#sourcePanel .source-buttons');
  if (sourceButtons && !sourceButtons.querySelector('[data-video-submit]')) {
    const submit = document.createElement('a');
    submit.href = submissionUrl;
    submit.target = '_blank';
    submit.rel = 'noopener';
    submit.dataset.videoSubmit = 'true';
    submit.textContent = '投稿视频';
    sourceButtons.prepend(submit);
  }

  const sideGroups = document.querySelectorAll('.side .nav');
  const sourceNav = sideGroups[sideGroups.length - 1];
  if (sourceNav && !sourceNav.querySelector('[data-video-submit]')) {
    const submitLink = document.createElement('a');
    submitLink.href = submissionUrl;
    submitLink.target = '_blank';
    submitLink.rel = 'noopener';
    submitLink.dataset.videoSubmit = 'true';
    submitLink.textContent = '＋　投稿视频';
    sourceNav.prepend(submitLink);
  }
})();
