<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import { onMount } from 'svelte'
  import Bar from '$lib/components/Bar.svelte'
  import { db, load } from '$lib/store.svelte'
  import { rp, pct, sum } from '$lib/format'

  onMount(() => load('revenue'))
  const rows = $derived(db.revenue?.byCategory ?? [])
  const overdue = $derived(db.revenue?.overdue ?? [])
  const max = $derived(Math.max(1, ...rows.map((r) => r.billed)))
  const worst = $derived(rows.filter((r) => r.billed).sort((a, b) => a.collected / a.billed - b.collected / b.billed)[0])
</script>

<DataState keys={['revenue']}>


<div class="stack">
  <section class="panel">
    <h3>Billed vs collected per kategori · semua periode</h3>
    {#each rows as r (r.category)}
      <div class="pair">
        <b>{r.category}</b>
        <Bar label="Billed" value={r.billed} {max} text={rp(r.billed)} />
        <Bar label="Collected" value={r.collected} {max} text="{rp(r.collected)} · {pct(r.collected, r.billed)}" tone="ok" />
      </div>
    {:else}
      <p class="empty">Belum ada invoice</p>
    {/each}
  </section>
  <section class="panel">
    <h3>Insight</h3>
    <a href="/commercial/billing">Lihat rincian tagihan →</a>
    <ul class="insights">
      {#if worst}<li>Collection rate terendah di kategori <b>{worst.category}</b> ({pct(worst.collected, worst.billed)}).</li>{/if}
      <li>
        <b>{overdue.length}</b> invoice lewat jatuh tempo, total {rp(sum(overdue, 'total'))}{overdue.length
          ? `: ${[...new Set(overdue.map((i) => i.brand))].join(', ')}`
          : ''}.
      </li>
      <li>Pendapatan fee pickup express: {rp(db.revenue?.expressFee ?? 0)}.</li>
    </ul>
  </section>
</div>

</DataState>
