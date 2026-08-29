/* Force-load lazy images and open <details> before printing so nothing is
     blank or collapsed in the PDF. */
  (function () {
    function prep() {
      document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
        img.loading = 'eager';
        if (img.dataset && img.dataset.src && !img.src) img.src = img.dataset.src;
      });
      document.querySelectorAll('details').forEach(function (d) { d.open = true; });
    }
    window.addEventListener('beforeprint', prep);
    if (window.matchMedia) {
      try { window.matchMedia('print').addEventListener('change', function (e) { if (e.matches) prep(); }); } catch (e) {}
    }
  })();

/* Trip-wide photo gallery: gathers the rendered carousel photos into one
     masonry board, then lets the user browse the set with keys or swipes. */
  (function () {
    var dialog = document.getElementById('tripGalleryDialog');
    var board = document.getElementById('tripGalleryBoard');
    if (!dialog || !board) return;

    var closeButton = dialog.querySelector('.trip-gallery-close');
    var empty = dialog.querySelector('.trip-gallery-empty');
    var countLabel = dialog.querySelector('.trip-gallery-count');
    var viewerCount = dialog.querySelector('.trip-gallery-viewer-count');
    var viewerImage = dialog.querySelector('.trip-gallery-frame img');
    var viewerCaption = dialog.querySelector('.trip-gallery-caption');
    var viewerBack = dialog.querySelector('.trip-gallery-viewer-back');
    var viewerClose = dialog.querySelector('.trip-gallery-viewer-close');
    var prevButton = dialog.querySelector('.trip-gallery-prev');
    var nextButton = dialog.querySelector('.trip-gallery-next');
    var trigger;
    var photos = [];
    var activeIndex = -1;
    var lastFocus = null;
    var touchStartX = 0;
    var touchStartY = 0;

    function absoluteUrl(value) {
      try { return new URL(value, document.baseURI).href; } catch (e) { return value || ''; }
    }

    function cleanText(value) {
      return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function figureCaption(figure, image) {
      var strong = figure.querySelector('figcaption strong');
      var span = figure.querySelector('figcaption span');
      var title = cleanText(strong && strong.textContent);
      var credit = cleanText(span && span.textContent);
      var alt = cleanText(image.getAttribute('alt'));
      if (title && credit) return title + ' - ' + credit;
      return title || alt || credit || 'Trip photo';
    }

    function photoKey(image) {
      var link = image.closest('figure') && image.closest('figure').querySelector('a[href]');
      return absoluteUrl(link ? link.getAttribute('href') : image.getAttribute('src')).split(/[?#]/)[0];
    }

    function photoDays() {
      var days = Object.create(null);
      var dayRecords = [];
      document.querySelectorAll('#itinerary .day').forEach(function (day, index) {
        var badge = cleanText(day.querySelector('.day-badge') && day.querySelector('.day-badge').textContent) || String(index + 1);
        dayRecords.push({ badge: badge, text: cleanText(day.textContent).toLowerCase() });
        day.querySelectorAll('.carousel img[src]').forEach(function (image) { days[photoKey(image)] = badge; });
      });
      document.querySelectorAll('#food-guide .fg-hub').forEach(function (hub) {
        var text = cleanText(hub.querySelector('.fg-hub-days') && hub.querySelector('.fg-hub-days').textContent);
        var match = text.match(/Days?\s+(\d+)(?:\s*[-–—]\s*(\d+))?/i);
        if (!match) return;
        var badge = match[2] ? match[1] + '-' + match[2] : match[1];
        hub.querySelectorAll('img[src]').forEach(function (image) { if (!days[photoKey(image)]) days[photoKey(image)] = badge; });
      });
      document.querySelectorAll('.base').forEach(function (base) {
        var title = cleanText(base.querySelector('h4') && base.querySelector('h4').textContent).toLowerCase();
        var record = title && dayRecords.find(function (day) { return day.text.includes(title); });
        if (!record && title) {
          var keyword = title.split(/\s|\//).find(function (word) { return word.length >= 4; });
          record = keyword && dayRecords.find(function (day) { return day.text.includes(keyword); });
        }
        base.querySelectorAll('img[src]').forEach(function (image) { if (!days[photoKey(image)]) days[photoKey(image)] = record ? record.badge : '0'; });
      });
      document.querySelectorAll('.pvcar figure').forEach(function (figure) {
        var image = figure.querySelector('img[src]');
        if (!image || days[photoKey(image)]) return;
        var cap = cleanText(figure.querySelector('.cap-day') && figure.querySelector('.cap-day').textContent);
        var match = cap.match(/Day\s+(\d+(?:\s*[-–—]\s*\d+)?)/i);
        if (match) days[photoKey(image)] = match[1].replace(/\s*[–—]\s*/g, '-');
      });
      return days;
    }

    function collectPhotos() {
      var seen = Object.create(null);
      var list = [];
      var days = photoDays();
      document.querySelectorAll('#itinerary .carousel figure, .pvcar figure').forEach(function (figure) {
        var image = figure.querySelector('img[src]');
        if (!image) return;
        var link = figure.querySelector('a[href]');
        var src = absoluteUrl(image.getAttribute('src'));
        var full = absoluteUrl(link ? link.getAttribute('href') : image.getAttribute('src'));
        var key = full.split('#')[0];
        if (!key || seen[key]) return;
        seen[key] = true;
        var caption = figureCaption(figure, image);
        var day = days[key] || '0';
        list.push({
          src: src,
          full: full,
          alt: cleanText(image.getAttribute('alt')) || 'Trip photo',
          caption: 'Day ' + day + ': ' + caption
        });
      });
      return list;
    }

    function buildBoard() {
      photos = collectPhotos();
      board.textContent = '';
      empty.hidden = photos.length > 0;
      countLabel.textContent = photos.length + (photos.length === 1 ? ' photo' : ' photos');
      photos.forEach(function (photo, index) {
        var tile = document.createElement('button');
        var image = document.createElement('img');
        var caption = document.createElement('span');
        tile.type = 'button';
        tile.className = 'trip-gallery-tile';
        tile.setAttribute('aria-label', 'Open photo ' + (index + 1) + ': ' + photo.caption);
        image.src = photo.src;
        image.alt = photo.alt;
        image.loading = 'lazy';
        caption.textContent = photo.caption;
        tile.appendChild(image);
        tile.appendChild(caption);
        tile.addEventListener('click', function () { openViewer(index); });
        board.appendChild(tile);
      });
      if (trigger) {
        trigger.hidden = !photos.length;
        trigger.setAttribute('aria-label', 'View gallery, ' + photos.length + ' photos');
      }
    }

    function installTrigger() {
      var hero = document.querySelector('.preview .pvcar, body > header, header, body > .preview, .preview');
      if (!hero || trigger) return;
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'trip-gallery-trigger';
      trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></g></svg><span>View gallery</span>';
      trigger.addEventListener('click', openDialog);
      hero.appendChild(trigger);
    }

    function openDialog() {
      lastFocus = document.activeElement;
      buildBoard();
      document.documentElement.classList.add('trip-gallery-open');
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute('open', '');
      dialog.classList.remove('is-viewing');
      window.setTimeout(function () {
        var first = board.querySelector('.trip-gallery-tile');
        (first || closeButton).focus();
      }, 0);
    }

    function closeDialog() {
      dialog.classList.remove('is-viewing');
      viewerImage.removeAttribute('src');
      if (dialog.close && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
      document.documentElement.classList.remove('trip-gallery-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function openViewer(index) {
      if (!photos.length) return;
      activeIndex = Math.max(0, Math.min(photos.length - 1, index));
      dialog.classList.add('is-viewing');
      renderViewer();
    }

    function closeViewer() {
      dialog.classList.remove('is-viewing');
      var tile = board.querySelectorAll('.trip-gallery-tile')[activeIndex];
      if (tile) tile.focus();
    }

    function renderViewer() {
      var photo = photos[activeIndex];
      viewerImage.src = photo.full;
      viewerImage.alt = photo.alt;
      viewerCaption.textContent = photo.caption;
      viewerCount.textContent = (activeIndex + 1) + ' / ' + photos.length;
    }

    function step(delta) {
      if (!photos.length || activeIndex < 0) return;
      activeIndex = (activeIndex + delta + photos.length) % photos.length;
      renderViewer();
    }

    installTrigger();
    buildBoard();

    closeButton.addEventListener('click', closeDialog);
    viewerClose.addEventListener('click', closeDialog);
    viewerBack.addEventListener('click', closeViewer);
    prevButton.addEventListener('click', function () { step(-1); });
    nextButton.addEventListener('click', function () { step(1); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener('cancel', function (event) {
      if (dialog.classList.contains('is-viewing')) {
        event.preventDefault();
        closeViewer();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (!dialog.open) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
      if (event.key === 'Escape' && !dialog.classList.contains('is-viewing')) closeDialog();
    });
    dialog.querySelector('.trip-gallery-stage').addEventListener('touchstart', function (event) {
      if (!event.touches || event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });
    dialog.querySelector('.trip-gallery-stage').addEventListener('touchend', function (event) {
      if (!event.changedTouches || event.changedTouches.length !== 1) return;
      var dx = event.changedTouches[0].clientX - touchStartX;
      var dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
    }, { passive: true });
    dialog.querySelector('.trip-gallery-stage').addEventListener('wheel', function (event) {
      if (!dialog.classList.contains('is-viewing') || Math.abs(event.deltaX) < 28) return;
      event.preventDefault();
      step(event.deltaX > 0 ? 1 : -1);
    }, { passive: false });
  })();

/* Responsive day navigator: a scroll-driven vertical dock on wide screens
     and a compact, swipeable strip on smaller screens. */
  (function () {
    var section = document.getElementById('itinerary');
    if (!section) return;

    var dock = section.querySelector('.day-dock');
    if (!dock) return;

    var track = dock.querySelector('.day-dock-track');
    var captionMeta = dock.querySelector('.day-dock-caption span');
    var captionTitle = dock.querySelector('.day-dock-caption strong');
    var items = [].slice.call(dock.querySelectorAll('.day-dock-item')).map(function (item) {
      var day = document.getElementById(item.getAttribute('data-day-id'));
      return day ? { item: item, day: day } : null;
    }).filter(Boolean);
    if (!items.length) return;

    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var desktopQuery = window.matchMedia ? window.matchMedia('(min-width: 1180px)') : { matches: false };
    var visible = false;
    var ticking = false;
    var activeIndex = -1;
    var scrollAnimationFrame = 0;

    function fallbackKind(text) {
      if (/ferry|boat|sail|ship|cross.+sea/.test(text)) return 'ship';
      if (/fly|flight|airport|overnight|pittsburgh|\bpit\b/.test(text)) return 'plane';
      if (/drive|driving|rental car|road trip|transfer/.test(text)) return 'car';
      return 'map';
    }

    function prepareItem(entry) {
      var item = entry.item;
      var thumb = item.querySelector('.day-dock-thumb');
      var tooltip = item.querySelector('.day-dock-tooltip');
      var image = entry.day.querySelector('.carousel img');
      item.setAttribute('aria-label', 'Jump to ' + tooltip.querySelector('span').textContent + ': ' + tooltip.querySelector('strong').textContent);
      if (image && image.getAttribute('src')) {
        var source = new URL(image.getAttribute('src'), document.baseURI).href;
        thumb.style.backgroundImage = 'url(' + JSON.stringify(source) + ')';
        item.classList.add('has-photo');
      } else {
        var use = item.querySelector('.day-dock-fallback use');
        use.setAttribute('href', '#day-dock-icon-' + fallbackKind(entry.day.textContent.toLowerCase()));
      }
    }

    function showCaption(item) {
      var tooltip = item.querySelector('.day-dock-tooltip');
      captionMeta.textContent = tooltip.querySelector('span').textContent;
      captionTitle.textContent = tooltip.querySelector('strong').textContent;
    }

    function scrollTrackTo(item) {
      if (desktopQuery.matches) return;
      var left = item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2;
      track.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
    }

    function stopFastScroll() {
      if (scrollAnimationFrame) window.cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = 0;
      document.documentElement.classList.remove('day-dock-fast-scroll');
    }

    function fastScrollTo(entry, event) {
      event.preventDefault();
      stopFastScroll();

      var root = document.documentElement;
      var wideNav = window.matchMedia && window.matchMedia('(min-width: 960px)').matches;
      var start = window.scrollY || window.pageYOffset;
      var end = start + entry.day.getBoundingClientRect().top - (wideNav ? 24 : 84);
      var duration = reducedMotion ? 0 : 220;
      var hash = entry.item.getAttribute('href');
      root.classList.add('day-dock-fast-scroll');
      if (window.history && window.history.pushState) window.history.pushState(null, '', hash);

      if (!duration) {
        window.scrollTo(0, end);
        root.classList.remove('day-dock-fast-scroll');
        return;
      }

      var started = window.performance.now();
      function step(now) {
        var progress = Math.min(1, (now - started) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, start + (end - start) * eased);
        if (progress < 1) scrollAnimationFrame = window.requestAnimationFrame(step);
        else stopFastScroll();
      }
      scrollAnimationFrame = window.requestAnimationFrame(step);
    }

    function setActive(index) {
      if (index === activeIndex) return;
      activeIndex = index;
      items.forEach(function (entry, itemIndex) {
        if (itemIndex === index) entry.item.setAttribute('aria-current', 'step');
        else entry.item.removeAttribute('aria-current');
      });
      showCaption(items[index].item);
      window.requestAnimationFrame(function () { scrollTrackTo(items[index].item); });
    }

    function scrollPosition() {
      var anchor = window.innerHeight * .45;
      var firstTop = items[0].day.getBoundingClientRect().top;
      if (anchor <= firstTop) return 0;

      for (var index = 0; index < items.length - 1; index += 1) {
        var nextTop = items[index + 1].day.getBoundingClientRect().top;
        if (anchor < nextTop) {
          var transition = Math.min(260, window.innerHeight * .28);
          var start = nextTop - transition;
          var progress = Math.max(0, Math.min(1, (anchor - start) / transition));
          return index + progress;
        }
      }
      return items.length - 1;
    }

    function update() {
      ticking = false;
      if (!visible) return;

      var position = scrollPosition();
      var baseSize = desktopQuery.matches
        ? Math.max(24, Math.min(40, (window.innerHeight - 110) / (items.length + 1.4)))
        : 40;

      items.forEach(function (entry, index) {
        var distance = Math.abs(index - position);
        var influence = Math.max(0, 1 - distance / 2.4);
        var scale = reducedMotion
          ? (Math.round(position) === index ? 1.14 : 1)
          : 1 + .68 * influence * influence;
        entry.item.style.setProperty('--dock-size', (baseSize * scale).toFixed(1) + 'px');
        entry.item.style.zIndex = String(Math.round(scale * 100));
      });
      setActive(Math.max(0, Math.min(items.length - 1, Math.round(position))));
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    function setVisible(isVisible) {
      visible = isVisible;
      dock.classList.toggle('is-visible', isVisible);
      if (isVisible) requestUpdate();
    }

    items.forEach(function (entry) {
      prepareItem(entry);
      entry.item.addEventListener('click', function (event) { fastScrollTo(entry, event); });
      entry.item.addEventListener('focus', function () {
        if (!desktopQuery.matches) showCaption(entry.item);
      });
      entry.item.addEventListener('blur', function () {
        if (!desktopQuery.matches && activeIndex >= 0) showCaption(items[activeIndex].item);
      });
    });

    dock.hidden = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        setVisible(entries[0].isIntersecting);
      }, { threshold: 0 }).observe(section);
    } else {
      var checkVisibility = function () {
        var rect = section.getBoundingClientRect();
        setVisible(rect.bottom > 0 && rect.top < window.innerHeight);
      };
      window.addEventListener('scroll', checkVisibility, { passive: true });
      checkVisibility();
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('wheel', stopFastScroll, { passive: true });
    window.addEventListener('touchstart', stopFastScroll, { passive: true });
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', requestUpdate);
    else if (desktopQuery.addListener) desktopQuery.addListener(requestUpdate);
  })();
