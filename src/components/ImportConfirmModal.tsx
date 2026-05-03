import React from 'react'
import Modal from './Modal'

interface ImportConfirmModalProps {
  existingAppts: number
  existingPays: number
  onReplace: () => void
  onMerge: () => void
  onCancel: () => void
}

export default function ImportConfirmModal({
  existingAppts,
  existingPays,
  onReplace,
  onMerge,
  onCancel,
}: ImportConfirmModalProps) {
  return (
    <Modal onClose={onCancel}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>
          ⚠️ Datos Existentes
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: 14, color: 'var(--text-light)', lineHeight: 1.5 }}>
          Ya existen <strong>{existingAppts}</strong> cita(s) y <strong>{existingPays}</strong> pago(s).
        </p>
        <p style={{ margin: '0 0 24px 0', fontSize: 13, color: 'var(--text-light)' }}>
          ¿Qué deseas hacer con el respaldo?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onReplace}
            style={{
              padding: '12px 16px',
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#c82333')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#dc3545')}
          >
            🔄 Reemplazar Todo
          </button>

          <button
            onClick={onMerge}
            style={{
              padding: '12px 16px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0b5ed7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary)')}
          >
            ➕ Fusionar
          </button>

          <button
            onClick={onCancel}
            style={{
              padding: '12px 16px',
              background: 'rgba(0,0,0,0.06)',
              color: 'inherit',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
          >
            ✕ Cancelar
          </button>
        </div>
      </div>
    </Modal>
  )
}
