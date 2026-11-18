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

type TechnicalStyles = Omit<TemplateStyleSlots, "page"> & {
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

type TechnicalTemplate = {
	colors: TemplateColorRoles;
	styles: TechnicalStyles;
};

type TechnicalHeaderProps = { styles: TechnicalStyles };

/**
 * Technical is the dense single column for engineering and data roles: a tight header closed by a
 * double rule, colored section labels, and no decoration between entries. Dates stay right-aligned.
 */
export const TechnicalPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useTechnicalTemplate();
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

				<SemanticRegionView region="main" style={composeStyles(styles.sections, { rowGap: metrics.sectionGap * 0.9 })}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: TechnicalHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<SemanticHeaderView style={styles.header}>
			<View style={styles.headerIdentity}>
				<Heading style={styles.headerName}>{basics.name}</Heading>
				{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
			</View>
			{hasPicture && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}

			<SemanticContactListView style={styles.headerContactList}>
				<EmailContactItem email={basics.email} style={styles.contactItem} textStyle={styles.contactText} />
				<PhoneContactItem phone={basics.phone} style={styles.contactItem} textStyle={styles.contactText} />
				<LocationContactItem location={basics.location} style={styles.contactItem} textStyle={styles.contactText} />
				<WebsiteContactItem website={basics.website} style={styles.contactItem} textStyle={styles.contactText} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem key={field.id} field={field} style={styles.contactItem} textStyle={styles.contactText} />
				))}
			</SemanticContactListView>
		</SemanticHeaderView>
	);
};

const useTechnicalTemplate = (): TechnicalTemplate => {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const headingWeight = metadata.typography.heading.fontWeights.at(-1) ?? "700";
		const bodySize = metadata.typography.body.fontSize;
		const headingSize = metadata.typography.heading.fontSize;

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: Math.max(metrics.page.paddingHorizontal, 36),
				paddingVertical: Math.max(metrics.page.paddingVertical * 0.85, 26),
				rowGap: metrics.sectionGap * 0.9,
			},
			header: {
				flexDirection: r.row,
				flexWrap: "wrap",
				alignItems: "flex-end",
				columnGap: metrics.gapX(1.2),
				rowGap: metrics.gapY(0.4),
				borderBottomWidth: 2,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.45),
			},
			headerIdentity: {
				flex: 1,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.2),
			},
			headerName: {
				color: foreground,
				fontSize: headingSize * 1.9,
				lineHeight: 1.05,
				fontWeight: headingWeight,
			},
			headerHeadline: {
				color: primary,
				fontSize: bodySize * 1.0,
				fontWeight: "600",
			},
			headerContactList: {
				width: "100%",
				flexDirection: r.row,
				flexWrap: "wrap",
				columnGap: metrics.gapX(1.0),
				rowGap: metrics.gapY(0.12),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.15),
			},
			contactText: {
				color: foreground,
				fontSize: bodySize * 0.8,
			},
			picture: {
				...base.picture,
			},
			section: {
				rowGap: metrics.gapY(0.26),
			},
			sectionHeading: {
				color: primary,
				fontSize: headingSize * 0.76,
				fontWeight: headingWeight,
				textTransform: "uppercase",
			},
			sectionItems: {
				rowGap: metrics.itemGapY * 0.9,
				paddingTop: metrics.gapY(0.1),
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
			} satisfies TechnicalStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
