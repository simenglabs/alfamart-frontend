<script lang="ts">
  import DetailPanel from '$lib/components/DetailPanel.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import RupiahInput from '$lib/components/RupiahInput.svelte'
  import { untrack } from 'svelte'
  import Badge from '$lib/components/Badge.svelte'
  import { db, actions, outletEvents, CHECKS, PROVISIONS, DOCS, daysLeft, today, type Outlet, type AppEvent } from '$lib/store.svelte'
  import { rp, fmtDate, fmtTime } from '$lib/format'

  let { o, edit, onclose }: { o: Outlet; edit: boolean; onclose: () => void } = $props()

  // state form lokal per outlet (komponen di-key per id): isian tidak hilang saat data disegarkan
  let c = $state(untrack(() => ({ start: o.contract?.start ?? today(), months: 24, rent: o.contract?.rent ?? 0, service: o.contract?.service ?? 0 })))
  let rn = $state({ months: 24, rent: 0, service: 0 })
  const localToday = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  let survey = $state({ date: localToday(), note: '' })
  let surveyOpen = $state(false)
  let contractOpen = $state(false)
  let renewalOpen = $state(false)
  let saving = $state(false)
  let formError = $state('')
  async function save(e: SubmitEvent, renewal = false) {
    e.preventDefault()
    if (saving || !edit) return
    saving = true
    formError = ''
    try {
      const ok = renewal
        ? await actions.renew(o.id, Number(rn.months), Number(rn.rent), Number(rn.service))
        : await actions.saveContract(o.id, c)
      if (ok) {
        contractOpen = renewalOpen = false
        if (renewal) rn = { months: 24, rent: 0, service: 0 }
      } else formError = 'Kontrak belum berhasil disimpan. Periksa isian lalu coba lagi.'
    } finally { saving = false }
  }
  async function completeSurvey(e: SubmitEvent) {
    e.preventDefault()
    if (saving || !edit) return
    saving = true
    formError = ''
    try {
      if (await actions.completeSurvey(o.id, survey)) surveyOpen = false
      else formError = 'Survei belum berhasil disimpan. Periksa isian lalu coba lagi.'
    } finally { saving = false }
  }
  let events = $state<AppEvent[]>([])
  // muat ulang riwayat setiap data outlet berubah (setelah aksi atau refresh)
  $effect(() => { void o; outletEvents(o.id).then((e) => (events = e)).catch(() => {}) })
  const unitStatus = $derived(db.units.find((u) => u.code === o.unit)?.status ?? '')
  const dis = $derived(!edit)
  const ask = async (fn: (id: string, reason: string) => Promise<boolean>) => {
    const r = prompt('Alasan:')
    if (r !== null) await fn(o.id, r)
  }
</script>

