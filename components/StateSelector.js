'use client';
import { useId, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useSelectedState } from './SelectedStateProvider';

// Two of the three selection methods (the third is clicking the map):
// 1. a dropdown of all 36 States/UTs, 2. a type-ahead search box.
export default function StateSelector({ showSearch = true, showDropdown = true }) {
  const { states, selected, setSelectedState } = useSelectedState();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return states;
    return states
      .filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase() === q || (s.capital || '').toLowerCase().includes(q))
      .sort((a, b) => a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q));
  }, [query, states]);

  const choose = (s) => {
    setSelectedState(s.code, { source: 'search' });
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && open && matches[active]) { e.preventDefault(); choose(matches[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const groups = [['STATE', 'States'], ['UNION_TERRITORY', 'Union Territories']];

  return (
    <div className="state-selector">
      {showSearch && (
        <div className="state-search">
          <Search size={15} className="search-icon" />
          <input
            ref={inputRef}
            className="input"
            type="search"
            placeholder="Search state or UT…"
            aria-label="Search state or union territory"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
          />
          {open && (
            <ul className="suggestions" id={listId} role="listbox">
              {matches.length === 0 && <li className="empty">No state or UT matches “{query}”</li>}
              {matches.map((s, i) => (
                <li key={s.code} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); choose(s); }} onMouseEnter={() => setActive(i)}>
                  <span>{s.name}</span>
                  <span className="faint tiny">{s.type === 'UNION_TERRITORY' ? 'UT' : s.code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {showDropdown && (
        <select
          className="select state-select"
          aria-label="Select state or union territory"
          value={selected.code}
          onChange={(e) => setSelectedState(e.target.value, { source: 'dropdown' })}
        >
          {groups.map(([type, label]) => (
            <optgroup key={type} label={label}>
              {states.filter((s) => s.type === type).map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </optgroup>
          ))}
        </select>
      )}
    </div>
  );
}
