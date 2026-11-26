// Reference lists used by the rule-based detection engines.
// Keeping them in one file makes the rules easy to read and extend.

// Well-known brands that phishers often impersonate, with their real domains.
const BRANDS = [
  { name: 'paypal', domains: ['paypal.com', 'paypal.me'] },
  { name: 'google', domains: ['google.com', 'gmail.com', 'youtube.com', 'goo.gl', 'google.com.pk'] },
  { name: 'microsoft', domains: ['microsoft.com', 'live.com', 'outlook.com', 'office.com', 'microsoftonline.com', 'office365.com'] },
  { name: 'outlook', domains: ['outlook.com', 'live.com', 'microsoft.com'] },
  { name: 'office365', domains: ['office.com', 'office365.com', 'microsoft.com'] },
  { name: 'apple', domains: ['apple.com', 'icloud.com'] },
  { name: 'icloud', domains: ['icloud.com', 'apple.com'] },
  { name: 'amazon', domains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.in', 'amazonaws.com'] },
  { name: 'facebook', domains: ['facebook.com', 'fb.com', 'fb.me', 'meta.com'] },
  { name: 'instagram', domains: ['instagram.com'] },
  { name: 'whatsapp', domains: ['whatsapp.com', 'whatsapp.net', 'wa.me'] },
  { name: 'netflix', domains: ['netflix.com'] },
  { name: 'linkedin', domains: ['linkedin.com', 'lnkd.in'] },
  { name: 'twitter', domains: ['twitter.com', 'x.com', 't.co'] },
  { name: 'dropbox', domains: ['dropbox.com'] },
  { name: 'adobe', domains: ['adobe.com'] },
  { name: 'chase', domains: ['chase.com'] },
  { name: 'wellsfargo', domains: ['wellsfargo.com'] },
  { name: 'bankofamerica', domains: ['bankofamerica.com'] },
  { name: 'hbl', domains: ['hbl.com'] },
  { name: 'easypaisa', domains: ['easypaisa.com.pk'] },
  { name: 'jazzcash', domains: ['jazzcash.com.pk'] },
  { name: 'dhl', domains: ['dhl.com'] },
  { name: 'fedex', domains: ['fedex.com'] },
  { name: 'binance', domains: ['binance.com'] },
  { name: 'coinbase', domains: ['coinbase.com'] },
  { name: 'steam', domains: ['steampowered.com', 'steamcommunity.com'] },
];

// Public URL shortening services (they hide the real destination).
const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly', 'adf.ly',
  'bitly.com', 'cutt.ly', 'rebrand.ly', 'shorturl.at', 'tiny.cc', 'rb.gy', 'v.gd',
  'clck.ru', 's.id', 't.ly', 'shorte.st', 'lnkd.in', 'qrco.de', 'bl.ink', 'soo.gd',
];

// Words commonly found in phishing URLs.
const SUSPICIOUS_URL_KEYWORDS = [
  'login', 'log-in', 'signin', 'sign-in', 'verify', 'verification', 'password',
  'account', 'update', 'secure', 'security', 'banking', 'confirm', 'webscr',
  'wallet', 'unlock', 'suspend', 'billing', 'invoice', 'reset', 'credential',
  'authenticate', 'validation', 'recover', 'support-ticket',
];

// Top-level domains with a high abuse rate in phishing reports.
const SUSPICIOUS_TLDS = [
  'zip', 'mov', 'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'click', 'country',
  'work', 'support', 'rest', 'fit', 'loan', 'men', 'icu', 'cam', 'buzz', 'monster',
  'live', 'online', 'site', 'info', 'shop',
];

// Second-level public suffixes so "example.co.uk" is treated as one domain.
const MULTI_PART_SUFFIXES = [
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'com.pk', 'edu.pk',
  'gov.pk', 'org.pk', 'net.pk', 'co.in', 'com.br', 'co.jp', 'com.cn', 'co.za',
  'com.sa', 'com.tr', 'com.mx',
];

// ---- Email phrases ----------------------------------------------------

