import { defineVaporComponent } from "vue";
import { Progress } from "semi-ui-vue";

export default defineVaporComponent(() => (
  <section data-progress-basic="" style={{ maxWidth: "100%" }}>
    <h3>线形、环形和纵向</h3>
    <div style={{ display: "grid", gap: "16px", maxWidth: "360px" }}>
      <Progress aria-label="默认进度" />
      <Progress aria-label="空任务" motion={false} percent={0} showInfo />
      <Progress aria-label="完成任务" motion={false} percent={100} showInfo />
      <Progress aria-label="小数任务" motion={false} percent={37.25} showInfo />
      <Progress aria-label="负数任务" motion={false} percent={-20} showInfo />
      <Progress aria-label="超出任务" motion={false} percent={120} showInfo />
      <Progress aria-label="加粗任务" percent={65} showInfo size="large" />
      <Progress aria-label="自定高度" percent={40} style={{ height: "12px" }} />
      <Progress aria-label="不确定线形" indeterminate percent={90} showInfo />
      <Progress
        aria-label="分段颜色"
        orbitStroke="#eeeeee"
        percent={40}
        stroke={[
          { percent: 0, color: "#ff0000" },
          { percent: 100, color: "#0000ff" },
        ]}
      />
      <Progress
        aria-label="插值颜色"
        percent={50}
        stroke={[
          { percent: 0, color: "#ff0000" },
          { percent: 100, color: "#0000ff" },
        ]}
        strokeGradient
      />
    </div>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        marginTop: "24px",
        alignItems: "center",
      }}
    >
      <Progress aria-label="默认环形" percent={50} showInfo type="circle" />
      <Progress
        aria-label="小号环形"
        percent={50}
        showInfo
        size="small"
        type="circle"
      />
      <Progress
        aria-label="大号环形"
        percent={50}
        showInfo
        size="large"
        type="circle"
      />
      <Progress
        aria-label="自定环形"
        orbitStroke="#eeeeee"
        percent={75}
        showInfo
        stroke="#006060"
        strokeLinecap="square"
        strokeWidth={8}
        type="circle"
        width={100}
      />
      <Progress
        aria-label="不确定环形"
        indeterminate
        percent={90}
        showInfo
        type="circle"
      />
    </div>
    <div
      style={{
        display: "flex",
        height: "100px",
        gap: "24px",
        marginTop: "24px",
      }}
    >
      <Progress aria-label="纵向进度" direction="vertical" percent={60} />
      <Progress
        aria-label="加粗纵向"
        direction="vertical"
        percent={80}
        size="large"
      />
      <Progress
        aria-label="不确定纵向"
        direction="vertical"
        indeterminate
        style={{ width: "12px" }}
      />
    </div>
    <p>
      完成 100% 不自动插入成功图标；颜色由 stroke
      与主题控制。插值颜色是当前进度对应的一种颜色，不是空间渐变。
    </p>
  </section>
));
