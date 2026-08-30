/* Carolina Wellness Psychiatry — New Patient Forms (prototype)
   Vanilla JS, no dependencies. Client-side only: nothing is sent to a server.
   Draft autosave uses localStorage and deliberately excludes [data-nosave] fields
   (SSN, card details, signatures, attestations). */

(function () {
  'use strict';

  var form = document.getElementById('intakeForm');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var navButtons = Array.prototype.slice.call(document.querySelectorAll('#stepNav [data-goto]'));
  var DRAFT_KEY = 'cwp-intake-draft-v1';
  var current = 0;

  /* ------------------------------------------------------------------ */
  /*  Build dynamic content                                             */
  /* ------------------------------------------------------------------ */

  // Medications
  var medList = document.getElementById('medList');
  var MED_MAX = 10;
  function medCount() { return medList.querySelectorAll('.med-row').length; }
  function addMedRow(values) {
    if (medCount() >= MED_MAX) return;
    var i = medCount() + 1;
    var row = document.createElement('div');
    row.className = 'med-row';
    row.innerHTML =
      '<input name="med_' + i + '_name" placeholder="Medication" aria-label="Medication ' + i + ' name">' +
      '<input name="med_' + i + '_dose" placeholder="Dose" aria-label="Medication ' + i + ' dose">' +
      '<input name="med_' + i + '_freq" placeholder="Frequency" aria-label="Medication ' + i + ' frequency">' +
      '<button type="button" class="link-btn med-remove">Remove</button>';
    medList.appendChild(row);
    if (values) {
      row.children[0].value = values.name || '';
      row.children[1].value = values.dose || '';
      row.children[2].value = values.freq || '';
    }
  }
  function renumberMeds() {
    var rows = medList.querySelectorAll('.med-row');
    Array.prototype.forEach.call(rows, function (row, idx) {
      var n = idx + 1;
      row.children[0].name = 'med_' + n + '_name';
      row.children[1].name = 'med_' + n + '_dose';
      row.children[2].name = 'med_' + n + '_freq';
    });
  }
  document.getElementById('addMedBtn').addEventListener('click', function () {
    addMedRow(); scheduleSave();
  });
  medList.addEventListener('click', function (e) {
    if (e.target.classList.contains('med-remove')) {
      if (medCount() <= 1) { return; }
      e.target.closest('.med-row').remove();
      renumberMeds(); scheduleSave();
    }
  });

  // Stressors
  var STRESSORS = ['Deaths', 'Births', 'Marriage', 'Divorce', 'Moving', 'Job change',
    'School', 'Chronic illness', 'Separation', 'Physical abuse', 'Sexual abuse',
    'Broken relationship', 'Unwanted pregnancy', 'Substance abuse', 'Medical'];
  var stressWrap = document.getElementById('stressors');
  STRESSORS.forEach(function (s) {
    var slug = 'stress_' + s.toLowerCase().replace(/[^a-z]+/g, '_');
    var l = document.createElement('label');
    l.innerHTML = '<input type="checkbox" name="' + slug + '"> ' + s;
    stressWrap.appendChild(l);
  });

  // Release-of-information categories
  var ROI_CATS = ['Psychiatric records', 'Procedures', 'Medical records', 'Educational records',
    'Discharge summary', 'Psychological testing', 'Therapy notes', 'Lab work', 'All of the above'];
  var roiWrap = document.getElementById('roiCats');
  ROI_CATS.forEach(function (c) {
    var slug = 'roi_cat_' + c.toLowerCase().replace(/[^a-z]+/g, '_');
    var l = document.createElement('label');
    l.innerHTML = '<input type="checkbox" name="' + slug + '"> ' + c;
    roiWrap.appendChild(l);
  });
  var roiOther = document.createElement('label');
  roiOther.innerHTML = '<input type="checkbox" name="roi_cat_other"> Other';
  roiWrap.appendChild(roiOther);

  // seed 3 medication rows
  addMedRow(); addMedRow(); addMedRow();

  /* ------------------------------------------------------------------ */
  /*  Toggle helpers                                                    */
  /* ------------------------------------------------------------------ */
  function applyToggle(input) {
    var showSel = input.getAttribute('data-toggle-show');
    var hideSel = input.getAttribute('data-toggle-hide');
    if (showSel) {
      var t = document.querySelector(showSel);
      if (t) t.hidden = !input.checked;
    }
    if (hideSel) {
      var h = document.querySelector(hideSel);
      if (h) h.hidden = input.checked;
    }
  }
  form.addEventListener('change', function (e) {
    if (e.target.hasAttribute('data-toggle-show') || e.target.hasAttribute('data-toggle-hide')) {
      applyToggle(e.target);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Age from DOB                                                      */
  /* ------------------------------------------------------------------ */
  var dob = form.elements['p_dob'];
  var ageField = form.elements['p_age'];
  if (dob) {
    var updateAge = function () {
      if (!dob.value) { ageField.value = ''; return; }
      var d = new Date(dob.value);
      var now = new Date();
      var a = now.getFullYear() - d.getFullYear();
      var m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
      ageField.value = (a >= 0 && a < 130) ? a : '';
    };
    dob.addEventListener('change', updateAge);
    dob.addEventListener('input', updateAge);
  }

  /* ------------------------------------------------------------------ */
  /*  Initials → mark policy blocks complete                            */
  /* ------------------------------------------------------------------ */
  var policyBlocks = Array.prototype.slice.call(document.querySelectorAll('.policy[data-initial]'));
  function refreshPolicy() {
    policyBlocks.forEach(function (p) {
      var input = p.querySelector('input');
      p.classList.toggle('ok', !!input.value.trim());
    });
  }
  form.addEventListener('input', function (e) {
    if (e.target.closest('.policy[data-initial]')) refreshPolicy();
  });

  /* ------------------------------------------------------------------ */
  /*  Signature pads                                                    */
  /* ------------------------------------------------------------------ */
  function SignaturePad(container) {
    var canvas = container.querySelector('.sig__pad');
    var hidden = container.querySelector('input[type="hidden"]');
    var typed = container.querySelector('.sig__typed input');
    var clearBtn = container.querySelector('.sig__clear');
    var ctx = canvas.getContext('2d');
    var drawing = false, dirty = false, last = null;

    function resize() {
      if (dirty) return;                        // don't wipe an in-progress signature
      var rect = canvas.getBoundingClientRect();
      if (!rect.width) return;                  // step not visible yet
      var dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#2c2f26';
    }
    setTimeout(resize, 0);
    window.addEventListener('resize', resize);
    this.resize = resize;
    this.container = container;

    function pos(e) {
      var rect = canvas.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - rect.left, y: p.clientY - rect.top };
    }
    function start(e) { drawing = true; dirty = true; last = pos(e); e.preventDefault(); }
    function move(e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      e.preventDefault();
    }
    function end() {
      if (!drawing) return;
      drawing = false;
      commit();
    }
    function commit() {
      hidden.value = dirty ? canvas.toDataURL('image/png') : (typed.value.trim() ? 'typed:' + typed.value.trim() : '');
    }
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);

    typed.addEventListener('input', function () {
      if (!dirty) commit();
    });
    clearBtn.addEventListener('click', function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dirty = false;
      commit();
    });

    this.hasValue = function () { return !!hidden.value; };
    this.field = container.getAttribute('data-sig');
  }
  var sigPads = Array.prototype.slice.call(document.querySelectorAll('.sig[data-sig]')).map(function (c) {
    return new SignaturePad(c);
  });

  /* ------------------------------------------------------------------ */
  /*  Draft persistence                                                 */
  /* ------------------------------------------------------------------ */
  var saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 400);
  }
  function saveableControls() {
    return Array.prototype.filter.call(form.elements, function (el) {
      return el.name && !el.hasAttribute('data-nosave') && el.type !== 'hidden' && el.type !== 'submit' && el.type !== 'button';
    });
  }
  function saveDraft() {
    try {
      var data = { __step: current, __medRows: medCount() };
      saveableControls().forEach(function (el) {
        if (el.type === 'checkbox') data[el.name] = el.checked;
        else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
        else data[el.name] = el.value;
      });
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch (e) { /* storage unavailable — ignore */ }
  }
  function loadDraft() {
    var raw;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }

    // ignore an "empty" draft (only defaults / auto-filled dates)
    var autofilled = { fin_date: 1, npp_date: 1, roi_date: 1 };
    var hasContent = Object.keys(data).some(function (k) {
      return k.indexOf('__') !== 0 && !autofilled[k] && data[k] && data[k] !== false;
    });
    if (!hasContent) return;

    // rebuild med rows to match
    var want = Math.max(1, data.__medRows || 3);
    while (medCount() < want) addMedRow();

    Object.keys(data).forEach(function (name) {
      if (name.indexOf('__') === 0) return;
      var el = form.elements[name];
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!data[name];
      else el.value = data[name];
    });

    // re-apply toggles & derived UI
    Array.prototype.forEach.call(form.querySelectorAll('[data-toggle-show],[data-toggle-hide]'), applyToggle);
    refreshPolicy();
    if (dob && dob.value) dob.dispatchEvent(new Event('change'));

    document.getElementById('draftNotice').hidden = false;
    if (typeof data.__step === 'number' && data.__step > 0 && data.__step < steps.length - 1) {
      goTo(data.__step, true);
    }
  }
  form.addEventListener('input', scheduleSave);
  form.addEventListener('change', scheduleSave);

  document.getElementById('clearDraftBtn').addEventListener('click', function () {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    location.reload();
  });

  /* ------------------------------------------------------------------ */
  /*  Validation                                                        */
  /* ------------------------------------------------------------------ */
  function clearErrors(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('.invalid'), function (el) {
      el.classList.remove('invalid');
    });
    Array.prototype.forEach.call(scope.querySelectorAll('.field-error'), function (el) { el.remove(); });
  }
  function markError(el, msg) {
    el.classList.add('invalid');
    if (el.parentNode.querySelector('.field-error')) return;
    var p = document.createElement('p');
    p.className = 'field-error';
    p.textContent = msg;
    el.insertAdjacentElement('afterend', p);
  }
  function validateStep(stepEl) {
    clearErrors(stepEl);
    var firstBad = null;
    var controls = Array.prototype.slice.call(stepEl.querySelectorAll('input, select, textarea'));
    controls.forEach(function (el) {
      if (el.disabled || el.type === 'hidden') return;
      // skip controls inside a hidden container
      if (el.closest('[hidden]')) return;
      var val = (el.value || '').trim();
      if (el.hasAttribute('required')) {
        if (el.type === 'checkbox' && !el.checked) { markError(el, 'Required.'); firstBad = firstBad || el; return; }
        if (el.type !== 'checkbox' && !val) { markError(el, 'This field is required.'); firstBad = firstBad || el; return; }
      }
      if (val && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        markError(el, 'Enter a valid email address.'); firstBad = firstBad || el; return;
      }
      if (val && el.pattern && !new RegExp('^(?:' + el.pattern + ')$').test(val)) {
        markError(el, el.title || 'Check the format of this entry.'); firstBad = firstBad || el;
      }
    });

    // signature completeness for signature blocks in this step
    Array.prototype.forEach.call(stepEl.querySelectorAll('.sig[data-sig]'), function (c) {
      if (c.closest('[hidden]')) return;
      var pad = sigPads.filter(function (p) { return p.field === c.getAttribute('data-sig'); })[0];
      var attest = c.querySelector('.sig__attest input');
      // a visible signature block must be filled (hidden ones already returned above)
      if (pad && !pad.hasValue()) {
        markError(c.querySelector('.sig__typed input'), 'Draw or type your signature.');
        firstBad = firstBad || c.querySelector('.sig__typed input');
      }
      if (attest && attest.hasAttribute('required') && !attest.checked && !c.closest('[hidden]')) {
        markError(attest, 'Please confirm.'); firstBad = firstBad || attest;
      }
    });

    if (firstBad) {
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      try { firstBad.focus({ preventScroll: true }); } catch (e) { firstBad.focus(); }
      return false;
    }
    return true;
  }

  /* ------------------------------------------------------------------ */
  /*  Wizard navigation                                                 */
  /* ------------------------------------------------------------------ */
  function goTo(index, skipValidation) {
    index = Math.max(0, Math.min(steps.length - 1, index));
    steps[current].classList.remove('is-active');
    steps[index].classList.add('is-active');
    current = index;

    navButtons.forEach(function (b, i) {
      b.classList.toggle('is-current', i === index);
      b.classList.toggle('is-done', i < index);
    });
    if (index === steps.length - 1) renderReview();
    // size any signature pads that just became visible
    sigPads.forEach(function (p) { if (steps[index].contains(p.container)) p.resize(); });
    window.scrollTo({ top: document.querySelector('.page-intro').offsetTop - 10, behavior: 'smooth' });
    saveDraft();
  }
  function next() {
    if (validateStep(steps[current])) goTo(current + 1);
  }
  function prev() { goTo(current - 1); }

  form.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-next')) next();
    else if (e.target.hasAttribute('data-prev')) prev();
  });
  navButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var target = parseInt(b.getAttribute('data-goto'), 10);
      // allow going back freely; going forward validates everything in between
      if (target <= current) { goTo(target, true); return; }
      for (var i = current; i < target; i++) {
        if (!validateStep(steps[i])) { goTo(i); return; }
      }
      goTo(target);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Review                                                            */
  /* ------------------------------------------------------------------ */
  var LABELS = {
    p_last: 'Last name', p_first: 'First name', p_mi: 'Middle initial', p_email: 'Email',
    p_dob: 'Date of birth', p_age: 'Age', p_sex: 'Sex', p_ssn: 'SSN',
    p_addr: 'Address', p_city: 'City / State', p_zip: 'ZIP', p_marital: 'Marital status',
    p_cell: 'Cell phone', p_work: 'Work phone',
    fr_self: 'Financially responsible party same as patient',
    fr_name: 'Responsible party', fr_rel: 'Relationship', fr_email: 'Responsible party email',
    fr_cell: 'Responsible party cell', fr_addr: 'Responsible party address',
    fr_city: 'Responsible party city / state', fr_zip: 'Responsible party ZIP',
    e_name: 'Employer / school', e_occ: 'Occupation', e_grade: 'Grade', e_city: 'City / State', e_edu: 'Education / degrees',
    ps_name: 'Parent / spouse', ps_phone: 'Parent / spouse phone', ps_rel: 'Relationship',
    ps_emp: 'Parent / spouse employer', ps_emp_phone: 'Employer phone', ps_addr: 'Address',
    ps_city: 'City / State', ps_zip: 'ZIP',
    ec_name: 'Emergency contact', ec_rel: 'Relationship', ec_cell: 'Cell phone', ec_work: 'Work phone',
    ref_internet: 'Referral: internet', ref_friend: 'Referral: friend', ref_doctor: 'Referral: doctor / psychologist',
    ref_doc_name: 'Referring provider',
    pc_phys: 'Primary care physician', pc_practice: 'Practice', pc_addr: 'Address', pc_phone: 'Phone',
    dx_1: 'Past diagnosis 1', dx_2: 'Past diagnosis 2', dx_3: 'Past diagnosis 3',
    mh_allergies: 'Known allergies', mh_illness: 'Severe illness', mh_therapy: 'Previous therapy',
    mh_hosp: 'Previous hospitalizations', stress_other: 'Other stressor', mh_reason: 'Reason for visit',
    fin_print: 'Print name', fin_date: 'Date', fin_sig_typed: 'Typed signature', fin_sig_attest: 'Signature attestation',
    npp_ack: 'Notice of Privacy Practices received', npp_name: 'Print name', npp_date: 'Date',
    npp_sig_typed: 'Typed signature', npp_sig_attest: 'Signature attestation',
    roi_enabled: 'Release of information requested', roi_consenter: 'Consenting person', roi_patient: 'Patient',
    roi_recipients: 'Share with', roi_witness: 'Witness', roi_rel: 'Relationship',
    roi_date: 'Date', roi_expires: 'Consent expiration', roi_sig_typed: 'Typed signature',
    i1: 'Initials — Medicare/Medicaid status', i2: 'Initials — out-of-network policy',
    i3: 'Initials — fee schedule', i4: 'Initials — card on file', i5: 'Initials — missed appointments'
  };
  var GROUPS = [
    { step: 1, title: '1 · Patient Information', prefixes: ['p_', 'fr_', 'e_', 'ps_', 'ec_', 'ref_'] },
    { step: 2, title: '2 · Medical History', prefixes: ['pc_', 'dx_', 'med_', 'mh_', 'stress_'] },
    { step: 3, title: '3 · Financial & Appointment Policy', prefixes: ['i1', 'i2', 'i3', 'i4', 'i5', 'fin_', 'cc_'] },
    { step: 4, title: '4 · Privacy Practices & Acknowledgement', prefixes: ['npp_'] },
    { step: 5, title: '5 · Release of Information', prefixes: ['roi_'] }
  ];

  function fmtVal(el) {
    if (el.type === 'checkbox') return el.checked ? 'Yes' : '';
    if (el.name.indexOf('cc_') === 0 && el.value) return '•••• (entered — not stored)';
    if (el.name === 'p_ssn' && el.value) return '•••-••-•••• (entered — not stored)';
    return el.value || '';
  }

  function renderReview() {
    var out = document.getElementById('reviewOut');
    out.innerHTML = '';
    GROUPS.forEach(function (g) {
      var rows = [];
      var seenMed = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name) return;
        if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
        if (/_sig(_typed|_attest)?$/.test(el.name)) return;   // shown as a signature thumbnail instead
        var match = g.prefixes.some(function (px) {
          return px.length <= 2 ? el.name === px : el.name.indexOf(px) === 0;
        });
        if (!match) return;
        if (el.name.indexOf('med_') === 0) {
          var idx = el.name.split('_')[1];
          if (seenMed[idx]) return;
          seenMed[idx] = true;
          var nm = form.elements['med_' + idx + '_name'];
          var ds = form.elements['med_' + idx + '_dose'];
          var fq = form.elements['med_' + idx + '_freq'];
          if (nm && nm.value) rows.push(['Medication ' + idx, nm.value + (ds.value ? ' · ' + ds.value : '') + (fq.value ? ' · ' + fq.value : '')]);
          return;
        }
        var v = fmtVal(el);
        if (v === '' || v === undefined) return;
        var label = LABELS[el.name] || el.name;
        rows.push([label, v]);
      });

      // signature thumbnails
      sigPads.forEach(function (pad) {
        var belongs = g.prefixes.some(function (p) { return ('' + pad.field).indexOf(p) === 0; });
        if (!belongs) return;
        var hidden = form.elements[pad.field];
        if (hidden && hidden.value) {
          rows.push(['Signature', hidden.value.indexOf('typed:') === 0
            ? '“' + hidden.value.slice(6) + '” (typed)'
            : '__IMG__' + hidden.value]);
        }
      });

      var group = document.createElement('div');
      group.className = 'review__group';
      var body = rows.length
        ? '<dl>' + rows.map(function (r) {
            var dd = r[1].indexOf('__IMG__') === 0
              ? '<img src="' + r[1].slice(7) + '" alt="signature">'
              : escapeHtml(r[1]);
            return '<dt>' + escapeHtml(r[0]) + '</dt><dd>' + dd + '</dd>';
          }).join('') + '</dl>'
        : '<p class="review__empty">Nothing entered.</p>';
      group.innerHTML =
        '<div class="review__head"><span>' + g.title + '</span>' +
        '<button type="button" class="link-btn" data-edit="' + g.step + '">Edit</button></div>' +
        '<div class="review__body">' + body + '</div>';
      out.appendChild(group);
    });

    Array.prototype.forEach.call(out.querySelectorAll('[data-edit]'), function (b) {
      b.addEventListener('click', function () { goTo(parseInt(b.getAttribute('data-edit'), 10), true); });
    });
  }

  function escapeHtml(s) {
    return ('' + s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Submit                                                            */
  /* ------------------------------------------------------------------ */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    for (var i = 1; i < steps.length - 1; i++) {
      if (!validateStep(steps[i])) { goTo(i); return; }
    }
    if (!validateStep(steps[steps.length - 1])) return;

    var ref = 'CWP-' + new Date().getFullYear() + '-' +
      Math.random().toString(36).slice(2, 7).toUpperCase();
    document.getElementById('refNo').textContent = ref;

    form.hidden = true;
    document.getElementById('draftNotice').hidden = true;
    var panel = document.getElementById('successPanel');
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try { localStorage.removeItem(DRAFT_KEY); } catch (err) {}
  });

  document.getElementById('printBtn').addEventListener('click', function () {
    form.hidden = false;
    steps.forEach(function (s) { s.classList.add('is-active'); });
    window.print();
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
    form.hidden = true;
  });
  document.getElementById('restartBtn').addEventListener('click', function () {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    location.reload();
  });

  /* ------------------------------------------------------------------ */
  /*  Init                                                              */
  /* ------------------------------------------------------------------ */
  // default today's date into date-signed fields
  var today = new Date().toISOString().slice(0, 10);
  ['fin_date', 'npp_date', 'roi_date'].forEach(function (n) {
    if (form.elements[n] && !form.elements[n].value) form.elements[n].value = today;
  });

  loadDraft();
  goTo(current, true);
})();
