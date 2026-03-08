# Styleguide - Interest Calculator

## Design Philosophy

Premium financieel dashboard met een navy + copper kleurenpalet. Clean, professioneel en vertrouwenwekkend. Mobile-first responsive design met dark mode support.

---

## Fonts

| Rol       | Font                | Gewichten          | Gebruik                          |
|-----------|---------------------|--------------------|----------------------------------|
| Display   | Playfair Display    | 400, 500, 600, 700 | Headings, titels, sectie-headers |
| Body      | Source Sans 3       | 300, 400, 500, 600, 700 | Alle overige tekst, buttons, labels |

```css
--font-display: 'Playfair Display', Georgia, serif;
--font-body: 'Source Sans 3', system-ui, sans-serif;
```

---

## Kleuren

### Navy (primair)

De basis van het kleurenpalet. Gebruikt voor achtergronden, tekst en structuur.

| Token         | Hex       | Gebruik                                      |
|---------------|-----------|----------------------------------------------|
| `navy-950`    | `#06101f` | Dark mode achtergrond                        |
| `navy-900`    | `#0a1628` | Dark mode cards, primaire tekst (light)      |
| `navy-800`    | `#0f2240` | Primaire buttons, tabel headers              |
| `navy-700`    | `#163058` | Button hover (dark), borders (dark)          |
| `navy-600`    | `#1e4070` | Form labels, secundaire tekst                |
| `navy-500`    | `#2a5494` | Stat labels, muted tekst                     |
| `navy-400`    | `#4a7cc4` | Placeholder tekst, icons, tertiaire tekst    |
| `navy-300`    | `#7ba3db` | Placeholder (light), borders (light)         |
| `navy-200`    | `#b0c9eb` | Borders, dividers                            |
| `navy-100`    | `#dce6f5` | Achtergrond inputs, tabel-rij hover          |
| `navy-50`     | `#eef3fa` | Body achtergrond (light), card achtergrond   |

### Copper (accent)

Warme accentkleur voor interactieve elementen en highlights.

| Token         | Hex       | Gebruik                                      |
|---------------|-----------|----------------------------------------------|
| `copper-600`  | `#a0714a` | Accent tekst (light), tagline                |
| `copper-500`  | `#c8956c` | Focus rings, active states, primaire accent  |
| `copper-400`  | `#d4a87e` | Accent tekst (dark), hover states            |
| `copper-300`  | `#e0be9a` | Gradient einde, subtiele accenten            |
| `copper-200`  | `#ebdbc5` | Badge achtergronden                          |
| `copper-100`  | `#f5ede0` | Hover achtergronden, badge bg                |

### Semantische kleuren

| Token            | Hex       | Gebruik                         |
|------------------|-----------|---------------------------------|
| `danger`         | `#c0392b` | Foutmeldingen, delete actions   |
| `danger-light`   | `#fbeae8` | Fout achtergrond (light)        |
| `success`        | `#2d8a5e` | Positieve waarden, best result  |
| `success-light`  | `#e8f5ef` | Succes achtergrond (light)      |

### Dark mode overrides

```css
danger-light -> #2a1210
success-light -> #0f2418
```

---

## Typografie

### Hierarchy

| Element          | Font    | Grootte              | Gewicht  | Kleur (light / dark)           |
|------------------|---------|----------------------|----------|--------------------------------|
| H1               | Display | `2xl` / `3xl` (lg)  | 600      | navy-900 / navy-50             |
| H2 (sectie)      | Display | `lg` / `xl` (sm)    | 600      | navy-900 / navy-50             |
| Tagline          | Display | `sm` / `lg` (sm)    | 500      | copper-600 / copper-400        |
| Body             | Body    | `base`               | 400      | navy-900 / navy-100            |
| Labels           | Body    | `xs`                 | 600      | navy-600 / navy-300            |
| Hints/meta       | Body    | `xs`                 | 400      | navy-400                       |
| Badges           | Body    | `2xs` (0.625rem)     | 700      | varies                         |
| Kleinste tekst   | Body    | `3xs` (0.5rem)       | 700      | varies                         |

### Label style

Form labels en stat labels volgen hetzelfde patroon:

```css
font-size: xs;
font-weight: 600 (semibold);
text-transform: uppercase;
letter-spacing: 0.07em;
color: navy-600 (light) / navy-300 (dark);
```

---

## Spacing & Layout

### Container

```
max-width: 96rem (--container-dashboard)
padding: 1rem (mobile) -> 1.5rem (sm) -> 2.5rem (lg)
```

### Main layout

