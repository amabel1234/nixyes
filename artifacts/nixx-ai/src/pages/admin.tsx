import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Show } from "@clerk/react";

interface Payment {
  id: number;
  clerkId: string;
  name: string;
  phone: string;
  amount: number;
  qrisRef: string | null;
  status: string;
  createdAt: string;
  approvedAt: string | null;
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments", { credentials: "include" });
      if (res.status === 403) { setError("Akses ditolak. Kamu bukan admin."); setLoading(false); return; }
      if (!res.ok) throw new Error("Gagal memuat data");
      setPayments(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayments(); }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal memproses");
      await loadPayments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const statusLabel = (s: string) => {
    if (s === "approved") return <span className="nx-badge nx-badge-green">✅ Disetujui</span>;
    if (s === "rejected") return <span className="nx-badge nx-badge-red">❌ Ditolak</span>;
    return <span className="nx-badge nx-badge-yellow">⏳ Menunggu</span>;
  };

  return (
    <div className="nx-admin-page">
      <Show when="signed-out">
        {(() => { navigate("/sign-in"); return null; })()}
      </Show>

      <div className="nx-admin-header">
        <button className="nx-back-btn" onClick={() => navigate("/chat")}>← Chat</button>
        <h1>🛡️ Admin Panel</h1>
        <button className="nx-refresh-btn" onClick={loadPayments}>🔄 Refresh</button>
      </div>

      {loading && <div className="nx-admin-loading">Memuat data...</div>}
      {error && <div className="nx-admin-error">⚠️ {error}</div>}

      {!loading && !error && (
        <div className="nx-admin-content">
          <h2>Daftar Pembayaran ({payments.length})</h2>

          {payments.length === 0 ? (
            <div className="nx-admin-empty">Belum ada pembayaran masuk.</div>
          ) : (
            <div className="nx-admin-table-wrap">
              <table className="nx-admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>No HP</th>
                    <th>Jumlah</th>
                    <th>Ref QRIS</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.phone}</td>
                      <td>Rp{p.amount.toLocaleString("id-ID")}</td>
                      <td>{p.qrisRef || "-"}</td>
                      <td>{statusLabel(p.status)}</td>
                      <td>{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                      <td>
                        {p.status === "pending" && (
                          <div className="nx-admin-actions">
                            <button
                              className="nx-approve-btn"
                              disabled={processing === p.id}
                              onClick={() => handleAction(p.id, "approve")}
                            >
                              ✅ Setujui
                            </button>
                            <button
                              className="nx-reject-btn"
                              disabled={processing === p.id}
                              onClick={() => handleAction(p.id, "reject")}
                            >
                              ❌ Tolak
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
