// Shared scoring helpers for both detection engines.

const DISCLAIMER =
  'This result comes from transparent, rule-based automated analysis. ' +
  'It cannot guarantee that a website or email is safe or malicious. ' +
  'Always verify through official channels before sharing information.';

// Score bands (0–100):
//   0–29   SAFE        – no strong phishing indicators found
//   30–59  SUSPICIOUS  – several warning signs, be careful
//   60–100 HIGH RISK   – strong phishing indicators
function getRiskLevel(score) {
  if (score >= 60) return 'HIGH RISK';
  if (score >= 30) return 'SUSPICIOUS';
  return 'SAFE';
}

// Adds up indicator points and caps the total at 100.
function calculateScore(indicators) {
  const total = indicators.reduce((sum, item) => sum + (item.points || 0), 0);
  return Math.max(0, Math.min(100, total));
}

// Severity label for a single indicator, based on its points.
function severityFor(points) {
  if (points >= 25) return 'high';
  if (points >= 10) return 'medium';
  if (points > 0) return 'low';
  return 'info';
}

module.exports = { DISCLAIMER, getRiskLevel, calculateScore, severityFor };
