# Cobo Merchant Wallet Design System

A professional, bank-grade design system focused on trust, security, and clarity.

---

## 🎨 Color Tokens

All colors use HSL format and are defined as CSS custom properties in `src/index.css`.

### Core Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | White | Dark navy | Page backgrounds |
| `--foreground` | Near black | Light gray | Primary text |
| `--card` | White | Dark navy | Card backgrounds |
| `--muted` | Light gray | Dark gray | Subtle backgrounds |
| `--muted-foreground` | Medium gray | Light gray | Secondary text |

### Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | Cobo Blue (#1F32D6) | Primary actions, CTAs |
| `--accent` | Same as primary | Interactive elements, links |

### Status Colors

| Token | Color | Usage |
|-------|-------|-------|
| `--success` | Green | Positive states, completed, received funds |
| `--warning` | Amber/Orange | Caution, pending, important notes |
| `--warning-surface` | #FCF5EA (light) | Warning banner backgrounds |
| `--destructive` | Red | Errors, risks, dangerous actions |
| `--trust` | Teal | iCloud, Apple-related positive states |

### Text Hierarchy

| Token | Usage |
|-------|-------|
| `foreground` | Primary text, key information |
| `muted-foreground` | Secondary labels, descriptions |
| `text-placeholder` | Input placeholders (lighter gray) |

---

## 📐 Spacing & Layout

### Page Padding
- **Horizontal padding**: `16px` (`px-4`) on all pages

### Container
- **Max width**: `430px` (mobile-first wallet)
- **Center aligned** with `padding: 1rem`

---

## 🔘 Component Sizes

### Button Heights

| Size | Height | Tailwind | Usage |
|------|--------|----------|-------|
| `sm` | 32px | `h-8` | Small actions, tags |
| `md` | 40px | `h-10` | Secondary buttons |
| `lg` / `default` | 48px | `h-12` | Primary CTAs, main actions |

### Input Heights
- **Standard**: `48px` (`h-12`)

### Icon Containers

Icons should be **half the size** of their container:

| Size | Container | Icon | Usage |
|------|-----------|------|-------|
| `sm` | 32px (`w-8 h-8`) | 16px (`w-4 h-4`) | List items, menu icons |
| `md` | 40px (`w-10 h-10`) | 20px (`w-5 h-5`) | Card icons, feature icons |
| `lg` | 48px (`w-12 h-12`) | 24px (`w-6 h-6`) | Hero icons, primary features |
| `xl` | 64px (`w-16 h-16`) | 32px (`w-8 h-8`) | Page hero, transaction details |
| `2xl` | 80px (`w-20 h-20`) | 40px (`w-10 h-10`) | Success states, onboarding |

### Border Radius

| Size | Value | Tailwind | Usage |
|------|-------|----------|-------|
| `sm` | 4px | `rounded-sm` | Small elements |
| `md` | 6px | `rounded-md` | Medium elements |
| `lg` | 8px | `rounded-lg` | Buttons, inputs |
| `xl` | 12px | `rounded-xl` | Cards, dialogs, modals |
| `2xl` | 16px | `rounded-2xl` | Large containers, drawer corners |

---

## 🔤 Typography

### Font Families
- **Sans**: Inter (primary)
- **Mono**: JetBrains Mono (addresses, hashes, amounts)

### Font Sizes

| Size | Tailwind | Usage |
|------|----------|-------|
| `text-xs` | 12px | Captions, timestamps, meta info |
| `text-sm` | 14px | Labels, helper text, descriptions |
| `text-base` | 16px | Form inputs, body text (default) |
| `text-lg` | 18px | Subheadings |
| `text-xl` | 20px | Section titles |
| `text-2xl` | 24px | Page titles |
| `text-3xl` | 30px | Large amounts, hero text |

### Icon Stroke Width
- **Global**: `1.5px` (enforced via CSS)

---

## 🧩 Components

### Buttons

```tsx
// Primary CTA (default)
<Button>确认</Button>

// Secondary action
<Button variant="secondary">取消</Button>

// Outline style
<Button variant="outline">查看详情</Button>

// Destructive action
<Button variant="destructive">删除</Button>

// Ghost (minimal)
<Button variant="ghost">更多</Button>

// Sizes
<Button size="sm">小按钮</Button>
<Button size="md">中按钮</Button>
<Button size="lg">大按钮</Button>
```

### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述文本</CardDescription>
  </CardHeader>
  <CardContent>
    内容区域
  </CardContent>
</Card>
```

### Inputs

```tsx
// Standard input (48px height)
<Input placeholder="请输入..." />

// With label
<div className="space-y-2">
  <Label>标签</Label>
  <Input />
</div>
```

### Badges

```tsx
<Badge>默认</Badge>
<Badge variant="secondary">次要</Badge>
<Badge variant="destructive">危险</Badge>
<Badge variant="outline">轮廓</Badge>
```

---

## ⚠️ Alert Banners

Two-tier visual hierarchy for inline alerts:

### 🟠 Orange Banner (Moderate / Important Note)

Use for: Tips, warnings, reminders, informational notices

```tsx
<div className="p-4 bg-warning-surface border border-warning/30 rounded-xl">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
      <AlertTriangle className="w-4 h-4 text-warning" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">重要提示</p>
      <p className="text-xs text-muted-foreground mt-0.5">说明文字</p>
    </div>
  </div>
