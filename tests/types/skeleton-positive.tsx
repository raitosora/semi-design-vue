import { Skeleton } from "../../packages/semi-ui-vue/src/index";
import {
  Skeleton as SkeletonSubpath,
  type AvatarProps,
  type GenericProps,
  type ParagraphProps,
  type SkeletonProps,
  type SkeletonSlots,
} from "../../packages/semi-ui-vue/src/components/skeleton/index";

const avatarProps: AvatarProps = {
  size: "extra-extra-small",
  shape: "square",
  "data-avatar": "ready",
};
const genericProps: GenericProps = {
  prefixCls: "custom-skeleton",
  type: "avatar",
};
const paragraphProps: ParagraphProps = { rows: 0, style: { width: 0 } };
const slots: SkeletonSlots = {
  placeholder: () => <Skeleton.Avatar size="medium" />,
  default: () => <p>Content</p>,
};
const props: SkeletonProps = {
  loading: undefined,
  active: false,
  className: "custom",
  "aria-label": "loading",
  "data-skeleton": 0,
  "v-slots": slots,
};
const positive = (
  <>
    <Skeleton {...props} />
    <SkeletonSubpath loading={false} v-slots={slots} />
    <Skeleton.Avatar {...avatarProps} />
    <Skeleton.Title style={{ width: 0 }} />
    <Skeleton.Button className="button" />
    <Skeleton.Image style={{ height: 0 }} />
    <Skeleton.Paragraph {...paragraphProps} />
  </>
);
void [genericProps, positive];
