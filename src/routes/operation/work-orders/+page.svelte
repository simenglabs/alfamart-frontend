<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import DetailPanel from '$lib/components/DetailPanel.svelte'
  import SearchSelect from '$lib/components/SearchSelect.svelte'
  import { onMount } from 'svelte'
  import Badge from '$lib/components/Badge.svelte'
  import Kpi from '$lib/components/Kpi.svelte'
  import Sla from '$lib/components/Sla.svelte'
  import AuthImg from '$lib/components/AuthImg.svelte'
  import { db, load, ticketEvents, clock, type Ticket, type AppEvent } from '$lib/store.svelte'
  import { pct, fmtTime } from '$lib/format'

  // Tracking work order: satu ticket dari dibuat sampai selesai, dengan waktu tiap tahap.
  onMount(() => load('tickets', 'vendors'))

  const FILTERS = {
    active: ['Aktif', (t: Ticket) => t.status === 'assigned' || t.status === 'in_progress'],
    waiting: ['Belum dimulai', (t: Ticket) => t.status === 'assigned'],
    progress: ['Dikerjakan', (t: Ticket) => t.status === 'in_progress'],
    late: ['Lewat SLA', (t: Ticket) => t.status !== 'resolved' && t.late],
    open: ['Belum ditugaskan', (t: Ticket) => t.status === 'open'],
    done: ['Selesai', (t: Ticket) => t.status === 'resolved'],
    all: ['Semua', () => true],
  } as const satisfies Record<string, readonly [string, (t: Ticket) => boolean]>
  type Filter = keyof typeof FILTERS

  let filter = $state<Filter>('active')
  let vendor = $state('')
  let q = $state('')
  let sel = $state<string | null>(null)
  let events = $state<AppEvent[]>([])
  let eventsLoading = $state(false)
  let eventsError = $state('')
  let eventRetry = $state(0)

  const rows = $derived(
    db.tickets
      .filter(FILTERS[filter][1])
      .filter((t) => !vendor || t.vendorId === vendor)
      .filter((t) => `${t.id} ${t.title} ${t.place} ${t.vendorName ?? ''}`.toLowerCase().includes(q.toLowerCase()))
      // selesai: terbaru dulu. Lainnya: paling mendesak dulu (lewat SLA, lalu tenggat terdekat)
      .sort((a, b) => filter === 'done'
        ? Date.parse(b.resolvedAt ?? '') - Date.parse(a.resolvedAt ?? '')
        : Number(b.late) - Number(a.late) || Date.parse(a.deadline) - Date.parse(b.deadline)),
  )
  const wo = $derived(db.tickets.filter((t) => t.vendorId))
  const active = $derived(wo.filter((t) => t.status !== 'resolved'))
  const done = $derived(wo.filter((t) => t.status === 'resolved' && t.resolvedAt))
  const avgResolve = $derived(done.length ? done.reduce((a, t) => a + (Date.parse(t.resolvedAt!) - Date.parse(t.createdAt)), 0) / done.length : 0)
  const selected = $derived(db.tickets.find((t) => t.id === sel))

  // riwayat dimuat ulang tiap ticket terpilih berubah (termasuk saat data disegarkan)
  $effect(() => {
    const t = selected
    events = []
    void eventRetry
    let live = true
    eventsLoading = !!t; eventsError = ''
    if (t) ticketEvents(t.id).then(e => { if (live) events = e }).catch(() => { if (live) eventsError = 'Riwayat belum berhasil dimuat.' }).finally(() => { if (live) eventsLoading = false })
    return () => { live = false }
  })

  const dur = (ms: number) => {
    const m = Math.max(0, Math.round(ms / 60e3))
    return m < 60 ? `${m} mnt` : m < 1440 ? `${Math.floor(m / 60)} j ${m % 60} mnt` : `${Math.floor(m / 1440)} hr ${Math.floor((m % 1440) / 60)} j`
  }
  const STATUS: Record<string, string> = { open: 'Belum ditugaskan', assigned: 'Belum dimulai', in_progress: 'Dikerjakan', resolved: 'Selesai' }
  const TONE: Record<string, string> = { open: 'warn', assigned: 'info', in_progress: 'brand', resolved: 'ok' }

  // tahap: waktu diambil dari data ticket, waktu assign dari riwayat event
  const steps = (t: Ticket, ev: AppEvent[]) => {
    const assigned = ev.find((e) => e.type === 'Di-assign ke vendor' || e.type === 'Work order PM dibuat')?.at ?? (t.status !== 'open' && t.source === 'pm' ? t.createdAt : null)
    return [
      { label: 'Dibuat', at: t.createdAt },
      { label: 'Ditugaskan ke vendor', at: assigned },
      { label: 'Mulai dikerjakan', at: t.startedAt },
      { label: 'Selesai', at: t.resolvedAt },
    ]
  }
  const progress = (t: Ticket) => ({ open: 1, assigned: 2, in_progress: 3, resolved: 4 })[t.status]
