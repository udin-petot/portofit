import type { Style } from "./forme/style-types";
import { Document, Page, Text, View } from "./forme/primitives";

export type InvoicePdfSnapshot = {
	customerName: string;
	customerEmail: string;
	planName: string;
	credits: number;
	items?: { kind: string; credits: number }[];
	amountIdr: number;
	uniqueCode: number;
	totalIdr: number;
	paymentMethod: string;
	paidAt: string;
	balanceAfter: number;
};

export type InvoicePdfInput = {
	number: string;
	issuedAt: Date;
	snapshot: InvoicePdfSnapshot;
};

const rupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

const ITEM_LABEL: Record<string, string> = {
	application: "lamaran",
	interview: "sesi wawancara",
	coach: "pesan Coach",
};

const tanggal = (value: Date | string) =>
	new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date(value));

/** Hijau aksi PortoFit, sama dengan aplikasi, supaya dokumen ini masih terasa dari produk yang sama. */
const ACCENT = "#337344";
const ACCENT_SOFT = "#DCF2DF";
const ACCENT_TEXT = "#195C2E";
const INK = "#1C1B15";
const MUTED = "#6B6A60";
const LINE = "#E4E1D8";
const PAPER = "#F6F4EE";

const styles = {
	page: { paddingTop: 0, paddingBottom: 46, paddingHorizontal: 46, fontFamily: "Helvetica", fontSize: 10, color: INK },
	band: { height: 6, backgroundColor: ACCENT, marginHorizontal: -46 },
	header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 36 },
	brandRow: { flexDirection: "row", alignItems: "center" },
	monogram: {
		width: 34,
		height: 34,
		borderRadius: 8,
		backgroundColor: ACCENT,
		alignItems: "center",
		justifyContent: "center",
	},
	monogramText: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 14 },
	brandName: { fontSize: 15, fontFamily: "Helvetica-Bold", marginLeft: 11, letterSpacing: 0.6 },
	site: { fontSize: 8.5, color: MUTED, marginTop: 4, marginLeft: 11 },
	titleBlock: { alignItems: "flex-end" },
	title: { fontSize: 26, fontFamily: "Helvetica-Bold", letterSpacing: 1.4 },
	number: { fontSize: 10.5, color: MUTED, marginTop: 5 },
	pill: { marginTop: 8, paddingVertical: 3.5, paddingHorizontal: 9, borderRadius: 999, backgroundColor: ACCENT_SOFT },
	pillText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: ACCENT_TEXT, letterSpacing: 1 },
	summary: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: ACCENT_SOFT,
		borderRadius: 8,
		paddingVertical: 14,
		paddingHorizontal: 16,
		marginTop: 24,
	},
	summaryLabel: { fontSize: 7.5, color: ACCENT_TEXT, letterSpacing: 1.1, fontFamily: "Helvetica-Bold" },
	summaryValue: { fontSize: 21, fontFamily: "Helvetica-Bold", color: ACCENT_TEXT, marginTop: 3 },
	summaryRight: { alignItems: "flex-end" },
	summaryMeta: { fontSize: 8.5, color: ACCENT_TEXT, marginTop: 2 },
	meta: { flexDirection: "row", marginTop: 22 },
	metaCell: { flex: 1, paddingRight: 16 },
	metaWide: { flex: 1.6, paddingRight: 20 },
	metaLabel: { fontSize: 7.5, color: MUTED, letterSpacing: 1 },
	metaValue: { fontSize: 9.5, marginTop: 5, lineHeight: 1.4 },
	metaStrong: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 5 },
	sectionLabel: { fontSize: 7.5, color: MUTED, letterSpacing: 1, marginTop: 28, marginBottom: 8 },
	tableHead: {
		flexDirection: "row",
		backgroundColor: PAPER,
		paddingVertical: 7,
		paddingHorizontal: 10,
		borderTopLeftRadius: 5,
		borderTopRightRadius: 5,
	},
	headCell: { fontSize: 7.5, color: MUTED, letterSpacing: 0.9 },
	row: {
		flexDirection: "row",
		paddingVertical: 10,
		paddingHorizontal: 10,
		borderBottomWidth: 0.5,
		borderBottomColor: LINE,
	},
	balanceNote: { fontSize: 8.5, color: MUTED, paddingHorizontal: 10, paddingTop: 8 },
	cell: { fontSize: 9.5 },
	colDesc: { flex: 1 },
	colCredits: { width: 64, textAlign: "right" },
	colAmount: { width: 100, textAlign: "right" },
	guide: {
		flexDirection: "row",
		marginTop: 26,
		backgroundColor: PAPER,
		borderRadius: 7,
		paddingVertical: 13,
		paddingHorizontal: 14,
	},
	guideLeft: { flex: 1.45, paddingRight: 20 },
	guideRight: { flex: 1, borderLeftWidth: 0.75, borderLeftColor: LINE, paddingLeft: 16 },
	step: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5 },
	stepNumber: {
		width: 13,
		height: 13,
		borderRadius: 7,
		backgroundColor: ACCENT,
		color: "#FFFFFF",
		fontFamily: "Helvetica-Bold",
		fontSize: 7,
		textAlign: "center",
		marginRight: 7,
		marginTop: 1,
	},
	stepText: { flex: 1, fontSize: 8, lineHeight: 1.5, color: INK },
	guideContact: { marginTop: 5, color: ACCENT_TEXT, fontFamily: "Helvetica-Bold" },
	notes: { flexDirection: "row", marginTop: 30, borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: 14 },
	notesLeft: { flex: 1.5, paddingRight: 24 },
	notesRight: { flex: 1, alignItems: "flex-end" },
	notesLabel: { fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 5 },
	notesText: { fontSize: 8, color: MUTED, lineHeight: 1.6 },
	footer: { marginTop: 26, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	footerText: { fontSize: 7.5, color: MUTED },
} satisfies Record<string, Style>;

