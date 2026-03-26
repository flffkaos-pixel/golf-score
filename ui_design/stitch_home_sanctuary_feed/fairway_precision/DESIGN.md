# The Design System: The Professional Caddie

## 1. Overview & Creative North Star

### Creative North Star: "The Elite Performance Journal"
This design system moves beyond the "standard utility app" into the realm of high-end editorial performance tools. It is inspired by the meticulous, quiet authority of a professional caddie—providing precisely what is needed with silent, premium execution.

To break the "template" look, we employ **Intentional Asymmetry** and **Organic Layering**. We reject rigid, boxed-in grids in favor of wide breathing room (`spacing-24`), overlapping "biophilic" curves that mimic the contour of a fairway, and a high-contrast typographic scale that treats every scorecard like a page from a luxury sports chronicle. The result is an interface that feels less like software and more like a bespoke sporting heirloom.

---

## 2. Colors & Atmospheric Tones

Our palette is rooted in the "Forest to Fairway" spectrum. It uses deep, authoritative greens to establish trust and high-energy lime accents to highlight performance metrics.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
*   **Definition through Tonality:** Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background provides all the separation required. 
*   **The "Glass & Gradient" Rule:** To provide visual "soul," use subtle linear gradients (e.g., `primary` to `primary-container`) for hero backgrounds. For floating HUDs (Heads-Up Displays) over course maps, use Glassmorphism: `surface` color at 70% opacity with a `20px` backdrop-blur.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create depth without shadows:
1.  **Base Layer:** `surface` (#f8f9fa) – The broad landscape.
2.  **Sectioning:** `surface-container-low` (#f3f4f5) – Grouping related content.
3.  **Actionable Cards:** `surface-container-lowest` (#ffffff) – Highlighting the primary focus (the "Scorecard").
4.  **Elevated Overlays:** `surface-bright` – Reserved for transient elements like tooltips or modal headers.

---

## 3. Typography: The Editorial Edge

The typography system pairs the technical precision of **Plus Jakarta Sans** with the approachable sophistication of **Manrope**.

*   **Display & Headlines (Plus Jakarta Sans):** Used for "The Big Numbers"—total scores, yardage, and handicaps. The high x-height and modern geometric forms convey high-performance data.
*   **Body & Titles (Manrope):** Used for course names, player stats, and descriptions. Its softer terminals provide a human touch to the professional data.

**Key Rule:** Large numerical data (Scores) should always use `display-lg` or `headline-lg` with `primary` color tokens to command the user’s attention immediately upon glance.

---

## 4. Elevation & Depth: Tonal Layering

We eschew the "Material 2" style of heavy shadows. Depth is achieved through the **Layering Principle**.

*   **Tonal Stacking:** Place a `surface-container-lowest` card on a `surface-container-low` background. The shift in value creates a "soft lift" that feels architectural rather than digital.
*   **Ambient Shadows:** When a floating effect is required (e.g., a "Start Round" FAB), use an extra-diffused shadow: `Blur: 24px`, `Opacity: 6%`, `Color: on-surface` (#191c1d). This mimics natural, overcast light on a golf course.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` at **15% opacity**. Never use 100% opaque borders.
*   **Biophilic Curves:** Containers should utilize the `xl` (1.5rem) roundedness scale on top corners only, or asymmetrically, to evoke the organic curves of greens and bunkers.

---

## 5. Components

### The Performance Scorecard (Specialized)
*   **Structure:** No dividers. Use `surface-container-highest` for the current hole row and `surface` for others.
*   **Inputs:** Numerical inputs for strokes must be "Touch-First" large targets using `primary-container` backgrounds and `headline-md` typography.

### Buttons (The "Tee-Off" Style)
*   **Primary:** Solid `primary` background. No border. `xl` roundedness. High-contrast `on-primary` text.
*   **Secondary:** `primary-fixed-dim` background. Provides a softer, premium alternative for "Save for Later" actions.
*   **Tertiary:** No background. Text-only in `secondary`. Use for "Cancel" or "Edit Course Settings."

### Course Selection Lists
*   **Constraint:** Forbid the use of divider lines.
*   **Visual Style:** Use vertical white space (`spacing-6`) and subtle background shifts on hover/press. Leading elements should be high-resolution course thumbnails with `md` rounded corners.

### Specialized Data Viz: "The Fairway Arc"
*   Use `tertiary` (Lime) for positive trends (Birdies, Greens in Regulation) and `on-primary-container` for neutral data. 
*   Charts must use "soft" paths (spline curves) rather than jagged lines to maintain the biophilic aesthetic.

---

## 6. Do’s and Don'ts

### Do
*   **Do** use `spacing-12` and `spacing-16` generously. Premium design is defined by the space you *don't* fill.
*   **Do** use overlapping elements. A player’s profile photo overlapping a course header creates a custom, editorial feel.
*   **Do** prioritize "Glanceability." A golfer on the 14th hole should see their score from 3 feet away.

### Don’t
*   **Don't** use pure black (#000000). Use `primary` or `on-surface` for deep tones.
*   **Don't** use standard "Select" dropdowns. Use custom bottom sheets or elegant full-screen list selections.
*   **Don't** use harsh 90-degree corners. Everything should have at least the `sm` (0.25rem) radius to feel organic.
*   **Don't** ever use a 1px solid divider line. Use a `12px` gap or a subtle tone shift instead.