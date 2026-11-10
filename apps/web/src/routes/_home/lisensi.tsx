import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/features/legal/page";

export const Route = createFileRoute("/_home/lisensi")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Lisensi MIT PortoFit" },
			{
				name: "description",
				content:
					"Lisensi MIT yang berlaku untuk PortoFit, proyek Reactive Resume yang menjadi fondasinya, dan atribusi yang diwajibkan keduanya.",
			},
		],
	}),
});

const licenseText = `MIT License

Copyright (c) 2026 Amruth Pillai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

function RouteComponent() {
	return (
		<LegalPage
			title="Lisensi MIT"
			summary="PortoFit dibangun di atas Reactive Resume, proyek sumber terbuka karya Amruth Pillai. Karya asli maupun fork ini dirilis dengan Lisensi MIT."
		>
			<LegalSection title="Apa yang diizinkan lisensi ini">
				<p>
					Lisensi MIT mengizinkan siapa pun memakai, menyalin, mengubah, menggabungkan, menerbitkan, mendistribusikan,
					memberi sublisensi, dan menjual salinan perangkat lunak. Lisensi ini berlaku untuk kode sumber, bukan untuk nama
					atau logo PortoFit.
				</p>
				<p>
					Syaratnya hanya satu: pemberitahuan hak cipta dan izin ini harus ikut di setiap salinan atau bagian penting
					perangkat lunak. Perangkat lunak disediakan tanpa jaminan.
				</p>
			</LegalSection>

			<LegalSection title="Atribusi">
				<p>
					Karya asli: Reactive Resume, hak cipta Amruth Pillai,{" "}
					<a
						href="https://github.com/reactive-resume/reactive-resume"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						github.com/reactive-resume/reactive-resume
					</a>
					.
				</p>
				<p>
					Fork ini:{" "}
					<a
						href="https://github.com/udin-petot/portofit"
						className="font-medium text-accent-text underline-offset-4 hover:underline"
						rel="noreferrer"
						target="_blank"
					>
						github.com/udin-petot/portofit
					</a>
					. Berkas lisensi lengkap ada di akar repositori.
				</p>
			</LegalSection>

			<LegalSection title="Teks lisensi">
				<pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-ink-2">
					{licenseText}
				</pre>
			</LegalSection>
		</LegalPage>
	);
}
