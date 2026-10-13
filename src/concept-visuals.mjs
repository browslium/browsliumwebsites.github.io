import { redesign } from './redesign-copy.mjs';

const e = (value = '') => String(value).replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[char]));

const maskSentence = (locale, value) => Array.from(
  new Intl.Segmenter(locale, { granularity:'grapheme' }).segment(value),
  part => /\s/u.test(part.segment) ? part.segment : '*',
).join('');

export function textVisual(locale) {
  const r = redesign[locale.code];
  const hidden = [r.textPassage[4], r.textPassage[7]];
  const masked = hidden.map(sentence => maskSentence(locale.code, sentence));
  const sentence = index => index === 4 || index === 7
    ? `<span class="tablet-masked">${e(masked[index === 4 ? 0 : 1])}</span>`
    : e(r.textPassage[index]);
  const paragraphs = [0, 1, 2].map(group => `<p>${[0, 1, 2].map(offset => sentence(group * 3 + offset)).join(' ')} ${e(r.textTabletExtra[group])}</p>`).join('') + `<p>${e(r.textTabletContinuation)}</p>`;
  const chalk = (value, x, y, width, angle = 0) => `<text x="${x}" y="${y}" text-anchor="middle" direction="${locale.dir}" transform="rotate(${angle} ${x} ${y})" fill="#f5f1e7" stroke="#fffdf2" stroke-opacity=".28" stroke-width=".3" font-size="10.5" font-weight="400" font-family="Chalkduster,Chalkboard SE,Marker Felt,cursive" textLength="${width}" lengthAdjust="spacingAndGlyphs">${e(value)}</text>`;
  const blogX = locale.dir === 'rtl' ? 695 : 505;
  const blogText = (value, y, width = 176) => `<text x="${blogX}" y="${y}" direction="${locale.dir}" text-anchor="start" fill="#36465a" font-size="8.5" font-family="Inter,NotoHebrew,Arial,sans-serif" textLength="${width}" lengthAdjust="spacingAndGlyphs">${e(value)}</text>`;

  return `<svg class="text-concept-svg" viewBox="0 0 760 460" role="img" aria-label="${e(r.textTitle)}: ${e(r.textOcr)}" data-demo-original="${e(hidden.join(' '))}" data-demo-masked="${e(masked.join(' '))}" data-phone-mask-count="2" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tablet-screen-grad" x2="1" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#eef4f8"/></linearGradient>
      <clipPath id="photo-phone-screen"><rect x="489" y="17" width="225" height="418" rx="39"/></clipPath>
      <clipPath id="blog-photo-window"><rect x="501" y="125" width="198" height="207" rx="6"/></clipPath>
    </defs>
    <rect x="9" y="57" width="450" height="360" rx="36" fill="#141c29" stroke="#718094" stroke-width="4"/>
    <rect x="18" y="66" width="432" height="342" rx="29" fill="#080d14"/>
    <rect x="27" y="75" width="414" height="324" rx="22" fill="url(#tablet-screen-grad)"/>
    <circle cx="234" cy="70" r="2.5" fill="#738296"/>
    <foreignObject x="43" y="91" width="382" height="292"><div xmlns="http://www.w3.org/1999/xhtml" class="tablet-copy" dir="${locale.dir}">${paragraphs}</div></foreignObject>
    <rect x="479" y="7" width="245" height="439" rx="48" fill="#202c3a" stroke="#6c7c90" stroke-width="4"/>
    <rect x="485" y="13" width="233" height="426" rx="42" fill="#090d14"/>
    <rect x="489" y="17" width="225" height="418" rx="39" fill="#f9fafb"/>
    <g clip-path="url(#photo-phone-screen)">
      <rect x="489" y="17" width="225" height="418" fill="#fafbfc"/>
      <rect x="501" y="57" width="198" height="27" rx="3" fill="#f0f2f6"/>
      <text x="${blogX}" y="74" direction="${locale.dir}" text-anchor="start" fill="#25354a" font-size="10" font-weight="780" font-family="Inter,NotoHebrew,Arial,sans-serif">${e(r.photoBlog[0])}</text>
      <text x="${blogX}" y="101" direction="${locale.dir}" text-anchor="start" fill="#18283a" font-size="12" font-weight="760" font-family="Inter,NotoHebrew,Arial,sans-serif" textLength="190" lengthAdjust="spacingAndGlyphs">${e(r.photoBlog[1])}</text>
      <path d="M503 110H698" stroke="#e0e5eb"/>
      <g clip-path="url(#blog-photo-window)">
        <image href="/assets/text-street-sign-v2.png" x="500" y="115" width="200" height="300" preserveAspectRatio="none"/>
        ${chalk(r.photoText[0], 600, 172, 79, -2)}
        ${chalk(hidden[0], 600, 191, 89, 1)}
        ${chalk(r.photoText[1], 600, 212, 88, -1)}
        ${chalk(r.photoText[2], 600, 232, 69, 2)}
        ${chalk(hidden[1], 610, 253, 61, -3)}
        ${chalk(r.photoText[3], 601, 273, 82, 1)}
        ${chalk(r.photoText[4], 598, 293, 72, -1)}
        <path class="phone-mask" d="M551 180 Q560 177 571 178 L638 177 Q650 178 650 182 L648 189 Q646 194 636 194 L559 196 Q552 193 551 188Z"/>
        <path class="phone-mask" d="M575 243 Q582 239 591 241 L641 239 Q648 240 648 244 L648 250 Q646 255 639 255 L582 257 Q575 254 575 250Z"/>
      </g>
      ${blogText(r.photoBlog[2], 351, 184)}
      ${blogText(r.photoBlog[3], 368, 188)}
      <path d="M504 381H646" stroke="#d4dbe5" stroke-width="3" stroke-linecap="round"/>
      <path d="M504 391H627" stroke="#d4dbe5" stroke-width="3" stroke-linecap="round"/>
    </g>
    <rect x="551" y="19" width="99" height="18" rx="9" fill="#070a10"/>
    <circle cx="636" cy="28" r="3" fill="#253748"/>
    <rect x="563" y="421" width="76" height="5" rx="2.5" fill="#121a25"/>
    <rect x="724" y="111" width="3" height="55" rx="1.5" fill="#708095"/>
    <rect x="476" y="116" width="3" height="43" rx="1.5" fill="#708095"/>
  </svg>`;
}

