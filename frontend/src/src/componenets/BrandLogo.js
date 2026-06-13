import { Leaf } from 'lucide-react';

export default function BrandLogo({ compact = false }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
                display: 'grid',
                width: '2.25rem',
                height: '2.25rem',
                flexShrink: 0,
                placeItems: 'center',
                borderRadius: '0.5rem',
                backgroundColor: '#0f766e',
                color: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)',
            }}>
                <Leaf size={20} />
            </div>
            {!compact && (
                <div style={{ minWidth: 0 }}>
                    <p style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        letterSpacing: 'normal',
                        color: '#0f172a',
                        margin: 0,
                    }}>
                        NutriPlan Pro
                    </p>
                    <p style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#0f766e',
                        margin: 0,
                    }}>
                        Plan smarter. Eat better.
                    </p>
                </div>
            )}
        </div>
    );
}
