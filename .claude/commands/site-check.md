# EM Patisserie — On-Demand Site Health Check

Run a full health check on the EM Patisserie production website and report findings.

## Instructions

Perform all of the following checks, then deliver a concise report. Skip verbose explanations for healthy sections — just confirm the status and key numbers.

### 1. Deployment Status
```bash
cd "/Users/shaunakdeshpande/Documents/Website Vibe Coding /cafe-site" && vercel ls 2>&1 | head -10
```
Report last 3 deploys with status and timestamps. Flag any failures.

### 2. Build Check
```bash
cd "/Users/shaunakdeshpande/Documents/Website Vibe Coding /cafe-site" && npx next build 2>&1 | tail -30
```
Report PASS or the specific error. If it fails, identify the file, line, and suggest the fix.

### 3. Runtime Errors
Use the Vercel MCP `get_runtime_logs` tool (project: "cafe-site", level: "error") for the last 24 hours.
Report count and error patterns. If zero, say "Clean."

### 4. Database Health
Use Supabase MCP `execute_sql`:

```sql
-- Activity snapshot
SELECT 
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE) as orders_today,
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE) as orders_yesterday,
  (SELECT COUNT(*) FROM custom_order_requests WHERE status = 'new') as unreviewed_custom,
  (SELECT COUNT(*) FROM orders WHERE status IN ('received','preparing') AND created_at < NOW() - INTERVAL '2 hours') as stuck_orders,
  (SELECT COUNT(*) FROM daily_inventory WHERE date = CURRENT_DATE) as inventory_items_set,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM orders) as total_orders;
```

Flag stuck orders and unreviewed custom requests as action items.

### 5. Site Accessibility
Verify these URLs return 200 (use curl or WebFetch):
- https://cafe-site-shaunak1.vercel.app/
- https://cafe-site-shaunak1.vercel.app/menu
- https://cafe-site-shaunak1.vercel.app/order
- https://cafe-site-shaunak1.vercel.app/api/menu

### 6. Upcoming Events
```sql
SELECT title, event_date, capacity,
  (SELECT COUNT(*) FROM event_signups WHERE event_id = events.id) as signups
FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date LIMIT 3;
```

### 7. Suggestions
Based on findings, provide 1-3 actionable suggestions. Reference the "Pending / Future Work" section of CLAUDE.md if relevant.

## Output Format

```
# EM Patisserie — Site Check

📅 [date and time]  
🚦 [🟢 Healthy / 🟡 Attention Needed / 🔴 Issues Found]

## Quick Summary
[2-3 bullet points covering the key findings]

## Deployments: [status]
## Build: [PASS/FAIL]
## Runtime Errors: [count]
## Database: [orders today] orders today, [stuck] stuck, [unreviewed] unreviewed custom
## Pages: [all up / X down]
## Inventory: [set / not set]

## Action Items
[If any — numbered list of things needing immediate attention]

## Suggestions
[1-3 improvement ideas]
```