```
Mobile: single column, tab-based navigatie
Desktop (lg): twee kolommen - flex main (fluid) + sidebar (28rem / --width-sidebar)
Gap: 1.5rem
```

### Secties

```
padding: 1rem (mobile) -> 1.5rem (sm)
border-radius: 1rem (rounded-2xl)
```

---

## Componenten

### Cards (`.portfolio-section`, `.results-section`)

```css
padding: 1rem / 1.5rem (sm) / 2rem (lg, alleen results)
border-radius: 1rem
background: white / navy-900 (dark)
border: 1px solid navy-200/60 / navy-700/50 (dark)
shadow: sm (light only)
```

### Buttons

#### Primary (`.btn-primary`)

```
Breedte: full-width
Hoogte: min 3rem (48px)
Padding: 0.875rem 1.5rem
Font: body, base, 600
Border-radius: 0.75rem (xl)
Achtergrond: gradient navy-800 -> navy-900 (light)
           gradient copper-500 -> copper-600 (dark)
Tekst: wit (light) / navy-950 (dark)
Hover: gradient lichter + shadow-lg + translate -1px
Active: scale 0.99, opacity 0.9
```

#### Action (`.btn-action`)

```
Padding: 0.5rem 1rem
Font: body, xs, 600
Border-radius: 0.5rem (lg)
Achtergrond: navy-800 (light) / copper-500 (dark)
Varianten: --muted (outlined), --danger (red outlined)
```

#### Icon (`.btn-icon`, `.btn-portfolio`)

```
Afmetingen: 2.25rem x 2.25rem (36px)
Border-radius: 0.5rem
Achtergrond: transparant
Active: scale 0.95 / 0.90
```

#### Secondary (`.btn-secondary`)

```
Full-width, navy-100 bg, navy-700 tekst
Dark: navy-800 bg, navy-200 tekst
```

### Forms

#### Input (`.form-input`)

```
Padding: 0.875rem (py) / 0.875rem (px)
Font: body, base
Background: navy-50 / navy-800 (dark)
Border: 1.5px solid navy-200 / navy-600 (dark)
Border-radius: 0.5rem (lg)
Hover: border navy-300
Focus: bg white, border copper-500, shadow 0 0 0 3px copper/18%
Error: border danger, bg danger-light/30
```

#### Label (`.form-label`)

```
Font: xs, 600, uppercase
Letter-spacing: 0.07em
Margin-bottom: 0.375rem
Focus-within: copper-600 / copper-400 (dark)
```

#### Radio selector (`.interval-option`)

```
Grid: 2 kolommen
Stijl: card-achtige radio buttons
Selected: navy-900 bg + wit tekst (light), copper-500 bg + navy-950 tekst (dark)
Border: 1.5px, border-radius lg
```

### Modal (`.modal__*`)

```
Overlay: fixed, centered, blur 4px achtergrond
Panel: max-width md (28rem), rounded-2xl
Header: px-6 pt-6 pb-4
Body: px-6 pb-4
Footer: px-6 pb-6, rechts uitgelijnd, gap-3
Animatie: fadeInUp 0.3s
```

### Tabel (`.comparison-table`, `.period-table`)

#### Vergelijkingstabel

```
Header: navy-900 bg, witte tekst, uppercase xs, tracking 0.07em
Rij hover: copper-500/4% bg
Borders: navy-100 / navy-700 (dark)
Best result: success kleur + success-light bg
Bedragen: font-semibold, tabular-nums
```

#### Periodetabel

```
Header: navy-50 bg (subtiel)
Kleiner: text-xs / text-sm (sm)
Eerste kolom: left-aligned, navy-500 kleur
```

### Badges

```
Font: 2xs, 700, uppercase, tracking-wide
Padding: 1px 6px
Border-radius: full (pill)
Varianten:
  - Default: navy-500 text, navy-100 bg
  - Ongoing: sky-600 text, sky-500/10 bg
  - Complete: success text, success-light bg
  - Expired: danger text, danger-light bg
```

### Popover / Tooltip

```
Background: navy-800 / navy-700 (dark)
Tekst: navy-100 / navy-200 (dark)
Padding: 0.5rem 0.75rem
Border-radius: lg
Width: 13rem
Arrow: 4px CSS border trick
Trigger: hover/focus, opacity transition
```

---

## Interactie

### Transitions

Standaard `duration-200` (200ms) voor de meeste interacties. Uitzondering:

- Dropdown/popover fade-in: `150ms`
- Animaties (fadeInUp): `300-500ms`
- Tabel rij hover: `150ms`

