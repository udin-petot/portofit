import type { Style } from "./forme/style-types";
import { Document, Page, Text, View } from "./forme/primitives";

export type InvoicePdfSnapshot = {
	customerName: string;
	customerEmail: string;
	planName: string;
	credits: number;
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
	page: { paddingTop: 0, paddingBottom: 44, paddingHorizontal: 46, fontFamily: "Helvetica", fontSize: 10, color: INK },
	band: { height: 6, backgroundColor: ACCENT, marginHorizontal: -46 },
	header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 34 },
	brandRow: { flexDirection: "row", alignItems: "center" },
	monogram: {
		width: 32,
		height: 32,
		borderRadius: 7,
		backgroundColor: ACCENT,
		alignItems: "center",
		justifyContent: "center",
	},
	monogramText: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 13 },
	brandName: { fontSize: 14, fontFamily: "Helvetica-Bold", marginLeft: 10, letterSpacing: 0.4 },
	site: { fontSize: 8.5, color: MUTED, marginTop: 3, marginLeft: 10 },
	titleBlock: { alignItems: "flex-end" },
	title: { fontSize: 25, fontFamily: "Helvetica-Bold", letterSpacing: 1.2 },
	number: { fontSize: 10, color: MUTED, marginTop: 4 },
	pill: { marginTop: 7, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, backgroundColor: ACCENT_SOFT },
	pillText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: ACCENT_TEXT, letterSpacing: 0.9 },
	rule: { borderBottomWidth: 0.75, borderBottomColor: LINE, marginTop: 20 },
	meta: { flexDirection: "row", marginTop: 18 },
	metaCell: { flex: 1, paddingRight: 12 },
	metaLabel: { fontSize: 7.5, color: MUTED, letterSpacing: 0.9 },
	metaValue: { fontSize: 9.5, marginTop: 4, lineHeight: 1.35 },
	metaStrong: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 4 },
	sectionLabel: { fontSize: 7.5, color: MUTED, letterSpacing: 0.9, marginTop: 26, marginBottom: 7 },
	tableHead: {
		flexDirection: "row",
		backgroundColor: PAPER,
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderTopLeftRadius: 5,
		borderTopRightRadius: 5,
	},
	headCell: { fontSize: 7.5, color: MUTED, letterSpacing: 0.8 },
	row: {
		flexDirection: "row",
		paddingVertical: 9,
		paddingHorizontal: 8,
		borderBottomWidth: 0.5,
		borderBottomColor: LINE,
	},
	cell: { fontSize: 9.5 },
	colDesc: { flex: 1 },
	colCredits: { width: 70, textAlign: "center" },
	colAmount: { width: 96, textAlign: "right" },
	totalRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: ACCENT_SOFT,
		paddingVertical: 11,
		paddingHorizontal: 10,
		borderBottomLeftRadius: 5,
		borderBottomRightRadius: 5,
	},
	totalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: ACCENT_TEXT, letterSpacing: 0.4 },
	totalValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: ACCENT_TEXT },
	footer: { marginTop: 26, borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: 10 },
	footerText: { fontSize: 7.5, color: MUTED, lineHeight: 1.6 },
	footerStrong: { fontSize: 7.5, color: INK, fontFamily: "Helvetica-Bold" },
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

				<View style={styles.rule} />

				<View style={styles.meta}>
					<View style={styles.metaCell}>
						<Text style={styles.metaLabel}>DITAGIHKAN KEPADA</Text>
						<Text style={styles.metaStrong}>{snapshot.customerName}</Text>
						<Text style={styles.metaValue}>{snapshot.customerEmail}</Text>
					</View>
					<View style={styles.metaCell}>
						<Text style={styles.metaLabel}>TANGGAL</Text>
						<Text style={styles.metaStrong}>Terbit {tanggal(issuedAt)}</Text>
						<Text style={styles.metaValue}>Dibayar {tanggal(snapshot.paidAt)}</Text>
					</View>
					<View style={styles.metaCell}>
						<Text style={styles.metaLabel}>PEMBAYARAN</Text>
						<Text style={styles.metaStrong}>{snapshot.paymentMethod.toUpperCase()}</Text>
						<Text style={styles.metaValue}>Diverifikasi manual</Text>
					</View>
				</View>

				<Text style={styles.sectionLabel}>RINCIAN</Text>

				<View style={styles.tableHead}>
					<Text style={[styles.headCell, styles.colDesc]}>DESKRIPSI</Text>
					<Text style={[styles.headCell, styles.colCredits]}>KREDIT</Text>
					<Text style={[styles.headCell, styles.colAmount]}>JUMLAH</Text>
				</View>

				<View style={styles.row}>
					<Text style={[styles.cell, styles.colDesc]}>Paket {snapshot.planName}</Text>
					<Text style={[styles.cell, styles.colCredits]}>{snapshot.credits}</Text>
					<Text style={[styles.cell, styles.colAmount]}>{rupiah(snapshot.amountIdr)}</Text>
				</View>

				<View style={styles.row}>
					<Text style={[styles.cell, styles.colDesc]}>Kode unik transfer</Text>
					<Text style={[styles.cell, styles.colCredits]}>—</Text>
					<Text style={[styles.cell, styles.colAmount]}>{snapshot.uniqueCode}</Text>
				</View>

				<View style={styles.row}>
					<Text style={[styles.cell, styles.colDesc]}>Sisa kredit setelah pembayaran ini</Text>
					<Text style={[styles.cell, styles.colCredits]}>—</Text>
					<Text style={[styles.cell, styles.colAmount]}>{snapshot.balanceAfter}</Text>
				</View>

				<View style={styles.totalRow}>
					<Text style={styles.totalLabel}>TOTAL DIBAYAR</Text>
					<Text style={styles.totalValue}>{rupiah(snapshot.totalIdr)}</Text>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>
						<Text style={styles.footerStrong}>Invoice ini bukan faktur pajak.</Text> Simpan sebagai bukti pembayaran
						yang sah. Nomor terbit otomatis setelah pembayaran diperiksa admin, dan tidak berubah walau harga paket
						disesuaikan kemudian.
					</Text>
					<Text style={styles.footerText}>Pertanyaan soal tagihan: Bantuan di dasbor, atau WhatsApp 081939948769.</Text>
				</View>
			</Page>
		</Document>
	);
}
