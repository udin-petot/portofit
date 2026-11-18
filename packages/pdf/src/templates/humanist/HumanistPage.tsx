import type { TemplatePageProps } from "../../document";
import type { Style } from "../../forme/style-types";
import type { TemplateColorRoles, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { Page, StyleSheet, View } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { useRenderedSectionIds, useResolvedNode } from "../../semantic/context";
import { semanticNodeKeys } from "../../semantic/node-keys";
import { getPrimaryTint } from "../shared/color-helpers";
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

type HumanistStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	band: Style;
	bandIdentity: Style;
	bandName: Style;
	bandHeadline: Style;
	bandContactList: Style;
	bandContactItem: Style;
	bandContactText: Style;
	picture: Style;
	body: Style;
	sections: Style;
};

type HumanistTemplate = {
	colors: TemplateColorRoles;
	styles: HumanistStyles;
};

type HumanistHeaderProps = { styles: HumanistStyles };

/**
 * Humanist opens with a warm tinted band and the photo on the right, then tells the story in one
 * calm column with hairline rules under each heading. The band carries no information of its own,
 * so nothing is lost when it prints in black and white.
 */
export const HumanistPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useHumanistTemplate();
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

const Header = ({ styles }: HumanistHeaderProps) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<SemanticHeaderView style={styles.band}>
			<View style={styles.bandIdentity}>
				<Heading style={styles.bandName}>{basics.name}</Heading>
				{basics.headline && <Text style={styles.bandHeadline}>{basics.headline}</Text>}

				<SemanticContactListView style={styles.bandContactList}>
					<EmailContactItem email={basics.email} style={styles.bandContactItem} textStyle={styles.bandContactText} />
					<PhoneContactItem phone={basics.phone} style={styles.bandContactItem} textStyle={styles.bandContactText} />
					<LocationContactItem location={basics.location} style={styles.bandContactItem} textStyle={styles.bandContactText} />
					<WebsiteContactItem website={basics.website} style={styles.bandContactItem} textStyle={styles.bandContactText} />
					{basics.customFields.map((field) => (
						<CustomFieldContactItem key={field.id} field={field} style={styles.bandContactItem} textStyle={styles.bandContactText} />
					))}
				</SemanticContactListView>
			</View>

			{hasPicture && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}
		</SemanticHeaderView>
	);
};

const useHumanistTemplate = (): HumanistTemplate => {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const headingWeight = metadata.typography.heading.fontWeights.at(-1) ?? "600";
		const bodySize = metadata.typography.body.fontSize;
		const headingSize = metadata.typography.heading.fontSize;

		const bandPaddingX = Math.max(metrics.page.paddingHorizontal, 40);
		const bodyPaddingX = Math.max(metrics.page.paddingHorizontal, 40);
		const bodyPaddingY = Math.max(metrics.page.paddingVertical * 0.85, 24);
		const bandColor = getPrimaryTint(primary, 0.12);
		const hairlineColor = getPrimaryTint(primary, 0.4);

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: 0,
				paddingVertical: 0,
			},
			band: {
				backgroundColor: bandColor,
				borderBottomWidth: 2.5,
				borderBottomColor: primary,
				flexDirection: "row",
				alignItems: "flex-start",
				justifyContent: "space-between",
				columnGap: 18,
				paddingHorizontal: bandPaddingX,
				paddingTop: Math.max(metrics.page.paddingVertical, 28),
				paddingBottom: Math.max(metrics.page.paddingVertical * 0.85, 22),
			},
			bandIdentity: {
				flexGrow: 1,
				flexBasis: 0,
				rowGap: metrics.gapY(0.4),
			},
			bandName: {
				color: foreground,
				fontSize: headingSize * 2.0,
				lineHeight: 1.08,
				fontWeight: headingWeight,
			},
			bandHeadline: {
				color: primary,
				fontSize: bodySize * 1.05,
				fontWeight: "700",
			},
			bandContactList: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.14),
				paddingTop: metrics.gapY(0.1),
			},
			bandContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.15),
			},
			bandContactText: {
				color: foreground,
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
				color: foreground,
				fontSize: headingSize * 0.8,
				fontWeight: headingWeight,
				borderBottomWidth: 1,
				borderBottomColor: hairlineColor,
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
			} satisfies HumanistStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
