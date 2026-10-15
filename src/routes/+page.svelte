<script lang="ts">
  import JourneyMedia from '$lib/components/JourneyMedia.svelte'
  import { session } from '$lib/api.svelte'

  const workspace = $derived(session.user ? (session.user.role === 'admin' ? '/admin/staff' : '/tenant/lifecycle') : '/login')
  let menuOpen = $state(false)
  let selected = $state(0)
  const modules = [
    { title: 'Tenant & ruang usaha', subtitle: 'Peluang usaha, tertata sejak awal.', description: 'Satukan pengajuan ruang usaha, dokumen, dan masa sewa tenant. Bantu tim meninjau kebutuhan mitra serta menindaklanjuti setiap tahapan dengan jelas.', tags: 'Pengajuan · Dokumen · Kontrak', image: 'tenant', alt: 'Program ruang usaha Tenant Alfamart' },
    { title: 'Layanan gerai', subtitle: 'Gerai siap melayani setiap hari.', description: 'Hubungkan laporan kendala dengan vendor dan tim operasional. Pantau tenggat layanan dan bukti penyelesaian agar tindak lanjut lebih terarah.', tags: 'Service desk · Vendor · SLA', image: 'store', alt: 'Fasad dan area layanan gerai Alfamart' },
    { title: 'Komersial', subtitle: 'Tagihan tertib. Informasi lebih jelas.', description: 'Telusuri tagihan sewa, status pembayaran, dan pendapatan tenant dalam satu ruang kerja untuk mendukung evaluasi serta tindak lanjut tim keuangan.', tags: 'Tagihan sewa · Pembayaran · Pendapatan', image: 'store', alt: 'Gerai Alfamart sebagai lokasi usaha' },
    { title: 'Kebersihan gerai', subtitle: 'Lingkungan terawat, layanan nyaman.', description: 'Kelola permintaan pengangkutan sampah, penugasan petugas, dan penyelesaian biaya. Setiap pekerjaan memiliki status yang dapat ditelusuri.', tags: 'Penjemputan · Penugasan · Biaya', image: 'store', alt: 'Area depan gerai Alfamart' },
  ]
  const active = $derived(modules[selected])
</script>

<svelte:head>
  <title>Alfamart · Retail Workspace</title>
  <meta name="description" content="Konsep ruang kerja terpadu untuk tenant, layanan gerai, komersial, dan kebersihan dalam ekosistem Alfamart." />
</svelte:head>