### Hover patronen

- **Buttons**: kleur/achtergrond verandering + optioneel shadow
- **Tabelrijen**: `copper-500/4%` achtergrond
- **Icon buttons**: kleur naar copper-500, achtergrond toevoegen
- **Links**: kleur naar copper-600

### Active/pressed

- Scale transform: `0.97-0.99` voor buttons, `0.90-0.95` voor icon buttons
- Geen bounce/spring - puur CSS transform

### Focus visible

```css
outline: 2px solid copper-400;
outline-offset: 2px;
```

Form inputs gebruiken hun eigen focus stijl (border + shadow) zonder outline.

---

## Animaties

| Naam           | Beschrijving                        | Duur   |
|----------------|-------------------------------------|--------|
| `fadeIn`        | Opacity 0 -> 1                     | 120-200ms |
| `fadeInUp`      | Opacity + translateY(12px) -> 0    | 300-500ms |
| `slideInUp`     | Opacity + translateY(16px) -> 0    | 300ms  |
| `expandReveal`  | Opacity + max-height 0 -> 2000px   | 300ms  |

---

## Responsive breakpoints

| Breakpoint | Prefix | Gedrag                                  |
|------------|--------|-----------------------------------------|
| < 640px    | -      | Mobile-first basis stijlen              |
| >= 640px   | `sm:`  | Grotere padding, tekst, spacing         |
| >= 1024px  | `lg:`  | Twee-kolom layout, tab bar verborgen    |

### Mobile tab bar

Vaste balk onderaan het scherm met `env(safe-area-inset-bottom)` voor notch-devices. Verdwijnt op `lg:` breakpoint.

---

## Dark mode

Geactiveerd via `data-theme="dark"` op `<html>`. Belangrijkste patronen:

| Element          | Light                | Dark                    |
|------------------|----------------------|-------------------------|
| Body bg          | navy-50              | navy-950                |
| Card bg          | white                | navy-900                |
| Tekst primair    | navy-900             | navy-100                |
| Tekst secundair  | navy-600             | navy-300                |
| Borders          | navy-200/60          | navy-700/50             |
| Primary button   | navy-800 gradient    | copper-500 gradient     |
| Accent tekst     | copper-600           | copper-400              |
| Input bg         | navy-50              | navy-800                |
| Input focus bg   | white                | navy-700                |

Belangrijk: in dark mode worden primaire buttons en selected states copper in plaats van navy. Dit zorgt voor voldoende contrast en een warm accent.

---

## Achtergrond

Subtiele radiale gradienten op de body voor visuele diepte:

```
Light:
  - Copper glow linksboven (7% opacity)
  - Navy glow rechtsonder (5% opacity)

Dark:
  - Copper glow linksboven (5% opacity)
  - Navy glow rechtsonder (10% opacity)
```

---

## Chart

CSS variabelen voor Recharts integratie:

| Variabele            | Light                         | Dark                          |
|----------------------|-------------------------------|-------------------------------|
| `--chart-grid`       | navy-100 (#dce6f5)           | navy-700 (#163058)            |
| `--chart-tick`       | navy-400 (#4a7cc4)           | navy-300 (#7ba3db)            |
| `--chart-axis`       | navy-100 (#dce6f5)           | navy-700 (#163058)            |
| `--chart-stroke`     | copper-500 (#c8956c)         | copper-400 (#d4a87e)          |
| `--chart-fill-start` | copper-500 @ 30%             | copper-400 @ 35%              |
| `--chart-fill-end`   | copper-500 @ 3%              | copper-400 @ 3%               |

---

## Naming conventions

- **CSS classes**: BEM - `.block__element--modifier`
- **CSS via**: `@apply` in `.css` bestanden, geen inline Tailwind in JSX
- **Component bestanden**: PascalCase mappen met `ComponentName.tsx`, `ComponentName.css`, `index.ts`
- **i18n**: alle UI-teksten via i18n, code in het Engels
- **Constanten**: geen magic strings, gebruik `constants/app.ts` en enums

---

## Scrollbars (WebKit)

```css
height: 6px
track: transparant
thumb: navy-300/50 (light) / navy-600/50 (dark), rounded-full
thumb hover: navy-300 / navy-600
```

---

## Accessibility

- `focus-visible` outline op alle interactieve elementen
- `sr-only` class voor screen reader content
- `aria` attributen waar nodig
- Keyboard navigatie support
- `color-scheme: dark` in dark mode
- `::selection` met copper accent
- `env(safe-area-inset-bottom)` voor mobile tab bar
