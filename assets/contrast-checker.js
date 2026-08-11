(()=>{
  if(document.getElementById('contrastChecker')) return;
  const host=document.querySelector('#accessibility')||document.querySelector('#performance')||document.querySelector('main');
  if(!host) return;
  const section=document.createElement('section');
  section.className='contrast-checker';
  section.id='contrastChecker';
  section.setAttribute('aria-labelledby','contrastCheckerTitle');
  section.innerHTML=`<div class="contrast-checker__head"><div><span class="contrast-checker__kicker">// WCAG COLOR TEST</span><h2 id="contrastCheckerTitle">COLOR CONTRAST CHECKER</h2></div><p class="contrast-checker__hint">选择文字与背景颜色，实时计算 WCAG 对比度。普通文本 AA ≥ 4.5:1、AAA ≥ 7:1；大文本 AA ≥ 3:1、AAA ≥ 4.5:1。</p></div><div class="contrast-checker__workspace"><div class="contrast-checker__controls"><label><span>TEXT COLOR</span><div class="contrast-checker__input"><input id="contrastFg" type="color" value="#f5f7fb" aria-label="文字颜色"><code id="contrastFgValue">#F5F7FB</code></div></label><button type="button" class="contrast-checker__swap" id="contrastSwap" aria-label="交换文字和背景颜色">⇄ SWAP</button><label><span>BACKGROUND</span><div class="contrast-checker__input"><input id="contrastBg" type="color" value="#05070d" aria-label="背景颜色"><code id="contrastBgValue">#05070D</code></div></label></div><div class="contrast-checker__preview" id="contrastPreview"><span>LIVE PREVIEW</span><strong>Readable text should stay clear.</strong><p>123 ABC abc · GitHub Pages diagnostic sample</p></div></div><div class="contrast-checker__results"><article><span>CONTRAST RATIO</span><strong id="contrastRatio">—</strong><small id="contrastVerdict">Calculating…</small></article><article><span>NORMAL TEXT</span><strong id="contrastNormal">—</strong><small>AA 4.5 · AAA 7.0</small></article><article><span>LARGE TEXT</span><strong id="contrastLarge">—</strong><small>AA 3.0 · AAA 4.5</small></article><article><span>UI / GRAPHICS</span><strong id="contrastUi">—</strong><small>AA threshold · 3.0</small></article></div><p class="contrast-checker__status" id="contrastStatus" role="status" aria-live="polite" aria-atomic="true">Contrast result ready.</p>`;
  host.parentNode.insertBefore(section,host);
  const nav=document.querySelector('.quick-nav');
  if(nav&&!nav.querySelector('a[href="#contrastChecker"]')){
    const link=document.createElement('a');link.href='#contrastChecker';link.textContent='CONTRAST';
    const anchor=nav.querySelector('a[href="#accessibility"]')||nav.querySelector('a[href="#performance"]');
    nav.insertBefore(link,anchor||null);
  }
  const fg=document.getElementById('contrastFg');
  const bg=document.getElementById('contrastBg');
  const fgValue=document.getElementById('contrastFgValue');
  const bgValue=document.getElementById('contrastBgValue');
  const ratioOut=document.getElementById('contrastRatio');
  const verdict=document.getElementById('contrastVerdict');
  const normal=document.getElementById('contrastNormal');
  const large=document.getElementById('contrastLarge');
  const ui=document.getElementById('contrastUi');
  const preview=document.getElementById('contrastPreview');
  const status=document.getElementById('contrastStatus');
  const swap=document.getElementById('contrastSwap');
  const luminance=hex=>{
    const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
    return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2];
  };
  const pass=(ratio,aa,aaa)=>ratio>=aaa?'AAA PASS':ratio>=aa?'AA PASS':'FAIL';
  const update=()=>{
    const a=luminance(fg.value),b=luminance(bg.value);const r=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    const rounded=r.toFixed(2);
    fgValue.textContent=fg.value.toUpperCase();bgValue.textContent=bg.value.toUpperCase();
    ratioOut.textContent=`${rounded}:1`;normal.textContent=pass(r,4.5,7);large.textContent=pass(r,3,4.5);ui.textContent=r>=3?'AA PASS':'FAIL';
    verdict.textContent=r>=7?'Enhanced contrast for normal text':r>=4.5?'Meets AA for normal text':r>=3?'Only suitable for large text / UI thresholds':'Low contrast combination';
    preview.style.color=fg.value;preview.style.backgroundColor=bg.value;
    status.textContent=`${fg.value.toUpperCase()} on ${bg.value.toUpperCase()} is ${rounded}:1. Normal text: ${normal.textContent}.`;
  };
  fg.addEventListener('input',update);bg.addEventListener('input',update);
  swap.addEventListener('click',()=>{const v=fg.value;fg.value=bg.value;bg.value=v;update();fg.focus();});
  update();
})();