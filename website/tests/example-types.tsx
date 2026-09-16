import Source from "../examples/fixture/Counter.vapor.tsx";
import Built from "../.generated/examples/fixture/Counter.vapor.js";
export const validSource = <Source label="源码类型" />;
export const validBuilt = <Built label="预编译声明类型" />;
// @ts-expect-error The fixture title is a string in the source.
export const invalidSource = <Source label={123} />;
// @ts-expect-error The emitted declaration must preserve the title type.
export const invalidBuilt = <Built label={123} />;
