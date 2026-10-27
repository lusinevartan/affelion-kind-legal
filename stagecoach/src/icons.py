"""Line icons in the brand's own stroke style, rounded caps, 24-unit grid. One per card."""

ICONS = {
    'heart-pulse': '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M5.5 12h3l1.5-3 2 6 1.5-3h4"/>',
    'bolt': '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
    'home': '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>',
    'truck': '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/><path d="M8.5 9.5v4M6.5 11.5h4"/>',
    'drop': '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2 2.4"/>',
    'child': '<circle cx="12" cy="6.5" r="2.5"/><path d="M8 13a4 4 0 0 1 8 0v2h-1.5l-.5 5h-4l-.5-5H8z"/><path d="M9 20h6"/>',
    'tooth': '<path d="M8 3.5c2 0 2.5 1 4 1s2-1 4-1c2.5 0 3.5 2.5 3 5-.6 3-2 5-2.5 9-.2 1.5-1 2.5-2 2.5S13 18 12 18s-1.5 2-2.5 2-1.8-1-2-2.5C7 13.5 5.6 11.5 5 8.5c-.5-2.5.5-5 3-5z"/>',
    'pill': '<rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="m9.5 9.5 5 5"/>',
    'handshake': '<path d="M3 8h4l3 3a2 2 0 0 0 3 0l1-1 4 4"/><path d="M21 8h-4l-2 2"/><path d="M7 8v6l4 4a2 2 0 0 0 3 0l1-1 1 1a2 2 0 0 0 3 0l2-2V8"/>',
    'file': '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
    'briefcase': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
    'hospital': '<path d="M4 20V6l8-3 8 3v14"/><path d="M2 20h20"/><path d="M12 9v6M9 12h6"/>',
    'flask': '<path d="M10 3h4M11 3v6l-5.5 9a2 2 0 0 0 1.7 3h9.6a2 2 0 0 0 1.7-3L13 9V3"/><path d="M7.5 15h9"/>',
    'compass': '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    'shield': '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9.5 12 2 2 3.5-4"/>',
    'calendar': '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    'users': '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5A5 5 0 0 1 21 19"/>',
    'book': '<path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2z"/><path d="M20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z"/>',
    'phone': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    'star': '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    'building': '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
    'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'spark': '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    'stetho': '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a4 4 0 0 0 8 0v-2"/><circle cx="18" cy="12" r="2"/>',
    'dispatch': '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10"/>',
    'wrench': '<path d="M14.5 4.5a4 4 0 0 0-4 6L4 17l3 3 6.5-6.5a4 4 0 0 0 6-4l-2.5 2.5-2.5-2.5z"/>',
    'graduation': '<path d="m3 9 9-4 9 4-9 4z"/><path d="M7 11v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4"/><path d="M21 9v5"/>',
    'map-pin': '<path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z"/><circle cx="12" cy="10" r="2.2"/>',
}


def icon(name, cls='ic'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>'
