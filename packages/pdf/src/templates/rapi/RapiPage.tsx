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

type RapiStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	headerContactList: Style;
	contactItem: Style;
	contactText: Style;
	picture: Style;
	contentRow: Style;
	mainColumn: Style;
	sidebarColumn: Style;
};

type RapiTemplate = {
	colors: TemplateColorRoles;
	styles: RapiStyles;
};

type RapiHeaderProps = { styles: RapiStyles };

/**
 * Rapi splits the page about seventy thirty: experience reads down the wide column, contact, skills
 * and languages sit in a narrow right column behind a hairline. No colour fills, no icons, no rules
 * between sections, so the whitespace does the separating.
 */
export const RapiPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useRapiTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const mainSections = useRenderedSectionIds(pageNodeKey, filterSections(page.main, data));
	const sidebarSections = useRenderedSectionIds(pageNodeKey, page.fullWidth ? [] : filterSections(page.sidebar, data));

	return (
		<Page
			{...semanticPageProps}
			size={semanticPageSize ?? pageSize}
			style={composeStyles(styles.page, pageMinHeightStyle, semanticPageStyle)}
		>
			<TemplateProvider pageNodeKey={pageNodeKey} styles={styles} colors={colors}>
				{showHeader && <Header styles={styles} />}

				<View style={composeStyles(styles.contentRow, { columnGap: metrics.columnGap })}>
					<SemanticRegionView region="main" style={composeStyles(styles.mainColumn, { rowGap: metrics.sectionGap })}>
						{mainSections.map((section) => (
							<Section key={section} section={section} placement="main" />
						))}
					</SemanticRegionView>

					<SemanticRegionView
						region="sidebar"
						style={composeStyles(styles.sidebarColumn, { rowGap: metrics.sectionGap * 0.75 })}
					>
						{sidebarSections.map((section) => (
							<Section key={section} section={section} placement="sidebar" />
						))}
					</SemanticRegionView>
				</View>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: RapiHeaderProps) => {
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

const useRapiTemplate = (): RapiTemplate => {
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
				paddingVertical: Math.max(metrics.page.paddingVertical, 36),
				rowGap: metrics.sectionGap,
			},
			header: {
				flexDirection: r.row,
				alignItems: "flex-start",
				columnGap: metrics.gapX(1.6),
			},
			headerIdentity: {
				flex: 1,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.3),
			},
			headerName: {
				color: foreground,
				fontSize: headingSize * 2.15,
				lineHeight: 1.03,
			},
			headerHeadline: {
				color: foreground,
				fontSize: bodySize * 1.0,
			},
			headerContactList: {
				width: 156,
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
			picture: {
				...base.picture,
				width: 64,
				height: 64,
			},
			contentRow: {
				flexDirection: r.row,
				alignItems: "stretch",
			},
			mainColumn: {
				flex: 2.2,
			},
			sidebarColumn: {
				flex: 1,
				paddingStart: metrics.gapX(1.1),
				...(r.rtl ? { borderRightWidth: 0.5 } : { borderLeftWidth: 0.5 }),
				borderColor: foreground,
			},
			section: {
				rowGap: metrics.gapY(0.22),
			},
			sectionHeading: {
				color: foreground,
				fontSize: headingSize * 0.7,
				fontWeight: headingWeight,
				letterSpacing: headingSize * 0.05,
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
		});

		const colors: TemplateColorRoles = { foreground, background, primary };

		return {
			colors,
			styles: {
				...baseStyles,
				icon: { display: "none" },
			} satisfies RapiStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
