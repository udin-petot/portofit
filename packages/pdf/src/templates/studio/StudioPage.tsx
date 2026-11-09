import type { TemplatePageProps } from "../../document";
import type { Style } from "../../forme/style-types";
import type { TemplateColorRoles, TemplateStyleSlots } from "../shared/types";
import { Fragment, useMemo } from "react";
import { Page, StyleSheet } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { useRenderedSectionIds, useResolvedNode } from "../../semantic/context";
import { semanticNodeKeys } from "../../semantic/node-keys";
import { TemplateProvider } from "../shared/context";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { SemanticRegionView } from "../shared/primitives";
import { Section } from "../shared/sections";
import { SidebarBackground } from "../shared/sidebar-background";
import { composeStyles } from "../shared/styles";
import { TemplateHeader, useTemplateBase } from "../shared/template-base";

type StudioStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	mainColumn: Style;
	sidebarColumn: Style;
	header: Style;
	picture: Style;
	headerTitle: Style;
	headerIdentity: Style;
	headerName: Style;
	headerContactList: Style;
	headerContactItem: Style;
};

type StudioTemplate = {
	colors: TemplateColorRoles;
	styles: StudioStyles;
};

type StudioHeaderProps = {
	styles: StudioStyles;
};

const SIDEBAR_BACKGROUND = "#F2F0EA";

/**
 * Studio pairs a neutral, full-height sidebar with a serif name and a wide main column. The sidebar
 * carries the supporting facts, the main column carries the story, and neither uses a heavy colour block.
 */
export const StudioPage = ({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) => {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { metadata } = data;
	const { colors, styles } = useStudioTemplate();
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
				{!page.fullWidth && <SidebarBackground color={SIDEBAR_BACKGROUND} width={`${metadata.layout.sidebarWidth}%`} />}

				<SemanticRegionView
					region="sidebar"
					style={composeStyles(styles.sidebarColumn, {
						display: page.fullWidth ? "none" : "flex",
						flexBasis: `${metadata.layout.sidebarWidth}%`,
						rowGap: metrics.sectionGap,
						marginTop: -metrics.page.paddingVertical,
						paddingTop: metrics.page.paddingVertical,
					})}
				>
					{sidebarSections.map((section) => (
						<Fragment key={section}>
							<Section section={section} placement="sidebar" />
						</Fragment>
					))}
				</SemanticRegionView>

				<SemanticRegionView
					region="main"
					style={composeStyles(styles.mainColumn, {
						rowGap: metrics.sectionGap,
						...(page.fullWidth
							? {}
							: {
									marginTop: -metrics.page.paddingVertical,
									paddingTop: metrics.page.paddingVertical,
								}),
					})}
				>
					{showHeader && <Header styles={styles} />}

					{mainSections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: StudioHeaderProps) => (
	<TemplateHeader
		styles={{
			header: styles.header,
			picture: styles.picture,
			title: styles.headerTitle,
			identity: styles.headerIdentity,
			name: styles.headerName,
			contactList: styles.headerContactList,
			contactItem: styles.headerContactItem,
		}}
	/>
);

const useStudioTemplate = (): StudioTemplate => {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const headingWeight = metadata.typography.heading.fontWeights.at(-1) ?? "600";
		const headingSize = metadata.typography.heading.fontSize;

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				flexDirection: r.columns,
				paddingVertical: metrics.page.paddingVertical,
			},
			mainColumn: {
				flex: 1,
				...r.columnInset(metrics.page.paddingHorizontal, metrics.columnGap),
			},
			sidebarColumn: {
				flexGrow: 0,
				flexShrink: 0,
				...r.columnInset(metrics.columnGap, metrics.page.paddingHorizontal),
			},
			header: {
				flexDirection: r.row,
				alignItems: "flex-start",
				columnGap: metrics.gapX(1),
			},
			picture: {
				...base.picture,
				width: 64,
				height: 64,
				borderRadius: 999,
				objectFit: "cover",
			},
			headerTitle: {
				flex: 1,
				rowGap: metrics.gapY(0.35),
			},
			headerIdentity: {
				...r.headerIdentity,
				rowGap: metrics.gapY(0.3),
			},
			headerName: {
				color: foreground,
				fontSize: headingSize * 1.7,
				lineHeight: 1.05,
			},
			headerContactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				columnGap: metrics.gapX(0.5),
				rowGap: metrics.gapY(0.1),
			},
			headerContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.1),
			},
			section: {
				rowGap: metrics.gapY(0.2),
			},
			sectionHeading: {
				color: primary,
				fontSize: headingSize * 0.74,
				fontWeight: headingWeight,
				textTransform: "uppercase",
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
		});

		const colors: TemplateColorRoles = { foreground, background, primary, sidebarBackground: SIDEBAR_BACKGROUND };

		return {
			colors,
			styles: {
				...baseStyles,
				icon: { display: "none" },
			} satisfies StudioStyles,
		};
	}, [metadata, r, foreground, background, primary, metrics, base]);
};
