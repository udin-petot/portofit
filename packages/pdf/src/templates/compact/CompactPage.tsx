import type { TemplatePageProps } from "../../document";
import type { Style } from "../../forme/style-types";
import type { TemplateColorRoles, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { Page, StyleSheet } from "#react-pdf-renderer";
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

type CompactStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerName: Style;
	headerHeadline: Style;
	contactList: Style;
	contactItem: Style;
	contactText: Style;
	sections: Style;
};

type CompactTemplate = {
	colors: TemplateColorRoles;
	styles: CompactStyles;
};

type CompactHeaderProps = {
	styles: CompactStyles;
};

/**
 * Compact keeps one reading order and standard headings, but pulls the name, headline and contact
 * details into a tight block so a fresh graduate's page stays dense without feeling cramped.
 */
export const CompactPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useCompactTemplate();
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

				<SemanticRegionView region="main" style={composeStyles(styles.sections, { rowGap: metrics.gapY(1) })}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: CompactHeaderProps) => {
	const { basics } = useRender();

	return (
		<SemanticHeaderView style={styles.header}>
			<Heading style={styles.headerName}>{basics.name}</Heading>
			{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}

			<SemanticContactListView style={styles.contactList}>
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

const useCompactTemplate = (): CompactTemplate => {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const headingWeight = metadata.typography.heading.fontWeights.at(-1) ?? "700";
		const bodySize = metadata.typography.body.fontSize;
		const headingSize = metadata.typography.heading.fontSize;

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: Math.max(metrics.page.paddingHorizontal, 28),
				paddingVertical: Math.max(metrics.page.paddingVertical, 26),
				rowGap: metrics.gapY(1),
			},
			header: {
				rowGap: metrics.gapY(0.25),
				paddingBottom: metrics.gapY(0.35),
			},
			headerName: {
				color: foreground,
				fontSize: headingSize * 2,
				lineHeight: 1.05,
			},
			headerHeadline: {
				color: foreground,
				fontSize: bodySize * 1.02,
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				columnGap: metrics.gapX(0.8),
				rowGap: metrics.gapY(0.1),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.1),
			},
			contactText: {
				color: foreground,
				fontSize: bodySize * 0.82,
			},
			section: {
				rowGap: metrics.gapY(0.25),
			},
			sectionHeading: {
				color: foreground,
				fontSize: headingSize * 0.76,
				fontWeight: headingWeight,
				textTransform: "uppercase",
				borderBottomWidth: 0.7,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.15),
			},
			sectionItems: {
				rowGap: metrics.gapY(0.6),
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
			} satisfies CompactStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
