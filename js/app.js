/*************************************************
 * CONFIG
 *************************************************/
const API_URL =
  "https://script.google.com/macros/s/AKfycbzXJYSI5VwLndm8tzCwBqDGPjYNiWrMGdNH0eg9KNzCkCwFVG-l4yToSHTCQhYGe0qUmg/exec";

const PLAYER_PHOTOS = {
  "Deepak L": "assets/players/deepak-l.png",
  "Pradyum": "assets/players/pradyum.jpg",
  "Kiran": "assets/players/kiran.jpg",
  "Rahul": "assets/players/rahul.jpg",
  "Omkar": "assets/players/omkar.jpg",
  "Sandeep W": "assets/players/sandeep-w.jpg",
  "Jaswanth": "assets/players/jaswanth.jpg"
};

const DEFAULT_PLAYER_PHOTO = "assets/players/default.png";

/*************************************************
 * UTIL
 *************************************************/
function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

/*************************************************
 * STATE
 *************************************************/
let dataCache = null;

/*************************************************
 * INIT
 *************************************************/
async function init() {
  const res = await fetch(API_URL);
  dataCache = await res.json();
  showFixtures();
}
init();

/*************************************************
 * FIXTURES
 *************************************************/
function showFixtures() {
  const c = document.getElementById("main-content");

  c.innerHTML = `
    <h2>Fixtures & Results</h2>
    <div id="fixtures-grid" class="fixtures-grid"></div>
  `;

  renderFixtures();
}

function renderFixtures() {
  const grid = document.getElementById("fixtures-grid");
  grid.innerHTML = "";

  const fixtures = dataCache.fixtures;
  const results = dataCache.results || {};

  fixtures.forEach(f => {
    const card = document.createElement("div");
    card.className = "fixture-card";

    let html = `
      <div class="fixture-header">
        ${f.team_a} <span class="vs">vs</span> ${f.team_b}
      </div>
    `;

    f.matches.forEach((pair, i) => {
      const r = results[f.tie_id];
      const m = r && r.matches[i];

      if (!m || !m.sets) {
        html += `
          <div class="result-row pending">
            <div>M${i + 1}</div>
            <div>${pair[0]}</div>
            <div>vs</div>
            <div>${pair[1]}</div>
            <div>—</div>
          </div>
        `;
        return;
      }

      const score = m.sets.map(s => `${s[0]}-${s[1]}`).join(" | ");

      html += `
        <div class="result-row">
          <div>M${i + 1}</div>
          <div>${pair[0]}</div>
          <div>vs</div>
          <div>${pair[1]}</div>
          <div>${score}</div>
        </div>
      `;
    });

    card.innerHTML = html;
    grid.appendChild(card);
  });
}

/*************************************************
 * PLAYER STANDINGS (TOP 10)
 *************************************************/
function showPlayerStandings() {
  const players = computeIndividualPlayerStandings().slice(0, 10);
  const c = document.getElementById("main-content");

  let html = `
    <h2>Player Standings (Top 10)</h2>

    <div class="fixture-card standings-wrapper">
      <div class="standings-grid standings-header">
        <div>R</div>
        <div>Player</div>
        <div>Team</div>
        <div>P</div>
        <div>W</div>
        <div>L</div>
        <div>Win%</div>
        <div>Form</div>
      </div>
  `;

  players.forEach((p, i) => {
    html += `
      <div class="standings-grid standings-row">
        <div>${i + 1}</div>
        <div style="cursor:pointer;color:#2563eb;font-weight:700"
             onclick="showPlayerProfile('${p.name}')">
          ${p.name}
        </div>
        <div>${p.team}</div>
        <div>${p.played}</div>
        <div>${p.wins}</div>
        <div>${p.losses}</div>
        <div>${p.winPct}</div>
        <div>${renderForm(p.recentForm)}</div>
      </div>
    `;
  });

  c.innerHTML = html + `</div>`;
}

/*************************************************
 * PLAYER PROFILE (ENHANCED + IMAGE ✅)
 *************************************************/
