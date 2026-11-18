import type { TemplatePageProps } from "../../document";
import type { Style } from "../../forme/style-types";
import type { TemplateColorRoles, TemplateFeatureStyleSlots, TemplateFeatures, TemplateStyleSlots } from "../shared/types";
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

type TimelineStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerName: Style;
	headerHeadline: Style;
	headerRule: Style;
	headerContactList: Style;
	contactItem: Style;
	contactText: Style;
	picture: Style;
	sections: Style;
};

type TimelineTemplate = {
	colors: TemplateColorRoles;
	styles: TimelineStyles;
	featureStyles: TemplateFeatureStyleSlots;
};

const timelineFeatures = {
	sectionTimeline: true,
} satisfies TemplateFeatures;

type TimelineHeaderProps = { styles: TimelineStyles };

/**
 * Timeline keeps one reading order and lays every section's items on a dated rail: a thin accent
 * line with a solid dot per entry. No icons, no color blocks, so the rail stays the only ornament.
 */
export const TimelinePage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles, featureStyles } = useTimelineTemplate();
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
			<TemplateProvider pageNodeKey={pageNodeKey} styles={styles} featureStyles={featureStyles} colors={colors} features={timelineFeatures}>
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

const Header = ({ styles }: TimelineHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<SemanticHeaderView style={styles.header}>
			<View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
				<View style={{ flexGrow: 1, flexBasis: 0, rowGap: 5 }}>
					<Heading style={styles.headerName}>{basics.name}</Heading>
					{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
				</View>
				{hasPicture && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}
			</View>

			<SemanticContactListView style={styles.headerContactList}>
				<EmailContactItem email={basics.email} style={styles.contactItem} textStyle={styles.contactText} />
				<PhoneContactItem phone={basics.phone} style={styles.contactItem} textStyle={styles.contactText} />
				<LocationContactItem location={basics.location} style={styles.contactItem} textStyle={styles.contactText} />
				<WebsiteContactItem website={basics.website} style={styles.contactItem} textStyle={styles.contactText} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem key={field.id} field={field} style={styles.contactItem} textStyle={styles.contactText} />
				))}
			</SemanticContactListView>

			<View style={styles.headerRule} />
		</SemanticHeaderView>
	);
};

const useTimelineTemplate = (): TimelineTemplate => {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const headingWeight = metadata.typography.heading.fontWeights.at(-1) ?? "700";
		const bodySize = metadata.typography.body.fontSize;
		const headingSize = metadata.typography.heading.fontSize;

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: Math.max(metrics.page.paddingHorizontal, 38),
				paddingVertical: Math.max(metrics.page.paddingVertical, 30),
				rowGap: metrics.sectionGap,
			},
			header: {
				rowGap: metrics.gapY(0.45),
			},
			headerName: {
				color: foreground,
				fontSize: headingSize * 2.2,
				lineHeight: 1.05,
			},
			headerHeadline: {
				color: primary,
				fontSize: bodySize * 1.08,
				fontWeight: "600",
			},
			headerRule: {
				width: 46,
				height: 2.5,
				backgroundColor: primary,
			},
			headerContactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				columnGap: metrics.gapX(1.1),
				rowGap: metrics.gapY(0.15),
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
				borderRadius: 999,
			},
			section: {
				rowGap: metrics.gapY(0.3),
			},
			sectionHeading: {
				color: primary,
				fontSize: headingSize * 0.78,
				fontWeight: headingWeight,
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

		const sectionTimelineStyles = StyleSheet.create({
			items: {
				position: "relative",
			},
			line: {
				position: "absolute",
				top: 2,
				bottom: 0,
				left: 6.5,
				width: 1,
				backgroundColor: primary,
			},
			item: {
				flexDirection: "row",
				columnGap: metrics.gapX(0.6),
				position: "relative",
			},
			marker: {
				width: 14,
				alignItems: "center",
			},
			dot: {
				width: 6,
				height: 6,
				marginTop: bodySize * 0.52,
				borderRadius: 999,
				backgroundColor: primary,
			},
			content: {
				flex: 1,
			},
		});

		const featureStyles = {
			sectionTimeline: sectionTimelineStyles,
		} satisfies TemplateFeatureStyleSlots;

		const colors: TemplateColorRoles = { foreground, background, primary };

		return {
			colors,
			featureStyles,
			styles: {
				...baseStyles,
				icon: { display: "none" },
			} satisfies TimelineStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
