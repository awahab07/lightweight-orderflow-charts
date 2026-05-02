# Attribution Guidance

`lightweight-orderflow-charts` builds on top of
[`TradingView lightweight-charts`](https://github.com/tradingview/lightweight-charts), which is
published under Apache-2.0 and carries an attribution requirement for user-facing deployments.

## Required Notice

This repo includes a root `NOTICE` file with the
[`TradingView lightweight-charts`](https://github.com/tradingview/lightweight-charts) attribution
text that downstream integrators should preserve in source form or documentation.

## Required Link

User-facing applications that ship charts built with
[`TradingView lightweight-charts`](https://github.com/tradingview/lightweight-charts) should
include a link to:

- <https://www.tradingview.com/>

One supported way to satisfy the link requirement is to keep the chart `layout.attributionLogo`
enabled.

## Demo Behavior

The demo application in this repository leaves `layout.attributionLogo` enabled explicitly so the
reference implementation reflects a compliant deployment shape.

## Recommended Consumer Checklist

- preserve the upstream notice text
- keep TradingView attribution visible or provide an equivalent user-facing link
- review the current
  [`TradingView lightweight-charts`](https://github.com/tradingview/lightweight-charts) license and
  notice text during dependency upgrades
