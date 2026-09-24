import { Row, Col } from "semi-ui-vue";
import {
  Row as SubpathRow,
  Col as SubpathCol,
  type RowProps,
  type ColProps,
  type RowSlots,
  type ColSlots,
  type Gutter,
  type ColSize,
  type Breakpoint,
} from "semi-ui-vue/grid";
// @ts-expect-error Grid component props remain on the Grid subpath.
import type { RowProps as RootRowProps } from "semi-ui-vue";
// @ts-expect-error Grid component props remain on the Grid subpath.
import type { ColProps as RootColProps } from "semi-ui-vue";

const rowIdentity: typeof Row = SubpathRow;
const colIdentity: typeof Col = SubpathCol;
const breakpoint: Breakpoint = "xxl";
const gutter: Gutter = { xs: 0, sm: 8, lg: 24 };
const columnSize: ColSize = { span: 12, offset: 2, order: 1, push: 1, pull: 0 };
const row: RowProps = {
  type: "flex",
  align: "middle",
  justify: "space-between",
  gutter: [gutter, 16],
  prefixCls: "semi-row",
  className: "row",
  role: "group",
  "aria-label": "Actions",
};
const undefinedRow: RowProps = {
  type: undefined,
  align: undefined,
  justify: undefined,
  gutter: undefined,
};
const col: ColProps = {
  span: 12,
  offset: 0,
  order: 2,
  push: 1,
  pull: 0,
  xs: 24,
  sm: columnSize,
  md: { span: 8 },
  lg: undefined,
  xl: 6,
  xxl: { span: 4, offset: 1 },
  className: "col",
  title: "Cell",
};
const rowSlots: RowSlots = { default: () => document.createElement("div") };
const colSlots: ColSlots = { default: () => document.createElement("button") };
// @ts-expect-error Grid breakpoints are a closed union.
const invalidBreakpoint: Breakpoint = "xxxl";
// @ts-expect-error Unsupported row type cannot enter the public contract.
const invalidType: RowProps = { type: "block" };
// @ts-expect-error Vertical alignment follows the fixed upstream union.
const invalidAlign: RowProps = { align: "baseline" };
// @ts-expect-error Justification follows the fixed upstream union.
const invalidJustify: RowProps = { justify: "space-evenly" };
// @ts-expect-error Gutter values are numeric or responsive numeric maps.
const invalidGutter: RowProps = { gutter: "large" };
// @ts-expect-error Col breakpoint values are numbers or ColSize objects.
const invalidCol: ColProps = { sm: "12" };
// @ts-expect-error React-style children do not own the Vapor slot.
const invalidChildren: RowProps = { children: "cell" };
// @ts-expect-error Direct HTML replacement would destroy slot ownership.
const invalidHtml: ColProps = { innerHTML: "<b>cell</b>" };
// @ts-expect-error A slot must return a Vapor renderable result.
const invalidSlot: RowSlots = { default: () => "cell" };
// @ts-expect-error Row has no upstream static Grid API.
const invalidStatic = Row.Col;
void [
  rowIdentity,
  colIdentity,
  breakpoint,
  gutter,
  columnSize,
  row,
  undefinedRow,
  col,
  rowSlots,
  colSlots,
  invalidBreakpoint,
  invalidType,
  invalidAlign,
  invalidJustify,
  invalidGutter,
  invalidCol,
  invalidChildren,
  invalidHtml,
  invalidSlot,
  invalidStatic,
  {} as RootRowProps,
  {} as RootColProps,
];
