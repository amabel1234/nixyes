import React, { useState } from "react";
import { useLocation } from "wouter";
import { Show } from "@clerk/react";
import { useUserInfo } from "@/hooks/use-user-info";
import { useQueryClient } from "@tanstack/react-query";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function PremiumPage() {
  const [, navigate] = useLocation();
  const { data: userInfo, refetch } = useUserInfo();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [qrisRef, setQrisRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Nama dan nomor HP wajib diisi");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), amount: 15000, qrisRef: qrisRef.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal mengirim pembayaran");
      }
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["user-info"] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nx-page-center">
      <Show when="signed-out">
        {(() => { navigate("/sign-in"); return null; })()}
      </Show>

      <div className="nx-premium-card">
        <div className="nx-premium-header">
          <div className="nx-premium-badge">⭐ PREMIUM</div>
          <h1 className="nx-premium-title">Upgrade ke Nixx AI Premium</h1>
          <p className="nx-premium-subtitle">Chat tanpa batas, akses semua 26 model AI</p>
        </div>

        {userInfo?.isPremium ? (
          <div className="nx-premium-active">
            <div className="nx-premium-active-icon">🎉</div>
            <h2>Kamu sudah Premium!</h2>
            {userInfo.premiumUntil && (
              <p>Aktif hingga: <strong>{new Date(userInfo.premiumUntil).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></p>
            )}
            <button className="nx-start-btn" onClick={() => navigate("/chat")}>
              Mulai Chat →
            </button>
          </div>
        ) : submitted ? (
          <div className="nx-premium-success">
            <div className="nx-premium-active-icon">✅</div>
            <h2>Pembayaran Terkirim!</h2>
            <p>Tim kami akan memverifikasi pembayaranmu dalam <strong>1×24 jam</strong>. Kamu akan mendapat notifikasi setelah disetujui.</p>
            <button className="nx-start-btn" onClick={() => navigate("/chat")}>
              Kembali ke Chat
            </button>
          </div>
        ) : (
          <>
            <div className="nx-premium-benefits">
              <div className="nx-premium-benefit">✅ Chat tanpa batas harian</div>
              <div className="nx-premium-benefit">✅ Akses 26 model AI premium</div>
              <div className="nx-premium-benefit">✅ Prioritas respons lebih cepat</div>
              <div className="nx-premium-benefit">✅ Berlaku 30 hari</div>
            </div>

            <div className="nx-premium-price">
              <span className="nx-premium-price-amount">Rp15.000</span>
              <span className="nx-premium-price-period">/ 30 hari</span>
            </div>

            <div className="nx-qris-section">
              <h3>Bayar via QRIS Dana</h3>
              <p className="nx-qris-note">Scan QRIS di bawah dengan aplikasi Dana atau dompet digital lainnya</p>
              <div className="nx-qris-placeholder">
                <div className="nx-qris-icon">📱</div>
                <p>QRIS Dana</p>
                <p className="nx-qris-amount">Rp15.000</p>
                <p className="nx-qris-info">Screenshot QRIS ini lalu bayar melalui Dana</p>
              </div>
            </div>

            <form className="nx-premium-form" onSubmit={handleSubmit}>
              <h3>Konfirmasi Pembayaran</h3>
              <p className="nx-form-note">Setelah bayar, isi form ini supaya admin bisa verifikasi akun kamu</p>

              <div className="nx-form-group">
                <label>Nama Lengkap *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama sesuai akun Dana"
                  required
                />
              </div>
              <div className="nx-form-group">
                <label>Nomor HP *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nomor HP yang dipakai Dana"
                  required
                />
              </div>
              <div className="nx-form-group">
                <label>Referensi QRIS (opsional)</label>
                <input
                  type="text"
                  value={qrisRef}
                  onChange={(e) => setQrisRef(e.target.value)}
                  placeholder="Kode transaksi dari Dana (jika ada)"
                />
              </div>

              {error && <div className="nx-form-error">⚠️ {error}</div>}

              <button type="submit" className="nx-start-btn" disabled={loading}>
                {loading ? "Mengirim..." : "📤 Konfirmasi Pembayaran"}
              </button>
            </form>
          </>
        )}

        <button className="nx-back-btn" onClick={() => navigate("/chat")}>
          ← Kembali ke Chat
        </button>
      </div>
    </div>
  );
}
