# Bug: Welcome screen horizontal scroll left margin

## Status
Open — needs manual fix.

## Location
`src/screens/onboarding/WelcomeScreen.tsx` — the persona preset horizontal scroll section at the bottom of the welcome screen.

## Problem
The first card in the horizontal scroll list sits flush against the left edge of the screen. It should have a 24px (1.5rem / `px-6`) left margin that matches the page padding.

## Root cause
The parent container uses `px-6` for page padding. The scroll container uses `-mx-6` to break out to the viewport edges so the scroll track reaches edge to edge. The left inset for the first card needs to be re-introduced inside the scroll container.

Three approaches were attempted and all failed:

1. **`ml-6` on first card / `mr-6` on last card** — did not produce visible spacing.
2. **`-mx-6 px-6` on the scroll container** — `padding-left` and `padding-right` on an `overflow-x: auto` element are consumed by the scroll overflow in most browsers and do not render visually.
3. **Spacer `<div>` elements** (`<div class="shrink-0 w-6">`) at the start and end of the flex scroll container — still did not produce the expected spacing.

## Current state (after attempt 3)
The scroll container has explicit spacer divs:
```tsx
<div className="flex overflow-x-auto pb-2 -mx-6 snap-x scrollbar-none">
  <div className="shrink-0 w-6" aria-hidden="true" />
  {/* ...cards with ml-3 between them... */}
  <div className="shrink-0 w-6" aria-hidden="true" />
</div>
```

## Likely fix direction
- Verify in browser DevTools whether the spacer div is actually rendered (it may be collapsed by flex).
- Try `min-w-[1.5rem]` instead of `w-6` on the spacers.
- Alternatively, wrap the entire scroll section in its own full-bleed container (remove `-mx-6`, use a parent div that is full viewport width) and apply `padding-inline` via CSS custom properties.
- Another option: use `::before` / `::after` pseudo-elements with `content: ''` and fixed width as scroll spacers (these are not flex-collapsed in some engines).
