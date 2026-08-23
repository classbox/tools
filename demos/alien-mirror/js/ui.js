/**
 * UI & HUD Manager Module
 * Manages player name entry on launch, leaderboard persistence,
 * top-right audio and reset controls, and victory leaderboard display.
 */
class UIManager {
  constructor() {
    this.isModalOpen = true; // Start modal is open initially
    this.playerName = localStorage.getItem('optics_last_player_name') || 'Pilot';
    this.leaderboardKey = 'optics_leaderboard_records_v2';

    this.cacheDOMElements();
    this.setupEventListeners();
    this.initStartModal();
  }

  cacheDOMElements() {
    this.btnSound = document.getElementById('btn-sound');
    this.btnResetTimes = document.getElementById('btn-reset-times');
    this.startModal = document.getElementById('start-modal');
    this.playerNameInput = document.getElementById('player-name-input');
    this.btnStartGame = document.getElementById('btn-start-game');

    this.victoryModal = document.getElementById('victory-modal');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.victoryPlayerName = document.getElementById('victory-player-name');
    this.victoryPlayerTime = document.getElementById('victory-player-time');
    this.victoryRankBadge = document.getElementById('victory-rank-badge');
    this.leaderboardRows = document.getElementById('leaderboard-rows');
  }

  setupEventListeners() {
    // 1. Sound toggle
    if (this.btnSound) {
      this.btnSound.addEventListener('click', () => {
        const isEnabled = window.soundFX.toggleSound();
        this.btnSound.textContent = isEnabled ? '🔊 Sound' : '🔈 Muted';
        if (isEnabled) {
          this.btnSound.classList.remove('muted');
        } else {
          this.btnSound.classList.add('muted');
        }
      });
    }

    // 2. Reset Times button under Sound button
    if (this.btnResetTimes) {
      this.btnResetTimes.addEventListener('click', () => {
        this.resetLeaderboard();
      });
    }

    // 3. Start Mission button & Enter key
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        this.startGameFromModal();
      });
    }

    if (this.playerNameInput) {
      this.playerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.startGameFromModal();
        }
      });
    }

    // 4. Victory Play Again button
    if (this.btnPlayAgain) {
      this.btnPlayAgain.addEventListener('click', () => {
        this.hideVictoryModal();
        if (window.game) {
          window.game.resetGame();
        }
      });
    }
  }

  initStartModal() {
    if (this.playerNameInput) {
      this.playerNameInput.value = this.playerName;
      setTimeout(() => {
        this.playerNameInput.focus();
        this.playerNameInput.select();
      }, 100);
    }
  }

  startGameFromModal() {
    if (this.playerNameInput) {
      const val = this.playerNameInput.value.trim();
      this.playerName = val.length > 0 ? val : 'Pilot';
      localStorage.setItem('optics_last_player_name', this.playerName);
    }

    if (this.startModal) {
      this.startModal.classList.add('hidden');
    }
    this.isModalOpen = false;

    if (window.game) {
      window.game.gameStartTime = performance.now();
      window.game.gameElapsedTime = 0;
      window.game.isVictory = false;

      // Lock mouse on start
      const canvas = document.querySelector('canvas') || document.body;
      if (canvas && canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    }
  }

  // Retrieve leaderboard from localStorage
  getLeaderboard() {
    const raw = localStorage.getItem(this.leaderboardKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const fakeNames = new Set(['Nova Prime', 'Photon Ace', 'Cosmic Ray', 'Starlight', 'Cadet Spark']);
          const clean = parsed.filter(item => item && item.name && !fakeNames.has(item.name));
          return clean.sort((a, b) => a.time - b.time);
        }
      } catch (e) {}
    }
    return [];
  }

  saveLeaderboard(records) {
    localStorage.setItem(this.leaderboardKey, JSON.stringify(records));
  }

  resetLeaderboard() {
    this.saveLeaderboard([]);

    if (this.btnResetTimes) {
      const originalText = this.btnResetTimes.textContent;
      this.btnResetTimes.textContent = 'Cleared! ✓';
      setTimeout(() => {
        if (this.btnResetTimes) this.btnResetTimes.textContent = originalText;
      }, 1500);
    }
  }

  showVictoryModal() {
    let finalTime = 0;
    if (window.game) {
      window.game.isVictory = true;
      if (window.game.player && window.game.player.isFiring) {
        window.game.player.toggleFiring(false);
      }
      finalTime = window.game.gameElapsedTime;
    }

    // Save and rank player's run
    const records = this.getLeaderboard();
    const newEntry = {
      name: this.playerName || 'Pilot',
      time: parseFloat(finalTime.toFixed(1))
    };

    records.push(newEntry);
    records.sort((a, b) => a.time - b.time);
    this.saveLeaderboard(records);

    // Find rank index of this current run
    const playerRankIndex = records.indexOf(newEntry);
    const playerRank = playerRankIndex + 1;

    // Update Hero Banner
    if (this.victoryPlayerName) {
      this.victoryPlayerName.textContent = newEntry.name;
    }
    if (this.victoryPlayerTime) {
      this.victoryPlayerTime.textContent = `${finalTime.toFixed(1)}s`;
    }
    if (this.victoryRankBadge) {
      const medal = playerRank === 1 ? '🥇 ' : (playerRank === 2 ? '🥈 ' : (playerRank === 3 ? '🥉 ' : ''));
      this.victoryRankBadge.textContent = `${medal}RANK #${playerRank}`;
    }

    // Render Large Leaderboard Rows
    if (this.leaderboardRows) {
      this.leaderboardRows.innerHTML = '';

      // Display up to top 10
      const displayCount = Math.min(records.length, 10);
      for (let i = 0; i < displayCount; i++) {
        const row = records[i];
        const rank = i + 1;
        const tr = document.createElement('tr');

        // Gold, Silver, Bronze classes
        if (rank === 1) tr.className = 'rank-gold';
        else if (rank === 2) tr.className = 'rank-silver';
        else if (rank === 3) tr.className = 'rank-bronze';

        if (row === newEntry) {
          tr.classList.add('current-player-row');
        }

        const rankIcon = rank === 1 ? '🥇 1st' : (rank === 2 ? '🥈 2nd' : (rank === 3 ? '🥉 3rd' : `#${rank}`));

        tr.innerHTML = `
          <td class="rank-cell">${rankIcon}</td>
          <td style="text-align: left;">${row.name}${row === newEntry ? ' (YOU)' : ''}</td>
          <td class="time-cell" style="text-align: right;">${row.time.toFixed(1)}s</td>
        `;
        this.leaderboardRows.appendChild(tr);
      }
    }

    if (this.victoryModal) {
      this.victoryModal.classList.remove('hidden');
    }
    this.isModalOpen = true;
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  hideVictoryModal() {
    if (this.victoryModal) {
      this.victoryModal.classList.add('hidden');
    }
    this.isModalOpen = false;

    // Relock mouse pointer on play again
    const canvas = document.querySelector('canvas') || document.body;
    if (canvas && canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
  }

  updateChecklist() {}
  updateMirrorSelectionUI() {}
}

window.UIManager = UIManager;
