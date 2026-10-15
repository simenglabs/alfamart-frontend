<script lang="ts">
  import '../app.css'
  import { untrack } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { session, login, acceptInvite } from '$lib/api.svelte'
  import { clock, load, refresh, resetData } from '$lib/store.svelte'
  import CmsShell from '$lib/components/CmsShell.svelte'
  import Toast from '$lib/components/Toast.svelte'

  let { children } = $props()

  const NAV = [
    { mod: 'Tenant Journey', pages: [['/tenant/lifecycle', 'Lifecycle'], ['/tenant/directory', 'Directory']] },
    { mod: 'Operation', pages: [['/operation/dashboard', 'Dashboard'], ['/operation/desk', 'Service desk'], ['/operation/work-orders', 'Tracking work order'], ['/operation/vendors', 'Vendors & maintenance'], ['/operation/partners', 'Akun vendor & petugas']] },
    { mod: 'Commercial', pages: [['/commercial/billing', 'Billing'], ['/commercial/revenue', 'Revenue insight']] },
    { mod: 'Waste', pages: [['/waste/dispatch', 'Dispatch'], ['/waste/finance', 'Finance'], ['/waste/executive', 'Executive']] },
  ]
  // admin hanya mengelola akun staff (need-to-know); role lain tidak melihat menu admin
  const ADMIN_NAV = [{ mod: 'Admin', pages: [['/admin/staff', 'Akun staff']] }]
  // halaman khusus satu role: tidak muncul di menu dan tidak bisa dibuka role lain
  const ONLY: Record<string, string> = { '/operation/dashboard': 'operations' }
  const canOpen = (href: string) => !ONLY[href] || ONLY[href] === session.user?.role
  const roleNav = $derived(NAV.map(group => ({ ...group, pages: group.pages.filter(([href]) => canOpen(href)) })))
  const isLanding = $derived(page.url.pathname === '/')
  const isLogin = $derived(page.url.pathname === '/login')
  const isAdmin = $derived(session.user?.role === 'admin')
  const homes: Record<string, string> = { admin: '/admin/staff', tenant_relations: '/tenant/lifecycle', operations: '/operation/desk', finance: '/commercial/billing', dispatcher: '/waste/dispatch', management: '/waste/executive' }
  const primary: Record<string, string[]> = {
    tenant_relations: ['/tenant/lifecycle', '/tenant/directory'],
    operations: ['/operation/dashboard', '/operation/desk', '/operation/work-orders', '/operation/vendors', '/operation/partners'],
    finance: ['/commercial/billing', '/commercial/revenue', '/waste/finance'],
    dispatcher: ['/waste/dispatch', '/operation/partners'],
    management: ['/waste/executive', '/commercial/revenue', '/operation/work-orders'],
  }
  const home = $derived(homes[session.user?.role ?? ''] ?? '/tenant/lifecycle')
  const allNav = $derived(isAdmin ? ADMIN_NAV : roleNav)
  const preferred = $derived(primary[session.user?.role ?? ''] ?? [])
  const nav = $derived(isAdmin ? ADMIN_NAV : roleNav.map(group => ({ ...group, pages: group.pages.filter(([href]) => preferred.includes(href)) })).filter(group => group.pages.length))
  const secondaryNav = $derived(isAdmin ? [] : roleNav.map(group => ({ ...group, pages: group.pages.filter(([href]) => !preferred.includes(href)) })).filter(group => group.pages.length))
  const section = $derived(allNav.find((n) => n.pages.some(([href]) => href === page.url.pathname))?.mod ?? 'Workspace')
  const title = $derived(allNav.flatMap((n) => n.pages).find(([href]) => href === page.url.pathname)?.[1] ?? '')
  // halaman hanya dirender bila sesuai role, supaya tidak memanggil API yang pasti ditolak
  const allowed = $derived(isAdmin === page.url.pathname.startsWith('/admin') && canOpen(page.url.pathname))
  $effect(() => {
    if (session.user && !isLanding && (isLogin || !allowed)) goto(home)
  })

  let email = $state('')
  let password = $state('')
  let invite = $state(false) // mode aktivasi akun dengan kode undangan dari admin
  let code = $state('')
  let confirmPw = $state('')
  let error = $state('')
  let busy = $state(false)
  let showPassword = $state(false)
  function withoutSpaces(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const cursor = input.selectionStart
    const beforeCursor = cursor === null ? null : input.value.slice(0, cursor).replace(/\s/g, '').length
    input.value = input.value.replace(/\s/g, '')
    if (beforeCursor !== null) input.setSelectionRange(beforeCursor, beforeCursor)
    return input.value
  }
  async function submit(e: SubmitEvent) {
    e.preventDefault()
    error = ''
    email = email.replace(/\s/g, '')
    code = code.replace(/\s/g, '')
    password = password.replace(/\s/g, '')
    confirmPw = confirmPw.replace(/\s/g, '')
    if (invite && password.length < 8) { error = 'Password minimal 8 karakter'; return }
    if (invite && password !== confirmPw) { error = 'Password tidak sama'; return }
    busy = true
    try {
      if (invite) await acceptInvite(code, password)
      else await login(email, password)
      password = confirmPw = code = ''
    } catch (err) { error = (err as Error).message } finally { busy = false }
  }

  $effect(() => {
    if (!session.user) { untrack(resetData); return }
    if (isLanding || isLogin) return
    untrack(() => load('meta'))
    // SLA bergerak tiap 30 detik; data disegarkan tiap 30 detik selama tab terbuka
    const id = setInterval(() => { clock.now = Date.now(); if (!document.hidden) refresh() }, 30000)
    return () => clearInterval(id)
  })
