# DESIGN.md — Cobo Agentic Wallet × Apple Design Language

> This file follows the [Google Stitch DESIGN.md format](https://stitch.withgoogle.com/docs/design-md/format/).
> AI agents should read this file to generate consistent UI.

---

## 1. Visual Theme & Atmosphere

- **Philosophy**: Whitespace is content. Every pixel earns its place.
- **Mood**: Calm confidence — the user trusts this app with real money.
- **Density**: Spacious. Apple-level breathing room (≥16px between sections, ≥12px between elements).
- **Decoration**: Near-zero. No gradients, no glow shadows, no mesh backgrounds, no decorative blobs.
- **Motion**: Subtle and purposeful — spring-based entry animations, no hover scale/translate effects.
- **Reference**: Apple.com product pages, iOS Settings, Apple Wallet.

---

## 2. Color Palette & Roles

All colors in HSL format for CSS custom properties.

### Light Mode

| Token | HSL | Hex | Role |
|-------|-----|-----|------|
| background | 0 0% 100% | #FFFFFF | Page background |
| foreground | 0 0% 11.4% | #1D1D1F | Primary text |
| muted | 240 6% 95% | #F2F2F7 | Grouped background, secondary buttons |
| muted-foreground | 240 1% 53% | #86868B | Secondary text, descriptions |
| card | 0 0% 100% | #FFFFFF | Card surface |
| border | 240 6% 90% | #E5E5EA | Separators, dividers |
| primary | 233.8 74.7% 48% | #1F32D6 | Cobo brand blue — CTAs, active states |
| primary-foreground | 0 0% 100% | #FFFFFF | Text on primary |
| success | 142 71% 49% | #34C759 | Positive states (Apple green) |
| warning | 28 100% 50% | #FF9500 | Caution states (Apple orange) |
| destructive | 4 100% 60% | #FF3B30 | Error states (Apple red) |

### Dark Mode

| Token | HSL | Hex | Role |
|-------|-----|-----|------|
| background | 0 0% 11% | #1C1C1E | Page background |
| foreground | 240 7% 97% | #F5F5F7 | Primary text |
| muted | 0 0% 17% | #2C2C2E | Grouped background |
| muted-foreground | 240 1% 64% | #A1A1A6 | Secondary text |
| border | 0 0% 22% | #38383A | Separators |
| primary | 233 74% 63% | #4A5FFF | Cobo brand blue (lightened for dark) |
| success | 142 69% 52% | #30D158 | Apple green (dark) |
| warning | 32 100% 52% | #FF9F0A | Apple orange (dark) |
| destructive | 0 100% 61% | #FF453A | Apple red (dark) |

### Usage Rules

- **Only accent color**: Cobo blue (#1F32D6). Used exclusively for CTAs and active tab indicators.
- **Status colors**: Green/Orange/Red for semantic meaning only — never decorative.
- **No color gradients** on surfaces. Flat solid colors only.
- **Separator** (not border): Use the separator token for dividers between list items.

---

## 3. Typography Rules

### Font Stack

```css
font-family: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif;
font-mono: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;
```

### Type Scale

| Level | Size | Weight | Letter-spacing | Line-height | Use |
|-------|------|--------|---------------|-------------|-----|
| Large Title | 34px | 700 | -0.4px | 1.1 | Balance display |
| Title 1 | 28px | 700 | -0.4px | 1.15 | Page titles |
| Title 2 | 22px | 700 | -0.3px | 1.2 | Section headers |
| Title 3 | 20px | 600 | -0.2px | 1.25 | Card titles, nav bar title |
| Headline | 17px | 600 | -0.4px | 1.3 | List item primary text |
| Body | 17px | 400 | -0.4px | 1.5 | Body copy |
| Callout | 16px | 400 | -0.3px | 1.4 | Supporting text |
| Subheadline | 15px | 400 | -0.2px | 1.35 | Subtitle, timestamps |
| Footnote | 13px | 400 | -0.1px | 1.35 | Labels, meta |
| Caption 1 | 12px | 400 | 0 | 1.3 | Small annotations |
| Caption 2 | 11px | 400 | 0.1px | 1.2 | Badges, tab labels |

### Rules

- **All titles use negative letter-spacing** (tracking-tight). This is the signature Apple "tight big text" feel.
- **Body text uses -0.4px tracking** — tighter than web default, matches iOS.
- **Antialiasing**: Always `-webkit-font-smoothing: antialiased`.

---

## 4. Component Stylings

### Cards

```
Background: white (card token)
Border: none or 1px separator color
Border-radius: 12-16px
Shadow: 0 1px 3px rgba(0,0,0,0.04) — barely visible
Hover: no visual change (no glow, no scale, no border color change)
```

### Buttons

| Variant | Background | Text | Border | Radius | Height |
|---------|-----------|------|--------|--------|--------|
| Primary | Cobo blue | White | None | 12px | 50px |
| Secondary | #F2F2F7 (muted) | #1D1D1F | None | 12px | 50px |
| Ghost | Transparent | #1D1D1F | None | 12px | 44px |
| Destructive | Transparent | #FF3B30 | None | 12px | 44px |

- **Font-weight**: 600 (semibold) for all buttons
- **No gradients, no shadows** on buttons

### Inputs

```
Background: #F2F2F7 (muted)
Border: none (focus: 1px ring in accent color)
Border-radius: 10px
Height: 44px
Font-size: 16px (prevents iOS zoom)
```

### Navigation Bar (Header)

```
Height: 44px
Background: rgba(255,255,255,0.72) + backdrop-filter: blur(20px) saturate(180%)
Title: 20px semibold, centered or left-aligned
Border-bottom: 1px separator (only when scrolled)
Position: sticky top-0
```

### Tab Bar (Bottom Nav)

```
Background: rgba(255,255,255,0.72) + backdrop-filter: blur(20px) saturate(180%)
Icon size: 24px
Label size: 10px
Active color: Cobo blue
Inactive color: #8E8E93
```

### Grouped List (Apple Settings style)

```
Container background: #F2F2F7 (muted)
Row background: white
Row height: 44px minimum
Row padding: 16px horizontal
Separator: 1px, inset 16px from left
Border-radius: 12px on container (first/last row rounded)
```

### Status Badges

```
Small pill shape: px-2 py-0.5, rounded-full
Font: 11px, weight 500
Background: status color at 10% opacity
Text: status color at full
```

---

## 5. Layout Principles

| Property | Value |
|----------|-------|
| Page horizontal padding | 16px |
| Section gap | 24px |
| Card internal padding | 16px |
| List row height | 44px (minimum touch target) |
| List separator inset | 16px from left edge |
| Icon container (small) | 32×32px, 8px radius |
| Icon container (medium) | 36×36px, 8px radius, tinted background |
| Content max-width | 430px (PhoneFrame constraint) |

### Whitespace Philosophy

- **More space = more premium**. When in doubt, add padding, not decoration.
- **Grouped sections**: Use muted (#F2F2F7) background behind card groups — the contrast itself creates hierarchy without borders.

---

## 6. Depth & Elevation

| Level | Use | Shadow | Background |
|-------|-----|--------|------------|
| 0 | Page | None | background |
| 1 | Cards, list groups | 0 1px 3px rgba(0,0,0,0.04) | card |
| 2 | Modals, popovers | 0 8px 40px rgba(0,0,0,0.12) | card + blur |
| 3 | Drawers, sheets | 0 -4px 40px rgba(0,0,0,0.15) | card + blur |

- **No colored shadows** (no glow-primary, glow-success, etc.)
- **Blur = elevation**: Frosted glass (backdrop-filter blur) signals "floating above content"

---

## 7. Do's and Don'ts

### Do

- Use whitespace to create hierarchy
- Use separator lines (not borders) between list items
- Use negative letter-spacing on headings
- Use the muted background to group related items
- Use flat solid colors — let typography carry the design
- Use subtle spring animations for page transitions

### Don't

- Use gradient backgrounds on cards, buttons, or pages
- Use colored glow/shadow effects
- Use decorative mesh/blob backgrounds
- Use hover scale/translate/glow effects
- Use icon containers with gradient backgrounds
- Use more than one accent color (Cobo blue is the only one)
- Use heavy borders — prefer separators or background contrast

---

## 8. Responsive Behavior

- App is locked to 430px PhoneFrame — no responsive breakpoints needed
- Maintain 16px horizontal padding universally
- Touch targets: minimum 44×44px
- Bottom safe area: respect home indicator (34px)

---

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background: white / #F2F2F7 (grouped)
Text: #1D1D1F / #86868B (secondary) / #AEAEB2 (tertiary)
Accent: #1F32D6 (Cobo blue)
Success: #34C759 | Warning: #FF9500 | Error: #FF3B30
Separator: #E5E5EA
```

### Ready-to-Use Prompts

- "Build a settings page with Apple-style grouped list rows, 44px height, separator between items, muted background behind groups"
- "Create a balance card with large 34px bold number, negative tracking, on white background, no gradient"
- "Design a bottom tab bar with frosted glass background, 24px icons, 10px labels, Cobo blue active state"
- "Make a confirmation dialog with centered icon, Title 2 heading, Body description, Primary + Ghost buttons"
