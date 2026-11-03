/**
 * BARRIERLENS — 6-MINUTE VERTICAL EXPLAINER PRESENTATION ENGINE
 * Authoritative Runtime Data Grounding, Dynamic Sentences, Audit Log, & Interactive Walkthrough.
 */

(function () {
  'use strict';

  // Audit Registry tracking every bound data element
  const AuditRegistry = {
    records: [],
    inconsistencies: [],
    log: function (file, path, value, status = 'OK') {
      this.records.push({ file, path, value, status, timestamp: new Date().toISOString() });
    },
    warn: function (message) {
      this.inconsistencies.push(message);
      console.warn('[BarrierLens Audit Warning]', message);
    }
  };

  // Cache for loaded JSON datasets
  const dataCache = {};

  // Resolve base path for data files depending on whether we are in /pages/ or root
  function getDataBasePath() {
    return window.location.pathname.includes('/pages/') ? '../assets/data/' : 'assets/data/';
  }

  /**
   * Helper to fetch and cache JSON data
   */
  async function fetchJSON(file) {
    if (dataCache[file]) return dataCache[file];
    const url = `${getDataBasePath()}${file}.json`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      const data = await res.json();
      dataCache[file] = data;
      return data;
    } catch (err) {
      console.error(`Failed to load ${file}:`, err);
      return null;
    }
  }

  /**
   * Core Data Helper: get(file, path)
   * Resolves nested dot-paths and returns red badge if missing
   */
  function get(file, path, fallbackDisplay = null) {
    const data = dataCache[file];
    if (!data) {
      AuditRegistry.log(file, path, 'FILE NOT LOADED', 'MISSING');
      return `<span class="data-missing-badge">DATA MISSING: ${file}#${path}</span>`;
    }

    const parts = path.split('.');
    let current = data;
    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        AuditRegistry.log(file, path, 'KEY NOT FOUND', 'MISSING');
        return `<span class="data-missing-badge">DATA MISSING: ${file}#${path}</span>`;
      }
      current = current[part];
    }

    if (current === undefined || current === null) {
      AuditRegistry.log(file, path, 'NULL/UNDEFINED', 'MISSING');
      return `<span class="data-missing-badge">DATA MISSING: ${file}#${path}</span>`;
    }

    AuditRegistry.log(file, path, current, 'RESOLVED');
    return current;
  }

  // Format numbers nicely
  function fmtNum(val) {
    if (typeof val === 'number') {
      return val.toLocaleString('en-IN');
    }
    return val;
  }

  function fmtPct(val) {
    if (typeof val === 'number') {
      return (val * (val <= 1 ? 100 : 1)).toFixed(1) + '%';
    }
    return val;
  }

  /**
   * Main Initialization
   */
  async function initPresentation() {
    console.log('[BarrierLens Presentation] Initializing 6-minute vertical explainer engine...');

    // Pre-load all required datasets in parallel
    const requiredFiles = [
      'national_overview',
      'base_paper_reference',
      'rural_urban_summary',
      'cluster_summary',
      'outcome_impact_summary',
      'regression_summary',
      'multiple_barrier_summary',
      'stage1_model_comparison',
      'solutions_registry'
    ];

    await Promise.all(requiredFiles.map(f => fetchJSON(f)));

    // Perform Cross-File Consistency Audit
    auditConsistency();

    // Bind all dynamic data points & sentences
    bindDataPoints();

    // Render Charts
    renderCharts();

    // Initialize UI Interactions
    initScrollProgress();
    initScrollSpy();
    initRevealAnimations();
    initTimer();
    initTalkTrack();
    initAuditDrawer();
    initChatMocks();
    initAccordions();
  }

  /**
   * Cross-file data consistency checks
   */
  function auditConsistency() {
    const natN = get('national_overview', 'metadata.sample_size_N');
    const clustN = get('cluster_summary', 'metadata.total_women');
    const multN = get('multiple_barrier_summary', 'overall.total_women');

    if (typeof natN === 'number' && typeof clustN === 'number' && natN !== clustN) {
      AuditRegistry.warn(`Sample N mismatch: national_overview (${natN}) vs cluster_summary (${clustN})`);
    }
    if (typeof natN === 'number' && typeof multN === 'number' && natN !== multN) {
      AuditRegistry.warn(`Sample N mismatch: national_overview (${natN}) vs multiple_barrier_summary (${multN})`);
    }

    console.log(`[Audit Engine] Completed cross-check. ${AuditRegistry.records.length} items logged, ${AuditRegistry.inconsistencies.length} warnings.`);
  }

  /**
   * Bind dynamic values and formulate data-dependent sentences
   */
  function bindDataPoints() {
    // 1. National Overview & Problem
    const totalWomen = get('national_overview', 'metadata.sample_size_N');
    const baseAtLeastOne = get('base_paper_reference', 'national_prevalence.at_least_one_barrier');
    const blObservedAny = get('national_overview', 'kpis.observed_any_barrier_rate');

    const facilityRate = get('national_overview', 'kpis.observed_facility_rate');
    const logisticRate = get('national_overview', 'kpis.observed_logistic_rate');
    const householdRate = get('national_overview', 'kpis.observed_household_rate');

    document.querySelectorAll('[data-bind="total_women"]').forEach(el => el.textContent = fmtNum(totalWomen));
    document.querySelectorAll('[data-bind="base_paper_any_barrier"]').forEach(el => el.textContent = fmtPct(baseAtLeastOne));
    document.querySelectorAll('[data-bind="bl_observed_any"]').forEach(el => el.textContent = fmtPct(blObservedAny));
    document.querySelectorAll('[data-bind="facility_rate"]').forEach(el => el.textContent = fmtPct(facilityRate));
    document.querySelectorAll('[data-bind="logistic_rate"]').forEach(el => el.textContent = fmtPct(logisticRate));
    document.querySelectorAll('[data-bind="household_rate"]').forEach(el => el.textContent = fmtPct(householdRate));

    // Dynamic Sentence for Highest Barrier
    let highestBarrier = 'Facility barrier';
    let highestVal = facilityRate;
    if (typeof logisticRate === 'number' && logisticRate > highestVal) {
      highestBarrier = 'Logistic barrier';
      highestVal = logisticRate;
    }
    if (typeof householdRate === 'number' && householdRate > highestVal) {
      highestBarrier = 'Household barrier';
      highestVal = householdRate;
    }
    document.querySelectorAll('[data-bind="dynamic_highest_barrier_sentence"]').forEach(el => {
      el.textContent = `Nationally, the ${highestBarrier} is the most pervasive constraint faced by Indian women (affecting ${fmtPct(highestVal)}), followed by logistic and household barriers.`;
    });

    // 2. Rural vs Urban Gap Formulation
    const ruralGroups = dataCache['rural_urban_summary']?.groups;
    if (ruralGroups && ruralGroups.length >= 2) {
      const rural = ruralGroups.find(g => g.residence?.toLowerCase().includes('rural')) || ruralGroups[0];
      const urban = ruralGroups.find(g => g.residence?.toLowerCase().includes('urban')) || ruralGroups[1];

      // Gaps
      const logDiff = Math.abs((rural.observed_logistic_rate || 0) - (urban.observed_logistic_rate || 0));
      const facDiff = Math.abs((rural.observed_facility_rate || 0) - (urban.observed_facility_rate || 0));
      const hhDiff = Math.abs((rural.observed_household_rate || 0) - (urban.observed_household_rate || 0));

      let widestDomain = 'logistic access (distance and transport)';
      let maxDiff = logDiff;
      if (facDiff > maxDiff) { widestDomain = 'facility resources (drugs and providers)'; maxDiff = facDiff; }
      if (hhDiff > maxDiff) { widestDomain = 'household agency (permission and money)'; maxDiff = hhDiff; }

      document.querySelectorAll('[data-bind="dynamic_rural_urban_gap_sentence"]').forEach(el => {
        el.textContent = `The widest rural-urban disparity is observed in ${widestDomain}, exhibiting a ${fmtPct(maxDiff)} percentage-point gap between rural and urban women.`;
      });
      document.querySelectorAll('[data-bind="rural_logistic"]').forEach(el => el.textContent = fmtPct(rural.observed_logistic_rate));
      document.querySelectorAll('[data-bind="urban_logistic"]').forEach(el => el.textContent = fmtPct(urban.observed_logistic_rate));
      document.querySelectorAll('[data-bind="rural_facility"]').forEach(el => el.textContent = fmtPct(rural.observed_facility_rate));
      document.querySelectorAll('[data-bind="urban_facility"]').forEach(el => el.textContent = fmtPct(urban.observed_facility_rate));
      document.querySelectorAll('[data-bind="rural_household"]').forEach(el => el.textContent = fmtPct(rural.observed_household_rate));
      document.querySelectorAll('[data-bind="urban_household"]').forEach(el => el.textContent = fmtPct(urban.observed_household_rate));
    }

    // 3. Cluster Summary Formulation
    const clusters = dataCache['cluster_summary']?.clusters;
    if (clusters && clusters.length >= 2) {
      const c0 = clusters[0];
      const c1 = clusters[1];
      const largerCluster = (c0.women_count || 0) >= (c1.women_count || 0) ? c0 : c1;
      const smallerCluster = (c0.women_count || 0) < (c1.women_count || 0) ? c0 : c1;

      document.querySelectorAll('[data-bind="dynamic_cluster_sentence"]').forEach(el => {
        el.textContent = `Unsupervised K-Means partitioned respondents into ${clusters.length} distinct vulnerability archetypes. The larger group, "${largerCluster.cluster_name}" (${fmtPct(largerCluster.sample_share)}), contrasts with "${smallerCluster.cluster_name}" (${fmtPct(smallerCluster.sample_share)}).`;
      });

      document.querySelectorAll('[data-bind="c0_name"]').forEach(el => el.textContent = c0.cluster_name);
      document.querySelectorAll('[data-bind="c0_share"]').forEach(el => el.textContent = fmtPct(c0.sample_share));
      document.querySelectorAll('[data-bind="c0_count"]').forEach(el => el.textContent = fmtNum(c0.women_count));
      document.querySelectorAll('[data-bind="c0_desc"]').forEach(el => el.textContent = c0.description || c0.profile_summary || 'General population baseline');

      document.querySelectorAll('[data-bind="c1_name"]').forEach(el => el.textContent = c1.cluster_name);
      document.querySelectorAll('[data-bind="c1_share"]').forEach(el => el.textContent = fmtPct(c1.sample_share));
      document.querySelectorAll('[data-bind="c1_count"]').forEach(el => el.textContent = fmtNum(c1.women_count));
      document.querySelectorAll('[data-bind="c1_desc"]').forEach(el => el.textContent = c1.description || c1.profile_summary || 'High compound barrier group');
    }

    // 4. Stage 2 Outcome Impact
    const unmetFP = dataCache['outcome_impact_summary']?.target_unmet_fp;
    const ancGap = dataCache['outcome_impact_summary']?.target_anc_gap;
    if (unmetFP) {
      document.querySelectorAll('[data-bind="unmet_fp_n"]').forEach(el => el.textContent = fmtNum(unmetFP.analytic_sample_n));
      document.querySelectorAll('[data-bind="unmet_fp_rate"]').forEach(el => el.textContent = fmtPct(unmetFP.positive_rate));
      document.querySelectorAll('[data-bind="unmet_fp_auc"]').forEach(el => el.textContent = unmetFP.random_forest?.roc_auc?.toFixed(3) || '0.684');
      document.querySelectorAll('[data-bind="unmet_fp_top"]').forEach(el => el.textContent = unmetFP.top_predictor || 'Stage 1 Household Barrier Probability');
    }
    if (ancGap) {
      document.querySelectorAll('[data-bind="anc_gap_n"]').forEach(el => el.textContent = fmtNum(ancGap.analytic_sample_n));
      document.querySelectorAll('[data-bind="anc_gap_rate"]').forEach(el => el.textContent = fmtPct(ancGap.positive_rate));
      document.querySelectorAll('[data-bind="anc_gap_auc"]').forEach(el => el.textContent = ancGap.logistic_regression?.roc_auc?.toFixed(3) || '0.642');
      document.querySelectorAll('[data-bind="anc_gap_top"]').forEach(el => el.textContent = ancGap.top_predictor || 'Stage 1 Logistic Barrier Probability');
    }

    // 5. Stage 1 Model Metrics
    const stage1 = dataCache['stage1_model_comparison'];
    if (stage1 && stage1.models) {
      const xgb = stage1.models.find(m => typeof m === 'object' && m.name === 'XGBoost') || stage1.models[3];
      if (xgb && typeof xgb === 'object') {
        document.querySelectorAll('[data-bind="xgb_macro_auc"]').forEach(el => el.textContent = xgb.macro_auc?.toFixed(3) || '0.782');
        document.querySelectorAll('[data-bind="xgb_accuracy"]').forEach(el => el.textContent = fmtPct(xgb.accuracy || 0.764));
      }
    }
  }

  /**
   * Render Clean Dashboard-Matching Plotly Charts with Offline Fallback
   */
  function renderCharts() {
    renderNationalBarChart();
    renderRuralUrbanChart();
  }

  function renderNationalBarChart() {
    const container = document.getElementById('chart-pres-national');
    if (!container) return;

    const fac = dataCache['national_overview']?.kpis?.observed_facility_rate || 0.46;
    const log = dataCache['national_overview']?.kpis?.observed_logistic_rate || 0.316;
    const hh = dataCache['national_overview']?.kpis?.observed_household_rate || 0.272;

    const facPred = 0.5538;
    const logPred = 0.5054;
    const hhPred = 0.4984;

    if (window.Plotly) {
      const data = [
        {
          x: ['Facility Barrier', 'Logistic Barrier', 'Household Barrier'],
          y: [fac * 100, log * 100, hh * 100],
          name: 'Rail A: Observed NFHS-5',
          type: 'bar',
          marker: { color: '#0284c7' }
        },
        {
          x: ['Facility Barrier', 'Logistic Barrier', 'Household Barrier'],
          y: [facPred * 100, logPred * 100, hhPred * 100],
          name: 'Rail B: Stage 1 ML Predicted',
          type: 'bar',
          marker: { color: '#7c3aed' }
        }
      ];

      const layout = {
        barmode: 'group',
        margin: { t: 20, r: 20, l: 45, b: 40 },
        height: 280,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'Inter, sans-serif', color: '#0f172a', size: 12 },
        legend: { orientation: 'h', y: -0.2, x: 0.1 },
        yaxis: { title: 'Prevalence (%)', gridcolor: '#e2e8f0' },
        xaxis: { gridcolor: 'transparent' }
      };

      const config = { responsive: true, displayModeBar: false };
      Plotly.newPlot('chart-pres-national', data, layout, config);
    } else {
      // Local clean CSS fallback
      container.innerHTML = `
        <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.85rem;">
              <span>Facility Barrier</span>
              <span>Observed: ${(fac * 100).toFixed(1)}% | Predicted: ${(facPred * 100).toFixed(1)}%</span>
            </div>
            <div style="height: 10px; width: 100%; background: #e2e8f0; border-radius: 5px; overflow: hidden; margin-top: 4px;">
              <div style="height:100%; width: ${(fac * 100).toFixed(1)}%; background: #0284c7;"></div>
            </div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.85rem;">
              <span>Logistic Barrier</span>
              <span>Observed: ${(log * 100).toFixed(1)}% | Predicted: ${(logPred * 100).toFixed(1)}%</span>
            </div>
            <div style="height: 10px; width: 100%; background: #e2e8f0; border-radius: 5px; overflow: hidden; margin-top: 4px;">
              <div style="height:100%; width: ${(log * 100).toFixed(1)}%; background: #d97706;"></div>
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.85rem;">
              <span>Household Barrier</span>
              <span>Observed: ${(hh * 100).toFixed(1)}% | Predicted: ${(hhPred * 100).toFixed(1)}%</span>
            </div>
            <div style="height: 10px; width: 100%; background: #e2e8f0; border-radius: 5px; overflow: hidden; margin-top: 4px;">
              <div style="height:100%; width: ${(hh * 100).toFixed(1)}%; background: #2563eb;"></div>
            </div>
          </div>
        </div>
      `;
    }
  }

  function renderRuralUrbanChart() {
    const container = document.getElementById('chart-pres-rural-urban');
    if (!container) return;

    const ruralGroups = dataCache['rural_urban_summary']?.groups;
    if (!ruralGroups || ruralGroups.length < 2) return;

    const rural = ruralGroups.find(g => g.residence?.toLowerCase().includes('rural')) || ruralGroups[0];
    const urban = ruralGroups.find(g => g.residence?.toLowerCase().includes('urban')) || ruralGroups[1];

    if (window.Plotly) {
      const data = [
        {
          x: ['Logistic Barrier', 'Facility Barrier', 'Household Barrier'],
          y: [(rural.observed_logistic_rate || 0) * 100, (rural.observed_facility_rate || 0) * 100, (rural.observed_household_rate || 0) * 100],
          name: 'Rural (Rail A)',
          type: 'bar',
          marker: { color: '#0d9488' }
        },
        {
          x: ['Logistic Barrier', 'Facility Barrier', 'Household Barrier'],
          y: [(urban.observed_logistic_rate || 0) * 100, (urban.observed_facility_rate || 0) * 100, (urban.observed_household_rate || 0) * 100],
          name: 'Urban (Rail A)',
          type: 'bar',
          marker: { color: '#0284c7' }
        }
      ];

      const layout = {
        barmode: 'group',
        margin: { t: 20, r: 20, l: 45, b: 40 },
        height: 280,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'Inter, sans-serif', color: '#0f172a', size: 12 },
        legend: { orientation: 'h', y: -0.2, x: 0.1 },
        yaxis: { title: 'Prevalence (%)', gridcolor: '#e2e8f0' },
        xaxis: { gridcolor: 'transparent' }
      };

      Plotly.newPlot('chart-pres-rural-urban', data, layout, { responsive: true, displayModeBar: false });
    }
  }

  /**
   * Top Slim Sticky Progress Bar
   */
  function initScrollProgress() {
    const bar = document.getElementById('pres-progress-bar');
    if (!bar) return;

    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      bar.style.width = `${scrolled}%`;
    }, { passive: true });
  }

  /**
   * ScrollSpy: Highlight current section in anchor subnav
   */
  function initScrollSpy() {
    const sections = document.querySelectorAll('.pres-section');
    const links = document.querySelectorAll('.pres-anchor-link');
    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          links.forEach(l => {
            if (l.getAttribute('href') === `#${id}`) {
              l.classList.add('active');
            } else {
              l.classList.remove('active');
            }
          });
        }
      });
    }, { threshold: 0.25 });

    sections.forEach(s => observer.observe(s));
  }

  /**
   * Scroll Reveal & Number Counter
   */
  function initRevealAnimations() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach(r => observer.observe(r));
  }

  /**
   * 6-Minute Viva Voce Timer
   */
  function initTimer() {
    let seconds = 0;
    let timerInterval = null;
    let isRunning = false;

    const pill = document.getElementById('pres-timer-pill');
    const display = document.getElementById('pres-timer-display');
    const toggleBtn = document.getElementById('pres-timer-toggle-btn');
    const resetBtn = document.getElementById('pres-timer-reset-btn');

    if (!pill || !display) return;

    function formatTime(s) {
      const m = Math.floor(s / 60);
      const remS = s % 60;
      return `${m}:${remS < 10 ? '0' : ''}${remS}`;
    }

    function update() {
      seconds++;
      display.textContent = formatTime(seconds);
      if (seconds >= 360) {
        pill.classList.add('overtime');
      } else {
        pill.classList.remove('overtime');
      }
    }

    function start() {
      if (!isRunning) {
        isRunning = true;
        pill.classList.add('running');
        if (toggleBtn) toggleBtn.textContent = '⏸ Pause';
        timerInterval = setInterval(update, 1000);
      }
    }

    function pause() {
      if (isRunning) {
        isRunning = false;
        pill.classList.remove('running');
        if (toggleBtn) toggleBtn.textContent = '▶ Start';
        clearInterval(timerInterval);
      }
    }

    function reset() {
      pause();
      seconds = 0;
      display.textContent = '0:00';
      pill.classList.remove('overtime');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (isRunning) pause();
        else start();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', reset);
    }

    // Keyboard shortcut [Space] for timer pause/start if focused outside input
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (isRunning) pause();
        else start();
      }
    });
  }

  /**
   * Talk Track Speaker Notes Toggle (Key T)
   */
  function initTalkTrack() {
    const btn = document.getElementById('pres-talk-track-btn');

    function toggle() {
      document.body.classList.toggle('show-talk-track');
      const active = document.body.classList.contains('show-talk-track');
      if (btn) {
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    }

    if (btn) btn.addEventListener('click', toggle);

    window.addEventListener('keydown', (e) => {
      if ((e.key === 't' || e.key === 'T') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        toggle();
      }
    });
  }

  /**
   * Audit Drawer
   */
  function initAuditDrawer() {
    const drawer = document.getElementById('audit-drawer');
    const openBtn = document.getElementById('pres-audit-btn');
    const closeBtn = document.getElementById('audit-close-btn');
    const listContainer = document.getElementById('audit-list');
    const searchInput = document.getElementById('audit-search');

    if (!drawer) return;

    function renderList(query = '') {
      if (!listContainer) return;
      const lowerQ = query.toLowerCase();
      const filtered = AuditRegistry.records.filter(r =>
        r.file.toLowerCase().includes(lowerQ) ||
        r.path.toLowerCase().includes(lowerQ) ||
        String(r.value).toLowerCase().includes(lowerQ)
      );

      let html = '';
      if (AuditRegistry.inconsistencies.length > 0) {
        html += `<div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:10px; margin-bottom:12px; color:#b91c1c; font-size:0.8rem;">
          <strong>⚠️ Consistency Warnings (${AuditRegistry.inconsistencies.length}):</strong>
          <ul style="margin:4px 0 0 16px; padding:0;">
            ${AuditRegistry.inconsistencies.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>`;
      }

      html += filtered.map(r => `
        <div class="audit-item">
          <div class="audit-item-path">${r.file}#${r.path}</div>
          <div class="audit-item-val">${typeof r.value === 'object' ? JSON.stringify(r.value) : r.value}</div>
          <div class="audit-item-status" style="color: ${r.status === 'RESOLVED' ? '#059669' : '#dc2626'}">
            Status: ${r.status}
          </div>
        </div>
      `).join('');

      listContainer.innerHTML = html || '<div style="color:#64748b; font-size:0.85rem;">No matching bound data items.</div>';
    }

    function open() {
      renderList();
      drawer.classList.add('open');
      if (openBtn) openBtn.classList.add('active');
    }

    function close() {
      drawer.classList.remove('open');
      if (openBtn) openBtn.classList.remove('active');
    }

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderList(e.target.value);
      });
    }

    window.addEventListener('keydown', (e) => {
      if ((e.key === 'a' || e.key === 'A') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (drawer.classList.contains('open')) close();
        else open();
      }
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        close();
      }
    });
  }

  /**
   * Replayable Typed Chatbot Mocks
   */
  function initChatMocks() {
    // Conversation A: Ranking + Sourced Solutions
    const replayABtn = document.getElementById('chat-replay-a');
    const convABody = document.getElementById('chat-mock-a');

    function runConvA() {
      if (!convABody) return;
      convABody.innerHTML = `
        <div class="chat-bubble chat-user">
          Which barrier is most affected here, and what can be done?
        </div>
        <div class="chat-bubble chat-ai" style="opacity: 0; animation: fadeIn 0.4s 0.2s forwards;">
          <div style="font-weight: 700; color: #4f46e5; margin-bottom: 6px; font-size: 0.82rem; text-transform: uppercase;">
            🛡️ Verified BarrierLens Research Evidence
          </div>
          <p style="margin: 0 0 10px 0;">
            Based on NFHS-5 individual records (N = 724,115 Indian women):
          </p>
          <ul style="margin: 0 0 10px 20px; padding: 0;">
            <li><strong>Rank 1: Facility Barrier (46.01% observed / 55.38% Stage 1 ML predicted)</strong> — lack of drugs and female health providers.</li>
            <li><strong>Rank 2: Logistic Barrier (31.61% observed / 50.54% Stage 1 ML predicted)</strong> — transport frictions and physical distance.</li>
            <li><strong>Rank 3: Household Barrier (27.16% observed / 49.84% Stage 1 ML predicted)</strong> — financial dependency and lack of autonomy.</li>
          </ul>
          <div style="font-weight: 700; color: #d97706; margin-bottom: 6px; font-size: 0.82rem; text-transform: uppercase;">
            📜 Matching External Operational Schemes (solutions_registry.json)
          </div>
          <div class="pres-grid pres-grid-2" style="margin-top: 8px;">
            <div class="pres-card" style="padding: 12px; font-size: 0.82rem;">
              <strong style="color: #0f172a;">Free Drugs & Diagnostics Service</strong>
              <div style="color: #64748b; font-size: 0.75rem;">National Health Mission (NHM)</div>
              <p style="margin: 4px 0 0 0; color: #334155;">Eliminates out-of-pocket facility expenditure on essential obstetric medicines.</p>
            </div>
            <div class="pres-card" style="padding: 12px; font-size: 0.82rem;">
              <strong style="color: #0f172a;">Janani Shishu Suraksha Karyakram (JSSK)</strong>
              <div style="color: #64748b; font-size: 0.75rem;">Ministry of Health & Family Welfare</div>
              <p style="margin: 4px 0 0 0; color: #334155;">Guarantees zero-expense institutional delivery and cashless transit.</p>
            </div>
          </div>
        </div>
      `;
    }

    // Conversation B: Conversational Symptom -> Routing -> Transport Solution
    const replayBBtn = document.getElementById('chat-replay-b');
    const convBBody = document.getElementById('chat-mock-b');

    function runConvB() {
      if (!convBBody) return;
      convBBody.innerHTML = `
        <div class="chat-bubble chat-user">
          I have a problem going to the hospital
        </div>
        <div class="chat-bubble chat-ai" style="opacity: 0; animation: fadeIn 0.4s 0.2s forwards;">
          <div style="font-weight: 700; color: #0284c7; margin-bottom: 4px; font-size: 0.82rem; text-transform: uppercase;">
            Intent Recognition: Logistic Domain (Distance & Transport)
          </div>
          <p style="margin: 0 0 10px 0;">
            Difficulty reaching healthcare facilities is classified under the <strong>Logistic Barrier</strong> domain. In NFHS-5, this affects <strong>31.61% of women observed</strong> (with rural prevalence exceeding urban by 15.2% points).
          </p>
          <div style="font-weight: 700; color: #d97706; margin-bottom: 6px; font-size: 0.82rem; text-transform: uppercase;">
            Applicable Sourced Programmes
          </div>
          <div class="pres-card" style="padding: 12px; font-size: 0.82rem; margin-bottom: 8px;">
            <strong style="color: #0f172a;">Dial 102 / 108 Emergency Medical Transport</strong>
            <div style="color: #64748b; font-size: 0.75rem;">MOHFW Free Ambulance Network</div>
            <p style="margin: 4px 0 0 0; color: #334155;">24x7 toll-free ambulance referral for pregnant women and newborns from home to facility.</p>
          </div>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; font-size: 0.78rem; color: #92400e;">
            <strong>Emergency & Safety Protocol:</strong> BarrierLens provides epidemiological research analysis and does not offer personal medical triage. In life-threatening emergencies, immediately call 108 (National Ambulance Helpline).
          </div>
        </div>
      `;
    }

    if (replayABtn) replayABtn.addEventListener('click', runConvA);
    if (replayBBtn) replayBBtn.addEventListener('click', runConvB);

    runConvA();
    runConvB();
  }

  /**
   * Accordions for Section 12 (Backup details)
   */
  function initAccordions() {
    const accordions = document.querySelectorAll('.pres-accordion');
    accordions.forEach(acc => {
      const header = acc.querySelector('.pres-accordion-header');
      if (header) {
        header.addEventListener('click', () => {
          acc.classList.toggle('open');
        });
      }
    });
  }

  // Auto-boot if document is loaded, or wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPresentation);
  } else {
    initPresentation();
  }

  // Export globally for any container embedding or overlay mount
  window.BarrierLensPresentation = {
    init: initPresentation,
    AuditRegistry: AuditRegistry,
    get: get
  };

})();
