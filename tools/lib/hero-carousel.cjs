'use strict';

function syncHeroCarousel($) {
  let hero = $('.preview .pvcar').first();
  const legacyHeader = hero.length ? null : $('body > header').first();
  const candidates = [];
  const seen = new Set();

  function addCandidate(src, figure, alt) {
    const key = imageKey(src);
    if (!key || seen.has(key)) return;
    seen.add(key);
    candidates.push({ src, figure, alt });
  }

  if (hero.length) {
    hero.find('figure').each((_, element) => {
      const figure = $(element);
      const image = figure.find('img[src]').first();
      addCandidate(image.attr('src'), figure, image.attr('alt'));
    });
  } else if (legacyHeader?.length) {
    const background = legacyHeroImage($, legacyHeader);
    if (background) addCandidate(background, null, `${legacyHeader.find('h1').text().replace(/\s+/g, ' ').trim()} hero view`);
  }

  $('body img[src]').each((_, element) => {
    const image = $(element);
    if (image.closest('.leaflet-container,#tripmap,.spot-map,.trip-gallery-dialog').length) return;
    const figure = image.closest('figure');
    addCandidate(image.attr('src'), figure.length ? figure : null, image.attr('alt'));
  });

  if (!candidates.length) return { count: 0, created: false };
  if (!hero.length) {
    if (!legacyHeader?.length) return { count: 0, created: false };
    legacyHeader.addClass('legacy-trip-hero');
    hero = $('<div class="carousel pvcar legacy-pvcar" aria-label="Trip photo carousel"></div>');
    hero.append('<div class="track"></div><button class="nav prev" aria-label="Previous">‹</button><button class="nav next" aria-label="Next">›</button><div class="counter"><span class="cur">1</span></div><div class="dots"></div>');
    legacyHeader.prepend(hero);
  }

  const track = hero.find('> .track').first();
  const figures = candidates.map((candidate, index) => buildFigure($, candidate, index));
  track.empty().append(figures);
  hero.attr({ 'data-n': String(figures.length), 'data-all-trip-photos': 'true' });
  let counter = hero.find('> .counter').first();
  if (!counter.length) counter = $('<div class="counter"></div>').appendTo(hero);
  counter.empty().append(`<span class="cur">1</span> / ${figures.length}`);
  let dots = hero.find('> .dots').first();
  if (!dots.length) dots = $('<div class="dots"></div>').appendTo(hero);
  dots.empty();
  figures.forEach((_, index) => dots.append(`<button class="dot" data-i="${index}" aria-label="Photo ${index + 1}"></button>`));
  if (!hero.find('> .nav.prev').length) hero.append('<button class="nav prev" aria-label="Previous">‹</button>');
  if (!hero.find('> .nav.next').length) hero.append('<button class="nav next" aria-label="Next">›</button>');
  return { count: figures.length, created: Boolean(legacyHeader?.length) };
}

function buildFigure($, candidate, index) {
  let figure;
  if (candidate.figure?.length) {
    figure = candidate.figure.clone();
    figure.find('img').slice(1).remove();
  } else {
    figure = $('<figure></figure>');
    figure.append($('<img>').attr({ src: candidate.src, alt: candidate.alt || 'Trip photo' }));
    figure.append($('<figcaption></figcaption>').append($('<strong></strong>').text(candidate.alt || 'Trip photo')));
  }
  const image = figure.find('img[src]').first();
  image.removeAttr('id fetchpriority');
  image.attr('loading', index === 0 ? 'eager' : 'lazy');
  return figure;
}

function legacyHeroImage($, header) {
  const inline = extractUrl(header.attr('style') || '');
  if (inline) return inline;
  const styles = $('style').toArray().map((element) => $(element).html() || '').join('\n');
  const rule = styles.match(/header::before\s*\{[^}]*?url\(([^)]+)\)/i);
  return rule ? cleanUrl(rule[1]) : null;
}

function extractUrl(value) {
  const match = String(value).match(/url\(([^)]+)\)/i);
  return match ? cleanUrl(match[1]) : null;
}

function cleanUrl(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '');
}

function imageKey(value) {
  return cleanUrl(value).split(/[?#]/)[0];
}

module.exports = { syncHeroCarousel, imageKey };
