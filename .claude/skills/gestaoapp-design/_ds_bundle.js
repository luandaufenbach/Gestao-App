/* @ds-bundle: {"format":4,"namespace":"GestaoAppDesignSystem_8ff7d0","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/core/AvatarGroup.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"ICON_NAMES","sourcePath":"components/core/Icon.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Kbd","sourcePath":"components/core/Kbd.jsx"},{"name":"PriorityFlag","sourcePath":"components/core/PriorityFlag.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"ProjectTag","sourcePath":"components/core/ProjectTag.jsx"},{"name":"StatusBadge","sourcePath":"components/core/StatusBadge.jsx"},{"name":"BarChart","sourcePath":"components/data/BarChart.jsx"},{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"GoalCard","sourcePath":"components/data/GoalCard.jsx"},{"name":"ProjectCard","sourcePath":"components/data/ProjectCard.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"TaskRow","sourcePath":"components/data/TaskRow.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"FilterChip","sourcePath":"components/forms/FilterChip.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"NavItem","sourcePath":"components/navigation/NavItem.jsx"},{"name":"NavSection","sourcePath":"components/navigation/NavSection.jsx"},{"name":"PageHeader","sourcePath":"components/navigation/PageHeader.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"WorkspaceSwitcher","sourcePath":"components/navigation/WorkspaceSwitcher.jsx"},{"name":"BottomSheet","sourcePath":"components/overlays/BottomSheet.jsx"},{"name":"Dialog","sourcePath":"components/overlays/Dialog.jsx"},{"name":"Drawer","sourcePath":"components/overlays/Drawer.jsx"},{"name":"Toast","sourcePath":"components/overlays/Toast.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"37f99a4120d8","components/core/AvatarGroup.jsx":"225df8dc59cb","components/core/Badge.jsx":"4f114b2667da","components/core/Button.jsx":"94963526086a","components/core/Icon.jsx":"d2ca836400ce","components/core/IconButton.jsx":"9a5149139986","components/core/Kbd.jsx":"8014df2a5eb1","components/core/PriorityFlag.jsx":"dc05b7da86eb","components/core/ProgressBar.jsx":"8829397e0911","components/core/ProjectTag.jsx":"268dbf1645f6","components/core/StatusBadge.jsx":"373270663df1","components/data/BarChart.jsx":"2456916d059a","components/data/Card.jsx":"805e895d4d54","components/data/DataTable.jsx":"0af8a8587ab8","components/data/GoalCard.jsx":"01f34c0483c4","components/data/ProjectCard.jsx":"f9b037b03009","components/data/StatCard.jsx":"eeb1015e2b99","components/data/TaskRow.jsx":"61b396983d35","components/forms/Checkbox.jsx":"f143917a0e73","components/forms/FilterChip.jsx":"8e37b4788b04","components/forms/Radio.jsx":"d1a3c59285dd","components/forms/SearchField.jsx":"b81a4321afe3","components/forms/SegmentedControl.jsx":"93cd3774a85b","components/forms/Select.jsx":"cec0948cb53b","components/forms/Switch.jsx":"bba9e5dfcde3","components/forms/TextField.jsx":"6bf68fb027b7","components/navigation/Breadcrumb.jsx":"f621fc188e7e","components/navigation/NavItem.jsx":"cb297f0fb82b","components/navigation/NavSection.jsx":"8b842bf07461","components/navigation/PageHeader.jsx":"7dfa36036601","components/navigation/Sidebar.jsx":"8e35dd3b28c2","components/navigation/TabBar.jsx":"e4e92356e23d","components/navigation/Tabs.jsx":"85a8edd70a31","components/navigation/WorkspaceSwitcher.jsx":"78449447097f","components/overlays/BottomSheet.jsx":"2fea07c92b58","components/overlays/Dialog.jsx":"ec4104bf114d","components/overlays/Drawer.jsx":"359a8be39812","components/overlays/Toast.jsx":"5f29e0e2ecfe","ui_kits/admin/App.jsx":"684c68a611e2","ui_kits/admin/Dashboard.jsx":"294286274c0f","ui_kits/admin/Projects.jsx":"6c1e411503be","ui_kits/admin/Settings.jsx":"2fbd7cf4fae6","ui_kits/admin/Shell.jsx":"929441a7db2a","ui_kits/admin/TaskDetail.jsx":"8552399be122","ui_kits/admin/Tasks.jsx":"8d4667b9b9ba","ui_kits/admin/Team.jsx":"6b94b26457ce","ui_kits/admin/data.js":"28230d6374f8"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.GestaoAppDesignSystem_8ff7d0 = window.GestaoAppDesignSystem_8ff7d0 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
const SIZES = {
  xs: 20,
  sm: 24,
  md: 28,
  lg: 32,
  xl: 40,
  '2xl': 48
};
const TONES = ['cobalt', 'zest', 'violet', 'orange', 'sky', 'green'];
function initialsOf(name) {
  if (!name) return '';
  const p = String(name).trim().split(/\s+/);
  return ((p[0] || '')[0] + ((p.length > 1 ? p[p.length - 1] : '')[0] || '')).toUpperCase();
}
function toneFor(name) {
  let h = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) >>> 0;
  return TONES[h % TONES.length];
}
function Avatar({
  name,
  initials,
  src,
  tone,
  size = 'md',
  status,
  className,
  style
}) {
  const px = typeof size === 'number' ? size : SIZES[size] || 28;
  const t = tone || toneFor(name);
  return /*#__PURE__*/React.createElement("span", {
    className: cx('ga-avatar', 'ga-avatar--' + t, className),
    style: Object.assign({
      '--s': px + 'px'
    }, style),
    title: name
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name || ''
  }) : initials || initialsOf(name), status ? /*#__PURE__*/React.createElement("span", {
    className: cx('ga-avatar__status', status !== 'online' && 'ga-avatar__status--' + status)
  }) : null);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/AvatarGroup.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
const SIZES = {
  xs: 20,
  sm: 24,
  md: 28,
  lg: 32,
  xl: 40,
  '2xl': 48
};
function AvatarGroup({
  people = [],
  max = 4,
  size = 'md',
  className,
  style
}) {
  const px = typeof size === 'number' ? size : SIZES[size] || 28;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return /*#__PURE__*/React.createElement("span", {
    className: cx('ga-avatar-group', className),
    style: Object.assign({
      '--s': px + 'px'
    }, style)
  }, shown.map(function (p, i) {
    return /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
      key: i,
      name: p.name,
      initials: p.initials,
      src: p.src,
      tone: p.tone,
      size: size
    });
  }), extra > 0 ? /*#__PURE__*/React.createElement("span", {
    className: "ga-avatar ga-avatar--ink",
    style: {
      '--s': px + 'px'
    }
  }, "+", extra) : null);
}
Object.assign(__ds_scope, { AvatarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/AvatarGroup.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  className,
  style,
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: cx('ga-badge', 'ga-badge--' + tone, size === 'sm' && 'ga-badge--sm', className),
    style: style
  }, dot ? /*#__PURE__*/React.createElement("span", {
    className: "ga-badge__dot"
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
// Lucide icon paths (ISC license), copied verbatim from lucide-static@0.469.0 — see assets/icons/.
const ICONS = {
  'arrow-right': "<path d=\"M5 12h14\" /> <path d=\"m12 5 7 7-7 7\" />",
  'arrow-up': "<path d=\"m5 12 7-7 7 7\" /> <path d=\"M12 19V5\" />",
  'arrow-up-right': "<path d=\"M7 7h10v10\" /> <path d=\"M7 17 17 7\" />",
  'bell': "<path d=\"M10.268 21a2 2 0 0 0 3.464 0\" /> <path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\" />",
  'bell-ring': "<path d=\"M10.268 21a2 2 0 0 0 3.464 0\" /> <path d=\"M22 8c0-2.3-.8-4.3-2-6\" /> <path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\" /> <path d=\"M4 2C2.8 3.7 2 5.7 2 8\" />",
  'briefcase': "<path d=\"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\" /> <rect width=\"20\" height=\"14\" x=\"2\" y=\"6\" rx=\"2\" />",
  'calendar': "<path d=\"M8 2v4\" /> <path d=\"M16 2v4\" /> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /> <path d=\"M3 10h18\" />",
  'calendar-days': "<path d=\"M8 2v4\" /> <path d=\"M16 2v4\" /> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /> <path d=\"M3 10h18\" /> <path d=\"M8 14h.01\" /> <path d=\"M12 14h.01\" /> <path d=\"M16 14h.01\" /> <path d=\"M8 18h.01\" /> <path d=\"M12 18h.01\" /> <path d=\"M16 18h.01\" />",
  'chart-column': "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /> <path d=\"M18 17V9\" /> <path d=\"M13 17V5\" /> <path d=\"M8 17v-3\" />",
  'check': "<path d=\"M20 6 9 17l-5-5\" />",
  'chevron-down': "<path d=\"m6 9 6 6 6-6\" />",
  'chevron-left': "<path d=\"m15 18-6-6 6-6\" />",
  'chevron-right': "<path d=\"m9 18 6-6-6-6\" />",
  'chevron-up': "<path d=\"m18 15-6-6-6 6\" />",
  'circle': "<circle cx=\"12\" cy=\"12\" r=\"10\" />",
  'circle-check': "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m9 12 2 2 4-4\" />",
  'clock': "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16 14\" />",
  'columns-3': "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /> <path d=\"M9 3v18\" /> <path d=\"M15 3v18\" />",
  'credit-card': "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\" /> <line x1=\"2\" x2=\"22\" y1=\"10\" y2=\"10\" />",
  'download': "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"7 10 12 15 17 10\" /> <line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />",
  'ellipsis': "<circle cx=\"12\" cy=\"12\" r=\"1\" /> <circle cx=\"19\" cy=\"12\" r=\"1\" /> <circle cx=\"5\" cy=\"12\" r=\"1\" />",
  'external-link': "<path d=\"M15 3h6v6\" /> <path d=\"M10 14 21 3\" /> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
  'eye': "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  'file-text': "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M10 9H8\" /> <path d=\"M16 13H8\" /> <path d=\"M16 17H8\" />",
  'filter': "<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\" />",
  'flag': "<path d=\"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z\" /> <line x1=\"4\" x2=\"4\" y1=\"22\" y2=\"15\" />",
  'folder': "<path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\" />",
  'folder-plus': "<path d=\"M12 10v6\" /> <path d=\"M9 13h6\" /> <path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\" />",
  'globe': "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /> <path d=\"M2 12h20\" />",
  'grip-vertical': "<circle cx=\"9\" cy=\"12\" r=\"1\" /> <circle cx=\"9\" cy=\"5\" r=\"1\" /> <circle cx=\"9\" cy=\"19\" r=\"1\" /> <circle cx=\"15\" cy=\"12\" r=\"1\" /> <circle cx=\"15\" cy=\"5\" r=\"1\" /> <circle cx=\"15\" cy=\"19\" r=\"1\" />",
  'hash': "<line x1=\"4\" x2=\"20\" y1=\"9\" y2=\"9\" /> <line x1=\"4\" x2=\"20\" y1=\"15\" y2=\"15\" /> <line x1=\"10\" x2=\"8\" y1=\"3\" y2=\"21\" /> <line x1=\"16\" x2=\"14\" y1=\"3\" y2=\"21\" />",
  'house': "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" /> <path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />",
  'inbox': "<polyline points=\"22 12 16 12 14 15 10 15 8 12 2 12\" /> <path d=\"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z\" />",
  'info': "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 16v-4\" /> <path d=\"M12 8h.01\" />",
  'layers': "<path d=\"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z\" /> <path d=\"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12\" /> <path d=\"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17\" />",
  'layout-grid': "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\" />",
  'link': "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\" /> <path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\" />",
  'list': "<path d=\"M3 12h.01\" /> <path d=\"M3 18h.01\" /> <path d=\"M3 6h.01\" /> <path d=\"M8 12h13\" /> <path d=\"M8 18h13\" /> <path d=\"M8 6h13\" />",
  'lock': "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />",
  'log-out': "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /> <polyline points=\"16 17 21 12 16 7\" /> <line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />",
  'mail': "<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\" /> <path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\" />",
  'menu': "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /> <line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /> <line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" />",
  'message-square': "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" />",
  'monitor': "<rect width=\"20\" height=\"14\" x=\"2\" y=\"3\" rx=\"2\" /> <line x1=\"8\" x2=\"16\" y1=\"21\" y2=\"21\" /> <line x1=\"12\" x2=\"12\" y1=\"17\" y2=\"21\" />",
  'moon': "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" />",
  'palette': "<circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\" /> <path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z\" />",
  'panel-left-close': "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /> <path d=\"M9 3v18\" /> <path d=\"m16 15-3-3 3-3\" />",
  'paperclip': "<path d=\"M13.234 20.252 21 12.3\" /> <path d=\"m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486\" />",
  'pencil': "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" /> <path d=\"m15 5 4 4\" />",
  'play': "<polygon points=\"6 3 20 12 6 21 6 3\" />",
  'plus': "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />",
  'puzzle': "<path d=\"M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z\" />",
  'refresh-cw': "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /> <path d=\"M21 3v5h-5\" /> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /> <path d=\"M8 16H3v5\" />",
  'repeat': "<path d=\"m17 2 4 4-4 4\" /> <path d=\"M3 11v-1a4 4 0 0 1 4-4h14\" /> <path d=\"m7 22-4-4 4-4\" /> <path d=\"M21 13v1a4 4 0 0 1-4 4H3\" />",
  'search': "<circle cx=\"11\" cy=\"11\" r=\"8\" /> <path d=\"m21 21-4.3-4.3\" />",
  'settings': "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  'sheet': "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\" /> <line x1=\"3\" x2=\"21\" y1=\"9\" y2=\"9\" /> <line x1=\"3\" x2=\"21\" y1=\"15\" y2=\"15\" /> <line x1=\"9\" x2=\"9\" y1=\"9\" y2=\"21\" /> <line x1=\"15\" x2=\"15\" y1=\"9\" y2=\"21\" />",
  'sliders-horizontal': "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\" /> <line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\" /> <line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\" /> <line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\" /> <line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\" /> <line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\" /> <line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\" /> <line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\" />",
  'smartphone': "<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\" /> <path d=\"M12 18h.01\" />",
  'sparkle': "<path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\" />",
  'square-check': "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /> <path d=\"m9 12 2 2 4-4\" />",
  'star': "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\" />",
  'sun': "<circle cx=\"12\" cy=\"12\" r=\"4\" /> <path d=\"M12 2v2\" /> <path d=\"M12 20v2\" /> <path d=\"m4.93 4.93 1.41 1.41\" /> <path d=\"m17.66 17.66 1.41 1.41\" /> <path d=\"M2 12h2\" /> <path d=\"M20 12h2\" /> <path d=\"m6.34 17.66-1.41 1.41\" /> <path d=\"m19.07 4.93-1.41 1.41\" />",
  'tag': "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\" /> <circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />",
  'target': "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <circle cx=\"12\" cy=\"12\" r=\"6\" /> <circle cx=\"12\" cy=\"12\" r=\"2\" />",
  'trash-2': "<path d=\"M3 6h18\" /> <path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /> <path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /> <line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /> <line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />",
  'trending-up': "<polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\" /> <polyline points=\"16 7 22 7 22 13\" />",
  'triangle-alert': "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /> <path d=\"M12 9v4\" /> <path d=\"M12 17h.01\" />",
  'upload': "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"17 8 12 3 7 8\" /> <line x1=\"12\" x2=\"12\" y1=\"3\" y2=\"15\" />",
  'user': "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /> <circle cx=\"12\" cy=\"7\" r=\"4\" />",
  'user-plus': "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <line x1=\"19\" x2=\"19\" y1=\"8\" y2=\"14\" /> <line x1=\"22\" x2=\"16\" y1=\"11\" y2=\"11\" />",
  'users': "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />",
  'x': "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />",
  'zap': "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\" />"
};
const ICON_NAMES = Object.keys(ICONS);
function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
  className,
  title
}) {
  const body = ICONS[name];
  if (!body) return null;
  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className,
    style: {
      flexShrink: 0,
      display: 'block',
      ...style
    },
    "aria-hidden": title ? undefined : true,
    role: title ? 'img' : undefined,
    dangerouslySetInnerHTML: {
      __html: (title ? '<title>' + title + '</title>' : '') + body
    }
  });
}
Object.assign(__ds_scope, { ICON_NAMES, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// gestaoApp Button — pill-shaped, Outfit medium. Primary carries the cobalt glow.
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block = false,
  disabled = false,
  type = 'button',
  href,
  onClick,
  className,
  style,
  children,
  ...rest
}) {
  const cls = cx('ga-btn', 'ga-btn--' + variant, size !== 'md' && 'ga-btn--' + size, block && 'ga-btn--block', className);
  const isz = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const content = /*#__PURE__*/React.createElement(React.Fragment, null, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: isz,
    strokeWidth: 2
  }) : null, children != null ? /*#__PURE__*/React.createElement("span", null, children) : null, iconRight ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: isz,
    strokeWidth: 2
  }) : null);
  if (href) return /*#__PURE__*/React.createElement("a", _extends({
    className: cls,
    href: href,
    style: style,
    onClick: onClick
  }, rest), content);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls,
    disabled: disabled,
    onClick: onClick,
    style: style
  }, rest), content);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  shape = 'rounded',
  dot = false,
  disabled = false,
  onClick,
  className,
  style,
  ...rest
}) {
  const isz = size === 'sm' ? 15 : size === 'lg' ? 20 : 17;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    style: style,
    className: cx('ga-iconbtn', 'ga-iconbtn--' + variant, size !== 'md' && 'ga-iconbtn--' + size, shape === 'circle' && 'ga-iconbtn--circle', className)
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: isz,
    strokeWidth: variant === 'primary' ? 2.25 : 1.75
  }), dot ? /*#__PURE__*/React.createElement("span", {
    className: "ga-iconbtn__dot"
  }) : null);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Kbd.jsx
