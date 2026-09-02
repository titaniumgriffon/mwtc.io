(function () {
  var SESSIONIZE_URL = 'https://sessionize.com/api/v2/c2u6te92/view/All';

  // Sessionize returns startsAt/endsAt as a timezone-less wall-clock string
  // (e.g. "2026-10-07T08:00:00") representing local event time in Columbia,
  // MO. Parsing it with `new Date()` and formatting with the visitor's
  // locale would silently reinterpret it in the visitor's own time zone, so
  // the hour/minute are read directly from the string instead.
  function formatTime(iso) {
    if (!iso) return 'To be announced';
    var match = /T(\d{2}):(\d{2})/.exec(iso);
    if (!match) return 'To be announced';
    var hour = parseInt(match[1], 10);
    var period = hour >= 12 ? 'PM' : 'AM';
    var displayHour = hour % 12 || 12;
    return displayHour + ':' + match[2] + ' ' + period + ' CT';
  }

  function initials(fullName) {
    var parts = fullName.trim().split(/\s+/);
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  function speakerBadge(speaker) {
    var el = document.createElement('div');
    el.className = 'speaker-inline';
    if (speaker.profilePicture) {
      var img = document.createElement('img');
      img.src = speaker.profilePicture;
      img.alt = speaker.fullName;
      img.className = 'speaker-photo';
      el.appendChild(img);
    } else {
      var initialsEl = document.createElement('div');
      initialsEl.className = 'speaker-initials';
      initialsEl.textContent = initials(speaker.fullName);
      el.appendChild(initialsEl);
    }
    var name = document.createElement('span');
    name.className = 'speaker-name';
    name.textContent = speaker.fullName;
    el.appendChild(name);
    return el;
  }

  function speakerPhotoCard(speaker) {
    var card = document.createElement('div');
    card.className = 'speaker-card';

    var link = (speaker.links || []).find(function (l) { return l.linkType === 'Sessionize'; });
    var a = document.createElement(link ? 'a' : 'div');
    if (link) a.href = link.url;

    var figure = document.createElement('figure');
    if (speaker.profilePicture) {
      var img = document.createElement('img');
      img.src = speaker.profilePicture;
      img.alt = speaker.fullName;
      img.className = 'speaker-photo';
      figure.appendChild(img);
    } else {
      var initialsEl = document.createElement('div');
      initialsEl.className = 'speaker-initials';
      initialsEl.textContent = initials(speaker.fullName);
      figure.appendChild(initialsEl);
    }
    var figcaption = document.createElement('figcaption');
    figcaption.textContent = speaker.fullName;
    figure.appendChild(figcaption);

    a.appendChild(figure);
    card.appendChild(a);
    return card;
  }

  function fetchScheduleData() {
    return fetch(SESSIONIZE_URL).then(function (res) {
      if (!res.ok) throw new Error('Sessionize request failed: ' + res.status);
      return res.json();
    });
  }

  // Confirmed talks and all service items (breaks, registration, lunch,
  // etc.) are shown, merged into one time-ordered schedule; the caller tells
  // them apart via session.isServiceSession. Service items skip the
  // isConfirmed check because they're logistics set by organizers, not
  // speaker-dependent content Sessionize needs to confirm.
  function scheduledSessions(data) {
    return (data.sessions || [])
      .filter(function (s) { return s.isConfirmed || s.isServiceSession; })
      .sort(function (a, b) {
        if (!a.startsAt) return 1;
        if (!b.startsAt) return -1;
        return new Date(a.startsAt) - new Date(b.startsAt);
      });
  }

  function speakerById(data, id) {
    return (data.speakers || []).find(function (s) { return s.id === id; });
  }

  function serviceCard(session) {
    var card = document.createElement('div');
    card.className = 'schedule-card schedule-card-service';
    card.dataset.sessionId = session.id;

    var time = document.createElement('div');
    time.className = 'schedule-time';
    time.textContent = formatTime(session.startsAt);
    card.appendChild(time);

    var title = document.createElement('h2');
    title.className = 'schedule-session-title';
    title.textContent = session.title;
    card.appendChild(title);

    return card;
  }

  function talkCard(data, session) {
    var card = document.createElement('a');
    card.className = 'schedule-card';
    card.dataset.sessionId = session.id;
    card.href = '/schedule/' + encodeURIComponent(session.id) + '/';

    var time = document.createElement('div');
    time.className = 'schedule-time';
    time.textContent = formatTime(session.startsAt);
    card.appendChild(time);

    var title = document.createElement('h2');
    title.className = 'schedule-session-title';
    title.textContent = session.title;
    card.appendChild(title);

    var speakerIds = session.speakers || [];
    if (speakerIds.length) {
      var speakersWrap = document.createElement('div');
      speakersWrap.className = 'schedule-speakers';
      speakerIds.forEach(function (id) {
        var speaker = speakerById(data, id);
        if (speaker) speakersWrap.appendChild(speakerBadge(speaker));
      });
      card.appendChild(speakersWrap);
    }

    return card;
  }

  // The schedule list is already fully rendered at build time (see
  // content/schedule/_content.gotmpl), so visitors and crawlers alike see a
  // real schedule immediately. This just re-fetches Sessionize live and
  // replaces it in place if anything has changed since the last deploy; on
  // failure it silently leaves the build-time snapshot as the fallback.
  function hydrateList() {
    var container = document.getElementById('schedule-container');
    if (!container) return;

    var empty = document.getElementById('schedule-empty');

    fetchScheduleData().then(function (data) {
      var sessions = scheduledSessions(data);
      container.innerHTML = '';

      if (!sessions.length) {
        empty.hidden = false;
        return;
      }

      empty.hidden = true;
      sessions.forEach(function (session) {
        container.appendChild(
          session.isServiceSession ? serviceCard(session) : talkCard(data, session)
        );
      });
    }).catch(function (err) {
      console.error('Failed to refresh schedule from Sessionize', err);
    });
  }

  // Same idea as hydrateList: the session page already has real content
  // from the last build, this just patches it live if Sessionize has a
  // newer confirmation status, time, room, speakers, or description.
  function hydrateDetail() {
    var root = document.getElementById('session-detail');
    if (!root) return;

    var id = root.dataset.sessionId;
    if (!id) return;

    fetchScheduleData().then(function (data) {
      var session = (data.sessions || []).find(function (s) { return s.id === id; });
      if (!session || !(session.isConfirmed || session.isServiceSession)) return;

      document.title = session.title + ' · Midwest Tech Conference';
      document.getElementById('session-title').textContent = session.title;
      document.getElementById('session-time').textContent = formatTime(session.startsAt);

      var room = (data.rooms || []).find(function (r) { return r.id === session.roomId; });
      var roomRow = document.getElementById('session-room-row');
      roomRow.hidden = !room;
      if (room) document.getElementById('session-room').textContent = room.name;

      var speakers = (session.speakers || []).map(function (id) { return speakerById(data, id); }).filter(Boolean);
      var speakersRow = document.getElementById('session-speakers-row');
      var sidebar = document.getElementById('session-sidebar');
      speakersRow.hidden = !speakers.length;
      sidebar.hidden = !speakers.length;

      if (speakers.length) {
        document.getElementById('session-speakers-label').textContent = speakers.length > 1 ? 'Speakers:' : 'Speaker:';
        document.getElementById('session-speakers').textContent = speakers.map(function (s) { return s.fullName; }).join(', ');
        document.getElementById('session-sidebar-label').textContent = speakers.length > 1 ? 'Speakers' : 'Speaker';

        var photosWrap = document.getElementById('session-speaker-photos');
        photosWrap.innerHTML = '';
        speakers.forEach(function (speaker) { photosWrap.appendChild(speakerPhotoCard(speaker)); });
      }

      var descSection = document.getElementById('session-description');
      descSection.hidden = !session.description;
      if (session.description) {
        descSection.querySelector('.session-description-body').textContent = session.description;
      }
    }).catch(function (err) {
      console.error('Failed to refresh session from Sessionize', err);
    });
  }

  hydrateList();
  hydrateDetail();
})();
