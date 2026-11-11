import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Tailwind, Text } from "react-email";

void React;

export type OrderEmailKind = "dibuat" | "pengingat" | "hangus";

export interface OrderEmailProps {
	kind: OrderEmailKind;
	name: string;
	planName: string;
	total: string;
	uniqueCode: number;
	deadline: string;
	url: string;
}

const COPY: Record<OrderEmailKind, { preview: string; heading: string; intro: string; action: string }> = {
	dibuat: {
		preview: "Pesanan dibuat, selesaikan pembayaran dalam 10 menit",
		heading: "Selesaikan pembayaran",
		intro: "Pesananmu sudah dibuat. Transfer sesuai nominal di bawah sebelum waktu habis, lalu unggah bukti di halaman transaksi.",
		action: "Buka transaksi",
	},
	pengingat: {
		preview: "Sisa waktu pembayaran tinggal lima menit",
		heading: "Waktu hampir habis",
		intro: "Sisa waktu pembayaranmu tinggal lima menit. Kalau sudah transfer, unggah buktinya sekarang supaya pesanan tidak hangus.",
		action: "Unggah bukti",
	},
	hangus: {
		preview: "Pesanan dibatalkan karena lewat batas waktu",
		heading: "Pesanan hangus",
		intro: "Batas waktu pembayaran sudah lewat, jadi pesanan ini kami tutup. Kamu bisa membuat pesanan baru kapan saja.",
		action: "Buat pesanan baru",
	},
};

/** Satu komponen untuk tiga titik email pesanan, supaya nada dan bentuknya sama. */
export function OrderEmail({ kind, name, planName, total, uniqueCode, deadline, url }: OrderEmailProps) {
	const copy = COPY[kind];

	return (
		<Html lang="id">
			<Tailwind config={{ theme: { extend: { colors: { ink: "#111111", muted: "#555555", line: "#dddddd" } } } }}>
				<Head />
				<Preview>{copy.preview}</Preview>
				<Body className="bg-white font-sans">
					<Container className="mx-auto max-w-[560px] px-6 py-10">
						<Text className="m-0 text-xs font-semibold tracking-[0.18em] text-muted">PORTOFIT</Text>
						<Heading className="mt-3 text-xl font-semibold text-ink">{copy.heading}</Heading>
						<Text className="mt-3 text-sm leading-6 text-muted">Halo {name}, {copy.intro}</Text>
						<Section className="mt-6 border border-solid border-line px-4 py-3">
							<Text className="m-0 text-xs uppercase tracking-[0.12em] text-muted">Total</Text>
							<Text className="m-0 mt-1 text-lg font-semibold text-ink">{total}</Text>
							<Text className="m-0 mt-2 text-sm text-muted">
								{planName} · kode unik {uniqueCode}
							</Text>
							{kind === "hangus" ? null : (
								<Text className="m-0 mt-1 text-sm text-muted">Batas bayar {deadline}</Text>
							)}
						</Section>
						<Button href={url} className="mt-6 bg-ink px-4 py-2 text-sm text-white no-underline">
							{copy.action}
						</Button>
						<Text className="mt-8 text-xs leading-5 text-muted">
							Kalau ada yang ingin ditanyakan, balas lewat menu Bantuan di dasbor.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
