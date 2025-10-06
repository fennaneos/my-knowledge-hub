import React from 'react';
import { useBadges } from './useBadges';


export default function BadgeShelf() {
    const badges = useBadges().all();
    if (!badges.length) return null;
    return (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            {badges.map(b => (
                <div key={b.id} className="gold-glow" style={{
                    border: '1px solid var(--gold-faint)', borderRadius: 10, padding: '6px 10px',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', color: '#fff'
                }}>
                    <span style={{ marginRight: 6 }}>{b.emoji || '🏅'}</span>
                    <strong style={{ background: 'linear-gradient(90deg, var(--gold-1), var(--gold-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{b.name}</strong>
                </div>
            ))}
        </div>
    );
}