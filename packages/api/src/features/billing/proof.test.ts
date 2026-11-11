import { describe, expect, it } from "vitest";
import { MAX_PROOF_BYTES, proofRejection } from "./proof";

const userId = "user-1";
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

describe("proofRejection", () => {
	it("accepts a JPEG", () => {
		const reason = proofRejection({
			userId,
			path: `uploads/${userId}/pictures/a.jpeg`,
			object: { contentType: "image/jpeg", size: 120_000, head: jpeg },
		});
		expect(reason).toBeNull();
	});

	it("accepts a PNG", () => {
		const reason = proofRejection({
			userId,
			path: `uploads/${userId}/pictures/a.png`,
			object: { contentType: "image/png", size: 90_000, head: png },
		});
		expect(reason).toBeNull();
	});

	it("rejects a PDF path before reading the file", () => {
		const reason = proofRejection({
			userId,
			path: `uploads/${userId}/pictures/a.pdf`,
			object: { contentType: "application/pdf", size: 50_000, head: pdf },
		});
		expect(reason).toBe("Bukti harus berupa gambar JPG atau PNG.");
	});

	it("rejects a PDF renamed to .png", () => {
		const reason = proofRejection({
			userId,
			path: `uploads/${userId}/pictures/a.png`,
			object: { contentType: "image/png", size: 50_000, head: pdf },
		});
		expect(reason).toBe("Isi berkas bukan gambar JPG atau PNG.");
	});

	it("rejects a file owned by another account", () => {
		const reason = proofRejection({
			userId,
			path: "uploads/other-user/pictures/a.png",
			object: { contentType: "image/png", size: 1000, head: png },
		});
		expect(reason).toBe("Berkas bukti bukan milik akun ini.");
	});

	it("rejects a missing file", () => {
		const reason = proofRejection({ userId, path: `uploads/${userId}/pictures/a.png`, object: null });
		expect(reason).toBe("Berkas bukti tidak ditemukan. Unggah ulang fotonya.");
	});

	it("rejects a file over the size cap", () => {
		const reason = proofRejection({
			userId,
			path: `uploads/${userId}/pictures/a.jpg`,
			object: { contentType: "image/jpeg", size: MAX_PROOF_BYTES + 1, head: jpeg },
		});
		expect(reason).toBe("Bukti lebih dari 10 MB. Kecilkan fotonya dulu.");
	});
});
