// =============================================================
// URL Phishing Detection Engine (rule-based, explainable)
// -------------------------------------------------------------
// IMPORTANT: This engine only inspects the TEXT of the URL.
// It never visits, downloads, or executes the submitted link.
// =============================================================
const {
  BRANDS,
  URL_SHORTENERS,
  SUSPICIOUS_URL_KEYWORDS,
  SUSPICIOUS_TLDS,
  MULTI_PART_SUFFIXES,
} = require('./ruleData');
const { DISCLAIMER, getRiskLevel, calculateScore, severityFor } = require('./riskLevel');

const MAX_URL_LENGTH = 2048;

// ---------- helpers ----------

// Turns user input into a URL object, or throws a friendly error.
function parseUrl(rawInput) {
  const input = String(rawInput || '').trim();
  if (!input) throw new Error('Please enter a URL to analyze.');
  if (input.length > MAX_URL_LENGTH) throw new Error(`URL is too long (max ${MAX_URL_LENGTH} characters).`);
  if (/\s/.test(input)) throw new Error('A URL cannot contain spaces.');

  // Only web addresses are accepted. Block javascript:, data:, file: etc.
  const schemeMatch = input.match(/^([a-z][a-z0-9+.-]*):/i);
  let hadScheme = false;
  let toParse = input;
  if (schemeMatch && input.slice(schemeMatch[0].length).startsWith('//')) {
    hadScheme = true;
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      throw new Error('Only http:// and https:// web addresses can be analyzed.');
    }
  } else if (schemeMatch && /^(javascript|data|file|vbscript|blob|about|mailto|ftp)$/i.test(schemeMatch[1])) {
    throw new Error('Only http:// and https:// web addresses can be analyzed.');
  } else {
    // "example.com/login" – no protocol given. Assume http for parsing.
    toParse = 'http://' + input;
  }

  let url;
  try {
    url = new URL(toParse);
  } catch {
    throw new Error('That does not look like a valid URL.');
  }
  if (!url.hostname || (!url.hostname.includes('.') && !url.hostname.startsWith('['))) {
    throw new Error('The URL must contain a valid domain name (for example: example.com).');
  }
  return { url, input, hadScheme };
}

function isIpAddress(hostname) {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4.test(hostname) || hostname.startsWith('[');
}

// "login.paypal.co.uk" -> "paypal.co.uk"
function getRegisteredDomain(hostname) {
  const parts = hostname.toLowerCase().split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_SUFFIXES.includes(lastTwo)) return parts.slice(-3).join('.');
  return lastTwo;
}

function domainMatches(hostname, officialDomain) {
  return hostname === officialDomain || hostname.endsWith('.' + officialDomain);
}

// Classic edit distance – used to spot look-alike names (paypa1, gooogle...).
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

// Replaces common character tricks: 0->o, 1->l, rn->m, vv->w ...
function normalizeLookalikes(text) {
  return text
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w')
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a');
}