export function InvoiceDocument({ number, issuedAt, snapshot }: InvoicePdfInput) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.band} />

				<View style={styles.header}>
					<View>
						<View style={styles.brandRow}>
							<View style={styles.monogram}>
								<Text style={styles.monogramText}>PF</Text>
							</View>
							<Text style={styles.brandName}>PORTOFIT</Text>
						</View>
						<Text style={styles.site}>www.portofit.tech</Text>
					</View>

					<View style={styles.titleBlock}>
						<Text style={styles.title}>INVOICE</Text>
						<Text style={styles.number}>{number}</Text>
						<View style={styles.pill}>
							<Text style={styles.pillText}>LUNAS</Text>
						</View>
					</View>
				</View>

				<View style={styles.summary}>
					<View>
						<Text style={styles.summaryLabel}>TOTAL DIBAYAR</Text>
						<Text style={styles.summaryValue}>{rupiah(snapshot.totalIdr)}</Text>
					</View>
					<View style={styles.summaryRight}>
						<Text style={styles.summaryMeta}>{snapshot.paymentMethod.toUpperCase()} · diverifikasi admin</Text>
						<Text style={styles.summaryMeta}>Dibayar {tanggal(snapshot.paidAt)}</Text>
						<Text style={styles.summaryMeta}>
							{snapshot.credits} kredit masuk ke akun
							{snapshot.uniqueCode > 0 ? ` · kode ${String(snapshot.uniqueCode).padStart(3, "0")}` : ""}
						</Text>
					</View>
				</View>

				<View style={styles.meta}>
					<View style={styles.metaWide}>
						<Text style={styles.metaLabel}>DITAGIHKAN KEPADA</Text>
						<Text style={styles.metaStrong}>{snapshot.customerName}</Text>
						<Text style={styles.metaValue}>{snapshot.customerEmail}</Text>
					</View>
					<View style={styles.metaCell}>
						<Text style={styles.metaLabel}>TANGGAL TERBIT</Text>
						<Text style={styles.metaStrong}>{tanggal(issuedAt)}</Text>
					</View>
					<View style={styles.metaCell}>
						<Text style={styles.metaLabel}>NOMOR INVOICE</Text>
						<Text style={styles.metaStrong}>{number}</Text>
					</View>
				</View>

				<Text style={styles.sectionLabel}>RINCIAN</Text>

				<View style={styles.tableHead}>
					<Text style={[styles.headCell, styles.colDesc]}>DESKRIPSI</Text>
					<Text style={[styles.headCell, styles.colCredits]}>KREDIT</Text>
					<Text style={[styles.headCell, styles.colAmount]}>JUMLAH</Text>
				</View>

				<View style={styles.row}>
					<Text style={[styles.cell, styles.colDesc]}>
						Paket {snapshot.planName}
						{snapshot.items && snapshot.items.length > 0
							? `\n${snapshot.items.map((item) => `${item.credits} ${ITEM_LABEL[item.kind] ?? item.kind}`).join("\n")}`
							: ""}
					</Text>
					<Text style={[styles.cell, styles.colCredits]}>{snapshot.credits}</Text>
					<Text style={[styles.cell, styles.colAmount]}>{rupiah(snapshot.amountIdr)}</Text>
				</View>

				<Text style={styles.balanceNote}>
					Sisa kredit di akun setelah pembayaran ini: {snapshot.balanceAfter} kredit.
				</Text>

				<View style={styles.guide}>
					<View style={styles.guideLeft}>
						<Text style={styles.notesLabel}>CARA PAKAI KREDIT INI</Text>
						<View style={styles.step}>
							<Text style={styles.stepNumber}>1</Text>
							<Text style={styles.stepText}>Buka dasbor, lalu pilih lamaran atau dokumen yang mau dikerjakan.</Text>
						</View>
						<View style={styles.step}>
							<Text style={styles.stepNumber}>2</Text>
							<Text style={styles.stepText}>
								Tekan persiapan di tab kecocokan. Satu kredit membuat CV dan surat lamaran.
							</Text>
						</View>
						<View style={styles.step}>
							<Text style={styles.stepNumber}>3</Text>
							<Text style={styles.stepText}>
								Periksa hasilnya, unduh PDF, lalu kirim sendiri ke perusahaan lewat situs mereka.
							</Text>
						</View>
					</View>
					<View style={styles.guideRight}>
						<Text style={styles.notesLabel}>BUTUH BANTUAN</Text>
						<Text style={styles.notesText}>
							Balas lewat menu Bantuan di dasbor. Dijawab pada hari kerja, biasanya kurang dari satu hari.
						</Text>
						<Text style={[styles.notesText, styles.guideContact]}>WhatsApp 081939948769</Text>
					</View>
				</View>

				<View style={styles.notes}>
					<View style={styles.notesLeft}>
						<Text style={styles.notesLabel}>CATATAN</Text>
						<Text style={styles.notesText}>
							Invoice ini bukan faktur pajak. Simpan sebagai bukti pembayaran yang sah. Kredit paket ini tersimpan di
							akunmu, tidak kedaluwarsa, dan dipakai dari dasbor pada bagian Beli kredit. Nomor invoice terbit sekali
							dan tidak berubah walau harga paket disesuaikan kemudian.
						</Text>
					</View>
					<View style={styles.notesRight}>
						<Text style={styles.notesLabel}>VERIFIKASI</Text>
						<Text style={styles.notesText}>Diverifikasi admin pada {tanggal(snapshot.paidAt)}</Text>
					</View>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>www.portofit.tech · WhatsApp 081939948769</Text>
					<Text style={styles.footerText}>{number}</Text>
				</View>
			</Page>
		</Document>
	);
}
