<script lang="ts">
  import { tick, type Snippet } from 'svelte'
  import { page } from '$app/state'
  import { session, logout } from '$lib/api.svelte'
  import { ROLES } from '$lib/store.svelte'

  let { nav, secondaryNav = [], title, section, children }: {
    nav: { mod: string; pages: string[][] }[]
    secondaryNav?: { mod: string; pages: string[][] }[]
    title: string
    section: string
    children: Snippet
  } = $props()
  let sidebarHidden = $state(false)
  let mobileOpen = $state(false)
  let query = $state('')
  let sidebar: HTMLElement
  $effect(() => {
    if (!mobileOpen) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    void tick().then(() => { if (mobileOpen) sidebar.querySelector<HTMLButtonElement>('.mobile-close')?.focus() })
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const elements = Array.from(sidebar.querySelectorAll<HTMLElement>('a, button, summary')).filter(el => el.getClientRects().length)
      const first = elements[0], last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    const resize = () => { if (window.innerWidth > 900) mobileOpen = false }
    document.addEventListener('keydown', trap)
    window.addEventListener('resize', resize)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', trap)
      window.removeEventListener('resize', resize)
      previous?.focus()
    }
  })
  const results = $derived([...nav, ...secondaryNav].flatMap(group => group.pages.map(([href, label]) => ({ href, label, group: group.mod })))
    .filter(item => `${item.label} ${item.group}`.toLowerCase().includes(query.trim().toLowerCase())))
  const initials = $derived((session.user?.name ?? '').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase())
  const icons: Record<string, string> = {
    'Tenant Journey': 'M3 10h18M5 10v10h14V10M3 10l3-6h12l3 6M9 20v-6h6v6',
    Operation: 'M9 5H5v16h14V5h-4M9 3h6v4H9zM8 12h8M8 16h5',
    Commercial: 'M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM9 8h6M9 12h6',
    Waste: 'm8 7 4-4 4 4M12 3v11M5 12l-3 5 3 4h5M19 12l3 5-3 4h-5',
    Admin: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  }
  function toggleSidebar() {
    if (window.matchMedia('(max-width: 900px)').matches) mobileOpen = !mobileOpen
    else sidebarHidden = !sidebarHidden
  }
  function closeNavigation() { query = ''; mobileOpen = false }
</script>

<svelte:window onkeydown={(event) => { if (event.key === 'Escape') closeNavigation() }} />