// Looks for brand names used on a domain that does not belong to the brand.
function checkImpersonation(hostname, pathAndQuery) {
  const registered = getRegisteredDomain(hostname);
  const mainLabel = registered.split('.')[0];
  const isOfficial = (brand) => brand.domains.some((d) => domainMatches(hostname, d));

  for (const brand of BRANDS) {
    if (isOfficial(brand)) continue;

    // 1. Brand name appears in the host name (e.g. paypal.secure-login.xyz),
    //    also after undoing character tricks (e.g. paypa1-support.com)
    const flatHost = hostname.replace(/-/g, '');
    if (!flatHost.includes(brand.name) && normalizeLookalikes(flatHost).includes(brand.name)) {
      return {
        points: 35,
        title: 'Look-alike (typosquatting) domain',
        description: `"${registered}" imitates "${brand.name}" by swapping look-alike characters (such as 1 for l or 0 for o). The real site is ${brand.domains[0]}.`,
      };
    }
    if (flatHost.includes(brand.name)) {
      return {
        points: 30,
        title: 'Possible brand impersonation in domain',
        description: `The domain contains "${brand.name}" but is not an official ${brand.name} domain (${brand.domains[0]}). Attackers often put trusted brand names into fake domains.`,
      };
    }

    // 2. Look-alike spelling of the main domain label (e.g. paypa1.com)
    const normalized = normalizeLookalikes(mainLabel);
    const distance = levenshtein(normalized, brand.name);
    const allowed = brand.name.length >= 8 ? 2 : 1;
    if (brand.name.length >= 5 && (normalized === brand.name || distance <= allowed)) {
      return {
        points: 35,
        title: 'Look-alike (typosquatting) domain',
        description: `"${registered}" looks very similar to the real brand "${brand.name}" (${brand.domains[0]}). Small spelling changes are a common phishing trick.`,
      };
    }
  }

  // 3. Brand name only in the path, e.g. evil.com/paypal/login
  const lowerPath = pathAndQuery.toLowerCase();
  for (const brand of BRANDS) {
    if (isOfficial(brand)) continue;
    if (brand.name.length >= 5 && lowerPath.includes(brand.name)) {
      return {
        points: 15,
        title: 'Brand name used in URL path',
        description: `The path mentions "${brand.name}" while the site is hosted on "${registered}". Fake pages often place a brand name in the path to look legitimate.`,
      };
    }
  }
  return null;
}

function buildRecommendations(level, indicators) {
  const ids = new Set(indicators.map((i) => i.id));
  const recs = [];

  if (level === 'HIGH RISK') {
    recs.push('Do NOT open this link or enter any information on this website.');
    recs.push('If you already entered a password on this site, change it immediately and enable two-factor authentication (2FA).');
    recs.push('Report the link to your IT/security team or the impersonated organisation.');
  } else if (level === 'SUSPICIOUS') {
    recs.push('Avoid entering passwords, card numbers, or personal details on this site.');
    recs.push('Visit the organisation\'s website by typing its official address yourself instead of clicking the link.');
  } else {
    recs.push('No strong phishing indicators were found, but stay alert – new phishing sites appear every day.');
    recs.push('Only enter sensitive information on sites you reached by typing the official address.');
  }

  if (ids.has('no_https')) recs.push('The connection is not encrypted (no HTTPS). Never submit passwords over HTTP.');
  if (ids.has('https_present')) recs.push('Remember: HTTPS only encrypts the connection. Phishing sites can also use HTTPS.');
  if (ids.has('shortener')) recs.push('Use a link-expander service to preview where a shortened link really leads before clicking.');
  if (ids.has('impersonation')) recs.push('Check the domain letter by letter – compare it with the official domain of the brand.');
  if (ids.has('ip_host')) recs.push('Legitimate organisations rarely ask you to visit a raw IP address.');
  recs.push('Keep your browser and antivirus up to date and use a password manager (it won\'t auto-fill on fake domains).');
  return recs;
}

// ---------- main analysis ----------

