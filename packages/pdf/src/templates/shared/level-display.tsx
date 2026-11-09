import type { IconName } from "../../forme/icons";
import type { Style } from "../../forme/style-types";
import { resolveLevelDisplaySizes } from "@reactive-resume/schema/resume/level-display-sizes";
import { View } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { Svg } from "../../forme/primitives";
import { toColor } from "../../forme/style";
import { resolvedPdfFlowProps } from "../../semantic/adapter";
import {
	useResolvedNode,
	useSemanticNodeBindings,
	useSemanticNodeKey,
	useSemanticNodeVisible,
} from "../../semantic/context";
import { semanticNodeKeys } from "../../semantic/node-keys";
import { useTemplateIconSlot, useTemplateStyle } from "./context";
import { resolveStyleFontSize } from "./icon-size";
import { getTemplateMetrics } from "./metrics";
import { Icon, Text } from "./primitives";
import { composeStyles } from "./styles";

const LEVEL_ITEM_KEYS = ["level-1", "level-2", "level-3", "level-4", "level-5"] as const;
const STAR_PATH = "M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.32l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z";

const Star = ({ active, color, size }: { active: boolean; color: string; size: number }) => (
	<Svg
		viewBox="0 0 24 24"
		width={size}
		height={size}
		content={`<path d="${STAR_PATH}" fill="${toColor(color) ?? "#000000"}" fill-opacity="${active ? 1 : 0.22}"/>`}
	/>
);

type LevelDisplayProps = {
	level: number;
};

export const LevelDisplay = ({ level }: LevelDisplayProps) => {
	const data = useRender();
	const itemNodeKey = useSemanticNodeKey();
	const levelNodeKey = itemNodeKey ? semanticNodeKeys.level(itemNodeKey) : undefined;
	const resolved = useResolvedNode(levelNodeKey);
	const visible = useSemanticNodeVisible(levelNodeKey);
	const { resolveNode, isNodeVisible } = useSemanticNodeBindings();
	const levelDesign = data.metadata.design.level;
	const metrics = getTemplateMetrics(data.metadata.page);
	const iconProps = useTemplateIconSlot("icon");
	const levelContainerStyle = useTemplateStyle("levelContainer");
	const levelItemStyle = useTemplateStyle("levelItem");
	const levelItemActiveStyle = useTemplateStyle("levelItemActive");
	const levelItemInactiveStyle = useTemplateStyle("levelItemInactive");
	const { decorationSize, levelIconExplicitSize } = resolveLevelDisplaySizes({
		bodyFontSize: data.metadata.typography.body.fontSize,
		levelFontSize: resolveStyleFontSize(resolved.style),
	});
	const color = typeof iconProps.color === "string" ? iconProps.color : "#000000";
	const bodySize = data.metadata.typography.body.fontSize;
	const isProgressBar = levelDesign.type === "progress-bar" || levelDesign.type === "progress-bar-percent";
	const isStars = levelDesign.type === "stars";

	if (level === 0 || !visible) return null;
	if (levelDesign.type === "hidden") return null;
	if (levelDesign.type === "icon" && levelDesign.icon === "") return null;

	let gap = metrics.gapX(1 / 3);

	if (isProgressBar) {
		gap = 0;
	}

	if (levelDesign.type === "rectangle-full") {
		gap = metrics.gapX(0.5);
	}

	return (
		<View
			{...resolvedPdfFlowProps(resolved)}
			style={composeStyles(
				{ flexDirection: "row", alignItems: "center", marginTop: 2, columnGap: gap },
				levelContainerStyle,
				resolved.style,
			)}
		>
			{LEVEL_ITEM_KEYS.map((itemKey, index) => {
				const isActive = index < level;
				const decorationNodeKey = levelNodeKey ? semanticNodeKeys.icon(levelNodeKey, itemKey) : undefined;
				const decorationResolved = resolveNode(decorationNodeKey);
				if (!isNodeVisible(decorationNodeKey)) return null;

				if (isStars) {
					return <Star key={itemKey} active={isActive} color={color} size={levelIconExplicitSize ?? decorationSize} />;
				}

				if (levelDesign.type === "icon") {
					return (
						<Icon
							key={itemKey}
							nodeKey={decorationNodeKey}
							{...(levelIconExplicitSize === undefined ? {} : { size: levelIconExplicitSize })}
							name={levelDesign.icon as IconName}
							style={{ opacity: isActive ? 1 : 0.35 }}
						/>
					);
				}

				if (isProgressBar) {
					return (
						<View
							key={itemKey}
							{...resolvedPdfFlowProps(decorationResolved)}
							style={composeStyles(
								{
									flex: 1,
									height: decorationSize,
									borderWidth: 0.75,
									borderColor: color,
									backgroundColor: isActive ? color : "transparent",
								},
								levelItemStyle,
								isActive ? levelItemActiveStyle : levelItemInactiveStyle,
								decorationResolved.style,
							)}
						/>
					);
				}

				const itemStyle: Style = {};
				let borderRadius = 0;
				let width: string | number = decorationSize;

				if (levelDesign.type === "rectangle") {
					width = 16;
				}

				if (levelDesign.type === "rectangle-full") {
					width = "auto";
					itemStyle.flex = 1;
				}

				if (levelDesign.type === "circle") {
					borderRadius = 999;
				}

				return (
					<View
						key={itemKey}
						{...resolvedPdfFlowProps(decorationResolved)}
						style={composeStyles(
							{
								width,
								height: decorationSize,
								borderWidth: 0.75,
								borderColor: color,
								borderRadius,
								backgroundColor: isActive ? color : "transparent",
								...itemStyle,
							},
							levelItemStyle,
							isActive ? levelItemActiveStyle : levelItemInactiveStyle,
							decorationResolved.style,
						)}
					/>
				);
			})}
			{levelDesign.type === "progress-bar-percent" && (
				<Text
					style={{ color, fontSize: Math.max(7, bodySize * 0.7), fontWeight: "600", marginLeft: metrics.gapX(0.5) }}
				>
					{Math.round(level * 20)}%
				</Text>
			)}
		</View>
	);
};