{#snippet rejectRevise()}
  <button class="ghost" disabled={dis} onclick={() => ask(actions.revise)}>Minta revisi</button>
  <button class="danger" disabled={dis} onclick={() => ask(actions.reject)}>Tolak</button>
{/snippet}

<DetailPanel label={`Detail ${o.brand}`} {onclose}>
  <div class="detail-head">
    <div><h3>{o.brand}</h3><small>{o.company}</small></div>
    <button class="ghost icon" onclick={onclose} aria-label="Tutup">✕</button>
  </div>
  <Badge v={o.status} />
  <dl class="dl">
    <dt>Unit</dt><dd>{o.unit} · {unitStatus}</dd>
    <dt>Kategori</dt><dd>{o.category}</dd>
    <dt>PIC</dt><dd>{o.pic}</dd>
    <dt>Email</dt><dd>{o.email}</dd>
    <dt>Dokumen</dt>
    <dd>{#each Object.entries(DOCS) as [k, l] (k)}<div>{l}: {o.docs[k]?.fileName ?? '—'}</div>{/each}</dd>
  </dl>
  {#if o.reason}<p class="note warn">Alasan: {o.reason}</p>{/if}
  {#if o.survey}
    <h4>Hasil survei</h4>
    <p class="note">{fmtDate(o.survey.date)} · {o.survey.note}</p>
  {/if}

  {#if o.status === 'application'}
    <div class="actions">
      <button disabled={dis} onclick={() => actions.startVerification(o.id)}>Mulai verifikasi</button>
      {@render rejectRevise()}
    </div>
  {:else if o.status === 'verification'}
    <h4>Checklist verifikasi</h4>
    {#each Object.entries(CHECKS) as [k, l] (k)}
      <label class="check"><input type="checkbox" disabled={dis} checked={o.checks[k]} onchange={() => actions.setCheck(o.id, k, !o.checks[k])} />{l}</label>
    {/each}
    <div class="actions">
      <button disabled={dis} onclick={() => actions.approve(o.id)}>Setujui</button>
      {@render rejectRevise()}
    </div>
  {:else if o.status === 'survey'}
    <h4>Survei lokasi</h4>
    <p class="note">Catat tanggal dan hasil survei sebelum menyiapkan kontrak.</p>
    <div class="actions"><button disabled={dis} onclick={() => { formError = ''; surveyOpen = true }}>Selesaikan survei</button></div>
  {:else if o.status === 'contract'}
    <h4>Kontrak</h4>
    <div class="actions"><button disabled={dis} onclick={() => { formError = ''; contractOpen = true }}>{o.contract ? 'Ubah kontrak' : 'Buat kontrak'}</button></div>
    {#if o.contract}<p class="note">Tersimpan: {fmtDate(o.contract.start)} – {fmtDate(o.contract.end)} · sewa {rp(o.contract.rent)}</p>{/if}
    <h4>Provisi</h4>
    {#each Object.entries(PROVISIONS) as [k, l] (k)}
      <label class="check"><input type="checkbox" disabled={dis} checked={o.provisions[k]} onchange={() => actions.setProvision(o.id, k, !o.provisions[k])} />{l}</label>
    {/each}
    <div class="actions"><button disabled={dis} onclick={() => actions.activate(o.id)}>Aktivasi outlet</button></div>
  {:else if o.status === 'active' && o.contract}
    <h4>Kontrak</h4>
    <dl class="dl">
      <dt>Periode</dt><dd>{fmtDate(o.contract.start)} – {fmtDate(o.contract.end)}</dd>
      <dt>Sewa</dt><dd>{rp(o.contract.rent)}</dd>
      <dt>Service charge</dt><dd>{rp(o.contract.service)}</dd>
      <dt>Sisa</dt><dd>{daysLeft(o)} hari</dd>
    </dl>
    <div class="actions">
      <button disabled={dis} onclick={() => { formError = ''; renewalOpen = true }}>Perpanjang kontrak</button>
      <button class="danger" disabled={dis} onclick={() => confirm('Akhiri kontrak dan kosongkan unit?') && actions.terminate(o.id)}>Akhiri kontrak</button>
    </div>
  {/if}

  <h4>Riwayat</h4>
  <ul class="timeline">
    {#each events as e (e.id)}
      <li><b>{e.type}</b>{#if e.note}<span> · {e.note}</span>{/if}<small>{fmtTime(e.at)} · {e.actor}</small></li>
    {/each}
  </ul>
</DetailPanel>

<Modal bind:open={surveyOpen} title="Selesaikan survei" busy={saving} error={formError}>
  <form onsubmit={completeSurvey}>
    <p class="muted">{o.brand} · {o.unit}</p>
    <label class="field"><span>Tanggal survei</span><input type="date" required max={localToday()} disabled={saving || dis} bind:value={survey.date} /></label>
    <label class="field"><span>Hasil survei</span><textarea required maxlength="1000" rows="4" disabled={saving || dis} bind:value={survey.note}></textarea></label>
    <div class="modal-actions"><button type="button" class="ghost" disabled={saving} onclick={() => { surveyOpen = false }}>Batal</button><button disabled={saving || dis}>{saving ? 'Menyimpan…' : 'Lanjut ke kontrak'}</button></div>
  </form>
</Modal>

<Modal bind:open={contractOpen} title={o.contract ? 'Ubah kontrak' : 'Buat kontrak'} busy={saving} error={formError}>
  <form onsubmit={e => save(e)}>
    <p class="muted">{o.brand} · {o.unit}</p>
    <div class="grid2">
      <label class="field"><span>Tanggal mulai</span><input type="date" required disabled={saving || dis} bind:value={c.start} /></label>
      <label class="field"><span>Masa sewa (bulan)</span><input type="number" min="1" required disabled={saving || dis} bind:value={c.months} /></label>
      <label class="field"><span>Sewa / bulan (Rp)</span><RupiahInput required disabled={saving || dis} bind:value={c.rent} /></label>
      <label class="field"><span>Service charge / bulan (Rp)</span><RupiahInput required disabled={saving || dis} bind:value={c.service} /></label>
    </div>
    <div class="modal-actions"><button type="button" class="ghost" disabled={saving} onclick={() => { contractOpen = false }}>Batal</button><button disabled={saving || dis}>{saving ? 'Menyimpan…' : 'Simpan kontrak'}</button></div>
  </form>
</Modal>
<Modal bind:open={renewalOpen} title="Perpanjang kontrak" busy={saving} error={formError}>
  <form onsubmit={e => save(e, true)}>
    <p class="muted">{o.brand} · {o.unit}</p>
    <div class="grid2">
      <label class="field"><span>Perpanjang (bulan)</span><input type="number" min="1" required disabled={saving || dis} bind:value={rn.months} /></label>
      <label class="field"><span>Sewa baru (opsional)</span><RupiahInput disabled={saving || dis} placeholder={o.contract?.rent ?? 0} bind:value={rn.rent} /></label>
      <label class="field"><span>Service charge baru (opsional)</span><RupiahInput disabled={saving || dis} placeholder={o.contract?.service ?? 0} bind:value={rn.service} /></label>
    </div>
    <div class="modal-actions"><button type="button" class="ghost" disabled={saving} onclick={() => { renewalOpen = false }}>Batal</button><button disabled={saving || dis}>{saving ? 'Menyimpan…' : 'Perpanjang kontrak'}</button></div>
  </form>
</Modal>
