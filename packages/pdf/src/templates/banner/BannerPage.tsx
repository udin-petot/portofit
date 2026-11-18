import type { TemplatePageProps } from "../../document";
import type { Style } from "../../forme/style-types";
import type { TemplateColorRoles, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { Page, StyleSheet, View } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { useRenderedSectionIds, useResolvedNode } from "../../semantic/context";
import { semanticNodeKeys } from "../../semantic/node-keys";
import { isDarkColor } from "@reactive-resume/utils/color";
import {
	CustomFieldContactItem,
	EmailContactItem,
	LocationContactItem,
	PhoneContactItem,
	WebsiteContactItem,
} from "../shared/contact-item";
import { TemplateProvider } from "../shared/context";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { hasTemplatePicture } from "../shared/picture";
import {
	Heading,
	SemanticContactListView,
	SemanticHeaderPicture,
	SemanticHeaderView,
	SemanticRegionView,
	Text,
} from "../shared/primitives";
import { Section } from "../shared/sections";
import { composeStyles } from "../shared/styles";
import { useTemplateBase } from "../shared/template-base";

type BannerStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	band: Style;
	bandName: Style;
	bandHeadline: Style;
	bandContactList: Style;
	bandContactItem: Style;
	bandContactText: Style;
	picture: Style;
	body: Style;
	sections: Style;
};

type BannerTemplate = {
	colors: TemplateColorRoles;
	styles: BannerStyles;
};

type BannerHeaderProps = { styles: BannerStyles };

/**
 * Banner opens the resume with a full-width band in the accent color: the name, headline and
 * contact in the band, then the whole story in one plain, ATS-readable column below it.
 */
export const BannerPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useBannerTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const mainSections = useRenderedSectionIds(pageNodeKey, filterSections(page.main, data));
	const sidebarSections = useRenderedSectionIds(pageNodeKey, page.fullWidth ? [] : filterSections(page.sidebar, data));
	const sections = [...mainSections, ...sidebarSections];

	return (
		<Page
			{...semanticPageProps}
			size={semanticPageSize ?? pageSize}
			style={composeStyles(styles.page, pageMinHeightStyle, semanticPageStyle)}
		>
			<TemplateProvider pageNodeKey={pageNodeKey} styles={styles} colors={colors}>
				{showHeader && <Header styles={styles} />}

				<SemanticRegionView region="main" style={composeStyles(styles.body, styles.sections, { rowGap: metrics.sectionGap })}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: BannerHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<SemanticHeaderView style={styles.band}>
			<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", columnGap: 18 }}>
				<View style={{ flexGrow: 1, flexBasis: 0, rowGap: 6 }}>
					<Heading style={styles.bandName}>{basics.name}</Heading>
					{basics.headline && <Text style={styles.bandHeadline}>{basics.headline}</Text>}
				</View>
				{hasPicture && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}
			</View>

			<SemanticContactListView style={styles.bandContactList}>
				<EmailContactItem email={basics.email} style={styles.bandContactItem} textStyle={styles.bandContactText} />
				<PhoneContactItem phone={basics.phone} style={styles.bandContactItem} textStyle={styles.bandContactText} />
				<LocationContactItem location={basics.location} style={styles.bandContactItem} textStyle={styles.bandContactText} />
				<WebsiteContactItem website={basics.website} style={styles.bandContactItem} textStyle={styles.bandContactText} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem key={field.id} field={field} style={styles.bandContactItem} textStyle={styles.bandContactText} />
				))}
			</SemanticContactListView>
		</SemanticHeaderView>
	);
};

const useBannerTemplate = (): BannerTemplate => {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const headingWeight = metadata.typography.heading.fontWeights.at(-1) ?? "700";
		const bodySize = metadata.typography.body.fontSize;
		const headingSize = metadata.typography.heading.fontSize;

		// White text over a dark accent, or the page's own foreground over a light one, keeps the band readable.
		const onAccent = isDarkColor(primary) ? "#ffffff" : foreground;
		const onAccentMuted = isDarkColor(primary) ? "rgba(255, 255, 255, 0.82)" : foreground;

		const bandPaddingX = Math.max(metrics.page.paddingHorizontal, 40);
		const bodyPaddingX = Math.max(metrics.page.paddingHorizontal, 40);
		const bodyPaddingY = Math.max(metrics.page.paddingVertical, 26);

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: 0,
				paddingVertical: 0,
			},
			band: {
				backgroundColor: primary,
				paddingHorizontal: bandPaddingX,
				paddingTop: Math.max(metrics.page.paddingVertical, 26),
				paddingBottom: Math.max(metrics.page.paddingVertical * 0.8, 20),
				rowGap: metrics.gapY(0.5),
			},
			bandName: {
				color: onAccent,
				fontSize: headingSize * 2.15,
				lineHeight: 1.05,
				fontWeight: headingWeight,
			},
			bandHeadline: {
				color: onAccentMuted,
				fontSize: bodySize * 1.05,
			},
			bandContactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				columnGap: metrics.gapX(1.1),
				rowGap: metrics.gapY(0.15),
			},
			bandContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.15),
			},
			bandContactText: {
				color: onAccentMuted,
				fontSize: bodySize * 0.84,
			},
			picture: {
				...base.picture,
				borderRadius: 999,
			},
			body: {
				paddingHorizontal: bodyPaddingX,
				paddingTop: bodyPaddingY,
				paddingBottom: bodyPaddingY,
			},
			section: {
				rowGap: metrics.gapY(0.3),
			},
			sectionHeading: {
				color: primary,
				fontSize: headingSize * 0.78,
				fontWeight: headingWeight,
				textTransform: "uppercase",
				borderBottomWidth: 1.2,
				borderBottomColor: primary,
				paddingBottom: metrics.gapY(0.25),
			},
			sectionItems: {
				rowGap: metrics.itemGapY,
				paddingTop: metrics.gapY(0.25),
			},
			item: {
				rowGap: metrics.gapY(0.125),
			},
			splitRow: {
				...base.splitRow,
				alignItems: "baseline",
			},
			alignEnd: {
				...r.alignEnd,
				textAlign: r.rtl ? "left" : "right",
			},
			sections: {
				flexDirection: "column",
			},
		});

		const colors: TemplateColorRoles = { foreground, background, primary };

		return {
			colors,
			styles: {
				...baseStyles,
				icon: { display: "none" },
			} satisfies BannerStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