const URGENT_PHRASES = [
  'urgent', 'immediately', 'immediate action', 'act now', 'right away', 'asap',
  'within 24 hours', 'within 48 hours', 'within 12 hours', 'expires today',
  'final notice', 'final warning', 'last chance', 'will be suspended',
  'will be closed', 'will be terminated', 'will be locked', 'has been suspended',
  'has been locked', 'unusual activity', 'suspicious activity', 'unauthorized access',
  'legal action', 'failure to comply', 'avoid suspension', 'account will be deleted',
  'respond immediately', 'time-sensitive', 'deadline',
];

const VERIFICATION_PHRASES = [
  'verify your account', 'verify your identity', 'confirm your account',
  'confirm your identity', 'validate your account', 'update your account',
  'update your information', 'update your details', 'confirm your details',
  'click here to verify', 'click the link below', 'click below to', 'reactivate your account',
  'restore your account', 'unlock your account', 'verify your email',
  're-enter your', 'complete verification', 'login to confirm', 'log in to confirm',
];

const SENSITIVE_INFO_PHRASES = [
  'password', 'passcode', 'pin code', 'pin number', 'your pin', 'credit card',
  'debit card', 'card number', 'cvv', 'cvc', 'expiry date', 'bank account',
  'account number', 'routing number', 'iban', 'social security', 'ssn',
  'cnic', 'national id', 'otp', 'one-time password', 'verification code',
  'security question', 'login details', 'login credentials', 'username and password',
  'mother\'s maiden name', 'date of birth', 'wire transfer', 'gift card',
];

const PRIZE_PHRASES = [
  'you have won', 'you\'ve won', 'you are a winner', 'congratulations you',
  'lottery', 'jackpot', 'prize', 'claim your reward', 'claim your prize',
  'cash reward', 'free gift', 'selected as a winner', 'lucky winner',
  'inheritance', 'million dollars', 'million usd', 'beneficiary', 'unclaimed funds',
  'next of kin', 'investment opportunity', 'guaranteed profit', 'double your money',
  'bitcoin giveaway', 'processing fee', 'transfer fee',
];

const GENERIC_GREETINGS = [
  'dear customer', 'dear user', 'dear valued customer', 'dear client',
  'dear account holder', 'dear member', 'dear sir/madam', 'dear sir or madam',
  'dear beneficiary', 'dear friend', 'hello user', 'dear email user',
];

// Common misspellings seen in phishing emails.
const COMMON_MISSPELLINGS = [
  'recieve', 'acount', 'accout', 'verfy', 'verifiy', 'pasword', 'passwrd',
  'suspened', 'suspendid', 'immediatly', 'imediately', 'securty', 'secuirty',
  'informations', 'kindly do the needful', 'adress', 'payement', 'bussiness',
  'transfered', 'untill', 'occured', 'garantee', 'definately', 'confirmaton',
  'updation', 'click hear', 'loose your account', 'you account',
];

const DANGEROUS_ATTACHMENT_HINTS = [
  '.exe', '.scr', '.bat', '.cmd', '.js ', '.vbs', '.jar', '.msi', '.iso',
  '.html attachment', 'enable macros', 'enable content', 'open the attached',
  'download the attachment', 'see attached invoice',
];

// Free email providers – a "bank" writing from one of these is a red flag.
const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com',
  'mail.com', 'gmx.com', 'yandex.com', 'proton.me', 'protonmail.com', 'icloud.com',
  'zoho.com',
];

module.exports = {
  BRANDS,
  URL_SHORTENERS,
  SUSPICIOUS_URL_KEYWORDS,
  SUSPICIOUS_TLDS,
  MULTI_PART_SUFFIXES,
  URGENT_PHRASES,
  VERIFICATION_PHRASES,
  SENSITIVE_INFO_PHRASES,
  PRIZE_PHRASES,
  GENERIC_GREETINGS,
  COMMON_MISSPELLINGS,
  DANGEROUS_ATTACHMENT_HINTS,
  FREE_EMAIL_PROVIDERS,
};
