import { describe, expect, it } from "vitest";
import { MAX_PROOF_BYTES } from "./config";
import { proofFileProblem } from "./proof-file";

describe("proofFileProblem", () => {
	it("menerima JPG dan PNG di bawah batas", () => {
		expect(proofFileProblem({ type: "image/png", size: 1024 })).toBeNull();
		expect(proofFileProblem({ type: "image/jpeg", size: MAX_PROOF_BYTES })).toBeNull();
	});

	it("menolak PDF walau namanya diganti jadi png", () => {
		expect(proofFileProblem({ type: "application/pdf", size: 1024 })).toBe("type");
	});

	it("menolak berkas di atas 10 MB", () => {
		expect(proofFileProblem({ type: "image/png", size: MAX_PROOF_BYTES + 1 })).toBe("size");
	});
});
