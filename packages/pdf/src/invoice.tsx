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

const styles = {
	page: { paddingVertical: 44, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 10, color: "#111111" },
	header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
	brand: { fontSize: 14, fontFamily: "Helvetica-Bold" },
	site: { fontSize: 9, color: "#555555", marginTop: 2 },
	title: { fontSize: 24, fontFamily: "Helvetica-Bold" },
	meta: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
	metaLabel: { fontSize: 8, color: "#555555", textTransform: "uppercase", letterSpacing: 0.6 },
	metaValue: { fontSize: 10, marginTop: 2 },
	status: { fontSize: 10, fontFamily: "Helvetica-Bold" },
	rule: { borderBottomWidth: 0.75, borderBottomColor: "#111111", marginTop: 12 },
	section: { marginTop: 18 },
	sectionLabel: { fontSize: 8, color: "#555555", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
	name: { fontSize: 11, fontFamily: "Helvetica-Bold" },
	row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#dddddd" },
	rowTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 0.75, borderTopColor: "#111111", marginTop: 2 },
	label: { fontSize: 10 },
	value: { fontSize: 10, textAlign: "right" },
	total: { fontSize: 11, fontFamily: "Helvetica-Bold" },
	footer: { marginTop: 28, fontSize: 8, color: "#555555", lineHeight: 1.5 },
} satisfies Record<string, Style>;

export function InvoiceDocument({ number, issuedAt, snapshot }: InvoicePdfInput) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<View>
						<Text style={styles.brand}>PortoFit</Text>
						<Text style={styles.site}>www.portofit.tech</Text>
					</View>
					<Text style={styles.title}>Kuitansi</Text>
				</View>

				<View style={styles.rule} />

				<View style={styles.meta}>
					<View>
						<Text style={styles.metaLabel}>Nomor</Text>
						<Text style={styles.metaValue}>{number}</Text>
					</View>
					<View>
						<Text style={styles.metaLabel}>Tanggal</Text>
						<Text style={styles.metaValue}>{tanggal(issuedAt)}</Text>
					</View>
					<View>
						<Text style={styles.metaLabel}>Status</Text>
						<Text style={styles.status}>LUNAS</Text>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Dibayar oleh</Text>
					<Text style={styles.name}>{snapshot.customerName}</Text>
					<Text style={styles.metaValue}>{snapshot.customerEmail}</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Rincian</Text>
					<View style={styles.row}>
						<Text style={styles.label}>Paket {snapshot.planName}</Text>
						<Text style={styles.value}>{snapshot.credits} kredit</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Harga paket</Text>
						<Text style={styles.value}>{rupiah(snapshot.amountIdr)}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Kode unik</Text>
						<Text style={styles.value}>{snapshot.uniqueCode}</Text>
					</View>
					<View style={styles.rowTotal}>
						<Text style={styles.total}>Total dibayar</Text>
						<Text style={styles.total}>{rupiah(snapshot.totalIdr)}</Text>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.label}>Metode bayar: {snapshot.paymentMethod.toUpperCase()}</Text>
					<Text style={styles.metaValue}>Diverifikasi {tanggal(snapshot.paidAt)}</Text>
				</View>

				<Text style={styles.footer}>
					Kuitansi ini bukan faktur pajak. Simpan sebagai bukti pembayaran yang sah. Pertanyaan lewat Bantuan di dasbor atau
					WhatsApp 081939948769.
				</Text>
			</Page>
		</Document>
	);
}