function analyzeUrl(rawInput) {
  const { url, input, hadScheme } = parseUrl(rawInput);
  const hostname = url.hostname.toLowerCase();
  const registered = getRegisteredDomain(hostname);
  const tld = hostname.split('.').pop();
  const pathAndQuery = url.pathname + url.search + url.hash;
  const indicators = [];
  const checks = [];

  const add = (id, category, points, title, description) => {
    indicators.push({ id, category, points, severity: severityFor(points), title, description });
  };

  // 1. HTTPS availability
  if (url.protocol === 'https:') {
    add('https_present', 'HTTPS', 0, 'Uses HTTPS',
      'The link uses HTTPS, so traffic is encrypted. However, HTTPS does NOT prove a website is legitimate – many phishing sites use free HTTPS certificates.');
    checks.push({ name: 'HTTPS availability', passed: true, detail: 'HTTPS used (encryption only, not proof of safety)' });
  } else {
    add('no_https', 'HTTPS', hadScheme ? 15 : 10, hadScheme ? 'No HTTPS encryption' : 'No protocol specified',
      hadScheme
        ? 'The link uses plain HTTP. Any data you send (like passwords) could be intercepted.'
        : 'No http/https was given, so HTTPS cannot be confirmed. Treat it as unencrypted until verified.');
    checks.push({ name: 'HTTPS availability', passed: false, detail: 'HTTPS not used or not confirmed' });
  }

  // 2. IP address instead of domain name
  if (isIpAddress(hostname)) {
    add('ip_host', 'Domain', 25, 'IP address used instead of domain name',
      `The link points to the raw IP address ${hostname}. Legitimate services almost always use a domain name.`);
    checks.push({ name: 'IP address instead of domain', passed: false, detail: hostname });
  } else {
    checks.push({ name: 'IP address instead of domain', passed: true, detail: 'Uses a domain name' });
  }

  // 3. Excessive URL length
  if (input.length > 100) {
    add('long_url', 'Structure', 15, 'Very long URL',
      `The URL is ${input.length} characters long. Very long URLs are often used to hide the real destination.`);
    checks.push({ name: 'URL length', passed: false, detail: `${input.length} characters` });
  } else if (input.length > 75) {
    add('long_url', 'Structure', 8, 'Long URL',
      `The URL is ${input.length} characters long, which is longer than typical legitimate links.`);
    checks.push({ name: 'URL length', passed: false, detail: `${input.length} characters` });
  } else {
    checks.push({ name: 'URL length', passed: true, detail: `${input.length} characters` });
  }

  // 4. Suspicious symbols and characters
  let symbolHits = 0;
  if (input.includes('@')) {
    symbolHits++;
    add('at_symbol', 'Symbols', 30, '"@" symbol in URL',
      `Browsers ignore everything before "@" in a URL, so this link really opens "${hostname}", not what appears before the "@".`);
  }
  if (url.pathname.includes('//')) {
    symbolHits++;
    add('double_slash', 'Symbols', 10, 'Double slash redirect in path',
      'A "//" inside the path can indicate a hidden redirect to another site.');
  }
  const hyphenCount = (registered.replace(/xn--/g, '').match(/-/g) || []).length;
  if (hyphenCount >= 2) {
    symbolHits++;
    add('many_hyphens', 'Symbols', 10, 'Many hyphens in domain',
      `The domain "${registered}" has ${hyphenCount} hyphens. Phishing domains often look like "secure-login-update.com".`);
  }
  if (/%[0-9a-f]{2}/i.test(input) && (input.match(/%[0-9a-f]{2}/gi) || []).length >= 4) {
    symbolHits++;
    add('encoded_chars', 'Symbols', 8, 'Heavy URL encoding',
      'The URL contains many encoded characters (%xx), which can be used to disguise its content.');
  }
  if (hostname.includes('xn--') || /[^\x00-\x7F]/.test(input)) {
    symbolHits++;
    add('punycode', 'Symbols', 35, 'International / look-alike characters',
      'The domain uses non-English characters (punycode "xn--"). Attackers use letters like Cyrillic "а" to imitate real domains.');
  }
  if (url.port && !['80', '443'].includes(url.port)) {
    symbolHits++;
    add('odd_port', 'Symbols', 10, 'Unusual port number',
      `The link uses port ${url.port}. Normal websites rarely need a custom port.`);
  }
  checks.push({
    name: 'Suspicious symbols & characters',
    passed: symbolHits === 0,
    detail: symbolHits === 0 ? 'None found' : `${symbolHits} issue(s) found`,
  });

  // 5. Suspicious domain name structure
  let domainHits = 0;
  const subdomainCount = isIpAddress(hostname) ? 0 : hostname.split('.').length - registered.split('.').length;
  if (subdomainCount >= 3) {
    domainHits++;
    add('many_subdomains', 'Domain', 12, 'Too many subdomains',
      `The address has ${subdomainCount} subdomain levels (${hostname}). This is often used to push the real domain out of view.`);
  }
  if (!isIpAddress(hostname) && SUSPICIOUS_TLDS.includes(tld)) {
    domainHits++;
    add('suspicious_tld', 'Domain', 10, `High-risk domain ending ".${tld}"`,
      `".${tld}" domains are cheap and frequently abused in phishing campaigns. This alone does not mean the site is malicious.`);
  }
  const digitCount = (registered.split('.')[0].match(/\d/g) || []).length;
  if (!isIpAddress(hostname) && digitCount >= 4) {
    domainHits++;
    add('digits_domain', 'Domain', 8, 'Many digits in domain name',
      'Random-looking domain names with many numbers are common in short-lived phishing sites.');
  }
  checks.push({
    name: 'Suspicious domain name',
    passed: domainHits === 0,
    detail: domainHits === 0 ? `Registered domain: ${registered}` : `${domainHits} issue(s) with ${registered}`,
  });

  // 6. URL shortening services
  const shortener = URL_SHORTENERS.find((s) => domainMatches(hostname, s));
  if (shortener) {
    add('shortener', 'Redirection', 30, 'URL shortening service',
      `The link uses ${shortener}, which hides the final destination. Phishers use shorteners to disguise malicious sites.`);
    checks.push({ name: 'URL shortening service', passed: false, detail: shortener });
  } else {
    checks.push({ name: 'URL shortening service', passed: true, detail: 'Not a known shortener' });
  }

  // 7. Suspicious keywords
  const lowerUrl = (hostname + pathAndQuery).toLowerCase();
  const foundKeywords = SUSPICIOUS_URL_KEYWORDS.filter((k) => lowerUrl.includes(k));
  if (foundKeywords.length > 0) {
    const points = Math.min(20, foundKeywords.length * 6);
    add('keywords', 'Keywords', points, 'Suspicious keywords',
      `The URL contains sensitive words: ${foundKeywords.join(', ')}. Phishing links often use words like "login" or "verify" to create trust or urgency.`);
    checks.push({ name: 'Suspicious keywords', passed: false, detail: foundKeywords.join(', ') });
  } else {
    checks.push({ name: 'Suspicious keywords', passed: true, detail: 'None found' });
  }

  // 8. Domain impersonation
  // Text hidden before "@" (user-info) is included, e.g. https://paypal.com@evil.ru
  const userInfo = decodeURIComponent(url.username || '').toLowerCase();
  let impersonation = isIpAddress(hostname) ? null : checkImpersonation(hostname, pathAndQuery);
  if (!impersonation && userInfo) {
    const brand = BRANDS.find((b) => userInfo.includes(b.name) && !b.domains.some((d) => domainMatches(hostname, d)));
    if (brand) {
      impersonation = {
        points: 30,
        title: 'Brand name disguised before "@"',
        description: `The link shows "${userInfo}" before the "@" to look like ${brand.name}, but actually opens "${hostname}".`,
      };
    }
  }
  if (impersonation) {
    add('impersonation', 'Impersonation', impersonation.points, impersonation.title, impersonation.description);
    checks.push({ name: 'Domain impersonation', passed: false, detail: impersonation.title });
  } else {
    checks.push({ name: 'Domain impersonation', passed: true, detail: 'No known brand imitation detected' });
  }

  const riskScore = calculateScore(indicators);
  const riskLevel = getRiskLevel(riskScore);
  const triggered = indicators.filter((i) => i.points > 0);

  const summary =
    triggered.length === 0
      ? 'No phishing indicators were triggered by our rules.'
      : `${triggered.length} warning sign(s) were found, giving a risk score of ${riskScore}/100.`;

  return {
    type: 'url',
    submittedUrl: input,
    normalizedUrl: url.href,
    domain: hostname,
    registeredDomain: registered,
    riskScore,
    riskLevel,
    summary,
    indicators,
    checks,
    recommendations: buildRecommendations(riskLevel, indicators),
    disclaimer: DISCLAIMER,
    method: 'Rule-based analysis (no AI / machine learning). The link was not opened.',
  };
}

module.exports = { analyzeUrl, getRegisteredDomain, checkImpersonation, parseUrl };
