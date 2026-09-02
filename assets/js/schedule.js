(function () {
  var SESSIONIZE_URL = 'https://sessionize.com/api/v2/c2u6te92/view/All';

  function formatTime(iso) {
    if (!iso) return 'To be announced';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function initials(fullName) {
    var parts = fullName.trim().split(/\s+/);
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  function speakerBadge(speaker, nameTag) {
    var el = document.createElement(nameTag ? 'div' : 'a');
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

  function fetchScheduleData() {
    return fetch(SESSIONIZE_URL).then(function (res) {
      if (!res.ok) throw new Error('Sessionize request failed: ' + res.status);
      return res.json();
    });
  }

  function confirmedSessions(data) {
    return (data.sessions || [])
      .filter(function (s) { return s.isConfirmed && !s.isServiceSession; })
      .sort(function (a, b) {
        if (!a.startsAt) return 1;
        if (!b.startsAt) return -1;
        return new Date(a.startsAt) - new Date(b.startsAt);
      });
  }

  function speakerById(data, id) {
    return (data.speakers || []).find(function (s) { return s.id === id; });
  }

  function renderList() {
    var container = document.getElementById('schedule-container');
    if (!container) return;

    var skeleton = document.getElementById('schedule-skeleton');
    var empty = document.getElementById('schedule-empty');
    var error = document.getElementById('schedule-error');

    fetchScheduleData().then(function (data) {
      var sessions = confirmedSessions(data);
      skeleton.hidden = true;

      if (!sessions.length) {
        empty.hidden = false;
        return;
      }

      sessions.forEach(function (session) {
        var card = document.createElement('a');
        card.className = 'schedule-card';
        card.href = '/schedule/session/?id=' + encodeURIComponent(session.id);

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
            if (speaker) speakersWrap.appendChild(speakerBadge(speaker, true));
          });
          card.appendChild(speakersWrap);
        }

        container.appendChild(card);
      });
    }).catch(function (err) {
      skeleton.hidden = true;
      error.hidden = false;
      console.error('Failed to load schedule from Sessionize', err);
    });
  }

  function renderDetail() {
    var root = document.getElementById('session-detail');
    if (!root) return;

    var skeleton = document.getElementById('session-skeleton');
    var notFound = document.getElementById('session-not-found');
    var error = document.getElementById('session-error');
    var id = new URLSearchParams(window.location.search).get('id');

    if (!id) {
      skeleton.hidden = true;
      notFound.hidden = false;
      return;
    }

    fetchScheduleData().then(function (data) {
      var session = (data.sessions || []).find(function (s) { return s.id === id; });
      skeleton.hidden = true;

      if (!session || !session.isConfirmed) {
        notFound.hidden = false;
        return;
      }

      document.title = session.title + ' · Midwest Tech Conference';
      root.hidden = false;

      document.getElementById('session-title').textContent = session.title;
      document.getElementById('session-time').textContent = formatTime(session.startsAt);

      var room = (data.rooms || []).find(function (r) { return r.id === session.roomId; });
      if (room) {
        document.getElementById('session-room-row').hidden = false;
        document.getElementById('session-room').textContent = room.name;
      }

      var speakers = (session.speakers || []).map(function (id) { return speakerById(data, id); }).filter(Boolean);

      if (speakers.length) {
        var speakersRow = document.getElementById('session-speakers-row');
        speakersRow.hidden = false;
        document.getElementById('session-speakers-label').textContent = speakers.length > 1 ? 'Speakers:' : 'Speaker:';
        document.getElementById('session-speakers').textContent = speakers.map(function (s) { return s.fullName; }).join(', ');

        var sidebar = document.getElementById('session-sidebar');
        sidebar.hidden = false;
        document.getElementById('session-sidebar-label').textContent = speakers.length > 1 ? 'Speakers' : 'Speaker';
        var photosWrap = document.getElementById('session-speaker-photos');
        speakers.forEach(function (speaker) {
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
          photosWrap.appendChild(card);
        });
      }

      if (session.description) {
        var descSection = document.getElementById('session-description');
        descSection.hidden = false;
        descSection.querySelector('.session-description-body').textContent = session.description;
      }
    }).catch(function (err) {
      skeleton.hidden = true;
      error.hidden = false;
      console.error('Failed to load session from Sessionize', err);
    });
  }

  renderList();
  renderDetail();
})();