</div>
```

**Examples**: 
- 备份提醒
- 安全提示
- 转账限额说明

### 🔴 Red Banner (High-Level / Danger)

Use for: Critical warnings, irreversible actions, emergency states

```tsx
<div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
      <AlertTriangle className="w-4 h-4 text-destructive" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-destructive">危险操作</p>
      <p className="text-xs text-muted-foreground mt-0.5">此操作不可撤销</p>
    </div>
  </div>
</div>
```

**Examples**:
- 不可撤销的操作
- 私钥导入警告
- MPC 逃逸状态

---

## 🔔 Toast Notifications

Toasts use the `sonner` library with custom styling. Import from `@/lib/toast`:

```tsx
import { toast } from '@/lib/toast';

// Success
toast.success('操作成功', '可选描述');

// Error
toast.error('操作失败', '请重试');

// Warning
toast.warning('请注意', '重要提示');

// Info
toast.info('提示', '说明信息');
```

### Toast Icon Styling
- Container: `w-7 h-7 rounded-full`
- Icon: `w-4 h-4 strokeWidth={1.5}`
- Colors: `bg-success`, `bg-destructive`, `bg-warning`, `bg-primary`

### Toast Positioning
- Position: `top-center`
- Top offset: `44px` (accounts for device notch)

---

## 🗂️ Navigation Patterns

### Primary Navigation (Segmented / Pills)

Use for top-level navigation:

```tsx
<div className="flex gap-2 p-1 bg-muted rounded-xl">
  <button className="px-4 py-2 rounded-lg bg-card font-medium">
    选中项
  </button>
  <button className="px-4 py-2 rounded-lg text-muted-foreground">
    未选中
  </button>
</div>
```

### Secondary Navigation (Underline Tabs)

Use for filters and categories:

```tsx
<div className="flex gap-6 border-b">
  <button className="pb-3 text-accent border-b-2 border-accent font-medium">
    选中项
  </button>
  <button className="pb-3 text-muted-foreground hover:text-foreground">
    未选中
  </button>
</div>
```

### Chain/Network Selector (Pills)

```tsx
<button className="px-3 py-1.5 rounded-full bg-muted text-foreground">
  Selected
</button>
<button className="px-3 py-1.5 rounded-full border border-border text-muted-foreground">
  Unselected
</button>
```

---

## 🎭 Shadows

| Level | CSS Variable | Usage |
|-------|--------------|-------|
| `sm` | `--shadow-sm` | Subtle elevation |
| `md` | `--shadow-md` | Cards, dropdowns |
| `lg` | `--shadow-lg` | Modals, drawers |
| `xl` | `--shadow-xl` | Elevated dialogs |

---

## ✨ Animations

### Standard Animations

| Name | Duration | Usage |
|------|----------|-------|
| `fade-in` | 300ms | General fade |
| `slide-up` | 400ms | Content entering |
| `slide-down` | 400ms | Dropdowns |
| `scale-in` | 300ms | Modals, dialogs |
| `pulse-soft` | 2s (infinite) | Loading states |
| `shimmer` | 2s (infinite) | Skeleton loading |

### Framer Motion Presets

```tsx
// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Spring transitions
const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
};
```

---

## 📱 Mobile Considerations

### Scrollbars
- Horizontal scrollbars are hidden on mobile
- Use `scrollbar-hide` utility class

### Bottom Button Positioning
Fixed bottom buttons should use:
```tsx
<div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-background">
  <Button className="w-full">确认</Button>
</div>
```

### Safe Areas
- Account for notch: `top: 44px` for toasts
- Bottom padding: `pb-8` for fixed buttons

---

## 📋 Quick Reference

### Do's ✅
- Use semantic color tokens (`text-foreground`, `bg-muted`)
- Use HSL colors only
- Import toasts from `@/lib/toast`
- Use `strokeWidth={1.5}` for all icons
- Use `rounded-xl` for cards, `rounded-lg` for buttons
- Use `h-12` (48px) for primary buttons and inputs

### Don'ts ❌
- Don't use hardcoded colors (`text-white`, `bg-black`)
- Don't import toasts directly from `sonner`
- Don't use inconsistent icon stroke widths
- Don't skip semantic tokens for status colors
- Don't use non-standard component heights

---

## 🔗 File References

| File | Purpose |
|------|---------|
| `src/index.css` | CSS variables, global styles |
| `tailwind.config.ts` | Tailwind theme configuration |
| `src/components/ui/button.tsx` | Button component |
| `src/components/ui/input.tsx` | Input component |
| `src/components/ui/card.tsx` | Card component |
| `src/components/ui/sonner.tsx` | Toast configuration |
| `src/lib/toast.ts` | Toast API wrapper |
