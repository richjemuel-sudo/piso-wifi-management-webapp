# Dropping this into WIFI_MANAGEMENT_WEBAPP/pisowifi-frontend

1. Install the one new dependency (icons):
   npm install lucide-react

2. Copy these files into your project, same paths:
   - tailwind.config.js        → replaces yours (or merge the `theme.extend` block if you've customized it already)
   - src/index.css             → replaces yours (keep your @tailwind directives if you had extra rules below them)
   - src/App.jsx                → replaces the "Tailwind is Working" test file
   - src/data/mockData.js       → new
   - src/components/Sidebar.jsx
   - src/components/Header.jsx
   - src/components/StatCard.jsx
   - src/components/DailySalesChart.jsx
   - src/components/ActiveSessions.jsx
   - src/components/RecentVouchers.jsx
   - src/components/StatusPill.jsx

3. main.jsx doesn't need any changes — it already renders <App />.

4. Run it:
   npm run dev

## Color tokens (sampled straight from your Figma export)

- Page background:     #0A1130  → `bg-navy-bg`
- Card background:      #111C44  → `bg-navy-card`
- Sidebar background:   #1B2559  → `bg-navy-sidebar`
- Teal accent (peso amounts, bars): #2DD4BF → `text-brand-teal` / `bg-brand-teal`
- Online status text:   #20B05B  → `text-brand-green`

If anything looks off against your Figma file (Figma sometimes exports at less
than 100% opacity), open your Figma file, select the layer, and check the
exact hex in the right panel — then update the values in `tailwind.config.js`.
I sampled these from the screenshot pixel-by-pixel, which is accurate but not
a substitute for reading Figma's own color panel.

## Moving from mock data to your backend

Every component takes props shaped exactly like the mock data
(`src/data/mockData.js`). To wire in your real API, in `App.jsx`:

```jsx
const [stats, setStats] = useState(null);
useEffect(() => {
  fetch("http://<your-backend>/api/dashboard/stats")
    .then((r) => r.json())
    .then(setStats);
}, []);

if (!stats) return <div className="p-6 text-white">Loading…</div>;
```

Do the same for `dailySalesChart`, `activeSessions`, and `recentVouchers` —
one endpoint each is the cleanest split, matching the four mock exports.
The voucher delete button already calls an `onDelete` prop — point that at a
`DELETE /api/vouchers/:id` call once the backend route exists.