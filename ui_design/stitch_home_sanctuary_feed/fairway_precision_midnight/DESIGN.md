# Design System Strategy: The Midnight Fairway

## 1. Overview & Creative North Star
**Creative North Star: The Elite Nocturnal Narrative**

This design system moves away from the "data-heavy spreadsheet" feel of traditional sports trackers. Instead, it adopts a high-end editorial aesthetic that mimics a premium clubhouse lounge at twilight. By leveraging deep tonal shifts and "luminous" accents, we create a sense of depth and prestige. 

The system rejects the "flat" trend. We utilize **Intentional Asymmetry**—where scorecards may bleed off the edge of a container—and **Layered Luminance** to ensure the user’s performance data feels like a curated gallery rather than a list of numbers. The goal is a digital experience that feels as tactile and bespoke as a custom-fitted set of irons.

---

## 2. Colors & Atmospheric Depth

The palette is rooted in the "Deep Emerald" and "Charcoal" core, but its sophistication comes from how we nest these tones.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be established solely through background color shifts or subtle tonal transitions. For example, a statistics module (using `surface_container_low`) should sit on the main `surface` background to define its shape naturally.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
- **Base Layer:** `surface` (#070e1d) for the primary application background.
- **Secondary Tier:** `surface_container` (#11192b) for primary content cards.
- **Focus Tier:** `surface_container_highest` (#1b263b) for active states or "Pop-out" score summaries.

### The "Glass & Gradient" Rule
To elevate the "Premium" feel, floating action buttons or high-level navigation headers should utilize **Glassmorphism**. Apply `surface_variant` at 60% opacity with a `20px` backdrop blur. 
- **Signature Texture:** Use a subtle linear gradient on primary CTAs transitioning from `primary` (#aaead0) to `primary_container` (#6fad95) at a 135-degree angle. This adds "soul" and prevents the interface from looking digitally sterile.

---

## 3. Typography: Editorial Authority

We use **Plus Jakarta Sans** not just for legibility, but as a brand signifier.

- **Display Scale (`display-lg` to `display-sm`):** Reserved for scores and par totals. These should use tight letter-spacing (-0.02em) to feel authoritative and "engineered."
- **Headline & Title Scale:** Used for course names and round dates. These provide the editorial "voice."
- **Body & Labels:** Use `on_surface_variant` (#a4abbf) for secondary metadata to ensure the "Night-time" review remains easy on the eyes by reducing white-text glare.

**The Contrast Rule:** All critical performance numbers (Birdies, Eagles, Total Score) must utilize the `secondary` (#bff365) "Vibrant Lime" token. This creates a high-contrast focal point against the dark emerald depths.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "web 2.0" for this system. We achieve lift through light, not shadow.

- **The Layering Principle:** Stack `surface_container_lowest` (#000000) cards on a `surface_container_low` (#0b1323) background to create a "sunken" or "embedded" feel for secondary stats.
- **Ambient Shadows:** For high-priority floating elements, use a diffused shadow: `Y: 20px, Blur: 40px, Color: rgba(0, 0, 0, 0.4)`. The shadow must feel like an ambient occlusion, not a hard silhouette.
- **The "Ghost Border" Fallback:** If a divider is functionally required for accessibility, use the `outline_variant` token at **15% opacity**. Never use 100% opaque lines.
- **Glassmorphism:** Use semi-transparent `surface_bright` (#212c43) for overlays. This allows the lush emerald greens of the background to bleed through, maintaining a cohesive atmospheric "glow."

---

## 5. Components & Primitive Styling

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`). Text in `on_primary_container`. Radius: `Round Eight` (0.5rem).
- **Secondary:** Surface-only. Use `surface_container_high` as the base with `primary` text.
- **Tertiary:** Ghost style. No background. Use `primary` text with a 0.5rem padding for touch targets.

### Cards & Scoreboards
- **The Divider Ban:** Do not use lines to separate holes 1 through 18. Instead, use a alternating background shift (e.g., Hole 1: `surface_container`, Hole 2: `surface_container_low`) or simple `1.5rem` vertical spacing.
- **Highlight Cards:** Use `secondary_container` (#476800) for "Personal Best" moments, paired with `secondary` (#bff365) text for a luminous glow.

### Input Fields & Controls
- **Text Inputs:** Use `surface_container_highest` with a "Ghost Border" of `outline_variant` at 20%.
- **Checkboxes/Radios:** When selected, use the `secondary` (#bff365) lime accent. This is the "high-vis" beacon of the UI.
- **Chips:** For "Fairway Hit" or "Green in Regulation" tags, use `tertiary_container` with `tertiary` text for a sophisticated teal-on-dark-green look.

### Specific App Components
- **The Score Arc:** A custom visualization component using `secondary` lime for the "Current Score" path and `outline` for the "Target" path.
- **Hole Detail Drawer:** Uses full Glassmorphism (`backdrop-blur: 16px`) to overlay the course map, ensuring the user never loses context of the "Midnight" aesthetic.

---

## 6. Do’s and Don’ts

### Do:
- **Use "Breathing Room":** Leverage the `spacing.10` (2.5rem) and `spacing.12` (3rem) tokens to give high-end stats room to breathe.
- **Embrace the Dark:** Allow large areas of `surface` (#070e1d) to remain empty. This "negative space" is what makes the app feel premium.
- **Focus on the "Glow":** Use the Lime `secondary` color sparingly—only for the most important data points.

### Don’t:
- **No Pure White:** Never use #FFFFFF. Always use `on_surface` (#dfe5fa) to prevent eye strain in low light.
- **No Hard Boxes:** Avoid the "boxed-in" look. Let content flow; use the `Round Eight` (0.5rem) radius to soften every interaction.
- **No Default Grids:** Avoid standard 12-column layouts for stats. Try staggered "masonry" styles for round highlights to maintain an editorial feel.