function showPlayerProfile(playerName) {
  const c = document.getElementById("main-content");

  const players = computeIndividualPlayerStandings();
  const player = players.find(
    p => normalizeName(p.name) === normalizeName(playerName)
  );

  if (!player) {
    c.innerHTML = "<h2>Player not found</h2>";
    return;
  }

  const rank = players.indexOf(player) + 1;
  const photo =
    PLAYER_PHOTOS[normalizeName(player.name)] || DEFAULT_PLAYER_PHOTO;

  const matchHistory = [];

  dataCache.fixtures.forEach(f => {
    const r = dataCache.results?.[f.tie_id];
    if (!r) return;

    f.matches.forEach((pair, i) => {
      if (!pair.join(" ").includes(playerName)) return;
      const m = r.matches[i];
      if (!m || !m.sets) return;

      matchHistory.push({
        opponent: pair[0].includes(playerName) ? pair[1] : pair[0],
        match: `${f.team_a} vs ${f.team_b}`,
        score: m.sets.map(s => `${s[0]}-${s[1]}`).join(" | ")
      });
    });
  });

  c.innerHTML = `
    <div class="player-profile">

      <div class="player-profile-header">
        <img src="${photo}" class="player-photo"
             onerror="this.src='${DEFAULT_PLAYER_PHOTO}'">

        <div class="player-info">
          <h2>${player.name}</h2>
          <p><strong>${player.team}</strong></p>
          <p>Rank: ${rank}</p>
        </div>
      </div>

      <div class="summary">
        Played: ${player.played} |
        Wins: ${player.wins} |
        Losses: ${player.losses} |
        Win%: ${player.winPct}
      </div>

      <div class="summary">
        Sets: ${player.setsWon}-${player.setsLost} |
        Points: ${player.pointsWon}-${player.pointsLost}
      </div>

      <div class="summary">
        Recent Form: ${renderForm(player.recentForm)}
      </div>

      <h3>Match History</h3>

      <div class="fixture-card">
        ${
          matchHistory.length === 0
            ? "<p>No completed matches</p>"
            : matchHistory.map(m => `
                <div class="result-row">
                  <div>vs</div>
                  <div>${m.opponent}</div>
                  <div></div>
                  <div>${m.match}</div>
                  <div>${m.score}</div>
                </div>
              `).join("")
        }
      </div>

      <button class="back-btn" onclick="showPlayerStandings()">
        ← Back to Player Standings
      </button>

    </div>
  `;
}

/*************************************************
 * PLAYER STATS ENGINE
 *************************************************/
function computeIndividualPlayerStandings() {
  const fixtures = dataCache.fixtures;
  const results = dataCache.results || {};
  const stats = {};

  function initPlayer(name, team) {
    return {
      name,
      team,
      played: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
      setDiff: 0,
      pointDiff: 0,
      winPct: 0,
      recentForm: ""
    };
  }

  fixtures.forEach(f => {
    f.matches.forEach(pair => {
      pair[0].split("/").forEach(p => {
        const n = p.trim();
        stats[n] ??= initPlayer(n, f.team_a);
      });
      pair[1].split("/").forEach(p => {
        const n = p.trim();
        stats[n] ??= initPlayer(n, f.team_b);
      });
    });
  });

  Object.entries(results).forEach(([tieId, r]) => {
    const f = fixtures.find(x => String(x.tie_id) === String(tieId));
    if (!f) return;

    r.matches.forEach((m, i) => {
      if (!m || !m.sets) return;

      const [aPair, bPair] = f.matches[i];
      const aPlayers = aPair.split("/").map(p => p.trim());
      const bPlayers = bPair.split("/").map(p => p.trim());

      let aSets = 0, bSets = 0;
      let aPts = 0, bPts = 0;

      m.sets.forEach(([a, b]) => {
        aPts += a;
        bPts += b;
        a > b ? aSets++ : bSets++;
      });

      aPlayers.forEach(p => {
        const s = stats[p];
        s.played++;
        s.setsWon += aSets;
        s.setsLost += bSets;
        s.pointsWon += aPts;
        s.pointsLost += bPts;
        s.recentForm += aSets > bSets ? "W" : "L";
        if (aSets > bSets) s.wins++; else s.losses++;
      });

      bPlayers.forEach(p => {
        const s = stats[p];
        s.played++;
        s.setsWon += bSets;
        s.setsLost += aSets;
        s.pointsWon += bPts;
        s.pointsLost += aPts;
        s.recentForm += bSets > aSets ? "W" : "L";
        if (bSets > aSets) s.wins++; else s.losses++;
      });
    });
  });

  Object.values(stats).forEach(p => {
    p.setDiff = p.setsWon - p.setsLost;
    p.pointDiff = p.pointsWon - p.pointsLost;
    p.winPct = p.played ? Math.round((p.wins / p.played) * 100) : 0;
    p.recentForm = p.recentForm.slice(-5);
  });

  return Object.values(stats).sort((a, b) =>
    b.wins - a.wins ||
    b.setDiff - a.setDiff ||
    b.pointDiff - a.pointDiff ||
    a.played - b.played ||
    a.name.localeCompare(b.name)
  );
}

/*************************************************
 * FORM RENDER
 *************************************************/
function renderForm(form) {
  return form
    .split("")
    .map(c => c === "W"
      ? `<span class="form-W">W</span>`
      : `<span class="form-L">L</span>`
    )
    .join("");
}
/*************************************************
 * PLACEHOLDER VIEWS (PREVENT CONSOLE ERRORS)
 *************************************************/
