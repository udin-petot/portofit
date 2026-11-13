import * as React from "react";
import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "react-email";

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
	/** Sisa waktu saat email dikirim, misal "sekitar 5 menit". Hanya dipakai pengingat. */
	remaining?: string | undefined;
}

/**
 * Subjek pendek tanpa nominal. Nominal dan batas waktu ada di dalam email,
 * subjek yang penuh angka terbaca seperti tagihan dan tidak perlu dibuka.
 */
export const ORDER_SUBJECT: Record<OrderEmailKind, string> = {
	dibuat: "Selesaikan pembayaran",
	pengingat: "Waktu hampir habis",
	hangus: "Pesanan hangus",
};

type Copy = {
	preview: string;
	heading: string;
	intro: string;
	action: string;
	badge: string;
	bar: string;
	badgeBg: string;
	badgeInk: string;
};

const COPY: Record<OrderEmailKind, Copy> = {
	dibuat: {
		preview: "Pesanan dibuat, selesaikan pembayaran sebelum batas waktu",
		heading: "Selesaikan pembayaran",
		intro:
			"Pesananmu sudah dibuat. Bayar sesuai nominal di bawah sebelum waktu habis, lalu unggah bukti di halaman transaksi.",
		action: "Buka transaksi",
		badge: "Menunggu bayar",
		bar: "#B7791F",
		badgeBg: "#FBF0DC",
		badgeInk: "#8A5A12",
	},
	pengingat: {
		preview: "Sisa waktu pembayaran sebentar lagi",
		heading: "Waktu hampir habis",
		intro:
			"Waktu pembayaranmu hampir habis. Kalau sudah bayar, unggah buktinya sekarang supaya pesanan tidak hangus.",
		action: "Unggah bukti",
		badge: "Segera hangus",
		bar: "#B7791F",
		badgeBg: "#F7E4C0",
		badgeInk: "#7A4A0A",
	},
	hangus: {
		preview: "Pesanan ditutup karena lewat batas waktu",
		heading: "Pesanan hangus",
		intro:
			"Batas waktu pembayaran sudah lewat, jadi pesanan ini kami tutup. Kredit tidak berkurang dan kamu bisa membuat pesanan baru kapan saja.",
		action: "Buat pesanan baru",
		badge: "Hangus",
		bar: "#A33A2A",
		badgeBg: "#FBE7E2",
		badgeInk: "#8C2F22",
	},
};

/**
 * Tiga email pesanan memakai kerangka yang sama dengan email invoice: pita status,
 * kartu putih, tabel rincian, dan satu tombol. Bedanya hanya warna pita dan angka besar.
 */
export function OrderEmail({ kind, name, planName, total, uniqueCode, deadline, url, remaining }: OrderEmailProps) {
	const copy = COPY[kind];
	const expired = kind === "hangus";

	const rows: Array<{ label: string; value: string }> = [
		{ label: "Paket", value: planName },
		...(expired ? [] : [{ label: "Kode unik", value: String(uniqueCode).padStart(3, "0") }]),
		{ label: expired ? "Batas bayar" : "Bayar sebelum", value: deadline },
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
								surface: "#FAF9F5",
							},
						},
					},
				}}
			>
				<Head>
					<meta name="viewport" content="width=device-width, initial-scale=1" />
				</Head>
				<Preview>{copy.preview}</Preview>
				<Body className="bg-paper font-sans">
					<Container className="mx-auto my-8 w-full max-w-[560px] overflow-hidden rounded-xl bg-white">
						<Section style={{ backgroundColor: copy.bar, height: 6, lineHeight: "6px" }}>
							<Text className="m-0 text-[6px] leading-[6px]">&nbsp;</Text>
						</Section>

						<Section className="px-8 pt-8">
							<Row>
								<Column>
									<Text className="m-0 text-sm font-bold tracking-[0.16em] text-ink">PORTOFIT</Text>
									<Text className="m-0 mt-1 text-[11px] text-muted">www.portofit.tech</Text>
								</Column>
								<Column align="right">
									<Section
										className="rounded-full px-3 py-1"
										style={{ backgroundColor: copy.badgeBg }}
									>
										<Text
											className="m-0 text-[10px] font-bold tracking-[0.14em] uppercase"
											style={{ color: copy.badgeInk }}
										>
											{copy.badge}
										</Text>
									</Section>
								</Column>
							</Row>
						</Section>

						<Section className="px-8 pt-6">
							<Heading className="m-0 text-[24px] leading-8 font-bold tracking-tight text-ink">
								{copy.heading}
							</Heading>
							<Text className="m-0 mt-3 text-sm leading-6 text-muted">
								Halo {name}, {copy.intro}
							</Text>
						</Section>

						{kind === "pengingat" ? (
							<Section className="mt-5 px-8">
								<Row className="rounded-lg px-4 py-3" style={{ backgroundColor: copy.badgeBg }}>
									<Column>
										<Text className="m-0 text-xs font-semibold" style={{ color: copy.badgeInk }}>
											{remaining ? `Sisa waktu ${remaining}.` : `Sisa waktu sampai ${deadline}.`}
										</Text>
									</Column>
								</Row>
							</Section>
						) : null}

						<Section className="mt-6 px-8">
							<Section
								className="rounded-lg border border-solid border-line px-5 py-4"
								style={{ backgroundColor: expired ? "#FBE7E2" : "#FAF9F5" }}
							>
								<Text className="m-0 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
									{expired ? "Tidak dibayar" : "Total yang harus dibayar"}
								</Text>
								<Text
									className={`m-0 mt-1 text-[28px] leading-9 font-bold ${expired ? "text-ink line-through" : "text-ink"}`}
								>
									{total}
								</Text>
								{expired ? (
									<Text className="m-0 mt-1 text-xs text-muted">Tidak ada dana yang kami terima untuk pesanan ini.</Text>
								) : (
									<Text className="m-0 mt-1 text-xs text-muted">
										Nominal sudah termasuk kode unik, bayar tepat sampai digit terakhir.
									</Text>
								)}
							</Section>
						</Section>

						<Section className="px-8 pt-6">
							<Button
								href={url}
								className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white no-underline"
							>
								{copy.action}
							</Button>
						</Section>

						<Section className="mt-6 px-8"><Section className="border-t border-solid border-line">
							{rows.map((row) => (
								<Row key={row.label} className="border-b border-solid border-line">
									<Column className="py-2.5">
										<Text className="m-0 text-[10px] tracking-[0.1em] text-muted uppercase">
											{row.label}
										</Text>
									</Column>
									<Column align="right" className="py-2.5">
										<Text className="m-0 text-xs font-medium text-ink">{row.value}</Text>
									</Column>
								</Row>
							))}
							</Section>
						</Section>

						<Section className="px-8 pb-8 pt-6">
							<Text className="m-0 text-[11px] leading-5 text-muted">
								Email ini dikirim otomatis karena ada pesanan di akun PortoFit kamu. Butuh bantuan? Balas lewat
								menu Bantuan di dasbor, atau WhatsApp 081939948769.
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
