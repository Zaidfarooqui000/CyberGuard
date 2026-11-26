// =============================================================
// Email Phishing Detection Engine (rule-based, explainable)
// -------------------------------------------------------------
// The email text is analysed in memory only. Links inside the
// email are checked with the URL engine – they are never opened.
// Only a short REDACTED excerpt is kept for the scan history.
// =============================================================
const {
  BRANDS,
  URGENT_PHRASES,
  VERIFICATION_PHRASES,
  SENSITIVE_INFO_PHRASES,
  PRIZE_PHRASES,
  GENERIC_GREETINGS,
  COMMON_MISSPELLINGS,
  DANGEROUS_ATTACHMENT_HINTS,
  FREE_EMAIL_PROVIDERS,
} = require('./ruleData');
const { analyzeUrl, getRegisteredDomain, checkImpersonation } = require('./urlAnalyzer');
const { DISCLAIMER, getRiskLevel, calculateScore, severityFor } = require('./riskLevel');

const MAX_EMAIL_LENGTH = 20000;
const MAX_LINKS_CHECKED = 10;

// Returns the phrases from the list that appear in the text.
function findPhrases(text, phrases) {
  return phrases.filter((p) => text.includes(p));
}

function extractLinks(text) {
  const matches = text.match(/\b((?:https?:\/\/|www\.)[^\s<>"')\]]+)/gi) || [];
  // Remove trailing punctuation like "." or "," and duplicates
  const cleaned = matches.map((m) => m.replace(/[.,;:!?]+$/, ''));
  return [...new Set(cleaned)];
}

// Hides personal data so the stored excerpt is not sensitive.
function redactExcerpt(text) {
  return text
    // "password: abc123", "PIN = 4321", "OTP 99812" -> value hidden
    .replace(/\b(password|passwd|passcode|pin|otp|cvv|cvc|code)\b(\s*(?:is|:|=|-)?\s*)\S+/gi, '$1$2[redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '[link]')
    .replace(/\d[\d\s-]{3,}\d/g, '[number]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

// "PayPal Support <service@paypa1-help.com>" -> { displayName, address, domain }
function parseSender(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  const angle = value.match(/^(.*)<([^>]+)>\s*$/);
  const displayName = angle ? angle[1].replace(/["']/g, '').trim() : '';
  const address = (angle ? angle[2] : value).trim().toLowerCase();
  const valid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(address);
  const domain = valid ? address.split('@')[1] : '';
  return { displayName, address, domain, valid };
}

function analyzeSender(sender, lowerText, add, checks) {
  const parsed = parseSender(sender);
  if (!parsed) {
    checks.push({ name: 'Sender information', passed: true, detail: 'Not supplied (optional)' });
    return null;
  }

  let hits = 0;
  if (!parsed.valid) {
    hits++;
    add('sender_invalid', 'Sender', 10, 'Malformed sender address',
      `"${parsed.address}" is not a valid email address. Spoofed or broken sender details are a warning sign.`);
  } else {
    const registered = getRegisteredDomain(parsed.domain);
    const displayLower = (parsed.displayName + ' ' + parsed.address.split('@')[0]).toLowerCase().replace(/\s|-/g, '');
    const claimedBrand = BRANDS.find((b) => displayLower.includes(b.name));
    const isFree = FREE_EMAIL_PROVIDERS.includes(registered);

    const impersonation = checkImpersonation(parsed.domain, '');
    if (impersonation) {
      hits++;
      add('sender_impersonation', 'Sender', 25, 'Sender domain imitates a brand', impersonation.description);
    }
    if (claimedBrand && !claimedBrand.domains.some((d) => parsed.domain === d || parsed.domain.endsWith('.' + d))) {
      hits++;
      add('sender_mismatch', 'Sender', isFree ? 25 : 20, 'Sender name does not match domain',
        `The sender claims to be "${claimedBrand.name}" but the email comes from "${parsed.domain}"` +
        (isFree ? ', a free public email service. Real companies do not use free email accounts.' : ', which is not an official domain.'));
    }
    if (!claimedBrand && !impersonation) {
      // The email body mentions a brand that the sender domain doesn't belong to
      const mentioned = BRANDS.find((b) => b.name.length >= 5 && lowerText.includes(b.name));
      if (mentioned && !mentioned.domains.some((d) => parsed.domain === d || parsed.domain.endsWith('.' + d))) {
        hits++;
        add('brand_sender_mismatch', 'Sender', 15, 'Brand mentioned but sender is unrelated',
          `The email talks about "${mentioned.name}" but was sent from "${parsed.domain}", which is not an official ${mentioned.name} domain.`);
      }
    }
    if ((registered.split('.')[0].match(/\d/g) || []).length >= 4) {
      hits++;
      add('sender_digits', 'Sender', 8, 'Random-looking sender domain',
        `The sender domain "${parsed.domain}" contains many numbers, typical of throw-away phishing domains.`);
    }
  }
  checks.push({
    name: 'Sender information',
    passed: hits === 0,
    detail: hits === 0 ? `${parsed.domain || parsed.address} – no issues found` : `${hits} issue(s) with sender`,
  });
  return parsed.valid ? parsed.domain : null; // only the domain is stored, never the full address
}

function buildRecommendations(level, ids) {
  const recs = [];
  if (level === 'HIGH RISK') {
    recs.push('Do NOT click any links, open attachments, or reply to this email.');
    recs.push('Never send passwords, PINs, OTP codes, or card details by email – real organisations will not ask for them.');
    recs.push('Report the email as phishing (e.g. "Report phishing" in Gmail/Outlook) and delete it.');
  } else if (level === 'SUSPICIOUS') {
    recs.push('Be careful: verify the request by contacting the organisation using a phone number or website you already trust.');
    recs.push('Do not click links in the email – type the official website address yourself.');
  } else {
    recs.push('No strong phishing indicators were found, but always double-check unexpected requests.');
  }
  if (ids.has('sensitive_info')) recs.push('If you already shared a password or code, change it immediately and enable two-factor authentication.');
  if (ids.has('prize_scam')) recs.push('You cannot win a lottery or prize you never entered. Never pay a "fee" to receive winnings.');
  if (ids.has('urgent_language')) recs.push('Urgency is a pressure tactic. Take your time – legitimate deadlines can be confirmed independently.');
  if (ids.has('dangerous_attachment')) recs.push('Do not enable macros or run attached files from unknown senders.');
  if (ids.has('suspicious_links')) recs.push('Hover over links to see the real address before clicking, and check them with the CyberGuard URL scanner.');
  return recs;
}

function analyzeEmail({ content, sender, subject }) {
  const body = String(content || '').trim();
  if (body.length < 10) throw new Error('Please paste the email content (at least 10 characters).');
  if (body.length > MAX_EMAIL_LENGTH) throw new Error(`Email content is too long (max ${MAX_EMAIL_LENGTH} characters).`);

  const subjectText = String(subject || '').trim().slice(0, 300);
  const fullText = (subjectText + '\n' + body);
  const lower = fullText.toLowerCase();
  const indicators = [];
  const checks = [];
  const add = (id, category, points, title, description, matches) => {
    indicators.push({ id, category, points, severity: severityFor(points), title, description, matches: matches || [] });
  };

  // 1. Urgent or threatening language
  const urgent = findPhrases(lower, URGENT_PHRASES);
  if (urgent.length) {
    add('urgent_language', 'Language', Math.min(25, 8 + (urgent.length - 1) * 4), 'Urgent or threatening language',
      'The email pressures you to act quickly or threatens consequences. Creating panic is a classic social-engineering tactic.', urgent);
  }
  checks.push({ name: 'Urgent / threatening language', passed: !urgent.length, detail: urgent.length ? `${urgent.length} phrase(s)` : 'None found' });

  // 2. Fake account verification requests
  const verify = findPhrases(lower, VERIFICATION_PHRASES);
  if (verify.length) {
    add('verification_request', 'Request', Math.min(25, 12 + (verify.length - 1) * 5), 'Account verification request',
      'The email asks you to verify, confirm, or update your account. Phishers use this to lead you to fake login pages.', verify);
  }
  checks.push({ name: 'Account verification requests', passed: !verify.length, detail: verify.length ? `${verify.length} phrase(s)` : 'None found' });

  // 3. Password or banking information requests
  const sensitive = findPhrases(lower, SENSITIVE_INFO_PHRASES);
  if (sensitive.length) {
    add('sensitive_info', 'Request', Math.min(30, 12 + (sensitive.length - 1) * 6), 'Requests for passwords or financial data',
      'The email mentions passwords, PINs, card numbers or banking details. Legitimate organisations never ask for these by email.', sensitive);
  }
  checks.push({ name: 'Password / banking requests', passed: !sensitive.length, detail: sensitive.length ? `${sensitive.length} term(s)` : 'None found' });

  // 4. Suspicious links (checked with the URL engine – never opened)
  const links = extractLinks(body);
  const linkResults = [];
  for (const link of links.slice(0, MAX_LINKS_CHECKED)) {
    try {
      const r = analyzeUrl(link);
      linkResults.push({ url: link.slice(0, 300), riskScore: r.riskScore, riskLevel: r.riskLevel });
    } catch {
      linkResults.push({ url: link.slice(0, 300), riskScore: null, riskLevel: 'INVALID' });
    }
  }
  const worst = linkResults.reduce((max, l) => Math.max(max, l.riskScore || 0), 0);
  const badLinks = linkResults.filter((l) => l.riskLevel !== 'SAFE');
  if (worst >= 60) {
    add('suspicious_links', 'Links', 25, 'High-risk link(s) found',
      'At least one link in the email shows strong phishing indicators.', badLinks.map((l) => l.url));
  } else if (worst >= 30) {
    add('suspicious_links', 'Links', 15, 'Suspicious link(s) found',
      'At least one link in the email has warning signs.', badLinks.map((l) => l.url));
  }
  if (links.length > 5) {
    add('many_links', 'Links', 5, 'Large number of links',
      `The email contains ${links.length} links. Many links can be used to hide a malicious one.`);
  }
  checks.push({
    name: 'Suspicious links',
    passed: worst < 30,
    detail: links.length === 0 ? 'No links found' : `${links.length} link(s), ${badLinks.length} flagged`,
  });

  // 5. Unusual sender information (optional)
  const senderDomain = analyzeSender(sender, lower, add, checks);

  // 6. Prize and lottery scams
  const prize = findPhrases(lower, PRIZE_PHRASES);
  if (prize.length) {
    add('prize_scam', 'Scam', Math.min(35, 20 + (prize.length - 1) * 5), 'Prize, lottery or money scam',
      'The email promises prizes, winnings, inheritance or easy money. These are almost always advance-fee scams.', prize);
  }
  checks.push({ name: 'Prize / lottery scam', passed: !prize.length, detail: prize.length ? `${prize.length} phrase(s)` : 'None found' });

  // 7. Grammar and spelling warning indicators
  const grammarMatches = [];
  let grammarPoints = 0;
  const misspelled = findPhrases(lower, COMMON_MISSPELLINGS);
  if (misspelled.length) {
    grammarPoints += Math.min(15, misspelled.length * 5);
    grammarMatches.push(...misspelled.map((m) => `misspelling: "${m}"`));
  }
  const greetings = findPhrases(lower, GENERIC_GREETINGS);
  if (greetings.length) {
    grammarPoints += 8;
    grammarMatches.push(...greetings.map((g) => `generic greeting: "${g}"`));
  }
  const capsWords = (fullText.match(/\b[A-Z]{4,}\b/g) || []).filter((w) => !['HTTP', 'HTTPS', 'HTML'].includes(w));
  if (capsWords.length >= 4) {
    grammarPoints += 5;
    grammarMatches.push(`${capsWords.length} words in ALL CAPS`);
  }
  const exclamations = (fullText.match(/!/g) || []).length;
  if (exclamations >= 3 || /!!/.test(fullText)) {
    grammarPoints += 5;
    grammarMatches.push(`${exclamations} exclamation marks`);
  }
  if (grammarPoints > 0) {
    add('grammar', 'Language', Math.min(20, grammarPoints), 'Grammar, spelling or style warnings',
      'Spelling mistakes, generic greetings, ALL CAPS and excessive "!" are common in phishing emails. Real emails can have mistakes too, so this is a weak signal on its own.',
      grammarMatches);
  }
  checks.push({ name: 'Grammar & spelling indicators', passed: grammarPoints === 0, detail: grammarPoints ? `${grammarMatches.length} warning(s)` : 'None found' });

  // Combination rule: a prize/money offer that also asks for money or financial details
  const feeRequest = /(fee|charges?|pay|payment|send money|transfer)/.test(lower);
  if (prize.length && (sensitive.length || feeRequest)) {
    add('advance_fee', 'Scam', 15, 'Advance-fee fraud pattern',
      'The email combines a prize or money offer with a request for payment or financial details – the typical pattern of advance-fee fraud.');
  }

  // Bonus rule: risky attachments
  const attachments = findPhrases(lower, DANGEROUS_ATTACHMENT_HINTS);
  if (attachments.length) {
    add('dangerous_attachment', 'Attachment', 15, 'Risky attachment or macro request',
      'The email refers to executable files or asks you to enable macros/content – a common way to install malware.', attachments.map((a) => a.trim()));
  }

  const riskScore = calculateScore(indicators);
  const riskLevel = getRiskLevel(riskScore);
  const ids = new Set(indicators.map((i) => i.id));
  const summary =
    indicators.length === 0
      ? 'No phishing indicators were triggered by our rules.'
      : `${indicators.length} warning sign(s) were found, giving a risk score of ${riskScore}/100.`;

  return {
    type: 'email',
    riskScore,
    riskLevel,
    summary,
    indicators,
    checks,
    links: linkResults,
    recommendations: buildRecommendations(riskLevel, ids),
    disclaimer: DISCLAIMER,
    method: 'Rule-based analysis (no AI / machine learning). Links were not opened.',
    // Privacy-safe metadata (stored in history)
    meta: {
      excerpt: redactExcerpt(subjectText ? `${subjectText} – ${body}` : body),
      senderDomain,
      wordCount: body.split(/\s+/).filter(Boolean).length,
      linkCount: links.length,
    },
  };
}

module.exports = { analyzeEmail, redactExcerpt, extractLinks };
