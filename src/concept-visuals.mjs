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
  return `<svg class="text-concept-svg" viewBox="0 0 760 460" role="img" aria-label="${e(r.textTitle)}: ${e(r.textOcr)}" data-demo-original="${e(hidden.join(' '))}" data-demo-masked="${e(masked.join(' '))}" data-phone-mask-count="2" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tablet-screen-grad" x2="1" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#eef4f8"/></linearGradient>
      <clipPath id="tablet-screen-clip"><rect x="23" y="87" width="422" height="292" rx="16"/></clipPath>
      <clipPath id="photo-phone-screen"><rect x="489" y="17" width="225" height="418" rx="39"/></clipPath>
    </defs>
    <rect x="9" y="73" width="450" height="320" rx="25" fill="#141c29" stroke="#718094" stroke-width="3"/>
    <rect x="14" y="78" width="440" height="310" rx="21" fill="#080d14"/>
    <rect x="23" y="87" width="422" height="292" rx="16" fill="url(#tablet-screen-grad)"/>
    <g clip-path="url(#tablet-screen-clip)"><foreignObject x="50" y="99" width="368" height="390"><div xmlns="http://www.w3.org/1999/xhtml" class="tablet-copy" dir="${locale.dir}">${paragraphs}</div></foreignObject></g>
    <g transform="translate(72 -3) scale(.88 1.025)">
    <rect x="479" y="7" width="245" height="439" rx="48" fill="#202c3a" stroke="#6c7c90" stroke-width="4"/>
    <rect x="485" y="13" width="233" height="426" rx="42" fill="#090d14"/>
    <rect x="489" y="17" width="225" height="418" rx="39" fill="#f9fafb"/>
    <g clip-path="url(#photo-phone-screen)">
      <image href="/assets/text-street-sign-v2.png" x="489" y="17" width="225" height="418" preserveAspectRatio="xMidYMid slice"/>
      ${chalk(r.photoText[0], 602, 119, 101, -2)}
      ${chalk(hidden[0], 602, 142, 112, 1)}
      ${chalk(r.photoText[1], 602, 166, 106, -1)}
      ${chalk(r.photoText[2], 602, 190, 93, 2)}
      ${chalk(hidden[1], 602, 213, 100, -3)}
      ${chalk(r.photoText[3], 602, 237, 100, 1)}
      ${chalk(r.photoText[4], 602, 261, 93, -1)}
      <path class="phone-mask" d="M547 132 Q552 128 562 130 L657 129 Q663 131 661 136 L659 143 Q655 147 647 148 L557 150 Q548 147 546 142Z"/>
      <path class="phone-mask" d="M552 203 Q561 200 569 201 L647 199 Q659 201 655 207 L657 213 Q653 220 644 219 L561 221 Q551 218 553 211Z"/>
    </g>
    <rect x="551" y="19" width="99" height="18" rx="9" fill="#070a10"/>
    <circle cx="636" cy="28" r="3" fill="#253748"/>
    <rect x="563" y="421" width="76" height="5" rx="2.5" fill="#121a25"/>
    <rect x="724" y="111" width="3" height="55" rx="1.5" fill="#708095"/>
    <rect x="476" y="116" width="3" height="43" rx="1.5" fill="#708095"/>
    </g>
  </svg>`;
}

// Bootstrap Icons volume-mute-fill (MIT), scaled for the concept illustration.
const muteIcon = (cx, background, outline) => `<g transform="translate(${cx} 177)">
  <circle r="32" fill="${background}" stroke="${outline}" stroke-width="2.5"/>
  <circle r="26" fill="#17243b" fill-opacity=".7"/>
  <g transform="translate(-20.8 -20.8) scale(2.6)" fill="#fff">
    <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06m7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0"/>
  </g>
</g>`;

export function audioVisual(locale) {
  const r = redesign[locale.code];
  const bursts = [[8, 6, .6], [30, 11, 1], [55, 8, .8], [80, 12, 1], [108, 14, .9], [135, 8, .7]];
  const bars = Array.from({ length:144 }, (_, i) => {
    const x = 42 + i * 4.45;
    if ((x >= 174 && x <= 345) || (x >= 410 && x <= 645)) return '';
    const envelope = Math.max(...bursts.map(([center, spread, peak]) => peak * Math.exp(-(((i - center) / spread) ** 2))));
    const texture = .32 + .68 * Math.min(1, Math.abs(Math.sin(i * .73) + .24 * Math.cos(i * 1.31)));
    const height = Math.round(5 + 76 * envelope * texture);
    return `<rect x="${x.toFixed(1)}" y="${177 - height}" width="3" height="${height * 2}" rx="1.5" fill="#9063d8"/>`;
  }).join('');
  const mutedDots = (start, end) => Array.from({ length:Math.floor((end - start) / 10) }, (_, i) =>
    `<circle cx="${start + 7 + i * 10}" cy="177" r="2.4" fill="#ffc0cd"/>`).join('');
  const label = (value, x, color) => {
    const size = Array.from(value).length > 20 ? 19 : Array.from(value).length > 16 ? 22 : 25;
    const bend = x < 360 ? -22 : 22;
    return `<g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M${x + bend} 321 Q${x + bend} 305 ${x} 293"/><path d="M${x - 6} 301L${x} 293L${x + 6} 301"/></g><text x="${x}" y="345" text-anchor="middle" direction="${locale.dir}" fill="${color}" font-size="${size}" font-weight="800" font-family="Inter,NotoHebrew,Arial,sans-serif">${e(value)}</text>`;
  };
  return `<svg class="audio-concept-svg" viewBox="0 0 720 380" role="img" aria-label="${e(r.audioTitle)}: ${e(r.audioLabels.join(', '))}" data-muted-regions="2" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="audio-card-grad" x2="1" y2="1"><stop stop-color="#1d2948"/><stop offset="1" stop-color="#171934"/></linearGradient>
    </defs>
    <rect x="10" y="22" width="700" height="338" rx="27" fill="url(#audio-card-grad)" stroke="#516a90" stroke-width="2"/>
    <rect x="174" y="56" width="171" height="232" rx="18" fill="#a52f4b" fill-opacity=".44" stroke="#ff7890" stroke-width="3"/>
    <rect x="410" y="56" width="235" height="232" rx="18" fill="#a52f4b" fill-opacity=".44" stroke="#ff7890" stroke-width="3"/>
    <path d="M42 177H680" stroke="#8ba2c9" stroke-width="1" opacity=".5"/>
    ${bars}
    ${mutedDots(184, 335)}${mutedDots(420, 635)}
    ${muteIcon(259, '#9f3b53', '#ffc6ce')}${muteIcon(528, '#9f3b53', '#ffc6ce')}
    ${label(r.audioLabels[0], 259, '#63e6bd')}
    ${label(r.audioLabels[1], 528, '#79caff')}
  </svg>`;
}
