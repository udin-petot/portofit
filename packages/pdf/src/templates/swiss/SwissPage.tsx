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
import { Heading, SemanticContactListView, SemanticHeaderView, SemanticRegionView, Text } from "../shared/primitives";
import { Section } from "../shared/sections";
import { composeStyles } from "../shared/styles";
import { useTemplateBase } from "../shared/template-base";

type SwissStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	headerContactList: Style;
	contactItem: Style;
	contactText: Style;
	sections: Style;
};

type SwissTemplate = {
	colors: TemplateColorRoles;
	styles: SwissStyles;
};

type SwissHeaderProps = {
	styles: SwissStyles;
};

/**
 * Swiss sets the resume on a strict grid: one reading order, a large quiet name, a separate contact
 * column and a thin accent rule over each section. No icons, no photograph, no decoration.
 */
export const SwissPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useSwissTemplate();
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

const Header = ({ styles }: SwissHeaderProps) => {
	const { basics } = useRender();

	return (
		<SemanticHeaderView style={styles.header}>
			<View style={styles.headerIdentity}>
				<Heading style={styles.headerName}>{basics.name}</Heading>
				{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
			</View>

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
		</SemanticHeaderView>
	);
};

const useSwissTemplate = (): SwissTemplate => {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const headingWeight = metadata.typography.heading.fontWeights.at(-1) ?? "700";
		const bodySize = metadata.typography.body.fontSize;
		const headingSize = metadata.typography.heading.fontSize;

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: Math.max(metrics.page.paddingHorizontal, 34),
				paddingVertical: Math.max(metrics.page.paddingVertical, 30),
				rowGap: metrics.sectionGap,
			},
			header: {
				flexDirection: r.row,
				alignItems: "flex-end",
				columnGap: metrics.gapX(1.8),
				paddingBottom: metrics.gapY(0.5),
				borderBottomWidth: 1,
				borderBottomColor: foreground,
			},
			headerIdentity: {
				flex: 1,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.35),
			},
			headerName: {
				color: foreground,
				fontSize: headingSize * 2.3,
				lineHeight: 1.05,
			},
			headerHeadline: {
				color: foreground,
				fontSize: bodySize * 1.05,
			},
			headerContactList: {
				width: 160,
				alignItems: r.rtl ? "flex-start" : "flex-end",
				rowGap: metrics.gapY(0.15),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.15),
			},
			contactText: {
				color: foreground,
				fontSize: bodySize * 0.82,
				textAlign: r.rtl ? "left" : "right",
			},
			section: {
				borderTopWidth: 0.8,
				borderTopColor: primary,
				paddingTop: metrics.gapY(0.5),
				rowGap: metrics.gapY(0.3),
			},
			sectionHeading: {
				color: foreground,
				fontSize: headingSize * 0.78,
				fontWeight: headingWeight,
				letterSpacing: r.rtl ? 0 : headingSize * 0.1,
				textTransform: "uppercase",
			},
			sectionItems: {
				rowGap: metrics.itemGapY,
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
			} satisfies SwissStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
