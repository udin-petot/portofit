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

type AcademicStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerName: Style;
	headerHeadline: Style;
	headerContactList: Style;
	contactItem: Style;
	contactText: Style;
	picture: Style;
	pictureWrap: Style;
	sections: Style;
};

type AcademicTemplate = {
	colors: TemplateColorRoles;
	styles: AcademicStyles;
};

type AcademicHeaderProps = { styles: AcademicStyles };

/**
 * Academic centres the header and every section heading over one generous column, the way
 * scholarship and research CVs are read. Serif type comes from the candidate's own pairing.
 */
export const AcademicPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useAcademicTemplate();
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

const Header = ({ styles }: AcademicHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<SemanticHeaderView style={styles.header}>
			{hasPicture && (
				<View style={styles.pictureWrap}>
					<SemanticHeaderPicture src={picture.url} style={styles.picture} />
				</View>
			)}
			<Heading style={styles.headerName}>{basics.name}</Heading>
			{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}

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

const useAcademicTemplate = (): AcademicTemplate => {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const headingWeight = metadata.typography.heading.fontWeights.at(-1) ?? "600";
		const bodySize = metadata.typography.body.fontSize;
		const headingSize = metadata.typography.heading.fontSize;

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: Math.max(metrics.page.paddingHorizontal, 46),
				paddingVertical: Math.max(metrics.page.paddingVertical, 36),
				rowGap: metrics.sectionGap,
			},
			header: {
				alignItems: "center",
				textAlign: "center",
				rowGap: metrics.gapY(0.35),
				borderBottomWidth: 0.8,
				borderBottomColor: primary,
				paddingBottom: metrics.gapY(0.6),
			},
			headerName: {
				color: foreground,
				fontSize: headingSize * 1.7,
				lineHeight: 1.1,
				textTransform: "uppercase",
				fontWeight: headingWeight,
			},
			headerHeadline: {
				color: primary,
				fontSize: bodySize * 1.0,
			},
			headerContactList: {
				justifyContent: "center",
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
				fontSize: bodySize * 0.82,
			},
			pictureWrap: {
				alignItems: "center",
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
				fontSize: headingSize * 0.74,
				fontWeight: headingWeight,
				textTransform: "uppercase",
				textAlign: "center",
			},
			sectionItems: {
				rowGap: metrics.itemGapY,
				paddingTop: metrics.gapY(0.15),
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
			} satisfies AcademicStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
