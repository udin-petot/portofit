import { describe, expect, it } from "vitest";
import { enforceSupportGuard } from "./guard";

const allowed = { faqText: "", pricesIdr: [5000, 10000], userAmounts: [] as string[] };

describe("enforceSupportGuard", () => {
	it("mengganti balasan yang menjanjikan refund", () => {
		const result = enforceSupportGuard("Tenang, pasti refund kok.", allowed);
		expect(result.replaced).toBe(true);
		expect(result.text).not.toContain("pasti refund");
		expect(result.text).toContain("WhatsApp");
	});

	it("mengganti janji pengembalian otomatis", () => {
		expect(enforceSupportGuard("Dana otomatis dikembalikan dalam sehari.", allowed).replaced).toBe(true);
	});

	it.each([
		"Dana Anda pasti akan dikembalikan penuh.",
		"Kredit Anda akan kami kembalikan hari ini juga.",
		"Refund penuh dijamin dalam 7 hari.",
	])("mengganti janji: %s", (reply) => {
		expect(enforceSupportGuard(reply, allowed).replaced).toBe(true);
	});

	it("tidak mengganti kalimat kebijakan yang benar", () => {
		expect(enforceSupportGuard("Kredit yang sudah terpakai tidak dapat dikembalikan.", allowed).replaced).toBe(false);
	});

	it("membiarkan nominal pengguna yang ditulis tanpa Rp", () => {
		const result = enforceSupportGuard("Saya catat transfer Rp50.003 Anda.", {
			...allowed,
			userAmounts: ["saya transfer 50003 tadi"],
		});
		expect(result.replaced).toBe(false);
	});

	it("membiarkan format Rp. bertitik", () => {
		const result = enforceSupportGuard("Dana Rp. 250.000 sudah kami terima.", {
			...allowed,
			userAmounts: ["tf 250000"],
		});
		expect(result.replaced).toBe(false);
	});

	it("membiarkan nominal yang ditulis pengguna sendiri", () => {
		const result = enforceSupportGuard("Saya catat transfer Rp50.003 Anda.", {
			...allowed,
			userAmounts: ["Rp50.003"],
		});
		expect(result.replaced).toBe(false);
	});

	it("membiarkan harga paket yang ada di basis data", () => {
		expect(enforceSupportGuard("Paket lamaran Rp5.000 dan wawancara Rp10.000.", allowed).replaced).toBe(false);
	});

	it("mengganti nominal karangan", () => {
		expect(enforceSupportGuard("Dana Rp250.000 akan kembali.", allowed).replaced).toBe(true);
	});

	it("tidak terganggu angka biasa tanpa rupiah", () => {
		expect(enforceSupportGuard("Prosesnya 3 hari kerja dan 7 hari kalender.", allowed).replaced).toBe(false);
	});
});