function showStandings() {
  const c = document.getElementById("main-content");
  c.innerHTML = `
    <h2>Team Standings</h2>
    <p>Team standings view will be added here.</p>
  `;
}

function renderTeamView() {
 function renderTeamView() {
  const c = document.getElementById("main-content");

  const teams = [...new Set(
    dataCache.fixtures.flatMap(f => [f.team_a, f.team_b])
  )];

  c.innerHTML = `
    <h2>Team Match Tracker</h2>

    <div class="filters">
      <select id="teamSelect"></select>
    </div>

    <div id="team-summary"></div>
    <div id="team-matches" class="fixtures-grid"></div>
  `;

  const teamSelect = document.getElementById("teamSelect");
  teams.forEach(t => {
    teamSelect.innerHTML += `<option value="${t}">${t}</option>`;
  });

  teamSelect.onchange = () => renderTeamMatches(teamSelect.value);

  // Render first team by default
  renderTeamMatches(teams[0]);
}
}

function renderPlayerView() {
  const c = document.getElementById("main-content");
  c.innerHTML = `
    <h2>Player Match Tracker</h2>
    <p>Player match tracker will be added here.</p>
  `;
}

function showTeamSquads() {
  const c = document.getElementById("main-content");
  c.innerHTML = `
    <h2>Teams</h2>
    <p>Team squads view will be added here.</p>
  `;
}

function renderTeamMatches(team) {
.setsLost += teamSetsLost;  const grid = document.getElementById("team-matches");
      stats.pointsWon += teamPtsWon;
      stats.pointsLost += teamPtsLost;

      if (teamSetsWon > teamSetsLost) stats.wins++;
      else stats.losses++;

      const score = m.sets.map(s => `${s[0]}-${s[1]}`).join(" | ");

      html += `
        <div class="result-row">
          <div>M${i + 1}</div>
          <div>${pair[0]}</div>
          <div>vs</div>
          <div>${pair[1]}</div>
          <div>${score}</div>
        </div>
      `;
    });

    card.innerHTML = html;
    grid.appendChild(card);
  });

  // ✅ Live standings summary
  summary.innerHTML = `
    <div class="summary">
      <strong>${team}</strong> |
      Played: ${stats.played} |
      Wins: ${stats.wins} |
      Losses: ${stats.losses} |
      Sets: ${stats.setsWon}-${stats.setsLost} |
      Points: ${stats.pointsWon}-${stats.pointsLost}
    </div>
  `;
}

  const summary = document.getElementById("team-summary");

  grid.innerHTML = "";

  const fixtures = dataCache.fixtures;
  const results = dataCache.results || {};

  // ✅ Team live stats
  const stats = {
    played: 0,
    wins: 0,
    losses: 0,
    setsWon: 0,
    setsLost: 0,
    pointsWon: 0,
    pointsLost: 0
  };

  fixtures.forEach(f => {
    if (f.team_a !== team && f.team_b !== team) return;

    const card = document.createElement("div");
    card.className = "fixture-card";

    let html = `
      <div class="fixture-header">
        ${f.team_a} <span class="vs">vs</span> ${f.team_b}
      </div>

      <div class="result-row header">
        <div>M</div>
        <div>${f.team_a}</div>
        <div>VS</div>
        <div>${f.team_b}</div>
        <div>Score</div>
      </div>
    `;

    const r = results[f.tie_id];

    f.matches.forEach((pair, i) => {
      const m = r && r.matches[i];

      // Pending
      if (!m || !m.sets) {
        html += `
          <div class="result-row pending">
            <div>M${i + 1}</div>
            <div>${pair[0]}</div>
            <div>vs</div>
            <div>${pair[1]}</div>
            <div>—</div>
          </div>
        `;
        return;
      }

      // Completed
      let aSets = 0, bSets = 0;
      let aPts = 0, bPts = 0;

      m.sets.forEach(([a, b]) => {
        aPts += a;
        bPts += b;
        a > b ? aSets++ : bSets++;
      });

      const teamIsA = f.team_a === team;
      const teamSetsWon = teamIsA ? aSets : bSets;
      const teamSetsLost = teamIsA ? bSets : aSets;
      const teamPtsWon = teamIsA ? aPts : bPts;
      const teamPtsLost = teamIsA ? bPts : aPts;

      stats.played++;
      stats.setsWon += teamSetsWon;

/*************************************************
 * EXPORTS
 *************************************************/
window.showFixtures = showFixtures;
window.showPlayerStandings = showPlayerStandings;
window.showPlayerProfile = showPlayerProfile;

/* EXPORT */

window.showResults = showResults;
window.renderTeamView = renderTeamView;
window.renderPlayerView = renderPlayerView;
window.showStandings = showStandings;
