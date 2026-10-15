<script lang="ts">
  import { Map, NavigationControl, Popup, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
  import 'maplibre-gl/dist/maplibre-gl.css'
  // maplibre mencari worker relatif ke file-nya sendiri; setelah dibundel Vite file itu tidak ada, jadi peta blank
  import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
  setWorkerUrl(workerUrl)

  let { height = '520px' }: { height?: string } = $props()
  let el: HTMLDivElement
  let map: Map | undefined

  // dibuka zoom dekat di Kemang (Jl. Kemang Raya): pin gerai dan gedung 3D sekitar langsung terlihat
  const KEMANG: [number, number] = [106.8137, -6.2615]
  const SLA_HOURS = 24
  // light/base/dark dipakai gradien pin supaya terlihat timbul seperti ikon 3D
  const STATUS = {
    late: { color: '#f04438', light: '#ff9c94', dark: '#b42318', label: 'Lewat SLA', order: 2 },
    open: { color: '#f79009', light: '#ffc86b', dark: '#b54708', label: 'Dalam SLA', order: 1 },
    clear: { color: '#12b76a', light: '#73e2a3', dark: '#067647', label: 'Tidak ada permintaan', order: 0 },
  }
  type Status = keyof typeof STATUS
  const KEYS = Object.keys(STATUS) as Status[]

  let counts = $state<Record<Status, number>>({ late: 0, open: 0, clear: 0 })
  let shown = $state<Status[]>([...KEYS])
  const num = (n: number) => n.toLocaleString('id-ID')
  // ponytail: sub-cabang = 5 kota administrasi DKI, tetap sampai ada master data cabang
  const stats = $derived([
    { label: 'Gerai', value: counts.late + counts.open + counts.clear, icon: 'M3 9l1.5-5h15L21 9M4 9v11h16V9M3 9h18M9 20v-6h6v6' },
    { label: 'Sub-cabang', value: 5, icon: 'M12 3v6M12 9l-7 6M12 9l7 6M5 15v4M19 15v4M12 9v10' },
    { label: 'Tiket aktif', value: counts.late + counts.open, icon: 'M4 7a2 2 0 0 0 0 4v6h16v-6a2 2 0 0 0 0-4V5H4zM10 5v14' },
    { label: 'Dalam proses', value: counts.open, icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z' },
  ])

  // ponytail: tiket dummy dari hash id gerai (stabil tiap reload); ganti dengan tiket kategori AC dari API
  function dummyTicket(id: string) {
    let h = 0
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
    const n = h % 100
    const status: Status = n < 12 ? 'late' : n < 30 ? 'open' : 'clear'
    // umur tiket: lewat SLA = 25–72 jam, dalam SLA = 1–23 jam
    const age = status === 'late' ? 25 + (h % 48) : 1 + (h % 23)
    return {
      status, age, order: STATUS[status].order,
      code: `AM-${String(h % 100000).padStart(5, '0')}`,
      issue: ISSUES[h % ISSUES.length],
      progress: PROGRESS[(h >> 3) % PROGRESS.length],
      eta: 15 + ((h >> 5) % 6) * 15, // menit
    }
  }
  const ISSUES = ['AC Tidak Berfungsi', 'AC Tidak Dingin', 'AC Bocor', 'AC Berisik']
  const PROGRESS = ['Vendor di lokasi', 'Vendor menuju lokasi', 'Menunggu sparepart']
  const BADGE: Record<Status, string> = { late: 'Lewat SLA', open: 'Dalam Proses', clear: 'Normal' }

  const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
  // nama & alamat dari OSM, jadi semua nilai di-escape sebelum masuk HTML
  function card(p: Record<string, string | number>) {
    const s = p.status as Status
    const foot = s === 'clear' ? (p.address || 'AC berfungsi normal')
      : s === 'late' ? `${p.progress} • Terlambat ${Number(p.age) - SLA_HOURS} jam`
      : `${p.progress} • Estimasi selesai ${p.eta} menit`
    return `<div class="pop-head">
        <span class="pop-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M3 9h18M9 20v-6h6v6"/></svg></span>
        <div><b>Gerai ${esc(p.code)}</b><span class="pop-issue ${s}">${esc(s === 'clear' ? 'Tidak ada permintaan' : p.issue)}</span><span class="pop-badge ${s}">${BADGE[s]}</span></div>
      </div>
      <div class="pop-foot">${esc(foot)}</div>`
  }

  // pin bergaya 3D: badan tetes dengan gradien radial + lubang berbayang, digambar 2x untuk layar retina
  function pinSvg(s: (typeof STATUS)[Status]) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="168" viewBox="0 0 64 84">
      <defs>
        <radialGradient id="b" cx="35%" cy="25%" r="80%"><stop offset="0" stop-color="${s.light}"/><stop offset=".45" stop-color="${s.color}"/><stop offset="1" stop-color="${s.dark}"/></radialGradient>
        <linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.dark}"/><stop offset="1" stop-color="#fff"/></linearGradient>
      </defs>
      <ellipse cx="32" cy="81" rx="9" ry="2.5" fill="#000" opacity=".22"/>
      <path d="M32 80C32 80 5 50 5 30a27 27 0 1 1 54 0c0 20-27 50-27 50Z" fill="url(#b)"/>
      <circle cx="32" cy="29" r="12" fill="url(#h)"/>
      <circle cx="33" cy="30.5" r="10" fill="#fff"/>
    </svg>`
  }

  async function addPins(m: Map) {
    await Promise.all(KEYS.map(async (k) => {
      const img = new Image()
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvg(STATUS[k]))
      await img.decode()
      m.addImage(`pin-${k}`, img, { pixelRatio: 2 })
    }))
  }

  type Store = { type: 'Feature'; geometry: { type: 'Point'; coordinates: number[] }; properties: { id: string; name: string; address: string } }
  type Pin = Store & { properties: { status: Status } }
  let pins: Pin[] = []

  // filter lewat data, bukan setFilter: cluster dihitung di source, jadi gerai yang disembunyikan harus keluar dari hitungan
  function visible() {
    return { type: 'FeatureCollection' as const, features: pins.filter((f) => shown.includes(f.properties.status)) }
  }

  function toggle(s: Status) {
    shown = shown.includes(s) ? shown.filter((x) => x !== s) : [...shown, s]
    map?.getSource<GeoJSONSource>('stores')?.setData(visible())
  }

  $effect(() => {
    // basemap OpenFreeMap: gratis tanpa API key, sudah punya layer gedung 3D
    const m = new Map({
      container: el,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: KEMANG,
      zoom: 15,
      pitch: 55,
      bearing: -20,
      maxPitch: 75,
    })
    map = m
    m.addControl(new NavigationControl({ visualizePitch: true }))
    m.on('load', async () => {
      m.addSource('jakarta', { type: 'geojson', data: '/geo/jakarta_provinsi.geojson' })
      m.addLayer({ id: 'jakarta-fill', type: 'fill', source: 'jakarta', paint: { 'fill-color': '#bb1724', 'fill-opacity': 0.06 } })
      m.addLayer({ id: 'jakarta-line', type: 'line', source: 'jakarta', paint: { 'line-color': '#bb1724', 'line-width': 2 } })

      const [stores] = await Promise.all([
        fetch('/geo/alfamart_jakarta.geojson').then((r) => r.json() as Promise<{ features: Store[] }>),
        addPins(m),
      ])
      const tally: Record<Status, number> = { late: 0, open: 0, clear: 0 }
      pins = stores.features.map((f) => {
        const t = dummyTicket(f.properties.id)
        tally[t.status]++
        return { ...f, properties: { ...f.properties, ...t } }
      })
      counts = tally
      const isStatus = (s: Status) => ['case', ['==', ['get', 'status'], s], 1, 0]
      m.addSource('stores', {
        type: 'geojson', data: visible(),
        // zoom jauh: gerai berdekatan digabung jadi satu lingkaran berisi jumlah; pecah jadi pin mulai zoom 14
        cluster: true, clusterRadius: 50, clusterMaxZoom: 13,
        clusterProperties: { late: ['+', isStatus('late')], open: ['+', isStatus('open')] },
      })
      m.addLayer({
        id: 'clusters', type: 'circle', source: 'stores', filter: ['has', 'point_count'],
        paint: {
          // warna cluster mengikuti status terburuk di dalamnya
          'circle-color': ['case', ['>', ['get', 'late'], 0], STATUS.late.color, ['>', ['get', 'open'], 0], STATUS.open.color, STATUS.clear.color],
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 21, 30, 27],
          'circle-stroke-width': 3, 'circle-stroke-color': '#fff',
          'circle-pitch-alignment': 'viewport',
        },
      })
      m.addLayer({
        id: 'cluster-count', type: 'symbol', source: 'stores', filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true },
        paint: { 'text-color': '#fff' },
      })
      m.on('click', 'clusters', async (e) => {
        const f = e.features?.[0]
        if (!f) return
        const zoom = await m.getSource<GeoJSONSource>('stores')!.getClusterExpansionZoom(f.properties.cluster_id)
        m.easeTo({ center: (f.geometry as { coordinates: [number, number] }).coordinates, zoom })
      })
      m.addLayer({
        id: 'stores', type: 'symbol', source: 'stores', filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['concat', 'pin-', ['get', 'status']],
          'icon-anchor': 'bottom',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.28, 14, 0.7],
          'icon-allow-overlap': true,
          'icon-pitch-alignment': 'viewport', // pin tetap berdiri tegak walau peta dimiringkan
          'symbol-sort-key': ['get', 'order'], // merah digambar paling atas
          'symbol-z-order': 'source', // tanpa ini urutan ikut posisi layar dan sort-key diabaikan
        },
      })

      m.on('click', 'stores', (e) => {
        const p = e.features?.[0]?.properties
        if (!p) return
        new Popup({ closeButton: false, offset: 28, className: 'store-pop', maxWidth: '300px' }).setLngLat(e.lngLat).setHTML(card(p)).addTo(m)
      })
      for (const id of ['stores', 'clusters']) {
        m.on('mouseenter', id, () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', id, () => { m.getCanvas().style.cursor = '' })
      }
    })
    return () => { m.remove(); map = undefined }
  })
</script>

<section class="region" aria-labelledby="region-title">
  <div class="region-head">
    <p class="eyebrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>Zoom wilayah</p>
    <h2 id="region-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>Cabang DKI Jakarta</h2>
    <p class="muted">Pemantauan kondisi operasional gerai di wilayah DKI Jakarta.</p>
  </div>
  <dl class="region-stats">
    {#each stats as s (s.label)}
      <div>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={s.icon} /></svg>
        <dt>{s.label}</dt>
        <dd>{num(s.value)}</dd>
      </div>
    {/each}
  </dl>
</section>

<div class="jakarta-wrap" style:height>
  <div bind:this={el} class="jakarta-map" role="region" aria-label="Peta 3D gerai Alfamart DKI Jakarta"></div>
  <div class="chips" role="group" aria-label="Filter status perbaikan AC">
    {#each KEYS as k (k)}
      <button type="button" class:off={!shown.includes(k)} aria-pressed={shown.includes(k)} onclick={() => toggle(k)}>
        <i style:background={STATUS[k].color}></i>{STATUS[k].label}<b>{counts[k]}</b>
      </button>
    {/each}
  </div>
</div>

<style>
  .region { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px; margin-bottom: 12px; padding: 16px 20px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; }
  .region svg { width: 18px; height: 18px; flex: none; fill: none; stroke: var(--brand); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .region .eyebrow { display: flex; align-items: center; gap: 6px; margin: 0 0 4px; }
  .region .eyebrow svg { width: 13px; height: 13px; }
  .region h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 22px; font-weight: 800; color: var(--title, var(--text)); }
  .region h2 svg { width: 22px; height: 22px; fill: var(--brand); stroke: var(--surface); }
  .region .muted { margin: 4px 0 0; font-size: 13px; }
  .region-stats { display: flex; flex-wrap: wrap; margin: 0; }
  .region-stats div { display: grid; grid-template-columns: auto auto; grid-template-areas: 'icon value' 'label label'; align-items: center; column-gap: 8px; padding: 0 20px; border-left: 1px solid var(--line); }
  .region-stats div:first-child { border-left: 0; }
  .region-stats svg { grid-area: icon; width: 22px; height: 22px; }
  .region-stats dd { grid-area: value; margin: 0; font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .region-stats dt { grid-area: label; font-size: 12px; color: var(--muted); }
  @media (max-width: 720px) { .region-stats div { padding: 8px 12px 0 0; border-left: 0; } }
  .jakarta-wrap { position: relative; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid var(--line); }
  .jakarta-map { position: absolute; inset: 0; }
  .chips { position: absolute; left: 12px; top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
  .chips button { display: flex; align-items: center; gap: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: var(--text); background: var(--surface); border: 1px solid var(--line); border-radius: 999px; box-shadow: 0 1px 3px rgb(0 0 0 / .08); }
  .chips button.off { opacity: .45; }
  .chips i { width: 10px; height: 10px; border-radius: 2px; }
  .chips b { font-variant-numeric: tabular-nums; }
  :global(.store-pop .maplibregl-popup-content) { padding: 12px 14px; border-radius: 12px; box-shadow: 0 8px 24px rgb(16 24 40 / .16); font-family: inherit; font-size: 12px; line-height: 1.4; }
  :global(.store-pop .pop-head) { display: flex; gap: 10px; align-items: flex-start; }
  :global(.store-pop .pop-icon) { display: grid; place-items: center; width: 36px; height: 36px; flex: none; border-radius: 8px; background: #344054; }
  :global(.store-pop .pop-icon svg) { width: 20px; height: 20px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  :global(.store-pop b) { display: block; font-size: 14px; font-weight: 800; color: var(--text); }
  :global(.store-pop .pop-issue) { display: block; margin: 1px 0 6px; font-size: 13px; font-weight: 600; }
  :global(.store-pop .pop-badge) { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; color: #fff; }
  :global(.store-pop .late) { color: #d92d20; } :global(.store-pop .pop-badge.late) { color: #fff; background: #d92d20; }
  :global(.store-pop .open) { color: #b54708; } :global(.store-pop .pop-badge.open) { color: #fff; background: #f79009; }
  :global(.store-pop .clear) { color: #067647; } :global(.store-pop .pop-badge.clear) { color: #fff; background: #12b76a; }
  :global(.store-pop .pop-foot) { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--line); color: var(--muted); }
</style>
