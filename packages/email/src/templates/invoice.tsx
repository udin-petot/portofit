import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Tailwind, Text } from "react-email";

void React;

export interface InvoiceEmailProps {
	name: string;
	number: string;
	total: string;
	url: string;
}

/** Email kuitansi sengaja pendek: nomor, total, satu tombol. Rincian lengkap ada di lampiran PDF. */
export function InvoiceEmail({ name, number, total, url }: InvoiceEmailProps) {
	return (
		<Html lang="id">
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: { ink: "#111111", muted: "#555555", line: "#dddddd" },
						},
					},
				}}
			>
				<Head />
				<Preview>Kuitansi {number} dari PortoFit</Preview>
				<Body className="bg-white font-sans">
					<Container className="mx-auto max-w-[560px] px-6 py-10">
						<Text className="m-0 text-xs font-semibold tracking-[0.18em] text-muted">PORTOFIT</Text>
						<Heading className="mt-3 text-xl font-semibold text-ink">Kuitansi {number}</Heading>
						<Text className="mt-3 text-sm leading-6 text-muted">
							Halo {name}, pembayaranmu sudah kami terima. Kuitansi dalam bentuk PDF kami lampirkan di email ini.
						</Text>
						<Section className="mt-6 border border-solid border-line px-4 py-3">
							<Text className="m-0 text-xs uppercase tracking-[0.12em] text-muted">Total dibayar</Text>
							<Text className="m-0 mt-1 text-lg font-semibold text-ink">{total}</Text>
						</Section>
						<Button href={url} className="mt-6 bg-ink px-4 py-2 text-sm text-white no-underline">
							Lihat transaksi
						</Button>
						<Text className="mt-8 text-xs leading-5 text-muted">
							Kuitansi ini bukan faktur pajak. Kalau ada yang ingin ditanyakan, balas lewat menu Bantuan di dasbor.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
