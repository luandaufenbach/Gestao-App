# gestaoApp Design System

Design system for **gestaoApp** — a modern, calm admin dashboard for small teams to manage tasks, projects and people, with full mobile parity (nothing important is dropped on desktop or phone).

## Sources
- 34 uploaded case-study boards in `uploads/` (taskly-01…34; 30 and 32 missing). They document a reference product called **Taskly** (task manager for studios — brand, website, web dashboard, mobile app, design system, pitch deck). Animated GIFs were frame-extracted to read the color, typography and dashboard boards.
- No codebase, Figma or vector logo was provided. All values were sampled from screenshots (e.g. Cobalt #2E44F0, Zest #D4F55A, Cloud #FAFBFD, radius/lg = 14).
- **Branding:** the visual language follows the reference; the product name is gestaoApp. The Taskly "T-check" mark is NOT reused — **no gestaoApp logo exists**, so the brand renders as the plain wordmark "gestaoApp" in Outfit SemiBold.

## Content fundamentals
- **Language:** Brazilian Portuguese (pt-BR). Sentence case everywhere ("Nova tarefa", "Criar projeto"); uppercase only for micro labels (MENU PRINCIPAL, PROJETOS) with +8% tracking.
- **Voice:** calm, direct, second person ("você"), friendly but exact. Every screen answers "o que eu faço agora?". Greet by first name: "Bom dia, Marina".
- **Copy shape:** short verb-first actions ("Concluir", "Convidar membro"); context lines joined with a middle dot: "quarta-feira, 8 de outubro · 3 tarefas vencem hoje e 1 reunião." Numbers do the talking: "24 / 28", "faltam 4 tarefas", "1 atrasada", "↑ 18% vs semana passada".
- **Headlines (marketing/empty states):** two lines — plain statement + italic cobalt (or zest on blue) payoff: "Tarefas simples. *Mais produtividade.*"
- **Emoji:** not in UI. Times 24h ("10:00"), dates "qui, 9 out".

## Visual foundations
- **Color:** Cloud canvas (60%), Ink text (22%), Cobalt for every action/focus (14%), Zest only for wins/done (4%). Signals: red = high priority/overdue, orange = medium/review, green = done/success. Project color codes: cobalt, lime, violet, orange, green, red, sky. Light + dark tokens (`[data-theme="dark"]`).
- **Type:** Outfit (geometric, 300–700, brand weight 500) for headlines, numbers, labels and UI; italic = synthesized oblique of Outfit for accent words. Plus Jakarta Sans for long-form paragraphs (**substitution — nearest Google match to the body face in the boards; please send the real file if known**). Scale: Display 88/100, Heading 32/120, Title 20/130, Body 16/155 (UI body 14), Label 12/+8%.
- **Backgrounds:** app = flat Cloud; brand moments = the "fluted-glass sky" (cobalt→periwinkle gradient with vertical reed texture, `assets/imagery/bg-sky.png`), soft radial cobalt/zest halos behind hero content. No noise/grain, no busy patterns.
- **Imagery:** bright, natural daylight photography of real people working (cool blues + fresh greens), 3D glass renders (glass check, molecule cluster, layer stack) — originals not provided.
- **Cards:** white, 1px hairline (#ECEEF3), radius 14, near-invisible shadow; one solid-cobalt hero card (weekly goal) per screen; zest card for celebration; ink card for promos; dashed card for "create".
- **Radii:** 6 (tags) · 10 (inputs, nav) · 12 (task rows) · 14 (cards) · 18–24 (panels, sheets) · pill for buttons/badges/chips · 28% for app icons.
- **Shadows:** cool-tinted, low opacity (`--shadow-xs…xl`); colored glow only under primary cobalt buttons and FAB (`--shadow-brand`). Floating notification cards use `--shadow-xl`.
- **Borders:** hairlines over shadows; focus = cobalt border + 3px soft cobalt ring.
- **Motion:** calm ease-out (`cubic-bezier(.22,1,.36,1)`) 140–320ms; one spring beat for checking a task/toasts; sheets slide up 420ms; respects reduced-motion.
- **Hover/press:** hover darkens cobalt one step, neutral surfaces get a faint cool tint; cards lift 1px with shadow-md. Press scales to .97 (buttons) / .94 (icon buttons).
- **Transparency/blur:** only on brand imagery (glass chips: white 16–20% + 12–16px blur). Never in product chrome.
- **Layout:** desktop shell = sidebar 248px (collapses to 72px) · content (max 1440, pad 28) · optional inline detail drawer 380px. Mobile (<768) = bottom TabBar with center "+" FAB, stacked task rows, full-screen details, bottom sheets; 44px min hit targets.

## Iconography
Lucide outline icons (1.75 stroke, round caps) — matches the reference set. 74 SVGs copied to `assets/icons/` and embedded in the `Icon` component (`ICON_NAMES`). Sizes 12–14 meta, 16–17 nav/buttons, 20 tab bar. Icons sit in soft tinted rounded tiles on stat/project cards. No emoji, no icon font, no unicode glyphs except "·" and "⌘".

## Index
- `styles.css` — entry (imports only) → `tokens/` (fonts, colors, typography, spacing, radius, shadows, motion, base) + component CSS.
- `assets/fonts/` Outfit, Plus Jakarta Sans (woff2) · `assets/icons/` Lucide SVGs · `assets/imagery/bg-sky.png`.
- `components/` — React primitives (`.jsx` + `.d.ts` + `.prompt.md`, one card per folder):
  - **core:** Icon, Button, IconButton, Badge, StatusBadge, Avatar, AvatarGroup, Kbd, ProgressBar, ProjectTag, PriorityFlag
  - **forms:** TextField, SearchField, Select, Checkbox, Radio, Switch, SegmentedControl, FilterChip
  - **data:** Card, StatCard, GoalCard, TaskRow, ProjectCard, BarChart, DataTable
  - **navigation:** Sidebar, NavItem, NavSection, WorkspaceSwitcher, Breadcrumb, Tabs, TabBar, PageHeader
  - **overlays:** Drawer, BottomSheet, Toast, Dialog
- `guidelines/` — 23 foundation specimen cards (Colors, Type, Spacing, Brand groups in the Design System tab).
- `ui_kits/admin/` — responsive admin app recreation: `index.html` (Painel, Tarefas list/board + detail drawer, Projetos, Equipe, Configurações; new-task dialog/sheet, toasts) and `mobile.html` (same app in two 390×844 frames). See its README.
- `thumbnail.html` — project tile · `SKILL.md` — agent skill entry.

### Intentional additions
- **Icon** — wrapper so consumers get the Lucide set without a dependency.
- **Dialog** — desktop confirm for irreversible actions (boards only show the mobile sheet pattern).

### Responsive rules (mobile parity)
- ≥1280: sidebar + content + **inline** detail drawer. 1024–1279: drawer overlays. 768–1023: sidebar auto-collapses to icon rail.
- <768: top bar (wordmark · bell · avatar→settings), bottom TabBar with center "+", KPI cards become a snap-scrolling strip (goal card first), TaskRow switches to `layout="stacked"`, details open full-screen, creation uses BottomSheet, tables become lists. Every desktop feature stays reachable.
