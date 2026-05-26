# CustodyCore Frontend Task

## Status
- [x] next.config.ts (rewrites proxy)
- [x] .env.local
- [x] app/page.tsx (redirect)
- [x] components/TopBar.tsx
- [x] components/StatusBadge.tsx
- [x] components/Modal.tsx
- [x] app/(dashboard)/layout.tsx
- [x] dashboard/page.tsx
- [x] cases/page.tsx
- [x] evidence/page.tsx
- [x] evidence/new/page.tsx
- [x] lab/page.tsx
- [x] audit/page.tsx
- [x] personnel/page.tsx
- [ ] disclosure/page.tsx
- [ ] ai-summaries/page.tsx
- [ ] settings/page.tsx
- [ ] app/login/page.tsx
- [ ] README.md
- [ ] npm run build verify

## Decisions
- API proxy: /api/* → http://localhost:3000/api/*
- No auth middleware
- Tailwind custom tokens (bg-secondary, etc.)
- Material Symbols for icons
