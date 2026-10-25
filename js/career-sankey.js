/* =========================================================
   Career Impact Map — Sankey diagram for the landing page.
   Ported from reference/career-impact-map.html. Data lives in
   data/career-sankey-data.csv (single source of truth).
   Everything here is namespaced with "sx-" classes/ids and reads
   its colours from the --sx-* custom properties defined under
   .career-sankey in styles.css, so nothing is hard-coded here.
   ========================================================= */
(function () {
  'use strict';

  var DATA_URL = '/data/career-sankey-data.csv';

  /* ---------- Config: role / skill-area colour maps ----------
     Keys are the exact strings used in the CSV. Values are CSS
     custom property names declared under .career-sankey. */
  var ROLE_COLOR = {
    'Software Engineer I': '--sx-role-se1',
    'Software Engineer II': '--sx-role-se2',
    'Product Owner II': '--sx-role-po2',
    'Product Owner III': '--sx-role-po3'
  };
  var AREA_COLOR = {
    'LIMS, Engineering & Data': '--sx-area-lims',
    'Stakeholder Alignment': '--sx-area-stakeholder',
    'Product Strategy & Delivery': '--sx-area-strategy',
    'GenAI & Agentic AI': '--sx-area-genai'
  };
  var AREA_COLOR_DEFAULT = '--sx-muted';
  var RESULT_COLOR = '--sx-marigold';

  /* ---------- Descriptions the CSV does not carry, keyed by the exact names used in the CSV ---------- */
  var ROLE_BLURB = {
    'Software Engineer I': 'Industry-specific solutions on Platform for Science LIMS and SampleManager LIMS. Built configurable BI dashboards in SQL and C# that expose lab bottlenecks and compliance gaps.',
    'Software Engineer II': 'Owned design to delivery of bio-analytical and visualisation solutions in SampleManager LIMS. Built machine learning modules in Python and SQL for trend views, fail-early samples and budget forecasts.',
    'Product Owner II': 'Owned the roadmap, evaluation criteria and deployment strategy for a GenAI opportunity intelligence platform, and took a GenAI image pipeline from pilot to production.',
    'Product Owner III': 'Leads AI products across quoting, contract renewals and instrument services, and built a 0 to 1 AI assistant MVP in ServiceNow, working with stakeholders in the USA, UK and EU.'
  };
  var AREA_BLURB = {
    'LIMS, Engineering & Data': 'The engineering base: LIMS platforms, data work and visualisation from 2020 to 2024.',
    'Stakeholder Alignment': 'Running discovery, aligning senior stakeholders and turning ambiguous requirements into decisions.',
    'Product Strategy & Delivery': 'Owning the roadmap, the metrics and the path from prototype to production.',
    'GenAI & Agentic AI': 'LLM, RAG and agentic systems built and evaluated for enterprise workflows.'
  };
  var SKILL_BLURB = {
    'Python, SQL & C#': 'Python, SQL, C#, enterprise data integration.',
    'ML & forecasting': 'Machine learning modules for trend visualisation, fail-early sample detection and budget forecasting.',
    'BI & dashboards': 'Configurable BI dashboards and visualisation on LIMS platforms.',
    'Discovery & requirements': 'Executive discovery workshops, requirements with pre-sales and subject-matter experts, process mapping.',
    'Executive storytelling': 'Executive storytelling, VP-level stakeholder management, demos and PoV presentations, panel moderation.',
    'Roadmap & backlog': 'Product vision, roadmapping, prioritisation, backlog ownership.',
    'KPIs & value measurement': 'KPI definition, business impact measurement, success metrics.',
    'Prototype to production': 'Proof of value, prototype to production AI systems, deployment strategy, Agile delivery.',
    'RAG & LLMs': 'Generative AI and LLMs, retrieval-augmented generation, prompt engineering.',
    'Agentic AI & prototyping': 'Agentic AI systems, vibe coding, full-stack AI prototyping with Plotly Dash.',
    'AI evaluation & governance': 'AI evaluation criteria and governance frameworks.'
  };
  var OUT_BLURB = {
    '$30M': 'AI-assisted quoting assistant, a precursor to Oracle CPQ. Daily prototyping sessions with USA and EU stakeholders converged on a business-approved solution. This figure is a projection, not realised savings.',
    '$3.1M': 'GenAI contract renewals decision-support platform, built from executive discovery workshops through to production. It surfaces non-compliance, upsell and bundling opportunities.',
    '$3.5M / 25x': 'Enterprise AI for instrument services workflows. Annual savings of $3.5M and a 25x increase in user adoption after moving off a third-party solution.',
    '-30%': '0 to 1 full-stack AI assistant MVP in ServiceNow for L1 support. It won investment for production scale and cut resolution time by 30%.',
    '$2M / +40%': 'GenAI opportunity intelligence platform that joins internal portfolio data with external bids, tenders and grants. Qualified opportunities rose 40% and incremental bookings reached $2M.',
    '-99%': 'GenAI image processing pipeline taken from pilot to production with evaluation criteria, governance and success metrics. Cost per image fell 99%.',
    '3 wins': 'Bio-analytical and visualisation solutions in SampleManager LIMS contributed to three major enterprise wins within three months of launch.',
    '-40%': 'Industry-specific LIMS solutions and ML modules cut the effort customers spent on customisation by 40%.'
  };

  var container = document.getElementById('sankey-container');
  if (!container) return;
  var panelEl = container.querySelector('.sx-panel');

  function parseCSV(t) {
    var rows = [], row = [], f = '', q = false, i, c;
    for (i = 0; i < t.length; i++) {
      c = t[i];
      if (q) {
        if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && t[i + 1] === '\n') i++;
        row.push(f); f = ''; rows.push(row); row = [];
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    var head = rows.shift().map(function (s) { return s.trim(); });
    return rows.filter(function (r) { return r.length > 1 && r[0].trim(); }).map(function (r) {
      var o = {}; head.forEach(function (k, j) { o[k] = (r[j] || '').trim(); }); return o;
    });
  }

  function pretty(s) { return s.replace(/^-/, '−').replace(/ \/ /g, ' · '); }

  function showError(err) {
    console.error('Career Impact Map: could not load ' + DATA_URL, err);
    if (!panelEl) return;
    panelEl.innerHTML =
      '<p class="sx-kicker">Unable to load</p>' +
      '<h3>Career impact map</h3>' +
      '<p class="sx-txt">This diagram could not load its data just now. Please refresh the page, or get in touch directly.</p>';
  }

  function build(text) {
    var recs;
    try { recs = parseCSV(text); } catch (e) { showError(e); return; }
    if (!recs.length) { showError(new Error('empty dataset')); return; }

    /* Nodes appear top to bottom in the order they first occur in the CSV. */
    var roles = [], areas = [], skills = [], outs = [];
    function find(list, key, make) {
      for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
      var o = make(); o.key = key; o.order = list.length; list.push(o); return o;
    }
    var paths = recs.map(function (r) {
      var w = parseFloat(r.ribbon_weight) || 0;
      var ro = find(roles, r.role, function () {
        return { kind: 'role', name: r.role, dates: r.role_dates.replace(' - ', ' – '), c: ROLE_COLOR[r.role] || '--sx-muted', blurb: ROLE_BLURB[r.role] || '' };
      });
      var ar = find(areas, r.skill_area, function () {
        return { kind: 'area', name: r.skill_area, c: AREA_COLOR[r.skill_area] || AREA_COLOR_DEFAULT, blurb: AREA_BLURB[r.skill_area] || '' };
      });
      var sk = find(skills, r.skill, function () { return { kind: 'skill', name: r.skill, blurb: SKILL_BLURB[r.skill] || '' }; });
      var ou = find(outs, r.result_headline, function () {
        return { kind: 'out', big: pretty(r.result_headline), sub: pretty(r.result_description), projected: /^y/i.test(r.projected), blurb: OUT_BLURB[r.result_headline] || '' };
      });
      return { ids: ['r' + ro.order, 'a' + ar.order, 's' + sk.order, 'o' + ou.order], role: ro, area: ar, out: ou, w: w };
    });

    var nodes = [], links = [];
    [[roles, 'r', 0], [areas, 'a', 1], [skills, 's', 2], [outs, 'o', 3]].forEach(function (g) {
      g[0].forEach(function (x) { nodes.push({ id: g[1] + x.order, kind: x.kind, layer: g[2], order: x.order, ref: x, name: x.name || (x.big + ' ' + x.sub) }); });
    });
    var nodeById = {}; nodes.forEach(function (n) { nodeById[n.id] = n; });
    var nodePids = {};
    paths.forEach(function (p, i) {
      for (var k = 0; k < 3; k++) {
        links.push({ source: p.ids[k], target: p.ids[k + 1], value: p.w, pid: i, segment: k, role: p.role, area: p.area });
      }
      p.ids.forEach(function (id) { (nodePids[id] = nodePids[id] || new Set()).add(i); });
    });

    /* ---------- Layout (unchanged from the reference) ---------- */
    var W = 1180, H = 720, M = { t: 44, r: 262, b: 16, l: 206 }, NW = 14;
    var sankey = d3.sankey().nodeId(function (d) { return d.id; }).nodeWidth(NW).nodePadding(16)
      .nodeSort(function (a, b) { return a.order - b.order; })
      .extent([[M.l, M.t], [W - M.r, H - M.b]]);
    var graph = sankey({
      nodes: nodes.map(function (d) { return Object.assign({}, d); }),
      links: links.map(function (d) { return Object.assign({}, d); })
    });

    var svg = d3.select('#sx-sankey'); svg.selectAll('*').remove();
    svg.attr('viewBox', '0 0 ' + W + ' ' + H).attr('role', 'group')
      .attr('aria-label', 'Sankey diagram from roles through skill areas and skills to measurable results');

    [['ROLE', 0], ['SKILL AREA', 1], ['SKILL', 2], ['RESULT', 3]].forEach(function (c) {
      var n = graph.nodes.filter(function (d) { return d.layer === c[1]; })[0];
      svg.append('text').attr('class', 'sx-colh').attr('x', c[1] === 0 ? n.x1 : n.x0).attr('y', 24)
        .attr('text-anchor', c[1] === 0 ? 'end' : 'start').text(c[0]);
    });

    var linkSel = svg.append('g').selectAll('path').data(graph.links).join('path')
      .attr('class', function (d) { return 'sx-link' + (d.segment === 2 ? ' sx-link--result' : ''); })
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke-width', function (d) { return Math.max(1, d.width); })
      .style('stroke', function (d) {
        if (d.segment === 0) return 'var(' + d.role.c + ')';
        if (d.segment === 1) return 'var(' + d.area.c + ')';
        return 'var(' + RESULT_COLOR + ')';
      });

    /* Result labels need more room than the nodes, so spread them apart. */
    var os = graph.nodes.filter(function (d) { return d.layer === 3; }).sort(function (a, b) { return a.y0 - b.y0; });
    var GAP = 40, prev = -Infinity, i;
    os.forEach(function (d) { d.ly = Math.max((d.y0 + d.y1) / 2, prev + GAP, M.t + 10); prev = d.ly; });
    var maxY = H - M.b - 22;
    for (i = os.length - 1; i >= 0; i--) {
      var lim = i === os.length - 1 ? maxY : os[i + 1].ly - GAP;
      if (os[i].ly > lim) os[i].ly = lim;
    }

    var nodeSel = svg.append('g').selectAll('g').data(graph.nodes).join('g')
      .attr('class', 'sx-node').attr('tabindex', 0).attr('role', 'button')
      .attr('aria-label', function (d) { return d.kind === 'out' ? d.ref.big + ' ' + d.ref.sub : d.name; });

    nodeSel.append('rect').attr('class', 'sx-node-body')
      .attr('x', function (d) { return d.x0; }).attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return Math.max(3, d.y1 - d.y0); }).attr('rx', 2)
      .style('fill', function (d) {
        if (d.kind === 'role') return 'var(' + d.ref.c + ')';
        if (d.kind === 'out' && d.ref.projected) return 'transparent';
        if (d.kind === 'out') return 'var(' + RESULT_COLOR + ')';
        return 'var(--sx-node)';
      })
      .style('stroke', function (d) { return d.kind === 'out' && d.ref.projected ? 'var(' + RESULT_COLOR + ')' : 'none'; })
      .style('stroke-width', 1.5)
      .style('stroke-dasharray', function (d) { return d.kind === 'out' && d.ref.projected ? '3 2' : 'none'; });

    nodeSel.each(function (d) {
      var g = d3.select(this), cy = (d.y0 + d.y1) / 2;
      if (d.kind === 'role') {
        g.append('text').attr('class', 'sx-lbl').attr('x', d.x0 - 12).attr('y', cy - 3).attr('text-anchor', 'end').text(d.name);
        g.append('text').attr('class', 'sx-meta').attr('x', d.x0 - 12).attr('y', cy + 12).attr('text-anchor', 'end').text(d.ref.dates);
      } else if (d.kind === 'area' || d.kind === 'skill') {
        g.append('text').attr('class', 'sx-lbl').attr('x', d.x1 + 8).attr('y', cy + 4).text(d.name);
      } else {
        var lx = d.x1 + 14;
        if (Math.abs(d.ly + 3 - cy) > 4) {
          g.append('path').attr('class', 'sx-leader').attr('d', 'M' + d.x1 + ',' + cy + 'H' + (d.x1 + 5) + 'L' + (d.x1 + 10) + ',' + (d.ly + 3));
        }
        g.append('text').attr('class', 'sx-big').attr('x', lx).attr('y', d.ly).text(d.ref.big);
        g.append('text').attr('class', 'sx-sub2' + (d.ref.projected ? ' sx-proj' : '')).attr('x', lx).attr('y', d.ly + 15).text(d.ref.sub);
      }
    });

    /* ---------- Role chips ---------- */
    var chipsEl = document.getElementById('sx-chips'); chipsEl.innerHTML = '';
    var hover = null, locked = null;
    function addChip(label, key, color) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sx-chip'; b.dataset.key = key || '';
      if (color) { var s = document.createElement('span'); s.className = 'sx-dot'; s.style.setProperty('--c', 'var(' + color + ')'); b.appendChild(s); }
      b.appendChild(document.createTextNode(label));
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { locked = key && locked !== key ? key : null; hover = null; render(); });
      chipsEl.appendChild(b);
    }
    addChip('All roles', '', null);
    roles.forEach(function (r) { addChip(r.name, 'r' + r.order, r.c); });

    /* ---------- Highlight + detail panel ---------- */
    var detailEl = document.getElementById('sx-detail');
    function uniq(pids, idx) {
      var s = [];
      pids.forEach(function (p) { var id = paths[p].ids[idx]; if (s.indexOf(id) < 0) s.push(id); });
      return s.sort(function (a, b) { return nodeById[a].order - nodeById[b].order; });
    }
    function roleTag(id) { var r = nodeById[id].ref; return '<span class="sx-tag"><span class="sx-dot" style="--c:var(' + r.c + ')"></span>' + r.name + '</span>'; }
    function outTag(id) { var o = nodeById[id].ref; return '<span class="sx-tag"><b>' + o.big + '</b> ' + o.sub + '</span>'; }
    function nameTag(id) { return '<span class="sx-tag">' + nodeById[id].name + '</span>'; }
    function relRow(label, html) { return '<div class="sx-rel"><span class="sx-k">' + label + '</span>' + html + '</div>'; }

    function renderDetail(cur) {
      if (!cur) {
        detailEl.innerHTML =
          '<p class="sx-kicker">How to read</p><h3>Role, skill area, skill, result</h3>' +
          '<p class="sx-txt">Shade of green marks the role, and marigold marks the results. Each role sends ribbons through the skills it built to the results that followed, and the product roles reach the larger business numbers on the right.</p>';
        return;
      }
      var n = nodeById[cur], pids = Array.from(nodePids[cur]);
      var kind = { role: 'Role', area: 'Skill area', skill: 'Skill', out: 'Result' }[n.kind];
      var h = '<p class="sx-kicker">' + kind + '</p><h3>' + (n.kind === 'out' ? n.ref.big + ' ' + n.ref.sub : n.name) + '</h3>';
      if (n.kind === 'role') h += '<p class="sx-when">' + n.ref.dates + '</p>';
      if (n.ref.blurb) h += '<p class="sx-txt">' + n.ref.blurb + '</p>';
      if (n.kind === 'role') h += relRow('Skills', uniq(pids, 2).map(nameTag).join('')) + relRow('Results', uniq(pids, 3).map(outTag).join(''));
      else if (n.kind === 'out') h += relRow('Roles', uniq(pids, 0).map(roleTag).join('')) + relRow('Skills', uniq(pids, 2).map(nameTag).join(''));
      else h += relRow('Roles', uniq(pids, 0).map(roleTag).join('')) + relRow('Results', uniq(pids, 3).map(outTag).join(''));
      detailEl.innerHTML = h;
    }

    function render() {
      var cur = hover || locked;
      if (!cur) {
        linkSel.classed('sx-on', false).classed('sx-dim', false); nodeSel.classed('sx-dim', false);
      } else {
        var pids = nodePids[cur], on = new Set();
        pids.forEach(function (p) { paths[p].ids.forEach(function (id) { on.add(id); }); });
        linkSel.classed('sx-on', function (d) { return pids.has(d.pid); }).classed('sx-dim', function (d) { return !pids.has(d.pid); });
        nodeSel.classed('sx-dim', function (d) { return !on.has(d.id); });
      }
      renderDetail(cur);
      var sel = locked || '';
      Array.prototype.forEach.call(chipsEl.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.key === sel)); });
    }

    nodeSel
      .on('pointerenter', function (e, d) { if (e.pointerType === 'mouse') { hover = d.id; render(); } })
      .on('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = null; render(); } })
      .on('click', function (e, d) { e.stopPropagation(); locked = locked === d.id ? null : d.id; render(); })
      .on('keydown', function (e, d) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); locked = locked === d.id ? null : d.id; render(); }
      });
    svg.on('click', function () { locked = null; hover = null; render(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && (locked || hover)) { locked = null; hover = null; render(); }
    });
    render();

    /* ---------- Visually hidden text alternative: role, dates, then its headline results ---------- */
    var altEl = document.getElementById('sx-alt');
    if (altEl) {
      altEl.innerHTML = '';
      var heading = document.createElement('p');
      heading.textContent = 'Text summary of the career impact diagram, by role:';
      altEl.appendChild(heading);
      var list = document.createElement('ul');
      roles.forEach(function (r) {
        var headlines = [];
        paths.forEach(function (p) { if (p.role === r && headlines.indexOf(p.out.big) < 0) headlines.push(p.out.big); });
        var li = document.createElement('li');
        li.textContent = r.name + ' (' + r.dates + '): ' + headlines.join(', ');
        list.appendChild(li);
      });
      altEl.appendChild(list);
    }
  }

  if (!window.fetch) { showError(new Error('fetch unsupported')); return; }
  fetch(DATA_URL, { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status)); })
    .then(function (t) { build(t); })
    .catch(showError);
})();
