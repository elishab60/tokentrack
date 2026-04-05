import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownOption {
  value: string;
  label: string;
  meta?: string;
  dot?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  width?: number;
}

export function Dropdown({ options, value, onChange, placeholder = 'Select...', searchable = false, width }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusIdx, setFocusIdx] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  // Position the menu below the trigger
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, width || 200) });
    }
  }, [width]);

  useEffect(() => {
    if (open) {
      updatePosition();
      if (searchable) setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearch('');
      setFocusIdx(-1);
    }
  }, [open, updatePosition, searchable]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' && focusIdx >= 0 && focusIdx < filtered.length) {
        e.preventDefault();
        onChange(filtered[focusIdx].value);
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, focusIdx]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onScroll); };
  }, [open, updatePosition]);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selected = options.find(o => o.value === value);
  const isFiltered = value !== '' && value !== options[0]?.value;

  const triggerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '7px 12px',
    height: 36,
    minWidth: width || 130,
    background: isFiltered ? 'rgba(217,119,87,0.06)' : 'var(--surface-card)',
    border: `1px solid ${open ? 'var(--accent-orange)' : isFiltered ? 'var(--accent-orange)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-display)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--ink)',
    cursor: 'pointer',
    outline: 'none',
    whiteSpace: 'nowrap',
    transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
    boxShadow: open ? '0 0 0 2px rgba(217,119,87,0.15)' : 'none',
  };

  const menu = open && createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        minWidth: pos.width,
        maxHeight: 340,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 9999,
        overflow: 'hidden',
        animation: 'fadeInUp 0.12s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {searchable && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-hairline)' }}>
          <input
            ref={searchRef}
            value={search}
            onChange={e => { setSearch(e.target.value); setFocusIdx(0); }}
            placeholder="Search..."
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)',
            }}
          />
        </div>
      )}
      <div style={{ maxHeight: searchable ? 280 : 320, overflowY: 'auto' }}>
        {filtered.map((opt, idx) => {
          const isSelected = opt.value === value;
          const isFocused = idx === focusIdx;
          return (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 12px', border: 'none', textAlign: 'left',
                background: isFocused ? 'var(--surface-elevated)' : 'transparent',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px',
                color: isSelected ? 'var(--accent-orange)' : 'var(--ink)',
                transition: 'background 80ms',
              }}
              onMouseEnter={() => setFocusIdx(idx)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                {opt.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                {opt.meta && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)' }}>{opt.meta}</span>
                )}
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--stone)' }}>
            No results
          </div>
        )}
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(!open)} style={triggerStyle}>
        {selected?.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: selected.dot, flexShrink: 0 }} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected?.label || placeholder}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"
          style={{ color: 'var(--stone)', transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <path d="M2 3.5L5 6.5L8 3.5" />
        </svg>
      </button>
      {menu}
    </>
  );
}
