/* Links to the official sources, on the story banners. Nothing official is copied or hosted here: the comics link to
   their page on titan-comics.com, and trailers are the studios' own YouTube uploads. A trailer is a button until it is
   clicked, so YouTube sees nothing from this page before then (and the offline copy has nothing to fetch).
   Each entry was opened and checked on the live site. To add one, check the page or the uploader first, then add a line
   below; tools/check.py rejects any other host and any malformed video id. */
(function () {
  var TITAN = 'https://titan-comics.com/comics/series/';
  var OFFICIAL = {
    origins: { titan: '578-blade-runner-origins', name: 'Blade Runner: Origins' },
    tokyo:   { titan: '579-blade-runner-tokyo-nexus', name: 'Blade Runner: Tokyo Nexus' },
    br2019:  { titan: '575-blade-runner-2019', name: 'Blade Runner 2019' },
    br2029:  { titan: '576-blade-runner-2029', name: 'Blade Runner 2029' },
    br2039:  { titan: '595-blade-runner-2039', name: 'Blade Runner 2039' },
    lotus:   { titan: '577-blade-runner-black-lotus', name: 'Blade Runner: Black Lotus', video: 'ahNgjVcq4sA', by: 'Adult Swim' },
    blackout: { video: 'rrZk9sSgRyQ', by: 'Warner Bros.', what: 'The short film' },
    dawn:    { video: 'UgsS3nhRRzQ', by: 'Warner Bros.', what: 'The short film' },
    nowhere: { video: 'aZ9Os8cP_gg', by: 'Warner Bros.', what: 'The short film' },
    film82:  { video: 'qoEyZoOTtss', by: 'Warner Bros. Entertainment', what: 'The Final Cut trailer' },
    film49:  { video: 'gCcx85zbxz4', by: 'Warner Bros.', what: 'Official trailer' }
  };

  function link(href, text, label) {
    var a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'off-link';
    a.textContent = text + ' ↗';
    a.setAttribute('aria-label', label + ' (opens in a new tab)');
    return a;
  }

  Object.keys(OFFICIAL).forEach(function (id) {
    var d = OFFICIAL[id];
    var banner = document.querySelector('#' + id + ' .vol-banner'); if (!banner) return;
    var host = banner.querySelector('.bt') || banner;
    var row = document.createElement('div'); row.className = 'official';
    var tag = document.createElement('span'); tag.className = 'off-tag'; tag.textContent = 'Official'; row.appendChild(tag);
    if (d.titan) row.appendChild(link(TITAN + d.titan + '/', 'Titan Comics', d.name + ' on Titan Comics'));
    if (d.video) {
      var watch = document.createElement('button'); watch.type = 'button'; watch.className = 'off-watch';
      watch.textContent = '▶ ' + (d.what || 'Official trailer');
      watch.setAttribute('aria-label', (d.what || 'Official trailer') + ', from ' + d.by + '. Plays here, from YouTube.');
      var frame = document.createElement('div'); frame.className = 'off-frame'; frame.hidden = true;
      watch.addEventListener('click', function () {
        if (!frame.firstChild) {
          var f = document.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + d.video + '?autoplay=1&rel=0';
          f.title = (d.what || 'Official trailer') + ' (' + d.by + ' on YouTube)';
          f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.setAttribute('allowfullscreen', '');
          f.referrerPolicy = 'strict-origin-when-cross-origin'; f.loading = 'lazy';
          frame.appendChild(f); frame.hidden = false; watch.setAttribute('aria-expanded', 'true');
        } else { frame.removeChild(frame.firstChild); frame.hidden = true; watch.setAttribute('aria-expanded', 'false'); }
      });
      watch.setAttribute('aria-expanded', 'false');
      row.appendChild(watch);
      row.appendChild(link('https://www.youtube.com/watch?v=' + d.video, 'YouTube', (d.what || 'Official trailer') + ' on YouTube, ' + d.by));
      var credit = document.createElement('span'); credit.className = 'off-by'; credit.textContent = d.by; row.appendChild(credit);
      host.appendChild(row); host.appendChild(frame); return;
    }
    host.appendChild(row);
  });
})();
