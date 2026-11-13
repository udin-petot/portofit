import * as React from "react";
import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Html,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "react-email";

void React;

export interface InvoiceEmailProps {
	name: string;
	number: string;
	total: string;
	url: string;
	/** Baris rincian yang sudah diformat, misal "Paket Lamaran · 1 kredit". */
	detail?: string | undefined;
	paidAt?: string | undefined;
	method?: string | undefined;
}

/**
 * Email invoice: satu dokumen yang ringkas, dengan nomor dan total terbaca dalam sekali lihat.
 * Rincian panjang tetap di lampiran PDF; email ini yang dibuka orang di ponsel.
 */
export function InvoiceEmail({ name, number, total, url, detail, paidAt, method }: InvoiceEmailProps) {
	const rows: Array<{ label: string; value: string }> = [
		...(detail ? [{ label: "Paket", value: detail }] : []),
		...(method ? [{ label: "Metode", value: method }] : []),
		...(paidAt ? [{ label: "Dibayar", value: paidAt }] : []),
	];

	return (
		<Html lang="id">
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: {
								ink: "#1C1B15",
								muted: "#6B6A60",
								line: "#E4E1D8",
								paper: "#F6F4EE",
								accent: "#337344",
								accentSoft: "#DCF2DF",
								accentText: "#195C2E",
							},
						},
					},
				}}
			>
				<Head>
					<meta name="viewport" content="width=device-width, initial-scale=1" />
				</Head>
				<Preview>
					Invoice {number} dari PortoFit, total {total}
				</Preview>
				<Body className="bg-paper font-sans">
					<Container className="mx-auto my-8 w-full max-w-[560px] overflow-hidden rounded-xl bg-white">
						<Section className="bg-accent" style={{ height: 6, lineHeight: "6px" }}>
							<Text className="m-0 text-[6px] leading-[6px]">&nbsp;</Text>
						</Section>

						<Section className="px-8 pt-8">
							<Row>
								<Column>
									<Text className="m-0 text-sm font-bold tracking-[0.16em] text-ink">PORTOFIT</Text>
									<Text className="m-0 mt-1 text-[11px] text-muted">www.portofit.tech</Text>
								</Column>
								<Column align="right">
									<Text className="m-0 text-[22px] font-bold tracking-[0.14em] text-ink">INVOICE</Text>
									<Text className="m-0 mt-1 text-xs text-muted">{number}</Text>
								</Column>
							</Row>
						</Section>

						<Section className="px-8 pt-6">
							<Row>
								<Column>
									<Text className="m-0 text-[10px] uppercase tracking-[0.14em] text-muted">Ditagihkan kepada</Text>
									<Text className="m-0 mt-1 text-sm font-semibold text-ink">{name}</Text>
								</Column>
								<Column align="right">
									<Section className="rounded-full bg-accentSoft px-3 py-1">
										<Text className="m-0 text-[10px] font-bold tracking-[0.14em] text-accentText">LUNAS</Text>
									</Section>
								</Column>
							</Row>
						</Section>

						<Section className="px-8 pt-6">
							<Text className="m-0 text-sm leading-6 text-muted">
								Halo {name}, pembayaranmu sudah kami terima. Invoice lengkapnya kami lampirkan sebagai PDF di email
								ini.
							</Text>
						</Section>

						{rows.length > 0 && (
							<Section className="mt-6 border-y border-solid border-line px-8 py-1">
								{rows.map((row) => (
									<Row key={row.label} className="border-b border-solid border-line last:border-0">
										<Column className="py-2">
											<Text className="m-0 text-xs uppercase tracking-[0.1em] text-muted">{row.label}</Text>
										</Column>
										<Column align="right" className="py-2">
											<Text className="m-0 text-xs font-medium text-ink">{row.value}</Text>
										</Column>
									</Row>
								))}
							</Section>
						)}

						<Section className="mt-6 px-8">
							<Row className="rounded-lg bg-accentSoft px-4 py-3">
								<Column>
									<Text className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-accentText">
										Total dibayar
									</Text>
								</Column>
								<Column align="right">
									<Text className="m-0 text-xl font-bold text-accentText">{total}</Text>
								</Column>
							</Row>
						</Section>

						<Section className="px-8 pb-8 pt-6">
							<Button
								href={url}
								className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white no-underline"
							>
								Buka transaksi
							</Button>
							<Text className="m-0 mt-6 text-[11px] leading-5 text-muted">
								Invoice ini bukan faktur pajak. Simpan sebagai bukti pembayaran yang sah. Ada yang ingin ditanyakan?
								Balas lewat menu Bantuan di dasbor, atau WhatsApp 081939948769.
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
