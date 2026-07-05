/* ============================================================
   C2S VLSI Lab Portal — Calendar Widget
   Monthly calendar grid with date indicators
   ============================================================ */

/**
 * Render a calendar widget.
 * @param {Object} opts
 * @param {number} opts.month       — 0-indexed month
 * @param {number} opts.year        — full year
 * @param {Object} [opts.data]      — { 'YYYY-MM-DD': { status, color } }
 * @param {Function} [opts.onDateClick] — callback(dateStr)
 * @param {string} [opts.id]        — unique id for the calendar container
 * @returns {string} HTML string
 */
function renderCalendar({ month, year, data = {}, onDateClick, id = 'calendar' }) {
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let dayCells = '';

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    dayCells += `<div class="cal-day cal-day-empty"></div>`;
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(year, month, d);
    const isToday = dateStr === todayStr;
    const entry = data[dateStr];
    const dotColor = entry ? (entry.color || 'var(--accent-primary)') : null;
    const statusClass = entry ? ` cal-day-has-data` : '';

    dayCells += `
      <div class="cal-day${isToday ? ' cal-day-today' : ''}${statusClass}"
           data-date="${dateStr}"
           role="button"
           tabindex="0">
        <span class="cal-day-num">${d}</span>
        ${dotColor ? `<span class="cal-day-dot" style="background:${dotColor}"></span>` : ''}
      </div>
    `;
  }

  return `
    <div class="cal-widget" id="${id}" data-month="${month}" data-year="${year}">
      <div class="cal-header">
        <button class="btn btn-ghost btn-sm cal-prev" data-cal-id="${id}" aria-label="Previous month">
          <i data-lucide="chevron-left" style="width:18px;height:18px"></i>
        </button>
        <span class="cal-title">${MONTH_NAMES[month]} ${year}</span>
        <button class="btn btn-ghost btn-sm cal-next" data-cal-id="${id}" aria-label="Next month">
          <i data-lucide="chevron-right" style="width:18px;height:18px"></i>
        </button>
      </div>
      <div class="cal-grid-header">
        ${DAY_NAMES.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
      </div>
      <div class="cal-grid">
        ${dayCells}
      </div>
    </div>
  `;
}

function formatDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Attach calendar event listeners.
 * @param {Object} opts
 * @param {string} opts.id          — calendar container id
 * @param {Object} opts.data        — data map
 * @param {Function} opts.onDateClick
 * @param {Function} opts.onMonthChange — callback(month, year) to re-render
 */
function initCalendar({ id = 'calendar', data = {}, onDateClick, onMonthChange }) {
  const container = document.getElementById(id);
  if (!container) return;

  const month = parseInt(container.dataset.month);
  const year = parseInt(container.dataset.year);

  // Date click
  container.querySelectorAll('.cal-day:not(.cal-day-empty)').forEach(el => {
    el.addEventListener('click', () => {
      const dateStr = el.dataset.date;
      if (onDateClick) onDateClick(dateStr);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const dateStr = el.dataset.date;
        if (onDateClick) onDateClick(dateStr);
      }
    });
  });

  // Prev / Next
  const prevBtn = container.querySelector('.cal-prev');
  const nextBtn = container.querySelector('.cal-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      let newMonth = month - 1;
      let newYear = year;
      if (newMonth < 0) { newMonth = 11; newYear--; }
      if (onMonthChange) onMonthChange(newMonth, newYear);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      let newMonth = month + 1;
      let newYear = year;
      if (newMonth > 11) { newMonth = 0; newYear++; }
      if (onMonthChange) onMonthChange(newMonth, newYear);
    });
  }
}

// ── Calendar Styles (injected once) ───────────────────────────
(function injectCalendarStyles() {
  if (document.getElementById('cal-styles')) return;
  const style = document.createElement('style');
  style.id = 'cal-styles';
  style.textContent = `
    .cal-widget {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: var(--space-lg);
      backdrop-filter: blur(10px);
    }
    .cal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-md);
    }
    .cal-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .cal-grid-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-bottom: var(--space-xs);
    }
    .cal-weekday {
      text-align: center;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      padding: 6px 0;
      letter-spacing: 0.04em;
    }
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }
    .cal-day {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      gap: 2px;
    }
    .cal-day:hover:not(.cal-day-empty) {
      background: var(--bg-glass);
    }
    .cal-day-empty {
      cursor: default;
    }
    .cal-day-num {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary);
      line-height: 1;
    }
    .cal-day-today {
      background: rgba(79, 143, 255, 0.12);
      border: 1px solid rgba(79, 143, 255, 0.25);
    }
    .cal-day-today .cal-day-num {
      color: var(--accent-primary);
      font-weight: 700;
    }
    .cal-day-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      position: absolute;
      bottom: 4px;
    }
    .cal-day-has-data:hover {
      background: rgba(79, 143, 255, 0.08);
    }
  `;
  document.head.appendChild(style);
})();

// ── Global ────────────────────────────────────────────────────
window.renderCalendar = renderCalendar;
window.initCalendar = initCalendar;