</script>

<DataState keys={['tickets', 'vendors']}>


<div class="with-panel">
  <div class="stack">
    <div class="kpis five">
      <Kpi label="Work order aktif" value={active.length} />
      <Kpi label="Belum dimulai" value={wo.filter((t) => t.status === 'assigned').length} sub="sudah ditugaskan" />
      <Kpi label="Aktif lewat SLA" value={active.filter((t) => t.late).length} tone="bad" />
      <Kpi label="Rata-rata selesai" value={done.length ? dur(avgResolve) : '—'} sub="dibuat → selesai" />
      <Kpi label="Kepatuhan SLA" value={pct(done.filter((t) => !t.late).length, done.length)} sub="target ≥ 90%" />
    </div>

    <section class="panel">
      <div class="toolbar">
        <div class="seg" role="tablist" aria-label="Filter status">
          {#each Object.entries(FILTERS) as [k, [label, fn]] (k)}
            <button role="tab" aria-selected={filter === k} class:on={filter === k} onclick={() => (filter = k as Filter)}>
              {label} <span class="count">{db.tickets.filter(fn).length}</span>
            </button>
          {/each}
        </div>
        <SearchSelect bind:value={vendor} label="Vendor" options={[{ value: '', label: 'Semua vendor' }, ...db.vendors.map(v => ({ value: v.id, label: v.name }))]} />
        <input type="search" placeholder="Cari ID, pekerjaan, lokasi" bind:value={q} aria-label="Cari work order" />
      </div>
      <div class="scroll-x">
        <table class="mobile-records">
          <thead><tr><th>Work order</th><th>Pekerjaan</th><th>Vendor</th><th>Status</th><th>Progres</th><th>SLA</th><th>Umur</th></tr></thead>
          <tbody>
            {#each rows as t (t.id)}
              <tr class="click" class:on={sel === t.id} onclick={() => (sel = t.id)} onkeydown={(e) => e.key === 'Enter' && (sel = t.id)} tabindex="0">
                <td data-label="Work order"><b>{t.id}</b><br /><Badge v={t.priority} /></td>
                <td data-label="Pekerjaan">{t.title}<br /><small class="muted">{t.place} · {t.category}{t.source === 'pm' ? ' · PM' : ''}</small></td>
                <td data-label="Vendor">{t.vendorName ?? '—'}</td>
                <td data-label="Status"><Badge tone={TONE[t.status]}>{STATUS[t.status]}</Badge></td>
                <td data-label="Progres">
                  <span class="dots" aria-label="Tahap {progress(t)} dari 4">
                    {#each [1, 2, 3, 4] as i (i)}<i class:on={i <= progress(t)}></i>{/each}
                  </span>
                </td>
                <td data-label="SLA"><Sla deadline={t.deadline} done={t.resolvedAt} /></td>
                <td data-label="Umur"><small>{dur((t.resolvedAt ? Date.parse(t.resolvedAt) : clock.now) - Date.parse(t.createdAt))}</small></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if !rows.length}<p class="empty">Tidak ada work order untuk filter ini</p>{/if}
    </section>
  </div>

  {#if selected}
    {@const s = steps(selected, events)}
    <DetailPanel label={`Detail ${selected.id}`} onclose={() => { sel = null }}>
      <div class="detail-head">
        <div><h3>{selected.id}</h3><small>{selected.title}</small></div>
        <button class="ghost icon" onclick={() => (sel = null)} aria-label="Tutup">✕</button>
      </div>
      <div class="badges">
        <Badge tone={TONE[selected.status]}>{STATUS[selected.status]}</Badge>
        <Badge v={selected.priority} />
        <Sla deadline={selected.deadline} done={selected.resolvedAt} />
      </div>
      <dl class="dl">
        <dt>Lokasi</dt><dd>{selected.place}</dd>
        <dt>Kategori</dt><dd>{selected.category}{selected.source === 'pm' ? ' · preventive maintenance' : ''}</dd>
        <dt>Vendor</dt><dd>{selected.vendorName ?? 'Belum ditugaskan'}</dd>
        <dt>Tenggat SLA</dt><dd>{fmtTime(selected.deadline)}</dd>
      </dl>

      <h4>Perjalanan work order</h4>
      <ol class="track">
        {#each s as step, i (step.label)}
          <li class:done={!!step.at}>
            <b>{step.label}</b>
            {#if step.at}
              <small>{fmtTime(step.at)}{#if i > 0 && s[i - 1].at} · {dur(Date.parse(step.at) - Date.parse(s[i - 1].at!))} dari tahap sebelumnya{/if}</small>
            {:else}
              <small class="muted">Belum</small>
            {/if}
          </li>
        {/each}
      </ol>

      {#if selected.photoId || selected.resolvePhotoId}
        <h4>Foto</h4>
        <div class="photos">
          {#if selected.photoId}<figure><AuthImg id={selected.photoId} alt="Foto laporan" /><figcaption>Saat dilaporkan</figcaption></figure>{/if}
          {#if selected.resolvePhotoId}<figure><AuthImg id={selected.resolvePhotoId} alt="Foto penyelesaian" /><figcaption>Setelah selesai</figcaption></figure>{/if}
        </div>
      {/if}
      {#if selected.note}<h4>Catatan penyelesaian</h4><p class="note">{selected.note}</p>{/if}

      <h4>Riwayat</h4>
      <ul class="timeline">
        {#each [...events].reverse() as e, i (i)}
          <li><b>{e.type}</b>{#if e.note}<span> · {e.note}</span>{/if}<small>{fmtTime(e.at)} · {e.actor}</small></li>
        {:else}
          <li class="muted">{eventsLoading ? 'Memuat…' : eventsError || 'Belum ada riwayat'}{#if eventsError}<button class="ghost" onclick={() => eventRetry++}>Coba lagi</button>{/if}</li>
        {/each}
      </ul>
    </DetailPanel>
  {:else}
    <aside class="detail muted">Pilih work order untuk melihat perjalanannya</aside>
  {/if}
</div>


</DataState>
<style>
  .five { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  @media (max-width: 1100px) { .five { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .seg { display: flex; flex-wrap: wrap; gap: 4px; }
  .seg button { background: var(--surface); color: var(--text); border-color: var(--line); font-size: 13px; padding: 6px 10px; }
  .seg button.on { background: var(--brand-soft); color: var(--brand); border-color: var(--brand); }
  .count { font-weight: 500; opacity: 0.7; margin-left: 2px; }
  tr.on { background: var(--brand-soft); }
  .dots { display: inline-flex; gap: 4px; }
  .dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--line); }
  .dots i.on { background: var(--brand); }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 10px; }
  .track { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 0; }
  .track li { position: relative; padding: 0 0 14px 22px; border-left: 2px solid var(--line); margin-left: 6px; }
  .track li:last-child { border-left-color: transparent; padding-bottom: 0; }
  .track li::before { content: ''; position: absolute; left: -7px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--surface); border: 2px solid var(--line); }
  .track li.done { border-left-color: var(--brand); }
  .track li.done:last-child { border-left-color: transparent; }
  .track li.done::before { background: var(--brand); border-color: var(--brand); }
  .track b { display: block; font-size: 13px; }
  .track small { display: block; color: var(--muted); font-size: 12px; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .photos figure { margin: 0; }
  .photos figcaption { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .photos :global(img.thumb) { width: 100%; height: 110px; object-fit: cover; border-radius: 8px; }
</style>