<div class="cms" class:sidebar-hidden={sidebarHidden} class:mobile-open={mobileOpen}>
  <a class="skip-link" href="#cms-content">Lewati navigasi</a>
  {#if mobileOpen}<button class="sidebar-overlay" aria-label="Tutup navigasi" onclick={() => { mobileOpen = false }}></button>{/if}
  <aside bind:this={sidebar} class="cms-sidebar" id="cms-navigation" aria-label="Navigasi konsol">
    <div class="sidebar-brand"><a href="/" aria-label="Beranda Alfamart"><img src="/images/alfamart/logo.png" alt="Alfamart" width="150" height="58" /></a><button class="mobile-close icon-button" aria-label="Tutup navigasi" onclick={() => { mobileOpen = false }}>×</button></div>
    <nav class="cms-nav">
      <p class="nav-heading">WORKSPACE</p>
      {#each nav as group (group.mod)}
        <div class="nav-group">
          <div class="group-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons[group.mod] ?? icons.Admin} /></svg><span>{group.mod}</span></div>
          {#each group.pages as [href, label] (href)}
            <a {href} class:active={page.url.pathname === href} aria-current={page.url.pathname === href ? 'page' : undefined} onclick={closeNavigation}><span class="nav-dot" aria-hidden="true"></span><span>{label}</span></a>
          {/each}
        </div>
      {/each}
      {#if secondaryNav.length}
        <details class="secondary-nav"><summary>Modul lainnya</summary>
          {#each secondaryNav as group (group.mod)}
            <div class="nav-group"><div class="group-title">{group.mod}</div>
              {#each group.pages as [href, label] (href)}
                <a {href} class:active={page.url.pathname === href} aria-current={page.url.pathname === href ? 'page' : undefined} onclick={closeNavigation}>{label}</a>
              {/each}
            </div>
          {/each}
        </details>
      {/if}
    </nav>
    <div class="sidebar-footer"><span class="status-dot" aria-hidden="true"></span><div>Retail Workspace<small>Konsol staff</small></div></div>
  </aside>

  <div class="cms-workspace" inert={mobileOpen}>
    <header class="cms-topbar">
      <button class="icon-button desktop-toggle" type="button" aria-label={sidebarHidden ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'} aria-expanded={!sidebarHidden} aria-controls="cms-navigation" onclick={toggleSidebar}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
      <button class="icon-button mobile-toggle" type="button" aria-label="Buka navigasi" aria-expanded={mobileOpen} aria-controls="cms-navigation" onclick={toggleSidebar}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
      <div class="menu-search">
        <label><span class="sr-only">Cari menu konsol</span><input type="search" placeholder="Cari menu…" bind:value={query} autocomplete="off" aria-controls="menu-results" /></label><svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        {#if query.trim()}
          <div class="search-results" id="menu-results"><p class="search-caption">{results.length} menu ditemukan</p>{#each results as result (result.href)}<a href={result.href} onclick={closeNavigation}><span>{result.label}</span><small>{result.group}</small></a>{:else}<p class="search-empty">Tidak ada menu yang cocok.</p>{/each}</div>
        {/if}
      </div>
      <a class="home-link" href="/" title="Buka landing page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></svg><span>Beranda</span></a>
      <details class="account-menu"><summary><span class="avatar">{initials || 'AF'}</span><span class="account-name">{session.user?.name}<small>{session.user ? ROLES[session.user.role] : ''}</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg></summary><div class="account-dropdown"><p><strong>{session.user?.name}</strong><br />{session.user ? ROLES[session.user.role] : ''}<br />{session.user?.email}</p><button type="button" onclick={logout}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v16h5M9 12h12m-4-4 4 4-4 4" /></svg>Keluar dari akun</button></div></details>
    </header>

    <main class="cms-main" id="cms-content" tabindex="-1">
      <header class="page-heading"><h1>{title}</h1><nav aria-label="Breadcrumb"><span>{section}</span><span aria-hidden="true">›</span><span aria-current="page">{title}</span></nav></header>
      {@render children()}
    </main>
    <footer class="cms-footer"><span>© {new Date().getFullYear()} Alfamart</span><span>Retail Workspace</span></footer>
  </div>
</div>

<style>
  .cms { --sidebar-width: 248px; min-height: 100svh; display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); background: #fbfcfc; color: var(--text); }
  .cms svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
  a { color: inherit; text-decoration: none; }
  .cms-sidebar { position: sticky; top: 0; height: 100svh; display: flex; flex-direction: column; background: #f8f9fb; border-right: 1px solid var(--line); min-width: 0; }
  .sidebar-brand { height: 76px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid var(--line); }
  .sidebar-brand img { display: block; width: 172px; height: auto; }
  .cms-nav { padding: 24px 12px; overflow-y: auto; flex: 1; }
  .nav-heading { padding: 0 14px; margin: 0 0 20px; font-size: 10px; font-weight: 600; letter-spacing: .1em; color: var(--muted); }
  .nav-group { margin-bottom: 22px; }
  .group-title { display: flex; align-items: center; gap: 12px; padding: 0 14px 8px; color: #637083; font-size: 12px; font-weight: 600; }
  .cms-nav a { display: flex; align-items: center; gap: 12px; padding: 10px 14px 10px 22px; margin: 2px 0; font-size: 12px; font-weight: 500; border-radius: 5px; color: var(--muted); line-height: 1.4; }
  .secondary-nav summary { padding: 12px 14px; cursor: pointer; color: var(--muted); font-size: 14px; }
  .nav-dot { width: 4px; height: 4px; border-radius: 50%; background: #c4ccd7; flex-shrink: 0; }
  .cms-nav a:hover { color: var(--brand); background: #fff1f2; }
  .cms-nav a.active { color: var(--brand); background: var(--brand-soft); font-weight: 600; }
  .cms-nav a.active .nav-dot { background: var(--brand); }
  .sidebar-footer { margin: 0 22px; padding: 20px 0; border-top: 1px solid var(--line); display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--text); }
  .sidebar-footer small { display: block; color: var(--muted); font-size: 10px; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-primary); }
  .cms-workspace { min-width: 0; display: flex; flex-direction: column; }
  .cms-topbar { height: 76px; position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 20px; padding: 0 28px; background: white; border-bottom: 1px solid var(--line); }
  .icon-button { display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; padding: 10px; border: none; border-radius: 5px; background: transparent; color: var(--text); }
  .icon-button:hover { background: var(--brand-soft); }
  .menu-search { position: relative; width: min(300px, 32vw); }
  .menu-search input { width: 100%; height: 38px; border: 0; border-radius: 4px; background: #f8f9fb; padding: 8px 40px 8px 14px; font-size: 12px; }
  .search-icon { position: absolute; top: 10px; right: 12px; pointer-events: none; color: var(--brand); }
  .search-results { position: absolute; top: calc(100% + 12px); left: 0; min-width: 100%; width: min(340px, calc(100vw - 100px)); max-height: 65vh; overflow: auto; padding: 8px; border: 1px solid var(--line); background: white; box-shadow: 0 8px 24px #23364b12; border-radius: 6px; }
  .search-caption, .search-empty { padding: 8px 10px; margin: 0; font-size: 11px; color: var(--muted); }
  .search-results a { display: grid; padding: 10px; border-radius: 4px; font-size: 12px; }
  .search-results a:hover { background: var(--brand-soft); color: var(--brand); }
  .search-results small { font-size: 10px; color: var(--muted); }
  .home-link { display: flex; gap: 8px; align-items: center; margin-left: auto; font-size: 12px; color: var(--muted); }
  .account-menu { position: relative; align-self: stretch; }
  .account-menu summary { height: 100%; display: flex; align-items: center; gap: 10px; cursor: pointer; list-style: none; border-inline: 1px solid var(--line); padding: 0 16px; background: #fafbfc; }
  .account-menu summary::-webkit-details-marker { display: none; }
  .avatar { height: 36px; width: 36px; border: 2px solid #f5d3d6; background: var(--brand-soft); color: var(--brand); border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .account-name { max-width: 160px; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .account-name small { display: block; font-size: 10px; color: var(--muted); }
  .account-dropdown { position: absolute; top: calc(100% + 8px); right: 0; width: 260px; padding: 8px; border: 1px solid var(--line); background: white; border-radius: 5px; box-shadow: 0 8px 24px #23364b12; }
  .account-dropdown p { font-size: 11px; color: var(--muted); margin: 8px; overflow-wrap: anywhere; }
  .account-dropdown button { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 10px; background: none; border: 0; color: var(--text); font-size: 12px; }
  .account-dropdown button:hover { background: var(--brand-soft); }
  .cms-main { padding: 24px 30px 40px; min-width: 0; flex: 1; }
  .page-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }
  .page-heading h1 { font-size: 19px; font-weight: 600; letter-spacing: -.025em; margin: 0; }
  .page-heading nav { display: flex; gap: 12px; font-size: 11px; color: var(--muted); }
  .page-heading nav > span:last-child { color: var(--text); }
  .cms-footer { margin-top: auto; padding: 20px 30px; display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid var(--line); background: white; font-size: 11px; color: var(--muted); }
  .cms :global(.panel), .cms :global(.detail) { border-radius: 5px; padding: 22px; box-shadow: none; }
  .cms :global(.panel > h3) { font-size: 14px; font-weight: 600; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 1px solid var(--line); }
  .cms :global(.stack) { gap: 24px; }
  .cms :global(.kpi) { border-radius: 5px; padding: 20px; }
  .cms :global(.kpi b) { font-size: 26px; font-weight: 600; }
  .cms :global(th) { font-size: 11px; font-weight: 600; color: var(--text); background: #fbfcfc; padding: 14px 12px; white-space: nowrap; }
  .cms :global(td) { padding: 16px 12px; font-size: 12px; line-height: 1.6; }
  .cms :global(tbody tr:hover) { background: #fafbfc; }
  .cms :global(.toolbar) { gap: 12px; margin-bottom: 20px; }
  .cms :global(button), .cms :global(input), .cms :global(select), .cms :global(textarea) { border-radius: 5px; }
  .cms :global(.card), .cms :global(.col), .cms :global(.item) { border-radius: 6px; }
  .cms :global(.actions.tight) { gap: 6px; }
  .cms :global(.actions.tight button) { padding: 5px 9px; }
  .cms :global(.detail) { top: 100px; max-height: calc(100svh - 124px); }
  .sidebar-hidden { grid-template-columns: 0 minmax(0, 1fr); }
  .sidebar-hidden .cms-sidebar { visibility: hidden; overflow: hidden; }
  .mobile-toggle, .mobile-close, .sidebar-overlay { display: none; }
  .sr-only, .skip-link:not(:focus) { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .skip-link:focus { position: fixed; top: 12px; left: 12px; z-index: 30; background: white; color: var(--brand); padding: 12px; }
  @media (max-width: 1280px) { .cms :global(.detail) { position: static; max-height: none; } }
  @media (max-width: 900px) {
    .cms, .sidebar-hidden { grid-template-columns: minmax(0, 1fr); }
    .cms-sidebar, .sidebar-hidden .cms-sidebar { position: fixed; left: 0; top: 0; width: var(--sidebar-width); z-index: 20; visibility: hidden; transform: translateX(-100%); }
    .mobile-open .cms-sidebar { visibility: visible; transform: translateX(0); }
    .sidebar-brand { padding-inline: 16px; }
    .sidebar-brand img { width: 152px; }
    .desktop-toggle { display: none; }
    .mobile-toggle, .mobile-close { display: grid; }
    .sidebar-overlay { display: block; position: fixed; inset: 0; background: #23364b66; border: 0; border-radius: 0; z-index: 15; }
    .cms-topbar { padding: 0 16px; gap: 12px; height: 66px; }
    .menu-search { width: min(300px, 45vw); }
    .account-name, .home-link span { display: none; }
    .account-menu summary { padding-inline: 8px; }
    .cms-main { padding: 24px 16px 32px; }
    .cms-nav a { font-size: 14px; min-height: 44px; }
    .group-title { font-size: 13px; }
    .menu-search { flex: 1; min-width: 0; }
    .menu-search input { height: 44px; font-size: 16px; }
    .account-dropdown p, .account-dropdown button { font-size: 14px; }
    .search-icon { top: 13px; }
    .home-link { min-width: 44px; min-height: 44px; justify-content: center; }
    .page-heading { align-items: start; flex-direction: column; gap: 8px; }
    .cms-footer { padding: 16px; }
    .cms :global(.panel), .cms :global(.detail) { padding: 16px; }
  }
  @media (max-width: 480px) { .home-link { display: none; } .account-menu { margin-left: auto; } .cms-topbar { gap: 8px; } }
</style>
