# 证据账本

> 本案例为合成数据演示。来源标识用于展示证据治理流程，不代表真实外部报告。

| ID | 来源 | 类型 | 状态 | 数据截至 | 定位 | 说明 |
|---|---|---|---|---|---|---|
| SYN-01 | 合成行业需求基准 | research | verified | 2026-06-30 | examples/synthetic-demo/source-notes.md#syn-01 | 用于演示市场规模与需求信号；非真实外部报告。 |
| SYN-02 | 合成骑行者访谈摘要 | community | reviewed | 2026-06-20 | examples/synthetic-demo/source-notes.md#syn-02 | 12 名虚构用户的合成访谈信号。 |
| SYN-03 | 合成渠道评论样本 | review | reviewed | 2026-06-25 | examples/synthetic-demo/source-notes.md#syn-03 | 用于演示痛点频次，不对应任何真实平台导出。 |
| SYN-04 | 合成竞品货架审计 | marketplace | verified | 2026-06-28 | examples/synthetic-demo/source-notes.md#syn-04 | 虚构品牌与 SKU，用于展示竞品评分。 |
| SYN-05 | 合成行业协会备忘录 | association | verified | 2026-05-31 | examples/synthetic-demo/source-notes.md#syn-05 | 用于独立交叉验证；非真实协会材料。 |
| SYN-06 | 合成品牌官网信息 | official | verified | 2026-06-29 | examples/synthetic-demo/source-notes.md#syn-06 | 虚构官网字段，演示一手来源。 |
| SYN-07 | 待复核的社媒趋势信号 | community | pending | 2026-06-30 | examples/synthetic-demo/source-notes.md#syn-07 | 故意保留为弱证据，用于展示评分封顶。 |

## 证据使用规则

- 结论必须引用来源 ID；无法解析的 ID 会使验证失败。
- 两个来源只有在独立组不同、且质量达到门槛时，才构成决策级交叉验证。
- 单来源或低质量来源不会被删除，但只能支持“方向性判断”或“待验证假设”。
