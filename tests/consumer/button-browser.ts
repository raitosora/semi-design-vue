import {
  Button,
  ButtonGroup,
  SplitButtonGroup,
  type ButtonProps as RootButtonProps,
} from "semi-ui-vue";
import ButtonFromSubpath, {
  Button as NamedButton,
  ButtonGroup as GroupFromButtonEntry,
  SplitButtonGroup as SplitFromButtonEntry,
  type BaseButtonProps,
  type ButtonGroupProps,
  type ButtonProps,
  type ButtonSlots,
  type HorizontalPaddingType,
  type SplitButtonGroupProps,
} from "semi-ui-vue/button";
import ButtonGroupFromSubpath, {
  ButtonGroup as NamedButtonGroup,
  type ButtonGroupProps as ButtonGroupSubpathProps,
  type ButtonGroupSlots,
} from "semi-ui-vue/button/buttonGroup";
import SplitButtonGroupFromSubpath, {
  SplitButtonGroup as NamedSplitButtonGroup,
  type SplitButtonGroupProps as SplitButtonGroupSubpathProps,
  type SplitButtonGroupSlots,
} from "semi-ui-vue/button/splitButtonGroup";

const buttonIdentity: typeof Button = ButtonFromSubpath;
const namedButtonIdentity: typeof Button = NamedButton;
const groupRootIdentity: typeof ButtonGroup = GroupFromButtonEntry;
const groupIdentity: typeof ButtonGroup = ButtonGroupFromSubpath;
const namedGroupIdentity: typeof ButtonGroup = NamedButtonGroup;
const splitRootIdentity: typeof SplitButtonGroup = SplitFromButtonEntry;
const splitIdentity: typeof SplitButtonGroup = SplitButtonGroupFromSubpath;
const namedSplitIdentity: typeof SplitButtonGroup = NamedSplitButtonGroup;
const buttonMarker: "Button" = Button.elementType;
const buttonName: "Button" = Button.__SemiComponentName__;
const baseButtonProps: BaseButtonProps = {
  prefixCls: "consumer-button",
  htmlType: "button",
  onClick(event) {
    const click: MouseEvent = event;
    void click;
  },
};
const horizontalPadding: HorizontalPaddingType = "left";
const buttonProps: ButtonProps = {
  type: "primary",
  theme: "outline",
  size: "default",
  htmlType: "submit",
  loading: false,
  text: 0,
};
const publicChildrenAlias: ButtonProps = {
  "x-semi-children-alias": "children",
};
const buttonSlots: ButtonSlots = {
  default: () => document.createTextNode("Save"),
  icon: (scope) => {
    const fill: readonly string[] | undefined = scope.fill;
    void fill;
    return document.createTextNode("*");
  },
};
const groupProps: ButtonGroupProps = { disabled: true, type: "danger" };
const groupSlots: ButtonGroupSlots = {
  default: () => document.createTextNode("Grouped"),
};
const splitProps: SplitButtonGroupProps = { className: "consumer-split" };
const splitSlots: SplitButtonGroupSlots = {
  default: () => document.createTextNode("Split"),
};
// @ts-expect-error Native submit remains htmlType, not component type.
const wrongButtonType: ButtonProps = { type: "submit" };
// @ts-expect-error Button keeps React-style icon nodes private.
const wrongButtonIcon: ButtonProps = { icon: () => [] };
// @ts-expect-error Button keeps React-style children private.
const wrongButtonChildren: ButtonProps = { children: "Save" };
// @ts-expect-error Internal content annotation is not public Button API.
const wrongButtonAnnotateContent: ButtonProps = { annotateContent: true };
// @ts-expect-error Internal native-element callback is not public Button API.
const wrongButtonElementCallback: ButtonProps = { onButtonElement: () => {} };
// @ts-expect-error Internal root prefix is not public Button API.
const wrongButtonRootPrefix: ButtonProps = { rootPrefixCls: "consumer" };
const wrongButtonNormalizedAlias: ButtonProps = {
  // @ts-expect-error Vue-normalized internal alias is not public Button API.
  xSemiChildrenAlias: "children",
};
// @ts-expect-error BaseButtonProps preserves the same slot-only icon boundary.
const wrongBaseButtonIcon: BaseButtonProps = { icon: () => [] };
// @ts-expect-error BaseButtonProps preserves the same slot-only children boundary.
const wrongBaseButtonChildren: BaseButtonProps = { children: "Save" };
// @ts-expect-error Button has no static Group member.
const staticGroup = Button.Group;
// @ts-expect-error BaseButton remains runtime-private.
import PrivateBaseButton from "semi-ui-vue/baseButton";
void [
  buttonIdentity,
  namedButtonIdentity,
  groupRootIdentity,
  groupIdentity,
  namedGroupIdentity,
  splitRootIdentity,
  splitIdentity,
  namedSplitIdentity,
  buttonMarker,
  buttonName,
  baseButtonProps,
  horizontalPadding,
  buttonProps satisfies RootButtonProps,
  publicChildrenAlias,
  buttonSlots,
  groupProps,
  groupSlots,
  splitProps,
  splitSlots,
  true satisfies ButtonGroupProps extends ButtonGroupSubpathProps
    ? ButtonGroupSubpathProps extends ButtonGroupProps
      ? true
      : false
    : false,
  true satisfies SplitButtonGroupProps extends SplitButtonGroupSubpathProps
    ? SplitButtonGroupSubpathProps extends SplitButtonGroupProps
      ? true
      : false
    : false,
  wrongButtonType,
  wrongButtonIcon,
  wrongButtonChildren,
  wrongButtonAnnotateContent,
  wrongButtonElementCallback,
  wrongButtonRootPrefix,
  wrongButtonNormalizedAlias,
  wrongBaseButtonIcon,
  wrongBaseButtonChildren,
  staticGroup,
  PrivateBaseButton,
];
