import { describe, expect, it } from "vitest";
import { zipSync } from "fflate";
import { unzipEntries, ZipEntryTooLargeError } from "./zip";

const encoder = new TextEncoder();

function archive(entries: Record<string, Uint8Array>) {
	return zipSync(entries);
}

describe("unzipEntries", () => {
	it("inflates only the names the caller selects", () => {
		const data = archive({
			"word/document.xml": encoder.encode("<w:document>hello</w:document>"),
			"word/styles.xml": encoder.encode("<w:styles/>"),
			"docProps/thumbnail.png": new Uint8Array(64),
		});

		const files = unzipEntries(data, (name) => name === "word/document.xml", 1024 * 1024);

		expect(Object.keys(files)).toEqual(["word/document.xml"]);
		expect(new TextDecoder().decode(files["word/document.xml"])).toBe("<w:document>hello</w:document>");
	});

	it("stops inflating an entry past the byte cap the caller set", () => {
		const data = archive({ "word/document.xml": new Uint8Array(64 * 1024) });

		expect(() => unzipEntries(data, () => true, 1024)).toThrow(ZipEntryTooLargeError);
	});
});
