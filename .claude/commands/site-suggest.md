# EM Patisserie — Suggest Improvements

Analyse the current state of the EM Patisserie website and suggest concrete improvements. If the user provides a focus area (e.g. "performance", "mobile", "security"), limit suggestions to that area. Otherwise, cover all categories.

## Context
- **Project**: /Users/shaunakdeshpande/Documents/Website Vibe Coding /cafe-site
- **CLAUDE.md**: Read this file first for full project context, pending work, and known issues
- **Live URL**: https://cafe-site-shaunak1.vercel.app

## Analysis Areas

### Security
- Check admin auth pattern (currently header-based password, no session/cookie)
- Check for exposed secrets or credentials in source code
- Review API routes for missing auth checks or input validation
- Check RLS policies on Supabase tables

### Performance
- Check image sizes and formats (should be WebP, properly sized)
- Check for unnecessary client-side JavaScript (bundle size)
- Look for N+1 queries or unnecessary database calls
- Check if static pages that could be statically generated are marked as dynamic

### UX / Accessibility
- Check mobile responsiveness of key pages (checkout, menu, admin)
- Verify form labels, ARIA attributes, and keyboard navigation
- Check for colour contrast issues against WCAG standards
- Look for missing loading states or error boundaries

### Code Quality
- Look for duplicated logic that could be extracted
- Check for TypeScript `any` types that should be typed
- Identify dead code or unused imports
- Review error handling — are errors caught and surfaced to users?

### Business / Operations
- Review the "Pending / Future Work" section in CLAUDE.md
- Check if any tabled features are now easy to implement
- Suggest operational improvements (better admin workflows, reporting)

## Output Format

Deliver suggestions grouped by priority:

```
# EM Patisserie — Improvement Suggestions

## 🔴 Critical (fix soon)
[Security issues, broken functionality, data integrity risks]

## 🟡 Important (this week)
[UX problems, performance issues, missing validation]

## 🟢 Nice to Have (when time allows)
[Code cleanup, minor enhancements, future features]
```

For each suggestion:
- **What**: one-line description
- **Why**: the concrete impact (not vague "improves user experience")
- **How**: the specific files/changes needed (file paths, line numbers if possible)
- **Effort**: Quick (< 30 min) / Medium (1-2 hours) / Large (half day+)

Limit to 8-10 suggestions total. Quality over quantity.
