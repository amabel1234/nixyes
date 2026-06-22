import React from "react";

export default function TermsPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "hsl(248, 30%, 6%)",
      color: "#e2e8f0",
      fontFamily: "system-ui, sans-serif",
      padding: "2rem 1rem",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <a href="/" style={{
            color: "#a855f7", textDecoration: "none", fontSize: 14,
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1.5rem",
          }}>
            ← Kembali ke Beranda
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 32 }}>📋</span>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#fff" }}>
              Syarat & Ketentuan
            </h1>
          </div>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
            Terakhir diperbarui: Juni 2025
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(168,85,247,0.2)", marginBottom: "2rem" }} />

        {/* Channel Banner */}
        <a
          href="https://t.me/nixsukakamu"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.1))",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            textDecoration: "none",
            marginBottom: "2rem",
            transition: "border-color .2s",
          }}
        >
          <span style={{ fontSize: 28 }}>📢</span>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
              Ikuti saluran Nixx
            </div>
            <div style={{ color: "#a855f7", fontSize: 13, marginTop: 2 }}>
              t.me/nixsukakamu — info update & fitur terbaru
            </div>
          </div>
          <span style={{ marginLeft: "auto", color: "#a855f7", fontSize: 18 }}>→</span>
        </a>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          <Section title="1. Penerimaan Syarat">
            Dengan mengakses dan menggunakan layanan Nixx AI, kamu menyatakan telah membaca,
            memahami, dan menyetujui Syarat & Ketentuan ini. Jika kamu tidak menyetujui,
            mohon untuk tidak menggunakan layanan ini.
          </Section>

          <Section title="2. Deskripsi Layanan">
            Nixx AI adalah platform asisten kecerdasan buatan yang menyediakan layanan chat
            dengan 26 model AI. Layanan ini disediakan secara gratis dan dapat berubah
            sewaktu-waktu tanpa pemberitahuan sebelumnya.
          </Section>

          <Section title="3. Penggunaan yang Diizinkan">
            Kamu diperbolehkan menggunakan Nixx AI untuk:
            <ul style={{ marginTop: 8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Mendapatkan informasi, saran, atau bantuan umum</li>
              <li>Keperluan belajar, riset, dan eksplorasi kreatif</li>
              <li>Percakapan sehari-hari dan hiburan</li>
            </ul>
          </Section>

          <Section title="4. Penggunaan yang Dilarang">
            Kamu <strong>dilarang</strong> menggunakan Nixx AI untuk:
            <ul style={{ marginTop: 8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Menyebarkan konten ilegal, berbahaya, atau melanggar hukum</li>
              <li>Menyebarkan informasi palsu (hoaks) atau konten manipulatif</li>
              <li>Melakukan tindakan yang merugikan orang lain</li>
              <li>Mencoba meretas atau mengeksploitasi sistem</li>
              <li>Konten yang melanggar hak cipta atau kekayaan intelektual</li>
            </ul>
          </Section>

          <Section title="5. Privasi & Data">
            Kami menyimpan percakapan kamu untuk keperluan pengalaman pengguna (riwayat chat).
            Kami tidak menjual, menyewakan, atau membagikan data percakapanmu kepada pihak
            ketiga. API Key AI disimpan di server kami dan tidak pernah terekspos ke browser.
          </Section>

          <Section title="6. Batasan Tanggung Jawab">
            Nixx AI disediakan "sebagaimana adanya". Kami tidak menjamin keakuratan,
            kelengkapan, atau keandalan respons AI. Keputusan berdasarkan respons AI
            sepenuhnya menjadi tanggung jawab pengguna. Kami tidak bertanggung jawab
            atas kerugian langsung maupun tidak langsung.
          </Section>

          <Section title="7. Perubahan Layanan">
            Kami berhak mengubah, menangguhkan, atau menghentikan layanan kapan saja
            tanpa pemberitahuan. Kami juga dapat memperbarui Syarat & Ketentuan ini
            sewaktu-waktu. Penggunaan berlanjut berarti kamu menyetujui perubahan tersebut.
          </Section>

          <Section title="8. Kontak & Komunitas">
            Untuk pertanyaan, saran, atau laporan pelanggaran, hubungi kami melalui
            saluran Telegram resmi kami.
            <div style={{ marginTop: 12 }}>
              <a
                href="https://t.me/nixsukakamu"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(168,85,247,0.15)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  color: "#a855f7", textDecoration: "none",
                  padding: "0.5rem 1rem", borderRadius: 8, fontSize: 14, fontWeight: 600,
                }}
              >
                📢 Ikuti saluran Nixx — t.me/nixsukakamu
              </a>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div style={{
          marginTop: "3rem", paddingTop: "1.5rem",
          borderTop: "1px solid rgba(168,85,247,0.15)",
          textAlign: "center", color: "#64748b", fontSize: 13,
        }}>
          © 2025 Nixx AI · by Nixx Team ·{" "}
          <a href="https://t.me/nixsukakamu" target="_blank" rel="noopener noreferrer"
            style={{ color: "#a855f7", textDecoration: "none" }}>
            t.me/nixsukakamu
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "1.25rem 1.5rem",
    }}>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700, color: "#c084fc" }}>
        {title}
      </h2>
      <div style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  );
}