<div class="landing" id="beranda">
  <a class="skip-link" href="#tentang">Lewati navigasi</a>
  <header class="landing-nav">
    <a class="landing-brand" href="/" aria-label="Beranda Alfamart"><img src="/images/alfamart/logo.png" alt="Alfamart — Retail Operations" width="150" height="58" /></a>
    <button class="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="landing-menu" onclick={() => { menuOpen = !menuOpen }}>{menuOpen ? 'Tutup ×' : 'Menu ☰'}</button>
    <nav id="landing-menu" class:open={menuOpen} aria-label="Navigasi utama">
      <a href="#tentang" onclick={() => { menuOpen = false }}>Tentang platform</a>
      <a href="#solusi" onclick={() => { menuOpen = false }}>Solusi kami</a>
      <a href="#cara-kerja" onclick={() => { menuOpen = false }}>Cara kerja</a>
      <a href="https://alfamart.co.id" target="_blank" rel="noreferrer">Tentang Alfamart ↗</a>
      <a class="nav-login" href={workspace}>{session.user ? 'Buka konsol' : 'Masuk'} <span aria-hidden="true">↗</span></a>
    </nav>
  </header>

  <main>
    <JourneyMedia />

    <section id="tentang" class="intro wrap" aria-labelledby="intro-title">
      <p class="eyebrow">Alfamart Retail Workspace</p>
      <div class="intro-grid">
        <h2 id="intro-title">Dari aktivitas gerai.<br />Menjadi informasi.<br /><em>Untuk keputusan.</em></h2>
        <div class="intro-copy"><p>Pandangan yang lebih utuh atas tenant, layanan gerai, dan tindak lanjut operasional.</p><p>Konsep platform yang menyatukan pengajuan ruang usaha, pekerjaan vendor, dan tagihan tenant. Membantu Direksi melihat prioritas, sementara tim menjalankan tindak lanjut dalam alur yang sama.</p><a class="text-link" href="#solusi">KENALI SOLUSI KAMI <span aria-hidden="true">→</span></a></div>
      </div>
    </section>

    <section class="ecosystem" aria-labelledby="ecosystem-title">
      <div class="wrap"><div class="section-heading"><p class="eyebrow">Terhubung dalam satu platform</p><h2 id="ecosystem-title">Alfamart <em>Workspace</em></h2></div>
        <div class="ecosystem-grid">
          <a href="#solusi" onclick={() => { selected = 0 }}><span>01</span><h3>Tenant &<br />ruang usaha</h3><span class="arrow" aria-hidden="true">↗</span></a>
          <a href="#solusi" onclick={() => { selected = 1 }}><span>02</span><h3>Layanan<br />gerai</h3><span class="arrow" aria-hidden="true">↗</span></a>
          <a href="#solusi" onclick={() => { selected = 2 }}><span>03</span><h3>Aktivitas<br />komersial</h3><span class="arrow" aria-hidden="true">↗</span></a>
          <a href="#solusi" onclick={() => { selected = 3 }}><span>04</span><h3>Kebersihan<br />gerai</h3><span class="arrow" aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>

    <section id="solusi" class="solutions" aria-labelledby="solutions-title">
      <div class="wrap section-heading"><p class="eyebrow">Solusi kami</p><h2 id="solutions-title">Empat kebutuhan.<br /><em>Satu ruang kerja.</em></h2></div>
      <div class="solution-options wrap" aria-label="Pilih solusi">
        {#each modules as module, index}
          <button type="button" class:active={selected === index} aria-pressed={selected === index} aria-controls="solution-detail" onclick={() => { selected = index }}>{module.title}</button>
        {/each}
      </div>
      <div id="solution-detail" class="solution-detail">
        <img class="solution-photo" class:banner={active.image === 'tenant'} src={`/images/alfamart/${active.image}.jpg`} alt={active.alt} width="1512" height="1025" loading="lazy" />
        <div class="solution-copy" aria-live="polite" aria-atomic="true"><p class="eyebrow">{active.title}</p><h3>{active.subtitle}</h3><p>{active.description}</p><small>{active.tags}</small><a class="text-link" href={workspace}>BUKA RUANG KERJA <span aria-hidden="true">→</span></a></div>
      </div>
    </section>

    <section id="cara-kerja" class="workflow wrap" aria-labelledby="workflow-title">
      <div class="section-heading"><p class="eyebrow">Cara kerja</p><h2 id="workflow-title">Peran berbeda.<br /><em>Tujuan bersama.</em></h2></div>
      <ol class="steps">
        <li><span>01</span><h3>Ajukan kebutuhan</h3><p>Tenant mengajukan ruang usaha. Tim gerai mencatat kebutuhan layanan dan kebersihan.</p></li>
        <li><span>02</span><h3>Koordinasikan tim</h3><p>Staff meninjau kebutuhan dan mengatur tindak lanjut bersama vendor dan petugas melalui konsol.</p></li>
        <li><span>03</span><h3>Pantau penyelesaian</h3><p>Ikuti perkembangan layanan, dokumen, dan tagihan agar setiap proses dapat ditindaklanjuti.</p></li>
      </ol>
    </section>

    <section class="closing" aria-labelledby="closing-title"><div class="wrap closing-inner"><div><p class="eyebrow">Ruang kerja Anda</p><h2 id="closing-title">Gerai terhubung.<br /><em>Langkah lebih terarah.</em></h2></div><a class="cta" href={workspace}>{session.user ? 'Buka konsol staff' : 'Masuk ke konsol staff'} <span aria-hidden="true">↗</span></a></div></section>
  </main>

  <footer class="landing-footer"><div class="wrap footer-main"><a class="landing-brand" href="/"><img src="/images/alfamart/logo-white.png" alt="Alfamart" width="150" height="58" /></a><p>Retail Workspace<br /><span>Menghubungkan gerai, tenant, dan mitra usaha.</span></p><a href="https://alfamart.co.id" target="_blank" rel="noreferrer">Situs resmi Alfamart ↗</a></div><div class="wrap footer-bottom"><span>Konsep presentasi oleh Nuratech · Untuk Alfamart</span><a href="#beranda">Kembali ke atas ↑</a></div></footer>
</div>

<style>
  .landing { background: white; color: #23364b; }
  .wrap { width: min(1320px, calc(100% - 120px)); margin-inline: auto; }
  a { text-decoration: none; color: inherit; }
  section[id] { scroll-margin-top: 24px; }
  .landing-nav { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 40px; padding: 20px clamp(24px, 4vw, 72px); color: var(--text); border-top: 4px solid var(--brand); border-bottom: 1px solid var(--line); background: white; }
  .landing-brand { flex-shrink: 0; }
  .landing-brand img { display: block; width: 180px; height: auto; }
  nav { display: flex; align-items: center; gap: clamp(20px, 2.5vw, 40px); font-size: 13px; }
  nav a { padding-block: 12px; }
  nav a:hover { text-decoration: underline; text-underline-offset: 6px; }
  .nav-login { border: 1px solid var(--line); border-radius: 2px; padding: 10px 20px; display: inline-flex; gap: 20px; }
  .menu-toggle { display: none; }
  h2 { font-size: clamp(34px, 4vw, 58px); line-height: 1.15; letter-spacing: -.045em; font-weight: 400; }
  em { font-family: 'Nunito', sans-serif; font-weight: 800; font-style: normal; }
  .intro { padding-block: 112px; }
  .intro > .eyebrow { margin-bottom: 40px; }
  .intro-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 80px; align-items: center; }
  .intro h2 { color: #637083; }
  .intro h2 em { color: var(--brand); }
  .intro-copy p { font-size: 15px; line-height: 1.9; color: var(--muted); margin: 0 0 24px; }
  .intro-copy p:first-child { color: var(--text); font-size: 21px; line-height: 1.6; }
  .text-link { display: inline-flex; align-items: center; justify-content: space-between; gap: 32px; font-size: 11px; font-weight: 700; letter-spacing: .06em; margin-top: 16px; }
  .text-link span { font-size: 24px; font-weight: 400; }
  .text-link:hover { color: var(--brand-primary); }
  .ecosystem { padding-block: 80px; color: white; background: #005da6; }
  .ecosystem .eyebrow { color: #e7effb; }
  .section-heading { display: flex; align-items: start; justify-content: space-between; gap: 32px; margin-bottom: 56px; }
  .section-heading h2 { text-align: right; }
  .ecosystem-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px; }
  .ecosystem-grid a { border-top: 1px solid #ffffff50; padding-top: 24px; }
  .ecosystem-grid a > span:first-child { color: #e7effb; font-size: 12px; }
  .ecosystem-grid h3 { margin-top: 36px; font-size: clamp(24px, 2.6vw, 36px); line-height: 1.25; font-weight: 400; letter-spacing: -.04em; }
  .arrow { display: block; font-size: 28px; margin-top: 28px; }
  .ecosystem-grid a:hover .arrow { color: #ffc604; }
  .solutions { padding-top: 96px; }
  .solution-options { display: flex; border-bottom: 1px solid var(--line); overflow-x: auto; gap: 40px; }
  .solution-options button { flex-shrink: 0; border: 0; border-radius: 0; border-bottom: 3px solid transparent; color: var(--muted); background: none; padding: 18px 0; font-weight: 500; }
  .solution-options button.active { color: var(--brand); border-bottom-color: var(--brand-primary); }
  .solution-detail { display: grid; grid-template-columns: 1fr 1fr; margin-top: 32px; background: #f8f9fb; }
  .solution-photo.banner { object-fit: contain; background: white; padding: 24px; }
  .solution-photo { width: 100%; height: 100%; min-height: 480px; object-fit: cover; }
  .solution-copy { padding: clamp(36px, 5vw, 80px); display: flex; flex-direction: column; align-items: start; justify-content: center; }
  .solution-copy h3 { font-size: clamp(28px, 3vw, 42px); line-height: 1.2; font-weight: 400; letter-spacing: -.035em; max-width: 470px; margin: 16px 0; }
  .solution-copy > p:not(.eyebrow) { font-size: 15px; line-height: 1.9; color: var(--muted); max-width: 460px; }
  .solution-copy small { color: var(--brand); margin: 12px 0 20px; }
  .workflow { padding-block: 112px; }
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 64px; margin: 0; padding: 0; list-style: none; }
  .steps li { padding-top: 24px; border-top: 1px solid var(--line); }
  .steps li > span { font-size: 56px; font-weight: 400; letter-spacing: -.06em; color: #005da6; }
  .steps h3 { font-size: 20px; font-weight: 500; margin-top: 24px; }
  .steps p { font-size: 14px; line-height: 1.9; color: var(--muted); }
  .closing { background: #faf8f5; padding-block: 72px; }
  .closing-inner { display: flex; justify-content: space-between; gap: 32px; align-items: center; }
  .cta { display: inline-flex; align-items: center; gap: 32px; flex-shrink: 0; padding: 18px 24px; background: var(--brand); color: white; font-size: 13px; }
  .cta:hover { background: #971220; }
  .cta span { font-size: 24px; }
  .landing-footer { background: #003f70; color: white; padding-top: 64px; }
  .footer-main { display: flex; align-items: center; justify-content: space-between; gap: 32px; padding-bottom: 48px; }
  .footer-main p { font-size: 14px; line-height: 1.9; }
  .footer-main p span, .footer-main > a:last-child { font-size: 12px; color: #e7effb; }
  .footer-bottom { border-top: 1px solid #ffffff30; display: flex; justify-content: space-between; gap: 24px; padding-block: 24px; color: #e7effb; font-size: 10px; }
  .skip-link { position: absolute; top: -100px; left: 24px; z-index: 5; padding: 12px; background: white; color: var(--brand); }
  .skip-link:focus { top: 12px; }
  .landing-nav a:focus-visible, .landing-nav button:focus-visible, .landing-footer a:focus-visible, .ecosystem a:focus-visible { outline: 2px solid #ffc604; outline-offset: 5px; }
  @media (max-width: 1000px) {
    .wrap { width: calc(100% - 64px); }
    .landing-nav { gap: 20px; }
    .landing-brand img { width: 150px; }
    nav { gap: 16px; font-size: 11px; }
    .intro-grid { gap: 40px; }
    .ecosystem-grid { gap: 24px; }
    .steps { gap: 32px; }
  }
  @media (max-width: 760px) {
    .wrap { width: calc(100% - 48px); }
    .landing-nav { padding: 20px 24px; flex-wrap: wrap; }
    .landing-brand img { width: 144px; }
    .menu-toggle { display: block; background: transparent; border-color: var(--line); color: var(--text); padding: 10px 14px; font-size: 12px; }
    nav { display: none; }
    nav.open { display: flex; flex-direction: column; align-items: stretch; width: 100%; padding: 16px 24px; background: white; gap: 4px; font-size: 14px; }
    .nav-login { justify-content: space-between; margin-top: 8px; }
    .intro, .workflow { padding-block: 64px; }
    .intro-grid, .solution-detail, .steps { grid-template-columns: 1fr; }
    .intro > .eyebrow { margin-bottom: 28px; }
    .intro-copy p:first-child { font-size: 18px; }
    .ecosystem { padding-block: 56px; }
    .section-heading { flex-direction: column; gap: 16px; margin-bottom: 36px; }
    .section-heading h2 { text-align: left; }
    .ecosystem-grid { grid-template-columns: 1fr 1fr; gap: 32px 24px; }
    .ecosystem-grid h3 { margin-top: 24px; }
    .solutions { padding-top: 64px; }
    .solution-options { gap: 28px; }
    .solution-photo.banner { object-fit: contain; background: white; padding: 24px; }
  .solution-photo { min-height: 0; height: 300px; }
    .solution-copy { padding: 36px 24px; }
    .steps { gap: 32px; }
    .closing { padding-block: 48px; }
    .closing-inner, .footer-main { flex-direction: column; align-items: start; }
    .footer-main { gap: 20px; }
    .footer-bottom { flex-wrap: wrap; }
  }
</style>