try { (() => {
function Kbd({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("kbd", {
    className: "ga-kbd",
    style: style
  }, children);
}
Object.assign(__ds_scope, { Kbd });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Kbd.jsx", error: String((e && e.message) || e) }); }

// components/core/PriorityFlag.jsx
try { (() => {
const LABELS = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa'
};
function PriorityFlag({
  level = 'low',
  label,
  iconOnly = false,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: 'ga-prio ga-prio--' + level,
    style: style,
    title: 'Prioridade ' + (label || LABELS[level])
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "flag",
    size: 13,
    strokeWidth: 2
  }), iconOnly ? null : /*#__PURE__*/React.createElement("span", null, label || LABELS[level]));
}
Object.assign(__ds_scope, { PriorityFlag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PriorityFlag.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
const TONES = {
  brand: 'var(--brand-primary)',
  accent: 'var(--accent)',
  success: 'var(--green-500)',
  warning: 'var(--orange-500)',
  danger: 'var(--red-500)',
  violet: 'var(--violet-500)',
  lime: 'var(--lime-500)',
  neutral: 'var(--ink-400)'
};
const H = {
  xs: 4,
  sm: 6,
  md: 8
};
function ProgressBar({
  value = 0,
  max = 100,
  tone = 'brand',
  color,
  size = 'sm',
  onBrand = false,
  label,
  style
}) {
  const pct = Math.max(0, Math.min(100, value / (max || 1) * 100));
  return /*#__PURE__*/React.createElement("div", {
    className: 'ga-progress' + (onBrand ? ' ga-progress--on-brand' : ''),
    role: "progressbar",
    "aria-valuenow": Math.round(pct),
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": label,
    style: Object.assign({
      '--h': (H[size] || 6) + 'px',
      '--c': color || TONES[tone] || TONES.brand
    }, style)
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-progress__fill",
    style: {
      width: pct + '%'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/ProjectTag.jsx
try { (() => {
function ProjectTag({
  name,
  color = 'var(--project-1)',
  plain = false,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: 'ga-ptag' + (plain ? ' ga-ptag--plain' : ''),
    style: Object.assign({
      '--c': color
    }, style)
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-ptag__sq"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ga-ptag__label"
  }, name));
}
Object.assign(__ds_scope, { ProjectTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProjectTag.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusBadge.jsx
try { (() => {
const STATUS = {
  todo: {
    label: 'A fazer',
    dot: 'var(--status-todo)',
    bg: 'var(--status-todo-bg)'
  },
  progress: {
    label: 'Em andamento',
    dot: 'var(--status-progress)',
    bg: 'var(--status-progress-bg)'
  },
  review: {
    label: 'Em revisão',
    dot: 'var(--status-review)',
    bg: 'var(--status-review-bg)'
  },
  done: {
    label: 'Concluída',
    dot: 'var(--status-done)',
    bg: 'var(--status-done-bg)'
  }
};
function StatusBadge({
  status = 'todo',
  label,
  size = 'md',
  style
}) {
  const s = STATUS[status] || STATUS.todo;
  return /*#__PURE__*/React.createElement("span", {
    className: 'ga-badge ga-status' + (size === 'sm' ? ' ga-badge--sm' : ''),
    style: Object.assign({
      '--sd': s.dot,
      '--sb': s.bg
    }, style)
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-badge__dot"
  }), label || s.label);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/data/BarChart.jsx
try { (() => {
function BarChart({
  data = [],
  max,
  height = 140,
  legend = true,
  legendLabels,
  style
}) {
  const m = max || Math.max.apply(null, data.map(function (d) {
    return Math.max(d.value || 0, d.planned || 0);
  }).concat([1]));
  const L = legendLabels || {
    done: 'Concluídas',
    today: 'Hoje',
    planned: 'Planejadas'
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "ga-bars",
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-bars__plot",
    style: {
      '--h': height + 'px'
    }
  }, data.map(function (d, i) {
    return /*#__PURE__*/React.createElement("div", {
      className: "ga-bars__col",
      key: i,
      title: d.label + ': ' + d.value + (d.planned ? ' / ' + d.planned : '')
    }, /*#__PURE__*/React.createElement("div", {
      className: "ga-bars__stack"
    }, d.planned ? /*#__PURE__*/React.createElement("div", {
      className: "ga-bars__planned",
      style: {
        height: d.planned / m * 100 + '%'
      }
    }) : null, /*#__PURE__*/React.createElement("div", {
      className: 'ga-bars__done' + (d.highlight ? ' ga-bars__done--hl' : ''),
      style: {
        height: Math.max(4, d.value / m * 100) + '%'
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: 'ga-bars__label' + (d.highlight ? ' ga-bars__label--hl' : '')
    }, d.label));
  })), legend ? /*#__PURE__*/React.createElement("div", {
    className: "ga-legend"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-legend__item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-legend__sw",
    style: {
      '--c': 'var(--brand-primary)'
    }
  }), L.done), /*#__PURE__*/React.createElement("span", {
    className: "ga-legend__item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-legend__sw",
    style: {
      '--c': 'var(--accent)'
    }
  }), L.today), /*#__PURE__*/React.createElement("span", {
    className: "ga-legend__item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-legend__sw",
    style: {
      '--c': 'var(--ink-100)'
    }
  }), L.planned)) : null);
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/data/Card.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Card({
  variant = 'default',
  padding = 'md',
  title,
  subtitle,
  actions,
  interactive = false,
  onClick,
  className,
  style,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    className: cx('ga-card', variant !== 'default' && 'ga-card--' + variant, padding !== 'md' && 'ga-card--pad-' + padding, (interactive || onClick) && 'ga-card--interactive', className),
    style: style
  }, title || actions ? /*#__PURE__*/React.createElement("div", {
    className: "ga-card__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-card__titles"
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "ga-card__title"
  }, title) : null, subtitle ? /*#__PURE__*/React.createElement("div", {
    className: "ga-card__subtitle"
  }, subtitle) : null), actions ? /*#__PURE__*/React.createElement("div", {
    className: "ga-card__actions"
  }, actions) : null) : null, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function DataTable({
  columns = [],
  rows = [],
  rowKey,
  onRowClick,
  compact = false,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ga-table-wrap",
    style: style
  }, /*#__PURE__*/React.createElement("table", {
    className: 'ga-table' + (onRowClick ? ' ga-table--clickable' : '') + (compact ? ' ga-table--compact' : '')
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(function (c) {
    return /*#__PURE__*/React.createElement("th", {
      key: c.key,
      style: {
        width: c.width,
        textAlign: c.align || 'left'
      }
    }, c.header);
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map(function (r, i) {
    return /*#__PURE__*/React.createElement("tr", {
      key: rowKey ? r[rowKey] : i,
      onClick: onRowClick ? function () {
        onRowClick(r);
      } : undefined
    }, columns.map(function (c) {
      return /*#__PURE__*/React.createElement("td", {
        key: c.key,
        style: {
          textAlign: c.align || 'left'
        }
      }, c.render ? c.render(r) : r[c.key]);
    }));
  }))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/GoalCard.jsx
try { (() => {
function GoalCard({
  label = 'Meta semanal',
  done = 24,
  total = 28,
  sub,
  icon = 'target',
  className,
  style
}) {
  const pct = Math.round(done / (total || 1) * 100);
  const left = Math.max(0, total - done);
  return /*#__PURE__*/React.createElement("div", {
    className: 'ga-card ga-card--brand ga-goal' + (className ? ' ' + className : ''),
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-goal__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-goal__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15,
    strokeWidth: 2.25
  })), /*#__PURE__*/React.createElement("span", {
    className: "ga-goal__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "ga-goal__count"
  }, done, " / ", total)), /*#__PURE__*/React.createElement("div", {
    className: "ga-goal__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-goal__value"
  }, pct, "%"), /*#__PURE__*/React.createElement("span", {
    className: "ga-goal__sub"
  }, sub || 'faltam ' + left + ' tarefas')), /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    value: pct,
    tone: "accent",
    onBrand: true,
    size: "sm",
    label: label
  }));
}
Object.assign(__ds_scope, { GoalCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/GoalCard.jsx", error: String((e && e.message) || e) }); }

// components/data/ProjectCard.jsx
try { (() => {
const HEALTH = {
  ontrack: ['success', 'No prazo'],
  atrisk: ['warning', 'Em risco'],
  late: ['danger', 'Atrasado'],
  done: ['neutral', 'Concluído']
};
function ProjectCard({
  name,
  description,
  icon = 'layers',
  color = 'var(--project-1)',
  tint,
  health = 'ontrack',
  progress = 0,
  tasksDone,
  tasksTotal,
  due,
  members = [],
  onClick,
  onMore,
  className,
  style
}) {
  const h = HEALTH[health] || HEALTH.ontrack;
  return /*#__PURE__*/React.createElement("div", {
    className: 'ga-card ga-pcard' + (onClick ? ' ga-card--interactive' : '') + (className ? ' ' + className : ''),
    style: style,
    onClick: onClick
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-pcard__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-pcard__icon",
    style: {
      '--t-bg': tint || 'color-mix(in oklab, ' + color + ' 14%, transparent)',
      '--t-fg': color
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 17
  })), /*#__PURE__*/React.createElement("span", {
    className: "ga-pcard__top-end"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: h[0],
    size: "sm"
  }, h[1]), onMore ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "ellipsis",
    label: "Mais",
    size: "sm",
    onClick: function (e) {
      e.stopPropagation();
      onMore(e);
    }
  }) : null)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ga-pcard__name"
  }, name), description ? /*#__PURE__*/React.createElement("div", {
    className: "ga-pcard__desc"
  }, description) : null), /*#__PURE__*/React.createElement("div", {
    className: "ga-pcard__prog"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-pcard__prog-row"
  }, /*#__PURE__*/React.createElement("span", null, "Progresso"), /*#__PURE__*/React.createElement("b", null, progress, "%")), /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    value: progress,
    color: color,
    size: "xs"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ga-pcard__foot"
  }, /*#__PURE__*/React.createElement(__ds_scope.AvatarGroup, {
    people: members,
    size: "xs",
    max: 3
  }), /*#__PURE__*/React.createElement("span", {
    className: "ga-pcard__facts"
  }, tasksTotal != null ? /*#__PURE__*/React.createElement("span", {
    className: "ga-pcard__fact"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "square-check",
    size: 13
  }), tasksDone, "/", tasksTotal) : null, due ? /*#__PURE__*/React.createElement("span", {
    className: "ga-pcard__fact"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "calendar",
    size: 13
  }), due) : null)));
}
Object.assign(__ds_scope, { ProjectCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProjectCard.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
const TONES = {
  brand: ['var(--brand-primary-soft)', 'var(--brand-primary)'],
  success: ['var(--feedback-success-bg)', 'var(--green-600)'],
  warning: ['var(--feedback-warning-bg)', 'var(--orange-500)'],
  danger: ['var(--feedback-danger-bg)', 'var(--red-500)'],
  accent: ['var(--accent)', 'var(--ink-950)'],
  violet: ['var(--violet-50)', 'var(--violet-500)']
};
function StatCard({
  icon = 'calendar',
  tone = 'brand',
  label,
  value,
  delta,
  deltaTrend,
  caption,
  onMore,
  compact = false,
  className,
  style
}) {
  const t = TONES[tone] || TONES.brand;
  return /*#__PURE__*/React.createElement("div", {
    className: cx('ga-card ga-stat', compact && 'ga-stat--compact ga-card--pad-sm', className),
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-stat__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-stat__icon",
    style: {
      '--t-bg': t[0],
      '--t-fg': t[1]
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("span", {
    className: "ga-stat__label"
  }, label), onMore ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "ellipsis",
    label: "Mais",
    size: "sm",
    onClick: onMore,
    style: {
      margin: '-4px -6px -4px 0'
    }
  }) : null), /*#__PURE__*/React.createElement("div", {
    className: "ga-stat__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-stat__value"
  }, value), delta ? /*#__PURE__*/React.createElement("span", {
    className: cx('ga-stat__delta', deltaTrend && 'ga-stat__delta--' + deltaTrend)
  }, deltaTrend === 'up' ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-up",
    size: 12,
    strokeWidth: 2.25
  }) : null, delta) : null, caption ? /*#__PURE__*/React.createElement("span", {
    className: "ga-stat__delta"
  }, caption) : null));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Checkbox({
  checked,
  defaultChecked,
  onChange,
  label,
  description,
  shape = 'square',
  size = 'md',
  strike = false,
  disabled = false,
  className,
  style,
  ariaLabel
}) {
  const done = strike && checked;
  return /*#__PURE__*/React.createElement("label", {
    className: cx('ga-check', shape === 'round' && 'ga-check--round', size === 'lg' && 'ga-check--lg', done && 'ga-check--done', disabled && 'ga-check--disabled', className),
    style: style
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled,
    "aria-label": ariaLabel || (typeof label === 'string' ? label : undefined)
  }), /*#__PURE__*/React.createElement("span", {
    className: "ga-check__box"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: size === 'lg' ? 14 : 12,
    strokeWidth: 3
  })), label || description ? /*#__PURE__*/React.createElement("span", {
    className: "ga-check__text"
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "ga-check__label"
  }, label) : null, description ? /*#__PURE__*/React.createElement("span", {
    className: "ga-check__desc"
  }, description) : null) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/data/TaskRow.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function TaskRow({
  title,
  project,
  projectColor,
  time,
  late = false,
  priority,
  assignee,
  done = false,
  selected = false,
  layout = 'row',
  onToggle,
  onClick,
  onMore,
  className,
  style
}) {
  const stacked = layout === 'stacked';
  return /*#__PURE__*/React.createElement("div", {
    className: cx('ga-task', stacked && 'ga-task--stacked', done && 'ga-task--done', selected && 'ga-task--selected', onClick && 'ga-task--clickable', className),
    style: style,
    onClick: onClick
  }, /*#__PURE__*/React.createElement("span", {
    onClick: function (e) {
      e.stopPropagation();
    },
    style: {
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Checkbox, {
    shape: "round",
    checked: done,
    onChange: function () {
      onToggle && onToggle(!done);
    },
    ariaLabel: done ? 'Reabrir tarefa' : 'Concluir tarefa'
  })), /*#__PURE__*/React.createElement("div", {
    className: "ga-task__main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-task__title"
  }, title), /*#__PURE__*/React.createElement("span", {
    className: "ga-task__meta"
  }, project ? /*#__PURE__*/React.createElement(__ds_scope.ProjectTag, {
    name: project,
    color: projectColor,
    plain: stacked
  }) : null, time ? /*#__PURE__*/React.createElement("span", {
    className: cx('ga-task__time', late && 'ga-task__time--late')
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: stacked ? 'clock' : 'calendar',
    size: 12
  }), time) : null, priority ? /*#__PURE__*/React.createElement(__ds_scope.PriorityFlag, {
    level: priority,
    iconOnly: stacked
  }) : null)), /*#__PURE__*/React.createElement("div", {
    className: "ga-task__end"
  }, assignee ? /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: assignee.name || assignee,
    tone: assignee.tone,
    size: "sm"
  }) : null, onMore && !stacked ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "ellipsis",
    label: "Mais a\xE7\xF5es",
    size: "sm",
    onClick: function (e) {
      e.stopPropagation();
      onMore(e);
    }
  }) : null));
}
Object.assign(__ds_scope, { TaskRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/TaskRow.jsx", error: String((e && e.message) || e) }); }

// components/forms/FilterChip.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function FilterChip({
  label,
  icon,
  active = false,
  onClick,
  onRemove,
  dropdown = true,
  size = 'md',
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    role: "button",
    tabIndex: 0,
    onClick: onClick,
    className: cx('ga-chip', active && 'ga-chip--active', size === 'sm' && 'ga-chip--sm', className),
    style: style
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }) : null, /*#__PURE__*/React.createElement("span", null, label), active && onRemove ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ga-chip__x",
    "aria-label": 'Remover filtro ' + label,
    onClick: function (e) {
      e.stopPropagation();
      onRemove();
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 12,
    strokeWidth: 2.25
  })) : dropdown ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 13
  }) : null);
}
Object.assign(__ds_scope, { FilterChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FilterChip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Radio({
  name,
  value,
  checked,
  defaultChecked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('ga-check ga-radio', disabled && 'ga-check--disabled', className),
    style: style
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled
  }), /*#__PURE__*/React.createElement("span", {
    className: "ga-check__box"
  }), label || description ? /*#__PURE__*/React.createElement("span", {
    className: "ga-check__text"
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "ga-check__label"
  }, label) : null, description ? /*#__PURE__*/React.createElement("span", {
    className: "ga-check__desc"
  }, description) : null) : null);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function SearchField({
  placeholder = 'Buscar',
  shortcut = '⌘K',
  value,
  defaultValue,
  onChange,
  variant = 'default',
  size = 'md',
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('ga-input', size !== 'md' && 'ga-input--' + size, variant === 'sunken' && 'ga-input--sunken', className),
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-input__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 15
  })), /*#__PURE__*/React.createElement("input", {
    type: "search",
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    "aria-label": placeholder
  }), shortcut ? /*#__PURE__*/React.createElement(__ds_scope.Kbd, null, shortcut) : null);
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  block = false,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "group",
    className: cx('ga-seg', size === 'sm' && 'ga-seg--sm', block && 'ga-seg--block', className),
    style: style
  }, options.map(function (o) {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      type: "button",
      className: "ga-seg__item",
      "aria-pressed": value === v,
      onClick: function () {
        onChange && onChange(v);
      }
    }, o.icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: o.icon,
      size: 14
    }) : null, l);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Select({
  label,
  hint,
  icon,
  options = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  disabled = false,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('ga-field', className),
    style: style
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "ga-field__label"
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    className: cx('ga-input', size !== 'md' && 'ga-input--' + size, disabled && 'ga-input--disabled')
  }, icon ? /*#__PURE__*/React.createElement("span", {
    className: "ga-input__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  })) : null, /*#__PURE__*/React.createElement("select", {
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled
  }, options.map(function (o) {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })), /*#__PURE__*/React.createElement("span", {
    className: "ga-input__chev"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 15
  }))), hint ? /*#__PURE__*/React.createElement("span", {
    className: "ga-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  size = 'md',
  disabled = false,
  className,
  style,
  ariaLabel
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('ga-switch', size === 'sm' && 'ga-switch--sm', className),
    style: style
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    role: "switch",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled,
    "aria-label": ariaLabel || (typeof label === 'string' ? label : undefined)
  }), /*#__PURE__*/React.createElement("span", {
    className: "ga-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-switch__thumb"
  })), label ? /*#__PURE__*/React.createElement("span", null, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function TextField({
  label,
  hint,
  error,
  icon,
  trailing,
  size = 'md',
  variant = 'default',
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  onChange,
  onKeyDown,
  autoFocus,
  name,
  id,
  className,
  style,
  inputStyle
}) {
  const fid = id || (name ? 'f-' + name : undefined);
  return /*#__PURE__*/React.createElement("label", {
    className: cx('ga-field', className),
    style: style,
    htmlFor: fid
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "ga-field__label"
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    className: cx('ga-input', size !== 'md' && 'ga-input--' + size, variant === 'sunken' && 'ga-input--sunken', error && 'ga-input--error', disabled && 'ga-input--disabled')
  }, icon ? /*#__PURE__*/React.createElement("span", {
    className: "ga-input__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  })) : null, /*#__PURE__*/React.createElement("input", {
    id: fid,
    name: name,
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onKeyDown: onKeyDown,
    autoFocus: autoFocus,
    style: inputStyle
  }), trailing || null), error ? /*#__PURE__*/React.createElement("span", {
    className: "ga-field__hint ga-field__hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "ga-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function Breadcrumb({
  items = [],
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Breadcrumb",
    className: "ga-crumbs",
    style: style
  }, items.map(function (it, i) {
    const last = i === items.length - 1;
    const label = typeof it === 'string' ? it : it.label;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, last ? /*#__PURE__*/React.createElement("span", {
      className: "ga-crumbs__current",
      "aria-current": "page"
    }, label) : it.onClick ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: it.onClick
    }, label) : it.href ? /*#__PURE__*/React.createElement("a", {
      href: it.href
    }, label) : /*#__PURE__*/React.createElement("span", null, label), !last ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: 12
    }) : null);
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavItem.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function NavItem({
  icon,
  dot,
  label,
  count,
  countBadge = false,
  active = false,
  href,
  onClick,
  className,
  style
}) {
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, icon ? /*#__PURE__*/React.createElement("span", {
    className: "ga-nav__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 17
  })) : null, dot ? /*#__PURE__*/React.createElement("span", {
    className: "ga-nav__dot",
    style: {
      '--c': dot
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    className: "ga-nav__label"
  }, label), count != null ? /*#__PURE__*/React.createElement("span", {
    className: cx('ga-nav__count', (countBadge || active) && 'ga-nav__count--badge')
  }, count) : null);
  const cls = cx('ga-nav', active && 'ga-nav--active', className);
  if (href) return /*#__PURE__*/React.createElement("a", {
    className: cls,
    href: href,
    onClick: onClick,
    style: style,
    "aria-current": active ? 'page' : undefined,
    title: label
  }, inner);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: cls,
    onClick: onClick,
    style: style,
    "aria-current": active ? 'page' : undefined,
    title: label
  }, inner);
}
Object.assign(__ds_scope, { NavItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavItem.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavSection.jsx
try { (() => {
function NavSection({
  label,
  action,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ga-navsec",
    style: style
  }, label ? /*#__PURE__*/React.createElement("div", {
    className: "ga-navsec__head"
  }, /*#__PURE__*/React.createElement("span", null, label), action || null) : null, children);
}
Object.assign(__ds_scope, { NavSection });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavSection.jsx", error: String((e && e.message) || e) }); }

// components/navigation/PageHeader.jsx
try { (() => {
function PageHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "ga-phead",
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-phead__text"
  }, breadcrumb && breadcrumb.length ? /*#__PURE__*/React.createElement(__ds_scope.Breadcrumb, {
    items: breadcrumb
  }) : null, /*#__PURE__*/React.createElement("h1", {
    className: "ga-phead__title"
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    className: "ga-phead__sub"
  }, subtitle) : null), actions ? /*#__PURE__*/React.createElement("div", {
    className: "ga-phead__actions"
  }, actions) : null);
}
Object.assign(__ds_scope, { PageHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/PageHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Sidebar({
  brand = 'gestaoApp',
  collapsed = false,
  onToggle,
  header,
  footer,
  children,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: cx('ga-sidebar', collapsed && 'ga-sidebar--collapsed', className),
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-sidebar__brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-wordmark"
  }, brand), onToggle ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: collapsed ? 'chevron-right' : 'chevron-left',
    label: collapsed ? 'Expandir menu' : 'Recolher menu',
    size: "sm",
    onClick: onToggle
  }) : null), header || null, /*#__PURE__*/React.createElement("nav", {
    className: "ga-sidebar__body"
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    className: "ga-sidebar__foot"
  }, footer) : null);
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function TabBar({
  items = [],
  value,
  onChange,
  onAdd,
  addLabel = 'Nova tarefa',
  floating = false,
  style
}) {
  const half = Math.ceil(items.length / 2);
  function render(it) {
    const active = value === it.value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      className: cx('ga-tabbar__item', active && 'ga-tabbar__item--active'),
      "aria-current": active ? 'page' : undefined,
      onClick: function () {
        onChange && onChange(it.value);
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 20
    }), /*#__PURE__*/React.createElement("span", null, it.label));
  }
  return /*#__PURE__*/React.createElement("nav", {
    className: cx('ga-tabbar', floating && 'ga-tabbar--floating'),
    style: style
  }, items.slice(0, half).map(render), onAdd ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ga-tabbar__fab",
    "aria-label": addLabel,
    onClick: onAdd
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 22,
    strokeWidth: 2.25
  })) : null, items.slice(half).map(render));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  tabs = [],
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    className: "ga-tabs",
    style: style
  }, tabs.map(function (t) {
    const v = typeof t === 'string' ? t : t.value;
    const l = typeof t === 'string' ? t : t.label;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      type: "button",
      className: "ga-tab",
      "aria-selected": value === v,
      onClick: function () {
        onChange && onChange(v);
      }
    }, l, t.count != null ? /*#__PURE__*/React.createElement("span", {
      className: "ga-tab__count"
    }, t.count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/WorkspaceSwitcher.jsx
try { (() => {
function WorkspaceSwitcher({
  name,
  eyebrow = 'Workspace da equipe',
  initial,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ga-ws",
    onClick: onClick,
    style: style,
    title: name
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-ws__logo"
  }, initial || (name ? name[0] : 'W')), /*#__PURE__*/React.createElement("span", {
    className: "ga-ws__meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-ws__eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("span", {
    className: "ga-ws__name"
  }, name)), /*#__PURE__*/React.createElement("span", {
    className: "ga-ws__chev"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 15
  })));
}
Object.assign(__ds_scope, { WorkspaceSwitcher });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/WorkspaceSwitcher.jsx", error: String((e && e.message) || e) }); }

// components/overlays/BottomSheet.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function BottomSheet({
  open = true,
  title,
  closeLabel = 'Cancelar',
  onClose,
  contained = false,
  children,
  style
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: cx('ga-scrim', contained && 'ga-scrim--contained'),
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-label": typeof title === 'string' ? title : undefined,
    className: cx('ga-sheet', contained && 'ga-sheet--contained'),
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-sheet__grab"
  }), title || onClose ? /*#__PURE__*/React.createElement("div", {
    className: "ga-sheet__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-sheet__title"
  }, title), onClose ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ga-sheet__close",
    onClick: onClose
  }, closeLabel) : null) : null, /*#__PURE__*/React.createElement("div", {
    className: "ga-sheet__body"
  }, children)));
}
Object.assign(__ds_scope, { BottomSheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/BottomSheet.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Dialog.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Dialog({
  open = true,
  tone = 'default',
  icon,
  title,
  description,
  actions,
  onClose,
  contained = false,
  children,
  style
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: cx('ga-dialog-wrap', contained && 'ga-dialog-wrap--contained')
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-scrim",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    role: "alertdialog",
    "aria-modal": "true",
    className: cx('ga-dialog', tone === 'danger' && 'ga-dialog--danger'),
    style: style
  }, icon ? /*#__PURE__*/React.createElement("span", {
    className: "ga-dialog__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20
  })) : null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ga-dialog__title"
  }, title), description ? /*#__PURE__*/React.createElement("p", {
    className: "ga-dialog__desc"
  }, description) : null), children, actions ? /*#__PURE__*/React.createElement("div", {
    className: "ga-dialog__actions"
  }, actions) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Drawer.jsx