</script>

<svelte:head><link rel="icon" href="/favicon.ico" sizes="48x48" type="image/x-icon" /><title>Alfamart · Konsol staff</title></svelte:head>

{#if isLanding}
  {@render children()}
{:else if !session.user}
  <main class="login">
    <section class="login-visual" aria-label="Alfamart, Retail Operations">
      <img class="login-photo" src="/images/alfamart/store.jpg" alt="Tampak depan gerai Alfamart" width="1512" height="1025" />
      <div class="login-shade"></div>
      <div class="login-story"><p>ALFAMART RETAIL WORKSPACE</p><h2>Setiap gerai,<br /><em>terhubung di sini.</em></h2><span>Menghubungkan layanan, mitra, dan peluang<br />dalam satu ekosistem.</span></div>
      <div class="login-visual-footer"><span>Alfamart Retail Workspace</span><span aria-hidden="true">↗</span></div>
    </section>
    <section class="login-content" aria-labelledby="login-title">
      <a class="back-home" href="/"><span aria-hidden="true">←</span> Kembali ke beranda</a>
      <div class="login-form-wrap">
        <a class="login-brand" href="/" aria-label="Beranda Alfamart"><img src="/images/alfamart/logo.png" alt="Alfamart" width="150" height="58" /></a>
        <div class="login-heading"><p class="eyebrow">RUANG KERJA STAFF</p><h1 id="login-title">{invite ? 'Aktifkan akun Anda.' : 'Selamat datang kembali.'}</h1><p>{invite ? 'Masukkan kode undangan dan buat password untuk mulai menggunakan ruang kerja Anda.' : 'Masuk untuk mengelola tenant, layanan gerai, dan aktivitas operasional hari ini.'}</p></div>
        <form onsubmit={submit} aria-busy={busy}>
          {#if invite}
            <label class="field"><span>Kode undangan</span><input value={code} oninput={(e) => { code = withoutSpaces(e) }} autocomplete="one-time-code" placeholder="Masukkan kode undangan" required disabled={busy} /></label>
            <label class="field"><span>Password baru</span><input type="password" autocomplete="new-password" value={password} oninput={(e) => { password = withoutSpaces(e) }} placeholder="Minimal 8 karakter" minlength="8" required disabled={busy} /></label>
            <label class="field"><span>Konfirmasi password</span><input type="password" autocomplete="new-password" value={confirmPw} oninput={(e) => { confirmPw = withoutSpaces(e) }} placeholder="Ulangi password baru" minlength="8" required disabled={busy} /></label>
          {:else}
            <label class="field"><span>Alamat email</span><input type="email" autocomplete="username" value={email} oninput={(e) => { email = withoutSpaces(e) }} placeholder="nama@perusahaan.com" required disabled={busy} /></label>
            <div class="field"><label for="login-password">Password</label><div class="password-field"><input id="login-password" type={showPassword ? 'text' : 'password'} autocomplete="current-password" value={password} oninput={(e) => { password = withoutSpaces(e) }} placeholder="Masukkan password" required disabled={busy} /><button type="button" class="password-toggle" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword} disabled={busy} onclick={() => { showPassword = !showPassword }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{#if showPassword}<path d="m3 3 18 18" />{/if}</svg></button></div></div>
          {/if}
          {#if error}<p class="alert bad" role="alert">{error}</p>{/if}
          <button class="login-submit" disabled={busy}><span>{busy ? 'Memproses…' : invite ? 'Aktifkan akun' : 'Masuk ke ruang kerja'}</span><span aria-hidden="true">{busy ? '…' : '→'}</span></button>
          <div class="login-account"><span>{invite ? 'Sudah punya akun?' : 'Undangan atau reset password?'}</span><button type="button" disabled={busy} onclick={() => { invite = !invite; error = ''; password = confirmPw = ''; showPassword = false }}>{invite ? 'Kembali masuk' : 'Gunakan kode'}</button></div>
        </form>
        <div class="login-mobile-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 18h4" /></svg><p>Untuk tenant, vendor, dan petugas,<br /><strong>akses sesuai penugasan akun Anda.</strong></p></div>
      </div>
      <footer class="login-footer"><span>Alfamart · Retail Workspace</span><span>Retail Operations</span></footer>
    </section>
  </main>
{:else}
  <CmsShell {nav} {secondaryNav} {title} {section}>
    {#if allowed}{@render children()}{/if}
  </CmsShell>
{/if}

<Toast />
