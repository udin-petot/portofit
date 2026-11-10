import type { TemplatePageProps } from "../../document";
import type { Style } from "../../forme/style-types";
import type { TemplateColorRoles, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { Page, StyleSheet, View } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { useRenderedSectionIds, useResolvedNode } from "../../semantic/context";
import { semanticNodeKeys } from "../../semantic/node-keys";
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

type BersihStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	headerContactList: Style;
	contactItem: Style;
	contactText: Style;
	picture: Style;
	sections: Style;
};

type BersihTemplate = {
	colors: TemplateColorRoles;
	styles: BersihStyles;
};

type BersihHeaderProps = { styles: BersihStyles };

/**
 * Bersih reads as one typed column: a large left name, the contact line under it, and a plain rule
 * above every section. No icons, no filled panels, no photograph unless the candidate adds one.
 */
export const BersihPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useBersihTemplate();
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

				<SemanticRegionView region="main" style={composeStyles(styles.sections, { rowGap: metrics.sectionGap })}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: BersihHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<SemanticHeaderView style={styles.header}>
			<View style={styles.headerIdentity}>
				<Heading style={styles.headerName}>{basics.name}</Heading>
				{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
				<SemanticContactListView style={styles.headerContactList}>
					<EmailContactItem email={basics.email} style={styles.contactItem} textStyle={styles.contactText} />
					<PhoneContactItem phone={basics.phone} style={styles.contactItem} textStyle={styles.contactText} />
					<LocationContactItem location={basics.location} style={styles.contactItem} textStyle={styles.contactText} />
					<WebsiteContactItem website={basics.website} style={styles.contactItem} textStyle={styles.contactText} />
					{basics.customFields.map((field) => (
						<CustomFieldContactItem
							key={field.id}
							field={field}
							style={styles.contactItem}
							textStyle={styles.contactText}
						/>
					))}
				</SemanticContactListView>
			</View>

			{hasPicture && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}
		</SemanticHeaderView>
	);
};

const useBersihTemplate = (): BersihTemplate => {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const headingWeight = metadata.typography.heading.fontWeights.at(-1) ?? "700";
		const bodySize = metadata.typography.body.fontSize;
		const headingSize = metadata.typography.heading.fontSize;

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: Math.max(metrics.page.paddingHorizontal, 40),
				paddingVertical: Math.max(metrics.page.paddingVertical, 34),
				rowGap: metrics.sectionGap,
			},
			header: {
				flexDirection: r.row,
				alignItems: "flex-start",
				columnGap: metrics.gapX(1.4),
				paddingBottom: metrics.gapY(0.55),
			},
			headerIdentity: {
				flex: 1,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.3),
			},
			headerName: {
				color: foreground,
				fontSize: headingSize * 2.25,
				lineHeight: 1.02,
			},
			headerHeadline: {
				color: foreground,
				fontSize: bodySize * 1.02,
			},
			headerContactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				columnGap: metrics.gapX(1.1),
				rowGap: metrics.gapY(0.15),
				paddingTop: metrics.gapY(0.15),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.15),
			},
			contactText: {
				color: foreground,
				fontSize: bodySize * 0.84,
			},
			picture: {
				...base.picture,
				width: 64,
				height: 64,
			},
			section: {
				borderTopWidth: 1,
				borderTopColor: foreground,
				paddingTop: metrics.gapY(0.45),
				rowGap: metrics.gapY(0.28),
			},
			sectionHeading: {
				color: foreground,
				fontSize: headingSize * 0.74,
				fontWeight: headingWeight,
				letterSpacing: headingSize * 0.06,
				textTransform: "uppercase",
			},
			sectionItems: {
				rowGap: metrics.itemGapY,
			},
			item: {
				rowGap: metrics.gapY(0.1),
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
			} satisfies BersihStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
