import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export const UserProfile: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
      <div style={{
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        background: '#3b82f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        fontWeight: '700',
        color: '#fff',
        flexShrink: 0,
      }}>
        {currentUser.tim_name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')}
      </div>
      <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', userSelect: 'none' }}>
        {currentUser.tim_name}
      </span>
    </div>
  );
};
