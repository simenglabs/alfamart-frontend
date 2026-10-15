<script lang="ts" generics="T extends string">
  import { tick } from 'svelte'
  let { value = $bindable('' as T), options, label, placeholder = 'Pilih…', disabled = false, required = false, onchange }: {
    value?: T; options: { value: T; label: string }[]; label: string; placeholder?: string; disabled?: boolean; required?: boolean; onchange?: (value: T) => unknown
  } = $props()
  const id = $props.id()
  let trigger: HTMLButtonElement
  let popup: HTMLDivElement
  let search: HTMLInputElement
  let open = $state(false)
  let query = $state('')
  let index = $state(0)
  let invalid = $state(false)
  let placement = $state('')
  const selected = $derived(options.find(option => option.value === value))
  const filtered = $derived(options.filter(option => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())))

  function position() {
    if (!trigger || !popup) return
    const rect = trigger.getBoundingClientRect()
    const viewport = window.visualViewport
    const viewWidth = viewport?.width ?? window.innerWidth
    const viewHeight = viewport?.height ?? window.innerHeight
    const offsetTop = viewport?.offsetTop ?? 0
    const offsetLeft = viewport?.offsetLeft ?? 0
    const width = Math.min(Math.max(rect.width, 240), viewWidth - 24)
    const below = offsetTop + viewHeight - rect.bottom - 12
    const above = rect.top - offsetTop - 12
    const height = Math.max(80, Math.min(320, Math.max(below, above)))
    const top = below >= Math.min(320, popup.scrollHeight) || below >= above ? rect.bottom + 6 : Math.max(offsetTop + 12, rect.top - Math.min(height, popup.scrollHeight) - 6)
    placement = `left:${Math.max(offsetLeft + 12, Math.min(rect.left, offsetLeft + viewWidth - width - 12))}px;top:${top}px;width:${width}px;max-height:${height}px`
  }
  async function show(keyboardInput = false) {
    if (disabled) return
    query = ''
    index = Math.max(0, options.findIndex(option => option.value === value))
    popup.showPopover()
    open = true
    await tick()
    position()
    if (keyboardInput || !window.matchMedia('(pointer: coarse)').matches) search.focus()
    document.getElementById(`${id}-option-${index}`)?.scrollIntoView({ block: 'nearest' })
  }
  function close(focus = true) { popup?.hidePopover(); open = false; if (focus) trigger?.focus() }
  function choose(option: { value: T; label: string }) {
    invalid = false
    if (onchange) onchange(option.value)
    else value = option.value
    close()
  }
  async function keyboard(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
    if (event.key === 'Tab') { close(false); return }
    if (event.key === 'Enter') { event.preventDefault(); if (filtered[index]) choose(filtered[index]); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      index = Math.max(0, Math.min(filtered.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))
      await tick()
      document.getElementById(`${id}-option-${index}`)?.scrollIntoView({ block: 'nearest' })
    }
  }
  $effect(() => { if (disabled && open) close(false) })
  $effect(() => {
    if (!open) return
    const reposition = () => position()
    const onScroll = (event: Event) => { if (!popup.contains(event.target as Node)) position() }
    window.visualViewport?.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('scroll', reposition)
    window.addEventListener('resize', reposition)
    document.addEventListener('scroll', onScroll, true)
    return () => { window.visualViewport?.removeEventListener('resize', reposition); window.visualViewport?.removeEventListener('scroll', reposition); window.removeEventListener('resize', reposition); document.removeEventListener('scroll', onScroll, true) }
  })
</script>

<div class="search-select">
  <span class="select-label">{label}{required ? ' *' : ''}</span>
  <button bind:this={trigger} type="button" role="combobox" aria-required={required} class="select-trigger" class:invalid {disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-invalid={invalid} onclick={(event) => open ? close() : show(event.detail === 0)} onkeydown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(true) } }}><span class:placeholder={!selected}>{selected?.label ?? placeholder}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg></button>
  {#if required}<input class="validation-input" tabindex="-1" aria-hidden="true" value={selected?.value ?? ''} required {disabled} oninvalid={(event) => { event.preventDefault(); invalid = true; trigger.focus() }} />{/if}
  {#if invalid}<small class="validation-error">Pilih {label.toLowerCase()}.</small>{/if}
  <div bind:this={popup} popover="auto" class="select-popup" style={placement} ontoggle={(event) => { open = event.newState === 'open' }}>
    <div class="select-search"><input bind:this={search} type="search" bind:value={query} oninput={() => { index = 0 }} onkeydown={keyboard} role="combobox" aria-label={`Cari ${label.toLowerCase()}`} aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={filtered[index] ? `${id}-option-${index}` : undefined} placeholder={`Cari ${label.toLowerCase()}…`} autocomplete="off" /></div>
    <div id={`${id}-list`} role="listbox" aria-label={label} class="option-list">
      {#each filtered as option, i (option.value)}<button id={`${id}-option-${i}`} type="button" role="option" aria-selected={option.value === value} tabindex="-1" class:highlighted={index === i} class:selected={option.value === value} onclick={() => choose(option)}><span>{option.label}</span>{#if option.value === value}<span aria-hidden="true">✓</span>{/if}</button>{:else}<p class="no-results">Tidak ada pilihan yang cocok.</p>{/each}
    </div>
  </div>
</div>

<style>
  .select-label { display: none; margin-bottom: 7px; font-size: 12px; color: var(--muted); }
  .search-select { position: relative; min-width: 140px; flex: 1; }
  .select-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; background: var(--surface); color: var(--text); border: 1px solid var(--line); border-radius: 5px; padding: 10px 12px; font-weight: 400; font-size: 13px; }
  .select-trigger > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .select-trigger svg { width: 16px; height: 16px; fill: none; stroke: var(--muted); stroke-width: 1.5; flex-shrink: 0; }
  .placeholder { color: var(--muted); }
  .select-trigger.invalid { border-color: var(--bad); }
  .validation-input { position: absolute; opacity: 0; width: 1px; height: 1px; padding: 0; border: 0; pointer-events: none; }
  .validation-error { color: var(--bad); font-size: 11px; }
  .select-popup { position: fixed; inset: auto; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--text); box-shadow: 0 12px 32px #23364b20; overflow: hidden; }
  .select-popup:popover-open { display: flex; flex-direction: column; }
  .select-search { padding: 10px; border-bottom: 1px solid var(--line); }
  .select-search input { width: 100%; font-size: 12px; background: var(--surface-2); }
  .option-list { overflow-y: auto; padding: 5px; min-height: 0; }
  .option-list button { display: flex; justify-content: space-between; gap: 16px; width: 100%; text-align: left; background: transparent; border: 0; color: var(--text); border-radius: 4px; padding: 10px; font-size: 12px; font-weight: 400; }
  .option-list button.highlighted, .option-list button:hover { background: var(--surface-2); }
  .option-list button.selected { background: var(--brand-soft); color: var(--brand); font-weight: 600; }
  .no-results { padding: 12px; margin: 0; font-size: 12px; color: var(--muted); }
  @media (pointer: coarse), (max-width: 700px) {
    .select-trigger, .select-search input { font-size: 16px; min-height: 44px; }
    .option-list button { font-size: 14px; min-height: 44px; white-space: normal; }
  }
</style>
