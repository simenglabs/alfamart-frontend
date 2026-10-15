<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import { onMount } from 'svelte'
  import Kpi from '$lib/components/Kpi.svelte'
  import ReadOnly from '$lib/components/ReadOnly.svelte'
  import AuthImg from '$lib/components/AuthImg.svelte'
  import { db, actions, can, load, type WasteRequest } from '$lib/store.svelte'
  import { rp, sum, fmtTime } from '$lib/format'

  onMount(() => load('waste', 'settlements'))
  const edit = $derived(can('settle'))
  const pending = $derived(db.waste.filter((w) => w.status === 'done'))
  // perkiraan untuk ditampilkan; nilai final dihitung server saat settle
  const preview = (w: WasteRequest) => ({
    incentive: Math.round((db.meta?.wasteRates.find((r) => r.type === w.type)?.incentiveKg ?? 0) * (w.weightKg ?? 0)),
    fee: db.meta?.wasteServices.find((s) => s.service === w.service)?.fee ?? 0,
  })
</script>

<DataState keys={['waste', 'settlements']}>


<div class="stack">
  {#if !edit}<ReadOnly who="Commercial / finance" />{/if}
  <div class="kpis">
    <Kpi label="Menunggu settlement" value={pending.length} />
    <Kpi label="Insentif dibayar" value={rp(sum(db.settlements, 'incentive'))} tone="ok" />
    <Kpi label="Fee express ditagih" value={rp(sum(db.settlements, 'fee'))} />
  </div>
  <section class="panel scroll-x">
    <h3>Siap settlement</h3>
    <p class="note">Dijalankan finance via LinkAja tanpa konfirmasi tenant. Insentif masuk wallet tenant, fee express dipotong dari wallet.</p>
    <table class="mobile-records">
      <thead><tr><th>Request</th><th>Tenant</th><th>Jenis</th><th>Berat</th><th>Layanan</th><th>Insentif</th><th>Fee</th><th>Foto</th><th></th></tr></thead>
      <tbody>
        {#each pending as w (w.id)}
          {@const st = preview(w)}
          <tr>
            <td data-label="Request"><b>{w.id}</b></td><td data-label="Tenant">{w.place}</td><td data-label="Jenis">{w.type}</td><td data-label="Berat">{w.weightKg} kg</td><td data-label="Layanan">{w.service}</td>
            <td data-label="Insentif">{rp(st.incentive)}</td><td data-label="Fee">{rp(st.fee)}</td>
            <td data-label="Foto">{#if w.photoId}<AuthImg id={w.photoId} alt="Bukti" />{:else}—{/if}</td>
            <td data-label="Aksi"><button disabled={!edit} onclick={() => actions.settleWaste(w.id)}>Settle</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if !pending.length}<p class="empty">Tidak ada yang menunggu</p>{/if}
  </section>
  <section class="panel scroll-x">
    <h3>Riwayat settlement</h3>
    <table class="mobile-records">
      <thead><tr><th>ID</th><th>Request</th><th>Tenant</th><th>Insentif</th><th>Fee</th><th>Ref LinkAja</th><th>Waktu</th></tr></thead>
      <tbody>
        {#each db.settlements as x (x.id)}
          <tr><td data-label="ID">{x.id}</td><td data-label="Request">{x.requestId}</td><td data-label="Tenant">{x.brand}</td><td data-label="Insentif">{rp(x.incentive)}</td><td data-label="Fee">{rp(x.fee)}</td><td data-label="Ref LinkAja"><small>{x.ref}</small></td><td data-label="Waktu">{fmtTime(x.at)}</td></tr>
        {/each}
      </tbody>
    </table>
  </section>
</div>

</DataState>
