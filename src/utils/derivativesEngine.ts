// Precision Financial Derivatives & Yield Curve Engine

// Standard Normal cumulative distribution function
export function cdfNormal(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);
  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

// Standard Normal probability density function
export function pdfNormal(x: number): number {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface BSOptionsResult {
  price: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export function blackScholes(
  spot: number,
  strike: number,
  timeToExpiryYears: number,
  riskFreeRate: number,
  volatility: number,
  type: 'CALL' | 'PUT'
): BSOptionsResult {
  if (timeToExpiryYears <= 0 || volatility <= 0 || spot <= 0 || strike <= 0) {
    const intrinsic = type === 'CALL' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
    return {
      price: intrinsic,
      delta: type === 'CALL' ? (spot > strike ? 1 : 0) : (spot < strike ? -1 : 0),
      gamma: 0,
      vega: 0,
      theta: 0,
      rho: 0
    };
  }

  const d1 = (Math.log(spot / strike) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiryYears) / (volatility * Math.sqrt(timeToExpiryYears));
  const d2 = d1 - volatility * Math.sqrt(timeToExpiryYears);

  const nd1 = cdfNormal(d1);
  const nd2 = cdfNormal(d2);
  const n_minus_d1 = cdfNormal(-d1);
  const n_minus_d2 = cdfNormal(-d2);
  const pdf_d1 = pdfNormal(d1);
  const discount = Math.exp(-riskFreeRate * timeToExpiryYears);

  let price: number;
  let delta: number;
  let rho: number;

  if (type === 'CALL') {
    price = spot * nd1 - strike * discount * nd2;
    delta = nd1;
    rho = strike * timeToExpiryYears * discount * nd2 * 0.01; // per 1% interest change
  } else {
    price = strike * discount * n_minus_d2 - spot * n_minus_d1;
    delta = nd1 - 1.0;
    rho = -strike * timeToExpiryYears * discount * n_minus_d2 * 0.01;
  }

  const gamma = pdf_d1 / (spot * volatility * Math.sqrt(timeToExpiryYears));
  const vega = (spot * pdf_d1 * Math.sqrt(timeToExpiryYears)) * 0.01; // per 1% vol change
  
  // 1-day theta
  const thetaYearly = -(spot * pdf_d1 * volatility) / (2 * Math.sqrt(timeToExpiryYears))
    - (type === 'CALL'
      ? riskFreeRate * strike * discount * nd2
      : -riskFreeRate * strike * discount * n_minus_d2);
  const theta = thetaYearly / 365;

  return {
    price: Math.max(0, Number(price.toFixed(4))),
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    theta: Number(theta.toFixed(4)),
    rho: Number(rho.toFixed(4))
  };
}

// Yield Curve Inversion & Slope Analysis
export function analyzeYieldCurve(curve: { tenor: string; maturityYears: number; yieldCurrent: number }[]) {
  const y2 = curve.find(p => p.tenor === '2Y')?.yieldCurrent ?? 4.10;
  const y10 = curve.find(p => p.tenor === '10Y')?.yieldCurrent ?? 4.285;
  const y30 = curve.find(p => p.tenor === '30Y')?.yieldCurrent ?? 4.52;
  const y3m = curve.find(p => p.tenor === '3M')?.yieldCurrent ?? 5.22;

  const spread2_10 = Number(((y10 - y2) * 100).toFixed(1)); // in bps
  const spread3m_10y = Number(((y10 - y3m) * 100).toFixed(1));
  const spread10_30 = Number(((y30 - y10) * 100).toFixed(1));

  let status: 'NORMAL' | 'FLAT' | 'INVERTED' | 'UN-INVERTING' = 'NORMAL';
  if (spread2_10 < 0 || spread3m_10y < 0) {
    status = 'INVERTED';
  } else if (spread2_10 >= 0 && spread2_10 <= 20) {
    status = 'UN-INVERTING';
  } else if (spread2_10 < 10) {
    status = 'FLAT';
  }

  return {
    spread2_10,
    spread3m_10y,
    spread10_30,
    status
  };
}
