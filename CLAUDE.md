# MoneyGrip

## Commands

- `npm run dev` — Dev server
- `npm run build` — TypeScript check + build
- `npm run lint` — ESLint

## Frontend Regels

- React 19 + TypeScript + Tailwind CSS 4 + Vite 7
- Mobile-first responsive design
- Component-based architectuur met single responsibility
- DRY: geen dubbele logica, herbruikbare componenten, gedeelde CSS classes in `src/style.css`
- SOLID: business logic gescheiden van UI (strategies, interfaces, models in eigen mappen)
- Semantische HTML: juiste elementen (`<main>`, `<header>`, `<section>`, etc.) voor toegankelijkheid en SEO
- W3C-valide HTML: correcte nesting, alt-attributen op images, labels bij inputs
- Accessibility (WCAG): aria-attributen, keyboard navigatie, voldoende kleurcontrast, focus-visible states
- BEM class naming: `.block__element--modifier` (bijv. `.mobile-tab--active`)
- CSS classes via `@apply` in `src/style.css`, geen inline Tailwind in JSX
- UI-teksten in het Nederlands, code in het Engels
- Gebruik Tailwind functions and directives
