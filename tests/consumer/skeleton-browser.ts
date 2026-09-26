import { Skeleton } from "semi-ui-vue";
import SubpathSkeleton, {
  Skeleton as NamedSubpathSkeleton,
  type SkeletonProps,
  type SkeletonSlots,
  type AvatarProps,
  type ParagraphProps,
  type GenericProps,
} from "semi-ui-vue/skeleton";
// @ts-expect-error Skeleton children are static members, not root named exports.
import { Avatar } from "semi-ui-vue";
// @ts-expect-error Skeleton children are static members, not root named exports.
import { Title } from "semi-ui-vue";
// @ts-expect-error Skeleton children are static members, not root named exports.
import { Paragraph } from "semi-ui-vue";
// @ts-expect-error Skeleton children are static members, not root named exports.
import { Image } from "semi-ui-vue";

const rootIdentity: typeof Skeleton = SubpathSkeleton;
const namedIdentity: typeof Skeleton = NamedSubpathSkeleton;
const avatar: typeof Skeleton.Avatar = SubpathSkeleton.Avatar;
const title: typeof Skeleton.Title = SubpathSkeleton.Title;
const button: typeof Skeleton.Button = SubpathSkeleton.Button;
const paragraph: typeof Skeleton.Paragraph = SubpathSkeleton.Paragraph;
const image: typeof Skeleton.Image = SubpathSkeleton.Image;
const props: SkeletonProps = {
  active: true,
  loading: undefined,
  className: "consumer-skeleton",
  style: { width: "240px" },
  role: "status",
  "aria-label": "Loading account",
  "data-consumer-skeleton": "",
};
const slots: SkeletonSlots = {
  default: () => document.createElement("span"),
  placeholder: () => [document.createElement("span")],
};
const avatarProps: AvatarProps = {
  size: "extra-extra-small",
  shape: "square",
  prefixCls: "consumer-skeleton",
  className: "consumer-avatar",
  style: { width: 20 },
};
const paragraphProps: ParagraphProps = {
  rows: 0,
  className: "consumer-paragraph",
  style: { width: "90%" },
};
const genericProps: GenericProps = {
  type: "title",
  size: "medium",
  shape: "circle",
};
// @ts-expect-error loading remains boolean.
const invalidLoading: SkeletonProps = { loading: "true" };
// @ts-expect-error active remains boolean.
const invalidActive: SkeletonProps = { active: "true" };
// @ts-expect-error React placeholder nodes are represented by a native Vapor slot.
const invalidPlaceholder: SkeletonProps = { placeholder: "Loading" };
// @ts-expect-error React children are represented by a native Vapor slot.
const invalidChildren: SkeletonProps = { children: "Loaded" };
// @ts-expect-error Avatar sizes follow the fixed upstream union.
const invalidAvatarSize: AvatarProps = { size: "huge" };
// @ts-expect-error Paragraph rows are numeric.
const invalidRows: ParagraphProps = { rows: "4" };
// @ts-expect-error A native slot cannot return a raw string.
const invalidSlot: SkeletonSlots = { default: () => "Loaded" };
// @ts-expect-error Native Vapor slots cannot be async.
const invalidAsyncSlot: SkeletonSlots = { placeholder: async () => [] };
void [
  rootIdentity,
  namedIdentity,
  avatar,
  title,
  button,
  paragraph,
  image,
  props,
  slots,
  avatarProps,
  paragraphProps,
  genericProps,
  invalidLoading,
  invalidActive,
  invalidPlaceholder,
  invalidChildren,
  invalidAvatarSize,
  invalidRows,
  invalidSlot,
  invalidAsyncSlot,
  Avatar,
  Title,
  Paragraph,
  Image,
];