const muteIcon = cx => `<g transform="translate(${cx} 176)">
  <circle r="27" fill="#822b3a" stroke="#ffc0c5" stroke-width="2.5"/>
  <path d="M-17-7h7l10-9v32L-10 7h-7z" fill="#fff2f1" stroke="#fff2f1" stroke-linejoin="round" stroke-width="1"/>
  <path d="M9-8L21 8M21-8L9 8" stroke="#fff2f1" stroke-width="3.5" stroke-linecap="round"/>
</g>`;

export function audioVisual(locale) {
  const r = redesign[locale.code];
  const bars = Array.from({ length:153 }, (_, i) => {
    const x = 42 + i * 4.18;
    const muted = (x >= 180 && x <= 339) || (x >= 416 && x <= 640);
    const movement = Math.abs(Math.sin(i * .38) * .5 + Math.sin(i * .13 + 1.2) * .31 + Math.cos(i * .67) * .19);
    const envelope = .48 + .52 * Math.abs(Math.sin(i * .045 + .3));
    const height = Math.round(9 + Math.min(70, movement * 79 * envelope));
    return `<rect x="${x.toFixed(1)}" y="${176 - height}" width="2.8" height="${height * 2}" rx="1.4" fill="${muted ? '#ff8791' : 'url(#audio-wave-grad)'}" opacity="${muted ? '.65' : '.95'}"/>`;
  }).join('');
  const label = (value, x, width) => {
    const constrained = Array.from(value).length > 18 ? ` textLength="${width}" lengthAdjust="spacingAndGlyphs"` : '';
    return `<text x="${x}" y="286" text-anchor="middle" direction="${locale.dir}" fill="#ffe7e9" font-size="13" font-weight="760" font-family="Inter,NotoHebrew,Arial,sans-serif"${constrained}>${e(value)}</text>`;
  };
  return `<svg class="audio-concept-svg" viewBox="0 0 720 380" role="img" aria-label="${e(r.audioTitle)}: ${e(r.audioLabels.join(', '))}" data-muted-regions="2" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="audio-card-grad" x2="1" y2="1"><stop stop-color="#172b49"/><stop offset="1" stop-color="#101b32"/></linearGradient>
      <linearGradient id="audio-wave-grad"><stop stop-color="#21b8ff"/><stop offset=".48" stop-color="#8d4dff"/><stop offset="1" stop-color="#19dfa6"/></linearGradient>
    </defs>
    <rect x="10" y="22" width="700" height="338" rx="27" fill="url(#audio-card-grad)" stroke="#516a90" stroke-width="2"/>
    <rect x="180" y="83" width="159" height="225" rx="18" fill="#ff5b6b" fill-opacity=".10"/>
    <rect x="416" y="83" width="224" height="225" rx="18" fill="#ff5b6b" fill-opacity=".10"/>
    <rect x="181" y="138" width="157" height="78" rx="12" fill="#ff5b6b" fill-opacity=".13"/>
    <rect x="417" y="138" width="222" height="78" rx="12" fill="#ff5b6b" fill-opacity=".13"/>
    <path d="M42 176H680" stroke="#8ba2c9" stroke-width="1" opacity=".55"/>
    ${bars}
    ${muteIcon(259)}${muteIcon(528)}
    <rect x="180" y="83" width="159" height="225" rx="18" fill="none" stroke="#ff6676" stroke-width="3"/>
    <rect x="416" y="83" width="224" height="225" rx="18" fill="none" stroke="#ff6676" stroke-width="3"/>
    ${label(r.audioLabels[0], 259, 137)}
    ${label(r.audioLabels[1], 528, 201)}
  </svg>`;
}