try { (() => {
function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function Drawer({
  open = true,
  mode = 'overlay',
  title,
  headerActions,
  footer,
  onClose,
  children,
  className,
  style
}) {
  if (!open) return null;
  const panel = /*#__PURE__*/React.createElement("aside", {
    role: "dialog",
    "aria-label": typeof title === 'string' ? title : undefined,
    className: cx('ga-drawer', mode === 'inline' && 'ga-drawer--inline', mode === 'contained' && 'ga-drawer--contained', className),
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-drawer__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ga-drawer__title"
  }, title), headerActions || null, onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Fechar",
    size: "sm",
    onClick: onClose
  }) : null), /*#__PURE__*/React.createElement("div", {
    className: "ga-drawer__body"
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    className: "ga-drawer__foot"
  }, footer) : null);
  if (mode === 'inline') return panel;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: cx('ga-scrim', mode === 'contained' && 'ga-scrim--contained'),
    onClick: onClose
  }), panel);
}
Object.assign(__ds_scope, { Drawer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Drawer.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Toast.jsx
try { (() => {
const ICON = {
  success: 'check',
  info: 'bell',
  danger: 'triangle-alert',
  brand: 'bell'
};
function Toast({
  tone = 'success',
  title,
  description,
  icon,
  action,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: 'ga-toast ga-toast--' + tone,
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-toast__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || ICON[tone],
    size: 16,
    strokeWidth: 2.25
  })), /*#__PURE__*/React.createElement("span", {
    className: "ga-toast__text"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-toast__title"
  }, title), description ? /*#__PURE__*/React.createElement("span", {
    className: "ga-toast__desc"
  }, description) : null), action || null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Toast.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/App.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ROUTES = ['dashboard', 'tasks', 'projects', 'team', 'settings'];
function App() {
  const data = window.GA_DATA;
  const isMobile = useMedia('(max-width: 767px)');
  const wide = useMedia('(min-width: 1280px)');
  const narrow = useMedia('(max-width: 1023px)');
  const initial = (location.hash || '').replace('#', '');
  const [route, setRoute] = React.useState(ROUTES.indexOf(initial) >= 0 ? initial : 'dashboard');
  const [tasks, setTasks] = React.useState(data.tasks);
  const [sel, setSel] = React.useState(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [userCollapsed, setUserCollapsed] = React.useState(false);
  const [projectFilter, setProjectFilter] = React.useState(null);
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  const go = (r, opts) => {
    setRoute(r);
    setSel(null);
    setProjectFilter(opts && opts.project ? opts.project : null);
    try {
      history.replaceState(null, '', '#' + r);
    } catch (e) {}
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };
  const toggle = id => {
    const t = tasks.find(x => x.id === id);
    const done = t.status !== 'done';
    setTasks(tasks.map(x => x.id === id ? Object.assign({}, x, {
      status: done ? 'done' : 'todo'
    }) : x));
    if (done) setToast({
      tone: 'success',
      title: t.title,
      description: 'Concluída agora · +1 na meta semanal'
    });
  };
  const sub = (id, i) => setTasks(tasks.map(x => x.id === id ? Object.assign({}, x, {
    subtasks: x.subtasks.map((s, j) => j === i ? {
      t: s.t,
      done: !s.done
    } : s)
  }) : x));
  const del = id => {
    setTasks(tasks.filter(x => x.id !== id));
    setSel(null);
    setToast({
      tone: 'danger',
      icon: 'trash-2',
      title: 'Tarefa excluída',
      description: 'Você pode desfazer em até 10 s.'
    });
  };
  const create = f => {
    const id = 't' + Date.now();
    const when = {
      today: '18:00',
      tomorrow: 'qui, 9 out',
      week: 'sex, 10 out'
    }[f.due];
    const dueLabel = {
      today: 'Hoje · 18:00',
      tomorrow: 'Amanhã · qui, 9 out',
      week: 'sex, 10 out'
    }[f.due];
    setTasks([{
      id,
      title: f.title,
      project: f.project,
      due: f.due,
      when,
      dueLabel,
      priority: f.priority,
      assignee: data.user.id,
      status: 'todo',
      desc: 'Sem descrição.',
      subtasks: []
    }].concat(tasks));
    setNewOpen(false);
    setToast({
      tone: 'brand',
      icon: 'plus',
      title: 'Tarefa criada',
      description: f.title
    });
  };
  const copy = () => setToast({
    tone: 'info',
    icon: 'link',
    title: 'Link copiado',
    description: 'Cole em qualquer conversa.'
  });
  const selTask = sel ? tasks.find(t => t.id === sel) : null;
  const drawerInline = !isMobile && wide && selTask;
  const compactRows = isMobile || drawerInline && route === 'dashboard';
  const common = {
    data,
    tasks,
    isMobile,
    compactRows,
    go,
    onOpen: setSel,
    onToggle: toggle,
    onNew: () => setNewOpen(true),
    selectedId: sel
  };
  let screen;
  if (route === 'tasks') screen = /*#__PURE__*/React.createElement(TasksScreen, _extends({}, common, {
    projectFilter: projectFilter,
    setProjectFilter: setProjectFilter
  }));else if (route === 'projects') screen = /*#__PURE__*/React.createElement(ProjectsScreen, _extends({}, common, {
    onNewProject: () => setToast({
      tone: 'info',
      icon: 'folder-plus',
      title: 'Novo projeto',
      description: 'Modelos em breve neste protótipo.'
    })
  }));else if (route === 'team') screen = /*#__PURE__*/React.createElement(TeamScreen, _extends({}, common, {
    onInvite: () => setToast({
      tone: 'brand',
      icon: 'mail',
      title: 'Convite enviado',
      description: 'bia@estudionorte.com.br'
    })
  }));else if (route === 'settings') screen = /*#__PURE__*/React.createElement(SettingsScreen, _extends({}, common, {
    onSaved: () => setToast({
      tone: 'success',
      title: 'Alterações salvas'
    }),
    onDeleteAccount: () => setConfirm(true)
  }));else screen = /*#__PURE__*/React.createElement(DashboardScreen, common);
  const drawerProps = {
    task: selTask,
    data,
    onClose: () => setSel(null),
    onToggle: toggle,
    onDelete: del,
    onSub: sub,
    onCopy: copy
  };
  return /*#__PURE__*/React.createElement("div", {
    className: 'app' + (drawerInline ? ' has-drawer' : '')
  }, isMobile ? null : /*#__PURE__*/React.createElement(AppSidebar, {
    route: route,
    go: go,
    data: data,
    tasks: tasks,
    collapsed: userCollapsed || narrow,
    onToggle: () => setUserCollapsed(!userCollapsed)
  }), /*#__PURE__*/React.createElement("div", {
    className: "app__main"
  }, isMobile ? /*#__PURE__*/React.createElement(MobileTopBar, {
    user: data.user,
    onAvatar: () => go('settings'),
    onBell: () => setToast({
      tone: 'info',
      title: 'Reunião de equipe',
      description: 'em 15 min · Google Meet'
    })
  }) : null, /*#__PURE__*/React.createElement("div", {
    className: "app__body"
  }, /*#__PURE__*/React.createElement("main", {
    className: "app__scroll",
    ref: scrollRef,
    "data-screen-label": route
  }, screen), drawerInline ? /*#__PURE__*/React.createElement("div", {
    className: "app__drawer"
  }, /*#__PURE__*/React.createElement(TaskDrawer, _extends({}, drawerProps, {
    mode: "inline"
  }))) : null), isMobile ? /*#__PURE__*/React.createElement(MobileTabBar, {
    route: route,
    go: go,
    onAdd: () => setNewOpen(true)
  }) : null), !isMobile && !wide && selTask ? /*#__PURE__*/React.createElement(TaskDrawer, _extends({}, drawerProps, {
    mode: "overlay"
  })) : null, isMobile && selTask ? /*#__PURE__*/React.createElement(MobileTaskDetail, drawerProps) : null, newOpen ? isMobile ? /*#__PURE__*/React.createElement(GA.BottomSheet, {
    title: "Nova tarefa",
    onClose: () => setNewOpen(false)
  }, /*#__PURE__*/React.createElement(NewTaskForm, {
    data: data,
    isMobile: true,
    onSubmit: create,
    onCancel: () => setNewOpen(false)
  })) : /*#__PURE__*/React.createElement(GA.Dialog, {
    icon: "square-check",
    title: "Nova tarefa",
    description: "Adicione ao painel em segundos.",
    onClose: () => setNewOpen(false)
  }, /*#__PURE__*/React.createElement(NewTaskForm, {
    data: data,
    onSubmit: create,
    onCancel: () => setNewOpen(false)
  })) : null, confirm ? /*#__PURE__*/React.createElement(GA.Dialog, {
    tone: "danger",
    icon: "trash-2",
    title: "Excluir conta?",
    description: "Isso remove permanentemente sua conta e todas as suas tarefas. Esta a\xE7\xE3o n\xE3o pode ser desfeita.",
    onClose: () => setConfirm(false),
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(GA.Button, {
      variant: "ghost",
      onClick: () => setConfirm(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(GA.Button, {
      variant: "danger",
      icon: "trash-2",
      onClick: () => setConfirm(false)
    }, "Excluir conta"))
  }) : null, toast ? /*#__PURE__*/React.createElement("div", {
    className: "toastwrap",
    key: toast.title + toast.description
  }, /*#__PURE__*/React.createElement(GA.Toast, {
    tone: toast.tone,
    icon: toast.icon,
    title: toast.title,
    description: toast.description,
    action: /*#__PURE__*/React.createElement(GA.IconButton, {
      icon: "x",
      label: "Fechar",
      size: "sm",
      onClick: () => setToast(null)
    })
  })) : null);
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/Dashboard.jsx
try { (() => {
function DashboardScreen({
  data,
  tasks,
  isMobile,
  compactRows,
  go,
  onOpen,
  onToggle,
  onNew,
  selectedId
}) {
  const {
    PageHeader,
    Button,
    IconButton,
    StatCard,
    GoalCard,
    Card,
    TaskRow,
    BarChart,
    Badge,
    ProgressBar,
    Avatar
  } = GA;
  const today = tasks.filter(t => t.due === 'today' || t.due === 'late');
  const doneToday = today.filter(t => t.status === 'done').length;
  const dueToday = tasks.filter(t => t.due === 'today' && t.status !== 'done').length;
  const late = tasks.filter(t => t.due === 'late' && t.status !== 'done').length;
  const doneAll = tasks.filter(t => t.status === 'done').length;
  const inProg = tasks.filter(t => t.status === 'progress' || t.status === 'review');
  const goalDone = data.goalBase + doneAll;
  const week = data.week.map(d => d.highlight ? Object.assign({}, d, {
    value: 2 + doneAll
  }) : d);
  const goal = /*#__PURE__*/React.createElement(GoalCard, {
    key: "goal",
    done: goalDone,
    total: data.goalTotal
  });
  const stats = [/*#__PURE__*/React.createElement(StatCard, {
    key: "due",
    icon: "calendar",
    label: "Vencem hoje",
    value: String(dueToday),
    delta: late ? late + ' atrasada' : 'nenhuma atrasada',
    deltaTrend: late ? 'down' : undefined,
    onMore: isMobile ? undefined : () => go('tasks'),
    compact: isMobile
  }), /*#__PURE__*/React.createElement(StatCard, {
    key: "done",
    icon: "square-check",
    tone: "success",
    label: "Conclu\xEDdas na semana",
    value: String(goalDone),
    delta: isMobile ? '18%' : '18% vs semana passada',
    deltaTrend: "up",
    compact: isMobile
  }), /*#__PURE__*/React.createElement(StatCard, {
    key: "prog",
    icon: "zap",
    tone: "warning",
    label: "Em andamento",
    value: String(inProg.length),
    caption: 'em ' + new Set(inProg.map(t => t.project)).size + ' projetos',
    compact: isMobile
  })];
  const loadRows = data.members.slice(0, 5).map(m => {
    const hot = m.load > 90;
    return /*#__PURE__*/React.createElement("div", {
      className: "load__row",
      key: m.id
    }, /*#__PURE__*/React.createElement("span", {
      className: "load__who"
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: m.name,
      tone: m.tone,
      size: "sm"
    }), /*#__PURE__*/React.createElement("span", null, m.name)), /*#__PURE__*/React.createElement(ProgressBar, {
      value: m.load,
      size: "sm",
      tone: hot ? 'danger' : m.load > 75 ? 'warning' : 'brand',
      label: 'Carga de ' + m.name
    }), /*#__PURE__*/React.createElement("span", {
      className: 'load__pct' + (hot ? ' load__pct--hot' : '')
    }, m.load, "%"));
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    breadcrumb: isMobile ? null : [data.workspace, 'Painel'],
    title: 'Bom dia, ' + data.user.name.split(' ')[0],
    subtitle: data.today + ' · ' + dueToday + ' tarefas vencem hoje e 1 reunião.',
    actions: isMobile ? null : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
      icon: "bell",
      label: "Notifica\xE7\xF5es",
      variant: "outline",
      shape: "circle",
      dot: true
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "folder",
      onClick: () => go('projects')
    }, "Criar projeto"), /*#__PURE__*/React.createElement(Button, {
      icon: "plus",
      onClick: onNew
    }, "Nova tarefa"))
  }), /*#__PURE__*/React.createElement("div", {
    className: "stats"
  }, isMobile ? [goal].concat(stats) : stats.concat([goal])), /*#__PURE__*/React.createElement("div", {
    className: "dash"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stack16"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Tarefas de hoje",
    subtitle: doneToday + ' de ' + today.length + ' concluídas',
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      iconRight: "arrow-right",
      onClick: () => go('tasks')
    }, "Ver todas")
  }, /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, today.map(t => {
    const p = data.projById[t.project];
    const a = data.memById[t.assignee];
    return /*#__PURE__*/React.createElement(TaskRow, {
      key: t.id,
      layout: compactRows ? 'stacked' : 'row',
      title: t.title,
      project: p.name,
      projectColor: p.color,
      time: t.when,
      late: t.due === 'late' && t.status !== 'done',
      priority: t.priority,
      assignee: {
        name: a.name,
        tone: a.tone
      },
      done: t.status === 'done',
      selected: selectedId === t.id,
      onToggle: () => onToggle(t.id),
      onClick: () => onOpen(t.id),
      onMore: () => onOpen(t.id)
    });
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "Carga da equipe",
    subtitle: "Ocupa\xE7\xE3o desta semana",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => go('team')
    }, "Ver equipe")
  }, /*#__PURE__*/React.createElement("div", {
    className: "load"
  }, loadRows))), /*#__PURE__*/React.createElement("div", {
    className: "stack16"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Progresso semanal",
    subtitle: "Tarefas conclu\xEDdas por dia",
    actions: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      size: "sm"
    }, "+18%")
  }, /*#__PURE__*/React.createElement(BarChart, {
    data: week,
    height: isMobile ? 120 : 150
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Projetos ativos",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => go('projects')
    }, "Ver todos")
  }, /*#__PURE__*/React.createElement("div", {
    className: "plist"
  }, data.projects.filter(p => p.health !== 'done').map(p => /*#__PURE__*/React.createElement("div", {
    className: "plist__row",
    key: p.id,
    onClick: () => go('tasks', {
      project: p.id
    })
  }, /*#__PURE__*/React.createElement("span", {
    className: "plist__name"
  }, /*#__PURE__*/React.createElement("span", {
    className: "plist__sq",
    style: {
      background: p.color
    }
  }), /*#__PURE__*/React.createElement("span", null, p.name)), /*#__PURE__*/React.createElement("span", {
    className: "plist__pct"
  }, p.progress, "%"), /*#__PURE__*/React.createElement(ProgressBar, {
    value: p.progress,
    color: p.color,
    size: "xs"
  }))))))));
}
window.DashboardScreen = DashboardScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/Projects.jsx
try { (() => {
function ProjectsScreen({
  data,
  tasks,
  isMobile,
  go,
  onNewProject
}) {
  const {
    PageHeader,
    Button,
    Tabs,
    ProjectCard,
    Icon
  } = GA;
  const [tab, setTab] = React.useState('all');
  const active = data.projects.filter(p => p.health !== 'done');
  const done = data.projects.filter(p => p.health === 'done');
  const list = tab === 'all' ? data.projects : tab === 'active' ? active : tab === 'done' ? done : [];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    breadcrumb: isMobile ? null : [data.workspace, 'Projetos'],
    title: "Projetos",
    subtitle: active.length + ' ativos · ' + done.length + ' concluído',
    actions: /*#__PURE__*/React.createElement(Button, {
      icon: "plus",
      size: isMobile ? 'sm' : 'md',
      onClick: onNewProject
    }, "Novo projeto")
  }), /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: 'all',
      label: 'Todos',
      count: data.projects.length
    }, {
      value: 'active',
      label: 'Ativos',
      count: active.length
    }, {
      value: 'done',
      label: 'Concluídos',
      count: done.length
    }, {
      value: 'archived',
      label: 'Arquivados'
    }]
  }), list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "inbox",
    size: 28
  }), /*#__PURE__*/React.createElement("div", {
    className: "empty__t"
  }, "Nenhum projeto arquivado"), "Projetos arquivados aparecem aqui e podem ser restaurados.") : /*#__PURE__*/React.createElement("div", {
    className: "pgrid"
  }, list.map(p => /*#__PURE__*/React.createElement(ProjectCard, {
    key: p.id,
    name: p.name,
    description: p.desc,
    icon: p.icon,
    color: p.color,
    health: p.health,
    progress: p.progress,
    tasksDone: p.done,
    tasksTotal: p.total,
    due: p.due,
    members: p.members.map(id => ({
      name: data.memById[id].name,
      tone: data.memById[id].tone
    })),
    onClick: () => go('tasks', {
      project: p.id
    }),
    onMore: () => {}
  })), tab !== 'done' ? /*#__PURE__*/React.createElement("div", {
    className: "ga-card ga-card--dashed ga-card--interactive newp",
    onClick: onNewProject,
    role: "button",
    tabIndex: 0
  }, /*#__PURE__*/React.createElement("span", {
    className: "newp__i"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "folder-plus",
    size: 20
  })), /*#__PURE__*/React.createElement("span", {
    className: "newp__t"
  }, "Criar projeto"), /*#__PURE__*/React.createElement("span", {
    className: "newp__d"
  }, "Comece do zero ou a partir de um modelo")) : null));
}
window.ProjectsScreen = ProjectsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/Projects.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/Settings.jsx
try { (() => {
function SettingsScreen({
  data,
  isMobile,
  onSaved,
  onDeleteAccount
}) {
  const {
    PageHeader,
    Tabs,
    Card,
    TextField,
    Select,
    Switch,
    Radio,
    Button,
    Avatar
  } = GA;
  const [tab, setTab] = React.useState('profile');
  const u = data.user;
  const notif = [['Lembretes de tarefas', 'Aviso 30 min antes de cada prazo', true], ['Menções e comentários', 'Quando alguém marcar você', true], ['Atualizações de projeto', 'Mudanças de status nos seus projetos', false], ['Notificações no celular', 'Push no app gestaoApp', true]];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    breadcrumb: isMobile ? null : [data.workspace, 'Configurações'],
    title: "Configura\xE7\xF5es",
    subtitle: "Gerencie seu perfil, notifica\xE7\xF5es e o workspace."
  }), /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: 'profile',
      label: 'Perfil'
    }, {
      value: 'notif',
      label: 'Notificações'
    }, {
      value: 'ws',
      label: 'Workspace'
    }]
  }), tab === 'profile' ? /*#__PURE__*/React.createElement("div", {
    className: "set"
  }, /*#__PURE__*/React.createElement("section", {
    className: "set__sec"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "set__h"
  }, "Perfil"), /*#__PURE__*/React.createElement("div", {
    className: "set__d"
  }, "Como voc\xEA aparece para a equipe.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "set__form"
  }, /*#__PURE__*/React.createElement("div", {
    className: "set__photo"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    tone: u.tone,
    size: 56
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "upload"
  }, "Alterar foto"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Remover")), /*#__PURE__*/React.createElement("div", {
    className: "set__grid"
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Nome completo",
    defaultValue: u.name
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "E-mail",
    icon: "mail",
    defaultValue: u.email
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Cargo",
    defaultValue: "Diretora de cria\xE7\xE3o"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Fuso hor\xE1rio",
    icon: "globe",
    options: ['América/São Paulo (GMT-3)', 'América/Manaus (GMT-4)', 'Europa/Lisboa (GMT+1)']
  })), /*#__PURE__*/React.createElement("div", {
    className: "set__actions"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
    onClick: onSaved
  }, "Salvar altera\xE7\xF5es"))))), /*#__PURE__*/React.createElement("section", {
    className: "set__sec"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "set__h"
  }, "Zona de perigo"), /*#__PURE__*/React.createElement("div", {
    className: "set__d"
  }, "A\xE7\xF5es permanentes na sua conta.")), /*#__PURE__*/React.createElement(Card, {
    className: "danger"
  }, /*#__PURE__*/React.createElement("div", {
    className: "set__row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "set__rt"
  }, "Excluir conta"), /*#__PURE__*/React.createElement("div", {
    className: "set__rd"
  }, "Remove sua conta e todas as suas tarefas.")), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm",
    icon: "trash-2",
    onClick: onDeleteAccount
  }, "Excluir"))))) : tab === 'notif' ? /*#__PURE__*/React.createElement("div", {
    className: "set"
  }, /*#__PURE__*/React.createElement("section", {
    className: "set__sec"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "set__h"
  }, "Notifica\xE7\xF5es"), /*#__PURE__*/React.createElement("div", {
    className: "set__d"
  }, "Escolha o que merece sua aten\xE7\xE3o.")), /*#__PURE__*/React.createElement(Card, null, notif.map(n => /*#__PURE__*/React.createElement("div", {
    className: "set__row",
    key: n[0]
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "set__rt"
  }, n[0]), /*#__PURE__*/React.createElement("div", {
    className: "set__rd"
  }, n[1])), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: n[2],
    ariaLabel: n[0]
  }))))), /*#__PURE__*/React.createElement("section", {
    className: "set__sec"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "set__h"
  }, "Resumo por e-mail"), /*#__PURE__*/React.createElement("div", {
    className: "set__d"
  }, "Um panorama das suas tarefas.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "set__form"
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "dig",
    defaultChecked: true,
    label: "Di\xE1rio",
    description: "Toda manh\xE3, \xE0s 08:00"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "dig",
    label: "Semanal",
    description: "Segunda-feira, \xE0s 08:00"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "dig",
    label: "Nunca"
  }))))) : /*#__PURE__*/React.createElement("div", {
    className: "set"
  }, /*#__PURE__*/React.createElement("section", {
    className: "set__sec"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "set__h"
  }, "Workspace"), /*#__PURE__*/React.createElement("div", {
    className: "set__d"
  }, "Nome e padr\xF5es da equipe.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "set__form"
  }, /*#__PURE__*/React.createElement("div", {
    className: "set__grid"
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Nome do workspace",
    defaultValue: data.workspace
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Endere\xE7o",
    defaultValue: "estudionorte",
    trailing: /*#__PURE__*/React.createElement("span", {
      className: "ga-field__hint"
    }, ".gestaoapp.com")
  })), /*#__PURE__*/React.createElement("div", {
    className: "set__grid"
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Idioma",
    options: ['Português (Brasil)', 'English', 'Español']
  }), /*#__PURE__*/React.createElement(Select, {
    label: "In\xEDcio da semana",
    options: ['Segunda-feira', 'Domingo']
  })), /*#__PURE__*/React.createElement("div", {
    className: "set__actions"
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onSaved
  }, "Salvar")))))));
}
window.SettingsScreen = SettingsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/Settings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/Shell.jsx
try { (() => {
const GA = window.GestaoAppDesignSystem_8ff7d0;
function useMedia(q) {
  const [m, setM] = React.useState(() => window.matchMedia(q).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const h = e => setM(e.matches);
    mq.addEventListener('change', h);
    setM(mq.matches);
    return () => mq.removeEventListener('change', h);
  }, [q]);
  return m;
}
const NAV_ITEMS = [{
  id: 'dashboard',
  label: 'Painel',
  icon: 'layout-grid'
}, {
  id: 'tasks',
  label: 'Tarefas',
  icon: 'square-check'
}, {
  id: 'projects',
  label: 'Projetos',
  icon: 'folder'
}, {
  id: 'team',
  label: 'Equipe',
  icon: 'users'
}, {
  id: 'settings',
  label: 'Configurações',
  icon: 'settings'
}];
const TAB_ITEMS = [{
  value: 'dashboard',
  label: 'Início',
  icon: 'layout-grid'
}, {
  value: 'tasks',
  label: 'Tarefas',
  icon: 'square-check'
}, {
  value: 'projects',
  label: 'Projetos',
  icon: 'folder'
}, {
  value: 'team',
  label: 'Equipe',
  icon: 'users'
}];
function AppSidebar({
  route,
  go,
  collapsed,
  onToggle,
  data,
  tasks
}) {
  const {
    Sidebar,
    NavSection,
    NavItem,
    WorkspaceSwitcher,
    SearchField,
    IconButton,
    Avatar,
    Button
  } = GA;
  const u = data.user;
  const open = tasks.filter(t => t.status !== 'done');
  return /*#__PURE__*/React.createElement(Sidebar, {
    collapsed: collapsed,
    onToggle: onToggle,
    header: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(WorkspaceSwitcher, {
      name: data.workspace
    }), collapsed ? null : /*#__PURE__*/React.createElement(SearchField, {
      size: "sm",
      placeholder: "Buscar"
    })),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, collapsed ? null : /*#__PURE__*/React.createElement("div", {
      className: "promo"
    }, /*#__PURE__*/React.createElement("div", {
      className: "promo__t"
    }, "Upgrade para o Pro"), /*#__PURE__*/React.createElement("div", {
      className: "promo__d"
    }, "Projetos ilimitados, automa\xE7\xF5es e relat\xF3rios."), /*#__PURE__*/React.createElement(Button, {
      variant: "accent",
      size: "sm",
      block: true
    }, "Fazer upgrade")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "userchip",
      onClick: () => go('settings'),
      title: u.name
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      tone: u.tone,
      size: "lg",
      status: "online"
    }), collapsed ? null : /*#__PURE__*/React.createElement("span", {
      className: "userchip__meta"
    }, /*#__PURE__*/React.createElement("span", {
      className: "userchip__name"
    }, u.name), /*#__PURE__*/React.createElement("span", {
      className: "userchip__mail"
    }, u.email))))
  }, /*#__PURE__*/React.createElement(NavSection, {
    label: "Menu principal"
  }, NAV_ITEMS.map(n => /*#__PURE__*/React.createElement(NavItem, {
    key: n.id,
    icon: n.icon,
    label: n.label,
    active: route === n.id,
    count: n.id === 'tasks' ? open.length : undefined,
    onClick: () => go(n.id)
  }))), /*#__PURE__*/React.createElement(NavSection, {
    label: "Projetos",
    action: collapsed ? null : /*#__PURE__*/React.createElement(IconButton, {
      icon: "plus",
      label: "Novo projeto",
      size: "sm",
      onClick: () => go('projects')
    })
  }, data.projects.filter(p => p.health !== 'done').map(p => /*#__PURE__*/React.createElement(NavItem, {
    key: p.id,
    dot: p.color,
    label: p.name,
    count: open.filter(t => t.project === p.id).length,
    onClick: () => go('tasks', {
      project: p.id
    })
  }))));
}
function MobileTopBar({
  user,
  onBell,
  onAvatar
}) {
  const {
    IconButton,
    Avatar
  } = GA;
  return /*#__PURE__*/React.createElement("header", {
    className: "mtop"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-wordmark"
  }, "gestaoApp"), /*#__PURE__*/React.createElement("div", {
    className: "mtop__end"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "Notifica\xE7\xF5es",
    variant: "outline",
    shape: "circle",
    dot: true,
    onClick: onBell
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "mtop__av",
    onClick: onAvatar,
    "aria-label": "Perfil e configura\xE7\xF5es"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: user.name,
    tone: user.tone,
    size: 36
  }))));
}
function MobileTabBar({
  route,
  go,
  onAdd
}) {
  return /*#__PURE__*/React.createElement(GA.TabBar, {
    items: TAB_ITEMS,
    value: route === 'settings' ? null : route,
    onChange: go,
    onAdd: onAdd
  });
}
Object.assign(window, {
  GA,
  useMedia,
  AppSidebar,
  MobileTopBar,
  MobileTabBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/TaskDetail.jsx
try { (() => {
function TaskDetailBody({
  task,
  data,
  onSub
}) {
  const {
    ProjectTag,
    PriorityFlag,
    Avatar,
    Checkbox,
    ProgressBar,
    Icon,
    TextField
  } = GA;
  const p = data.projById[task.project];
  const a = data.memById[task.assignee];
  const subs = task.subtasks || [];
  const sd = subs.filter(s => s.done).length;
  const late = task.due === 'late' && task.status !== 'done';
  return /*#__PURE__*/React.createElement("div", {
    className: "td"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "td__title"
  }, task.title), /*#__PURE__*/React.createElement("div", {
    className: "td__meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "td__k"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "folder",
    size: 14
  }), "Projeto"), /*#__PURE__*/React.createElement("span", {
    className: "td__v"
  }, /*#__PURE__*/React.createElement(ProjectTag, {
    name: p.name,
    color: p.color
  })), /*#__PURE__*/React.createElement("span", {
    className: "td__k"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 14
  }), "Prazo"), /*#__PURE__*/React.createElement("span", {
    className: 'td__v' + (late ? ' td__late' : '')
  }, task.dueLabel, late ? ' · atrasada' : ''), /*#__PURE__*/React.createElement("span", {
    className: "td__k"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flag",
    size: 14
  }), "Prioridade"), /*#__PURE__*/React.createElement("span", {
    className: "td__v"
  }, /*#__PURE__*/React.createElement(PriorityFlag, {
    level: task.priority
  })), /*#__PURE__*/React.createElement("span", {
    className: "td__k"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 14
  }), "Respons\xE1vel"), /*#__PURE__*/React.createElement("span", {
    className: "td__v"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: a.name,
    tone: a.tone,
    size: "sm"
  }), a.name)), /*#__PURE__*/React.createElement("div", {
    className: "td__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "td__h"
  }, "Descri\xE7\xE3o"), /*#__PURE__*/React.createElement("p", {
    className: "td__p"
  }, task.desc)), subs.length ? /*#__PURE__*/React.createElement("div", {
    className: "td__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "td__h"
  }, "Subtarefas", /*#__PURE__*/React.createElement("span", null, sd, "/", subs.length)), /*#__PURE__*/React.createElement(ProgressBar, {
    value: sd,
    max: subs.length,
    size: "xs",
    tone: sd === subs.length ? 'success' : 'brand',
    label: "Subtarefas"
  }), /*#__PURE__*/React.createElement("div", {
    className: "td__subs"
  }, subs.map((s, i) => /*#__PURE__*/React.createElement(Checkbox, {
    key: i,
    shape: "round",
    strike: true,
    checked: s.done,
    onChange: () => onSub(task.id, i),
    label: s.t
  })))) : null, /*#__PURE__*/React.createElement("div", {
    className: "td__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "td__h"
  }, "Atividade"), /*#__PURE__*/React.createElement("div", {
    className: "td__act"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Jo\xE3o Kim",
    tone: "zest",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "td__actt"
  }, /*#__PURE__*/React.createElement("b", null, "Jo\xE3o Kim"), " comentou: \u201CPode seguir com a vers\xE3o B.\u201D"), /*#__PURE__*/React.createElement("div", {
    className: "td__acttime"
  }, "h\xE1 25 min"))), /*#__PURE__*/React.createElement("div", {
    className: "td__act"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: a.name,
    tone: a.tone,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "td__actt"
  }, /*#__PURE__*/React.createElement("b", null, a.name), " mudou o status para Em andamento"), /*#__PURE__*/React.createElement("div", {
    className: "td__acttime"
  }, "hoje, 08:40"))), /*#__PURE__*/React.createElement("div", {
    className: "td__comment"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: data.user.name,
    tone: data.user.tone,
    size: "sm"
  }), /*#__PURE__*/React.createElement(TextField, {
    variant: "sunken",
    size: "sm",
    placeholder: "Escreva um coment\xE1rio\u2026",
    style: {
      flex: 1
    }
  }))));
}
function TaskActions({
  task,
  onToggle,
  onDelete,
  block
}) {
  const {
    Button,
    IconButton
  } = GA;
  const done = task.status === 'done';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
    variant: done ? 'secondary' : 'accent',
    icon: done ? 'repeat' : 'check',
    size: block ? 'lg' : 'sm',
    block: block,
    onClick: () => onToggle(task.id)
  }, done ? 'Reabrir' : 'Concluir'), /*#__PURE__*/React.createElement(IconButton, {
    icon: "pencil",
    label: "Editar",
    variant: "outline",
    shape: "circle",
    size: block ? 'lg' : 'md'
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "trash-2",
    label: "Excluir",
    variant: "danger",
    shape: "circle",
    size: block ? 'lg' : 'md',
    onClick: () => onDelete(task.id)
  }));
}
function TaskDrawer({
  task,
  data,
  mode,
  onClose,
  onToggle,
  onDelete,
  onSub,
  onCopy
}) {
  const {
    Drawer,
    StatusBadge,
    IconButton
  } = GA;
  return /*#__PURE__*/React.createElement(Drawer, {
    key: task.id,
    mode: mode,
    onClose: onClose,
    title: /*#__PURE__*/React.createElement(StatusBadge, {
      status: task.status
    }),
    headerActions: /*#__PURE__*/React.createElement(IconButton, {
      icon: "link",
      label: "Copiar link",
      size: "sm",
      onClick: onCopy
    }),
    footer: /*#__PURE__*/React.createElement(TaskActions, {
      task: task,
      onToggle: onToggle,
      onDelete: onDelete
    })
  }, /*#__PURE__*/React.createElement(TaskDetailBody, {
    task: task,
    data: data,
    onSub: onSub
  }));
}
function MobileTaskDetail({
  task,
  data,
  onClose,
  onToggle,
  onDelete,
  onSub,
  onCopy
}) {
  const {
    IconButton,
    StatusBadge
  } = GA;
  return /*#__PURE__*/React.createElement("div", {
    className: "mdetail",
    role: "dialog",
    "aria-label": task.title
  }, /*#__PURE__*/React.createElement("div", {
    className: "mdetail__top"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "chevron-left",
    label: "Voltar",
    size: "lg",
    onClick: onClose
  }), /*#__PURE__*/React.createElement(StatusBadge, {
    status: task.status
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "link",
    label: "Copiar link",
    size: "lg",
    onClick: onCopy
  })), /*#__PURE__*/React.createElement("div", {
    className: "mdetail__body"
  }, /*#__PURE__*/React.createElement(TaskDetailBody, {
    task: task,
    data: data,
    onSub: onSub
  })), /*#__PURE__*/React.createElement("div", {
    className: "mdetail__foot"
  }, /*#__PURE__*/React.createElement(TaskActions, {
    task: task,
    onToggle: onToggle,
    onDelete: onDelete,
    block: true
  })));
}
function NewTaskForm({
  data,
  onSubmit,
  onCancel,
  isMobile
}) {
  const {
    TextField,
    Select,
    SegmentedControl,
    Button
  } = GA;
  const [title, setTitle] = React.useState('');
  const [project, setProject] = React.useState('p1');
  const [due, setDue] = React.useState('today');
  const [prio, setPrio] = React.useState('medium');
  const ok = title.trim().length > 0;
  const submit = () => {
    if (ok) onSubmit({
      title: title.trim(),
      project,
      due,
      priority: prio
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "nt"
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "T\xEDtulo",
    autoFocus: true,
    size: isMobile ? 'lg' : 'md',
    placeholder: "Ex.: Enviar v\xEDdeo final",
    value: title,
    onChange: e => setTitle(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') submit();
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "nt__grid"
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Projeto",
    value: project,
    onChange: e => setProject(e.target.value),
    options: data.projects.filter(p => p.health !== 'done').map(p => ({
      value: p.id,
      label: p.name
    }))
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Prazo",
    value: due,
    onChange: e => setDue(e.target.value),
    options: [{
      value: 'today',
      label: 'Hoje'
    }, {
      value: 'tomorrow',
      label: 'Amanhã'
    }, {
      value: 'week',
      label: 'Esta semana'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    className: "nt__prio"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ga-field__label"
  }, "Prioridade"), /*#__PURE__*/React.createElement(SegmentedControl, {
    block: true,
    value: prio,
    onChange: setPrio,
    options: [{
      value: 'high',
      label: 'Alta'
    }, {
      value: 'medium',
      label: 'Média'
    }, {
      value: 'low',
      label: 'Baixa'
    }]
  })), isMobile ? /*#__PURE__*/React.createElement(Button, {
    block: true,
    size: "lg",
    icon: "plus",
    disabled: !ok,
    onClick: submit
  }, "Adicionar tarefa") : /*#__PURE__*/React.createElement("div", {
    className: "nt__actions"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onCancel
  }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
    icon: "plus",
    disabled: !ok,
    onClick: submit
  }, "Criar tarefa")));
}
Object.assign(window, {
  TaskDrawer,
  MobileTaskDetail,
  NewTaskForm
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/TaskDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/Tasks.jsx
try { (() => {
const TASK_GROUPS = [{
  id: 'late',
  label: 'Atrasadas',
  icon: 'triangle-alert'
}, {
  id: 'today',
  label: 'Hoje',
  icon: 'calendar'
}, {
  id: 'tomorrow',
  label: 'Amanhã',
  icon: 'calendar-days'
}, {
  id: 'week',
  label: 'Esta semana',
  icon: 'calendar-days'
}];
const BOARD_COLS = ['todo', 'progress', 'review', 'done'];
function BoardCard({
  t,
  data,
  onOpen,
  selected
}) {
  const {
    ProjectTag,
    PriorityFlag,
    Avatar,
    Icon
  } = GA;
  const p = data.projById[t.project];
  const a = data.memById[t.assignee];
  const late = t.due === 'late' && t.status !== 'done';
  return /*#__PURE__*/React.createElement("div", {
    className: 'ga-card ga-card--interactive ga-card--pad-none bcard' + (t.status === 'done' ? ' bcard--done' : ''),
    onClick: () => onOpen(t.id),
    style: selected ? {
      borderColor: 'var(--cobalt-300)',
      boxShadow: '0 0 0 3px rgba(46,68,240,.10)'
    } : null
  }, /*#__PURE__*/React.createElement(ProjectTag, {
    name: p.name,
    color: p.color,
    plain: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "bcard__title"
  }, t.title), /*#__PURE__*/React.createElement("div", {
    className: "bcard__foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: 'bcard__when' + (late ? ' bcard__when--late' : '')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 12
  }), t.when), /*#__PURE__*/React.createElement("span", {
    className: "bcard__end"
  }, /*#__PURE__*/React.createElement(PriorityFlag, {
    level: t.priority,
    iconOnly: true
  }), /*#__PURE__*/React.createElement(Avatar, {
    name: a.name,
    tone: a.tone,
    size: "xs"
  }))));
}
function TasksScreen({
  data,
  tasks,
  isMobile,
  compactRows,
  onOpen,
  onToggle,
  onNew,
  selectedId,
  projectFilter,
  setProjectFilter
}) {
  const {
    PageHeader,
    Button,
    SegmentedControl,
    FilterChip,
    TaskRow,
    StatusBadge,
    Badge,
    Icon
  } = GA;
  const [view, setView] = React.useState('list');
  const [mine, setMine] = React.useState(false);
  const [showDone, setShowDone] = React.useState(true);
  let list = tasks;
  if (mine) list = list.filter(t => t.assignee === data.user.id);
  if (projectFilter) list = list.filter(t => t.project === projectFilter);
  const open = tasks.filter(t => t.status !== 'done').length;
  const late = tasks.filter(t => t.due === 'late' && t.status !== 'done').length;
  const pf = projectFilter ? data.projById[projectFilter] : null;
  const viewSwitch = /*#__PURE__*/React.createElement(SegmentedControl, {
    value: view,
    onChange: setView,
    block: isMobile,
    options: [{
      value: 'list',
      label: 'Lista',
      icon: 'list'
    }, {
      value: 'board',
      label: 'Quadro',
      icon: 'columns-3'
    }]
  });
  const row = t => {
    const p = data.projById[t.project];
    const a = data.memById[t.assignee];
    return /*#__PURE__*/React.createElement(TaskRow, {
      key: t.id,
      layout: compactRows ? 'stacked' : 'row',
      title: t.title,
      project: p.name,
      projectColor: p.color,
      time: t.when,
      late: t.due === 'late' && t.status !== 'done',
      priority: t.priority,
      assignee: {
        name: a.name,
        tone: a.tone
      },
      done: t.status === 'done',
      selected: selectedId === t.id,
      onToggle: () => onToggle(t.id),
      onClick: () => onOpen(t.id),
      onMore: () => onOpen(t.id)
    });
  };
  const pending = list.filter(t => t.status !== 'done');
  const done = list.filter(t => t.status === 'done');
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    breadcrumb: isMobile ? null : [data.workspace, 'Tarefas'],
    title: "Tarefas",
    subtitle: open + ' abertas' + (late ? ' · ' + late + ' atrasada' : ''),
    actions: isMobile ? null : /*#__PURE__*/React.createElement(React.Fragment, null, viewSwitch, /*#__PURE__*/React.createElement(Button, {
      icon: "plus",
      onClick: onNew
    }, "Nova tarefa"))
  }), isMobile ? viewSwitch : null, /*#__PURE__*/React.createElement("div", {
    className: "chips"
  }, /*#__PURE__*/React.createElement(FilterChip, {
    label: "Respons\xE1vel: Eu",
    icon: "user",
    active: mine,
    dropdown: false,
    onClick: () => setMine(!mine),
    onRemove: () => setMine(false)
  }), data.projects.filter(p => p.health !== 'done').map(p => /*#__PURE__*/React.createElement(FilterChip, {
    key: p.id,
    label: p.name,
    dropdown: false,
    active: projectFilter === p.id,
    onClick: () => setProjectFilter(projectFilter === p.id ? null : p.id),
    onRemove: () => setProjectFilter(null)
  }))), view === 'list' ? /*#__PURE__*/React.createElement("div", {
    className: "stack16"
  }, list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "inbox",
    size: 28
  }), /*#__PURE__*/React.createElement("div", {
    className: "empty__t"
  }, "Nada por aqui"), "Nenhuma tarefa com esses filtros.") : null, TASK_GROUPS.map(g => {
    const items = pending.filter(t => t.due === g.id);
    if (!items.length) return null;
    return /*#__PURE__*/React.createElement("section", {
      className: "stack",
      key: g.id
    }, /*#__PURE__*/React.createElement("div", {
      className: "sechead"
    }, /*#__PURE__*/React.createElement("span", {
      className: 'sechead__l' + (g.id === 'late' ? ' sechead__l--late' : '')
    }, /*#__PURE__*/React.createElement(Icon, {
      name: g.icon,
      size: 14
    }), g.label, /*#__PURE__*/React.createElement(Badge, {
      size: "sm",
      tone: g.id === 'late' ? 'danger' : 'neutral'
    }, items.length))), items.map(row));
  }), done.length ? /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sechead"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sechead__l"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check",
    size: 14
  }), "Conclu\xEDdas", /*#__PURE__*/React.createElement(Badge, {
    size: "sm",
    tone: "success"
  }, done.length)), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconRight: showDone ? 'chevron-up' : 'chevron-down',
    onClick: () => setShowDone(!showDone)
  }, showDone ? 'Ocultar' : 'Mostrar')), showDone ? done.map(row) : null) : null) : /*#__PURE__*/React.createElement("div", {
    className: "board"
  }, BOARD_COLS.map(s => {
    const items = list.filter(t => t.status === s);
    return /*#__PURE__*/React.createElement("div", {
      className: "board__col",
      key: s
    }, /*#__PURE__*/React.createElement("div", {
      className: "board__head"
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: s
    }), /*#__PURE__*/React.createElement(Badge, {
      size: "sm",
      tone: "outline"
    }, items.length)), items.map(t => /*#__PURE__*/React.createElement(BoardCard, {
      key: t.id,
      t: t,
      data: data,
      onOpen: onOpen,
      selected: selectedId === t.id
    })), s === 'todo' ? /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      icon: "plus",
      onClick: onNew
    }, "Adicionar") : null);
  })));
}
window.TasksScreen = TasksScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/Tasks.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/Team.jsx
try { (() => {
function TeamScreen({
  data,
  tasks,
  isMobile,
  onInvite
}) {
  const {
    PageHeader,
    Button,
    IconButton,
    Card,
    DataTable,
    Avatar,
    Badge,
    ProgressBar,
    SearchField,
    Tabs,
    Icon,
    Select
  } = GA;
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('members');
  const openBy = id => tasks.filter(t => t.assignee === id && t.status !== 'done').length + 3;
  const rows = data.members.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));
  const loadTone = v => v > 90 ? 'danger' : v > 75 ? 'warning' : 'brand';
  const presence = {
    online: ['success', 'Ativa'],
    away: ['warning', 'Ausente'],
    offline: ['neutral', 'Offline']
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    breadcrumb: isMobile ? null : [data.workspace, 'Equipe'],
    title: "Equipe",
    subtitle: data.members.length + ' membros · 2 convites pendentes',
    actions: /*#__PURE__*/React.createElement(Button, {
      icon: "user-plus",
      size: isMobile ? 'sm' : 'md',
      onClick: onInvite
    }, "Convidar membro")
  }), /*#__PURE__*/React.createElement("div", {
    className: "toolbar"
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: 'members',
      label: 'Membros',
      count: data.members.length
    }, {
      value: 'invites',
      label: 'Convites',
      count: 2
    }],
    style: {
      borderBottom: 0
    }
  }), /*#__PURE__*/React.createElement(SearchField, {
    placeholder: "Buscar membros",
    shortcut: null,
    size: "sm",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      width: isMobile ? '100%' : 260
    }
  })), tab === 'invites' ? /*#__PURE__*/React.createElement(Card, {
    padding: "none",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mlist"
  }, ['bia@estudionorte.com.br', 'caio@freela.com'].map(e => /*#__PURE__*/React.createElement("div", {
    className: "mrow",
    key: e,
    style: {
      cursor: 'default'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "who"
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: "@",
    tone: "sky",
    size: 36
  }), /*#__PURE__*/React.createElement("span", {
    className: "who__meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "who__name"
  }, e), /*#__PURE__*/React.createElement("span", {
    className: "who__mail"
  }, "Convidado h\xE1 2 dias \xB7 Membro"))), /*#__PURE__*/React.createElement("span", {
    className: "mrow__end"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Reenviar")))))) : isMobile ? /*#__PURE__*/React.createElement(Card, {
    padding: "none",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mlist"
  }, rows.map(m => /*#__PURE__*/React.createElement("div", {
    className: "mrow",
    key: m.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "who"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: m.name,
    tone: m.tone,
    size: 36,
    status: m.presence
  }), /*#__PURE__*/React.createElement("span", {
    className: "who__meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "who__name"
  }, m.name), /*#__PURE__*/React.createElement("span", {
    className: "who__mail"
  }, m.role, " \xB7 ", openBy(m.id), " abertas"))), /*#__PURE__*/React.createElement("span", {
    className: "mrow__end"
  }, /*#__PURE__*/React.createElement(Badge, {
    size: "sm",
    tone: m.load > 90 ? 'danger' : m.load > 75 ? 'warning' : 'neutral'
  }, m.load, "%"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  })))))) : /*#__PURE__*/React.createElement(Card, {
    padding: "none",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(DataTable, {
    rowKey: "id",
    rows: rows,
    columns: [{
      key: 'name',
      header: 'Membro',
      render: m => /*#__PURE__*/React.createElement("span", {
        className: "who"
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: m.name,
        tone: m.tone,
        size: 32,
        status: m.presence
      }), /*#__PURE__*/React.createElement("span", {
        className: "who__meta"
      }, /*#__PURE__*/React.createElement("span", {
        className: "who__name"
      }, m.name), /*#__PURE__*/React.createElement("span", {
        className: "who__mail"
      }, m.email)))
    }, {
      key: 'role',
      header: 'Função',
      width: 150,
      render: m => m.role === 'Dona' ? /*#__PURE__*/React.createElement(Badge, {
        tone: "brand"
      }, "Dona") : /*#__PURE__*/React.createElement(Select, {
        size: "sm",
        defaultValue: m.role,
        options: ['Admin', 'Membro', 'Convidado'],
        style: {
          width: 130
        }
      })
    }, {
      key: 'open',
      header: 'Abertas',
      align: 'right',
      width: 90,
      render: m => /*#__PURE__*/React.createElement("span", {
        className: "ga-num"
      }, openBy(m.id))
    }, {
      key: 'load',
      header: 'Carga',
      width: 170,
      render: m => /*#__PURE__*/React.createElement("span", {
        className: "loadcell"
      }, /*#__PURE__*/React.createElement(ProgressBar, {
        value: m.load,
        size: "xs",
        tone: loadTone(m.load),
        style: {
          width: 90
        }
      }), m.load + '%')
    }, {
      key: 'st',
      header: 'Status',
      width: 110,
      render: m => /*#__PURE__*/React.createElement(Badge, {
        size: "sm",
        dot: true,
        tone: presence[m.presence][0]
      }, presence[m.presence][1])
    }, {
      key: 'more',
      header: '',
      width: 48,
      render: () => /*#__PURE__*/React.createElement(IconButton, {
        icon: "ellipsis",
        label: "Mais a\xE7\xF5es",
        size: "sm"
      })
    }]
  })));
}
window.TeamScreen = TeamScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/Team.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/data.js
try { (() => {
// gestaoApp admin UI kit — sample data (pt-BR)
window.GA_DATA = function () {
  var members = [{
    id: 'm1',
    name: 'Marina Alves',
    email: 'marina@estudionorte.com.br',
    role: 'Dona',
    tone: 'cobalt',
    load: 82,
    presence: 'online'
  }, {
    id: 'm2',
    name: 'João Kim',
    email: 'joao@estudionorte.com.br',
    role: 'Admin',
    tone: 'zest',
    load: 64,
    presence: 'online'
  }, {
    id: 'm3',
    name: 'Rosa Silva',
    email: 'rosa@estudionorte.com.br',
    role: 'Membro',
    tone: 'violet',
    load: 96,
    presence: 'away'
  }, {
    id: 'm4',
    name: 'Léo Prado',
    email: 'leo@estudionorte.com.br',
    role: 'Membro',
    tone: 'orange',
    load: 48,
    presence: 'online'
  }, {
    id: 'm5',
    name: 'Ana Navarro',
    email: 'ana@estudionorte.com.br',
    role: 'Admin',
    tone: 'ink',
    load: 71,
    presence: 'offline'
  }, {
    id: 'm6',
    name: 'Tom Reis',
    email: 'tom@freela.com',
    role: 'Convidado',
    tone: 'sky',
    load: 30,
    presence: 'offline'
  }];
  var projects = [{
    id: 'p1',
    name: 'Redesign do site',
    color: 'var(--project-1)',
    icon: 'layers',
    desc: 'Novo site institucional e páginas de preço',
    health: 'ontrack',
    progress: 72,
    done: 18,
    total: 25,
    due: '24 out',
    members: ['m1', 'm3', 'm2', 'm5']
  }, {
    id: 'p2',
    name: 'Vídeo da marca',
    color: 'var(--project-2)',
    icon: 'play',
    desc: 'Filme de 60s para o lançamento de outubro',
    health: 'atrisk',
    progress: 45,
    done: 9,
    total: 20,
    due: '18 out',
    members: ['m2', 'm3']
  }, {
    id: 'p3',
    name: 'App mobile',
    color: 'var(--project-3)',
    icon: 'smartphone',
    desc: 'Onboarding e fluxo de tarefas no celular',
    health: 'ontrack',
    progress: 38,
    done: 11,
    total: 29,
    due: '15 nov',
    members: ['m1', 'm3', 'm6']
  }, {
    id: 'p4',
    name: 'Marketing',
    color: 'var(--project-4)',
    icon: 'trending-up',
    desc: 'Campanha de lançamento e conteúdo social',
    health: 'late',
    progress: 61,
    done: 14,
    total: 23,
    due: '10 out',
    members: ['m2', 'm4', 'm5']
  }, {
    id: 'p5',
    name: 'Onboarding de clientes',
    color: 'var(--project-5)',
    icon: 'user-plus',
    desc: 'Kit de boas-vindas e sessões de kickoff',
    health: 'done',
    progress: 100,
    done: 16,
    total: 16,
    due: '30 set',
    members: ['m4', 'm1']
  }];
  var tasks = [{
    id: 't4',
    title: 'Enviar fatura ao cliente',
    project: 'p1',
    due: 'late',
    when: '2 dias atrasada',
    dueLabel: 'seg, 6 out',
    priority: 'high',
    assignee: 'm5',
    status: 'todo',
    desc: 'Fatura referente à fase 2 do redesign. Conferir horas lançadas antes de enviar.',
    subtasks: [{
      t: 'Conferir horas',
      done: true
    }, {
      t: 'Gerar PDF',
      done: false
    }]
  }, {
    id: 't1',
    title: 'Finalizar design do site',
    project: 'p1',
    due: 'today',
    when: '10:00',
    dueLabel: 'Hoje · 10:00',
    priority: 'high',
    assignee: 'm1',
    status: 'progress',
    desc: 'Fechar as telas finais da home e da página de preços para a revisão com o cliente às 16h.',
    subtasks: [{
      t: 'Hero e seções da home',
      done: true
    }, {
      t: 'Layout da página de preços',
      done: true
    }, {
      t: 'Breakpoints responsivos',
      done: false
    }]
  }, {
    id: 't2',
    title: 'Revisar feedback do cliente',
    project: 'p2',
    due: 'today',
    when: '13:30',
    dueLabel: 'Hoje · 13:30',
    priority: 'medium',
    assignee: 'm2',
    status: 'review',
    desc: 'Consolidar os comentários da segunda versão do corte e separar o que entra nesta rodada.',
    subtasks: [{
      t: 'Ler comentários',
      done: true
    }, {
      t: 'Priorizar ajustes',
      done: false
    }]
  }, {
    id: 't3',
    title: 'Reunião de alinhamento da sprint',
    project: 'p4',
    due: 'today',
    when: '15:00',
    dueLabel: 'Hoje · 15:00',
    priority: 'low',
    assignee: 'm4',
    status: 'todo',
    desc: 'Revisar entregas da semana e redistribuir tarefas atrasadas.',
    subtasks: []
  }, {
    id: 't5',
    title: 'Preparar notas da sprint',
    project: 'p4',
    due: 'today',
    when: '09:00',
    dueLabel: 'Hoje · 09:00',
    priority: 'low',
    assignee: 'm1',
    status: 'done',
    desc: 'Resumo do que foi entregue e do que ficou para a próxima sprint.',
    subtasks: []
  }, {
    id: 't6',
    title: 'Roteiro do vídeo institucional',
    project: 'p2',
    due: 'tomorrow',
    when: 'qui, 9 out',
    dueLabel: 'Amanhã · qui, 9 out',
    priority: 'high',
    assignee: 'm3',
    status: 'progress',
    desc: 'Versão final do roteiro com locução e indicação de cenas.',
    subtasks: [{
      t: 'Abertura',
      done: true
    }, {
      t: 'Depoimentos',
      done: false
    }, {
      t: 'Encerramento',
      done: false
    }]
  }, {
    id: 't7',
    title: 'Protótipo do onboarding',
    project: 'p3',
    due: 'tomorrow',
    when: 'qui, 9 out',
    dueLabel: 'Amanhã · qui, 9 out',
    priority: 'medium',
    assignee: 'm1',
    status: 'todo',
    desc: 'Fluxo de 3 telas para o primeiro acesso no app.',
    subtasks: []
  }, {
    id: 't8',
    title: 'Testes de usabilidade',
    project: 'p3',
    due: 'week',
    when: 'sex, 10 out',
    dueLabel: 'sex, 10 out',
    priority: 'medium',
    assignee: 'm3',
    status: 'todo',
    desc: 'Cinco sessões remotas com clientes atuais.',
    subtasks: []
  }, {
    id: 't9',
    title: 'Campanha de lançamento',
    project: 'p4',
    due: 'week',
    when: 'sex, 10 out',
    dueLabel: 'sex, 10 out',
    priority: 'high',
    assignee: 'm2',
    status: 'review',
    desc: 'Peças para redes sociais e e-mail de anúncio.',
    subtasks: [{
      t: 'Peças sociais',
      done: true
    }, {
      t: 'E-mail',
      done: false
    }]
  }, {
    id: 't10',
    title: 'Layout da página de preços',
    project: 'p1',
    due: 'week',
    when: 'seg, 6 out',
    dueLabel: 'seg, 6 out',
    priority: 'low',
    assignee: 'm1',
    status: 'done',
    desc: 'Tabela de planos com comparação.',
    subtasks: []
  }];
  var week = [{
    label: 'S',
    value: 6,
    planned: 8
  }, {
    label: 'T',
    value: 7,
    planned: 8
  }, {
    label: 'Q',
    value: 4,
    planned: 6,
    highlight: true
  }, {
    label: 'Q',
    value: 0,
    planned: 9
  }, {
    label: 'S',
    value: 0,
    planned: 6
  }, {
    label: 'S',
    value: 0,
    planned: 2
  }, {
    label: 'D',
    value: 0,
    planned: 1
  }];
  var byId = function (arr) {
    var o = {};
    arr.forEach(function (x) {
      o[x.id] = x;
    });
    return o;
  };
  return {
    user: members[0],
    workspace: 'Estúdio Norte',
    today: 'quarta-feira, 8 de outubro',
    members: members,
    projects: projects,
    tasks: tasks,
    week: week,
    memById: byId(members),
    projById: byId(projects),
    goalBase: 20,
    goalTotal: 28
  };
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Kbd = __ds_scope.Kbd;

__ds_ns.PriorityFlag = __ds_scope.PriorityFlag;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.ProjectTag = __ds_scope.ProjectTag;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.GoalCard = __ds_scope.GoalCard;

__ds_ns.ProjectCard = __ds_scope.ProjectCard;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.TaskRow = __ds_scope.TaskRow;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.FilterChip = __ds_scope.FilterChip;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.NavItem = __ds_scope.NavItem;

__ds_ns.NavSection = __ds_scope.NavSection;

__ds_ns.PageHeader = __ds_scope.PageHeader;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.WorkspaceSwitcher = __ds_scope.WorkspaceSwitcher;

__ds_ns.BottomSheet = __ds_scope.BottomSheet;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Drawer = __ds_scope.Drawer;

__ds_ns.Toast = __ds_scope.Toast;

})();
