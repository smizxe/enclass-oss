# DiepClass Design System Reference

This document defines the visual language extracted from the homepage design. **All future pages should follow these guidelines.**

## Color Palette

| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| Primary | `#4f46e5` | `indigo-600` | Main CTA buttons, active states, links |
| Primary Dark | `#3730a3` | `indigo-800` | Hover states, dark accents |
| Primary Light | `#e0e7ff` | `indigo-100` | Backgrounds, selection states |
| Text Dark | `#0f172a` | `slate-900` | Headings, important text |
| Text Medium | `#475569` | `slate-600` | Body text |
| Text Light | `#94a3b8` | `slate-400` | Muted text, placeholders |
| Background | `#f8fafc` | `slate-50` | Page backgrounds |
| Surface | `#ffffff` | `white` | Cards, modals |
| Border | `#e2e8f0` | `slate-200` | Borders, dividers |
| Success | `#10b981` | `emerald-500` | Completed states, positive feedback |
| Warning | `#f97316` | `orange-500` | Attention, streaks |
| Danger | `#ef4444` | `red-500` | Errors, notifications |

## Typography

- **Font Family**: `Plus Jakarta Sans` (Google Fonts)
- **Headings**: `font-bold`, `tracking-tight`
- **Body**: `leading-relaxed`, `text-slate-600`

## Effects

- **Glass Nav**: `background: rgba(255,255,255,0.9); backdrop-filter: blur(12px);`
- **Fade In Animation**: `translateY(20px) -> translateY(0)`, `opacity: 0 -> 1`
- **Gradient Blobs**: Large blurred circles with `mix-blend-multiply`
- **Shadows**: `shadow-xl shadow-indigo-600/25` for primary buttons

## Border Radius

- **Buttons**: `rounded-lg` (8px) or `rounded-xl` (12px)
- **Cards**: `rounded-xl` (12px) or `rounded-2xl` (16px)
- **Avatars**: `rounded-full`

## Spacing

- **Container**: `max-w-7xl mx-auto px-6`
- **Section Padding**: `py-24`
