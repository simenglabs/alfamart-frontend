<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import { onMount } from 'svelte'
  import Kpi from '$lib/components/Kpi.svelte'
  import Bar from '$lib/components/Bar.svelte'
  import { db, load } from '$lib/store.svelte'
  import { rp, pct } from '$lib/format'

  onMount(() => load('dashboard'))
  const d = $derived(db.dashboard)
  const top = $derived(d ? [...d.byType].sort((a, b) => b.kg - a.kg)[0] : null)
  const full = $derived(d?.bins.filter((b) => b.fill >= 80) ?? [])
</script>

<DataState keys={['dashboard']}>


{#if d}
  <div class="stack">
    <div class="create-toolbar"><p class="muted">Akumulasi seluruh periode · data diperbarui otomatis</p><div class="actions tight"><a href="/waste/dispatch">Lihat pickup</a><a href="/waste/finance">Lihat settlement</a><a href="/commercial/revenue">Revenue insight</a></div></div>
    <div class="kpis">
      <Kpi label="Volume terkumpul" value="{d.totalKg.toFixed(1)} kg" />
      <Kpi label="Tingkat daur ulang" value={pct(d.recycledKg, d.totalKg)} sub="plastik + kardus" />
      <Kpi label="SLA pickup" value={pct(d.pickupsInSla, d.pickupsDone)} sub="target ≥ 95%" />
      <Kpi label="CO₂ dihindari" value="{d.co2AvoidedKg.toFixed(1)} kg" sub="faktor emisi dummy" />
    </div>
    <div class="board two">
      <section class="panel">
        <h3>Volume per jenis</h3>
        {#each d.byType as t (t.type)}
          <Bar label={t.type} value={t.kg} max={d.totalKg} text="{t.kg.toFixed(1)} kg" tone={t.type === 'plastik' || t.type === 'kardus' ? 'ok' : ''} />
        {/each}
      </section>
      <section class="panel">
        <h3>Smart bin <small class="muted">(simulasi)</small></h3>
        {#each d.bins as b (b.id)}
          <Bar label="{b.loc} · {b.type}" value={b.fill} max={100} text="{b.fill}%" tone={b.fill >= 80 ? 'bad' : ''} />
        {/each}
      </section>
    </div>
    <section class="panel">
      <h3>Insight</h3>
      <ul class="insights">
        {#if top}<li>Jenis sampah terbanyak: <b>{top.type}</b> ({top.kg.toFixed(1)} kg).</li>{/if}
        {#if full.length}<li><b>{full.length}</b> bin di atas 80%: {full.map((b) => b.loc).join(', ')}. Jadwalkan pickup.</li>{/if}
        <li>Insentif daur ulang tersalurkan: {rp(d.incentivePaid)}.</li>
      </ul>
    </section>
  </div>
{:else}
  <p class="empty">Memuat…</p>
{/if}

</DataState>
