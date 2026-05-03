import React, { useEffect, useState } from "react";
import TodayList from "./components/TodayList";
import AppointmentForm from "./components/AppointmentForm";
import PaymentsAnalytics from "./components/PaymentsAnalytics";
import Modal from "./components/Modal";
import InstallPrompt from "./components/InstallPrompt";
import History from "./components/History";
import ImportConfirmModal from "./components/ImportConfirmModal";
import { db } from "./db";
import Swal from "sweetalert2";

type Tab = "citas" | "pagos" | "historial";

export default function App() {
  const [tab, setTab] = useState<Tab>("citas");
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [existingCounts, setExistingCounts] = useState({ appts: 0, pays: 0 });
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (navigator.storage && (navigator as any).storage.persist) {
      (navigator as any).storage.persist();
    }
  }, []);

  useEffect(() => {
    const handleSWUpdate = () => {
      setShowUpdatePrompt(true);
    };
    window.addEventListener('swUpdated', handleSWUpdate);
    return () => window.removeEventListener('swUpdated', handleSWUpdate);
  }, []);

  const handleExport = async () => {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agenda-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);

      // Detect if there is existing data
      const [existingAppts, existingPays] = await Promise.all([
        db.appointments.count(),
        db.payments.count(),
      ]);
      const hasData = existingAppts > 0 || existingPays > 0;

      if (hasData) {
        // Show confirmation modal
        setImportData(parsed);
        setExistingCounts({ appts: existingAppts, pays: existingPays });
        setShowImportConfirm(true);
      } else {
        // No existing data, import directly
        await db.importAll(parsed, 'replace');
        await Swal.fire('Éxito', 'Datos importados correctamente', 'success');
        setRefreshKey((k) => k + 1);
      }
    } catch (e) {
      await Swal.fire('Error', 'Archivo inválido', 'error');
    }
  };

  const handleImportReplace = async () => {
    if (!importData) return;
    await db.importAll(importData, 'replace');
    await Swal.fire('Éxito', 'Datos reemplazados correctamente', 'success');
    setShowImportConfirm(false);
    setImportData(null);
    setRefreshKey((k) => k + 1);
  };

  const handleImportMerge = async () => {
    if (!importData) return;
    await db.importAll(importData, 'merge');
    await Swal.fire('Éxito', 'Datos fusionados correctamente', 'success');
    setShowImportConfirm(false);
    setImportData(null);
    setRefreshKey((k) => k + 1);
  };

  const handleImportCancel = () => {
    setShowImportConfirm(false);
    setImportData(null);
  };

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="app">
      {showUpdatePrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#0d6efd',
          borderBottom: '3px solid #0a58ca',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 9999,
          fontSize: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <span style={{fontWeight: 600, color: 'white'}}>📦 Nueva versión disponible</span>
          <button
            onClick={() => {
              setShowUpdatePrompt(false);
              window.location.reload();
            }}
            style={{
              background: 'white',
              color: '#0d6efd',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
            }}
          >
            Actualizar
          </button>
        </div>
      )}
      <div className="topbar" style={showUpdatePrompt ? {paddingTop: '55px'} : {}}>
        <h1>📋 Agenda</h1>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: "#f0f0f0",
              color: "#212529",
              border: "none",
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: "bold",
              minWidth: 44,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Menú"
          >
            ⋮
          </button>
          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                background: "#fff",
                border: "1px solid #dee2e6",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 1000,
                marginTop: 8,
                minWidth: 200,
              }}
            >
              <button
                onClick={() => {
                  handleExport();
                  setShowMenu(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  borderBottom: "1px solid #dee2e6",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <span style={{color: 'black'}}>📤 Respaldar datos</span>
              </button>
              <label
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "block",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    handleImport(e.target.files?.[0] || null);
                    setShowMenu(false);
                  }}
                />
                <span>📤 Restaurar datos</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <InstallPrompt />
        {tab === "citas" && (
          <div className="grid">
            <div>
              <div className="card">
                <TodayList key={refreshKey} />
              </div>
            </div>
          </div>
        )}

        {tab === "pagos" && (
          <div className="card">
            <PaymentsAnalytics key={tab} />
          </div>
        )}

        {tab === "historial" && (
          <div className="card">
            <History key={tab} />
          </div>
        )}
      </div>

      {/* floating action button */}
      <button
        className="fab"
        aria-label="Nueva cita"
        onClick={() => setShowModal(true)}
      >
        +
      </button>

      {/* bottom navigation (mobile-first) */}
      <div className="bottom-nav" role="navigation" aria-label="Navegación">
        <button
          className={tab === "citas" ? "tab active" : "tab"}
          onClick={() => setTab("citas")}
        >
          Citas
        </button>
        <button
          className={tab === "pagos" ? "tab active" : "tab"}
          onClick={() => setTab("pagos")}
        >
          💰 Pagos
        </button>
        <button
          className={tab === "historial" ? "tab active" : "tab"}
          onClick={() => setTab("historial")}
        >
          Historial
        </button>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <AppointmentForm
            onClose={() => setShowModal(false)}
            onSaved={() => {
              handleSaved();
              setShowModal(false);
            }}
          />
        </Modal>
      )}

      {showImportConfirm && (
        <ImportConfirmModal
          existingAppts={existingCounts.appts}
          existingPays={existingCounts.pays}
          onReplace={handleImportReplace}
          onMerge={handleImportMerge}
          onCancel={handleImportCancel}
        />
      )}
    </div>
  );
}
