import {
  Skeleton,
  type SkeletonProps,
  type SkeletonSlots,
} from "../../packages/semi-ui-vue/src/components/skeleton/index";

const invalidLoading = (
  // @ts-expect-error loading is boolean when provided.
  <Skeleton loading="true" />
);
const invalidActive = (
  // @ts-expect-error active is boolean when provided.
  <Skeleton active="yes" />
);
const invalidAvatarSize = (
  // @ts-expect-error Avatar size is a fixed upstream size union.
  <Skeleton.Avatar size="huge" />
);
const invalidAvatarShape = (
  // @ts-expect-error Avatar shape is circle or square.
  <Skeleton.Avatar shape="triangle" />
);
const invalidRows = (
  // @ts-expect-error Paragraph rows must be numeric.
  <Skeleton.Paragraph rows="three" />
);
const invalidSlots: SkeletonSlots = {
  // @ts-expect-error Slot functions must return Vapor content.
  placeholder: () => ({ invalid: true }),
};
const invalidData: SkeletonProps = {
  // @ts-expect-error data attributes accept scalar DOM values, not objects.
  "data-skeleton": { nested: true },
};
void [
  invalidLoading,
  invalidActive,
  invalidAvatarSize,
  invalidAvatarShape,
  invalidRows,
  invalidSlots,
  invalidData,
];
