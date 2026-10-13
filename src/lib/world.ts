// 195 countries: 193 UN members + 2 UN observer states (Holy See, Palestine). ISO 3166-1 alpha-2.
export type Continent = "Africa" | "Asia" | "Europe" | "North America" | "South America" | "Oceania";
export type WorldCountry = { code: string; name: string; continent: Continent };

const RAW: Record<Continent, string> = {
  Africa:
    "DZ Algeria|AO Angola|BJ Benin|BW Botswana|BF Burkina Faso|BI Burundi|CV Cabo Verde|CM Cameroon|CF Central African Republic|TD Chad|KM Comoros|CG Congo|CD DR Congo|CI Côte d'Ivoire|DJ Djibouti|EG Egypt|GQ Equatorial Guinea|ER Eritrea|SZ Eswatini|ET Ethiopia|GA Gabon|GM Gambia|GH Ghana|GN Guinea|GW Guinea-Bissau|KE Kenya|LS Lesotho|LR Liberia|LY Libya|MG Madagascar|MW Malawi|ML Mali|MR Mauritania|MU Mauritius|MA Morocco|MZ Mozambique|NA Namibia|NE Niger|NG Nigeria|RW Rwanda|ST São Tomé and Príncipe|SN Senegal|SC Seychelles|SL Sierra Leone|SO Somalia|ZA South Africa|SS South Sudan|SD Sudan|TZ Tanzania|TG Togo|TN Tunisia|UG Uganda|ZM Zambia|ZW Zimbabwe",
  Asia:
    "AF Afghanistan|AM Armenia|AZ Azerbaijan|BH Bahrain|BD Bangladesh|BT Bhutan|BN Brunei|KH Cambodia|CN China|CY Cyprus|GE Georgia|IN India|ID Indonesia|IR Iran|IQ Iraq|IL Israel|JP Japan|JO Jordan|KZ Kazakhstan|KW Kuwait|KG Kyrgyzstan|LA Laos|LB Lebanon|MY Malaysia|MV Maldives|MN Mongolia|MM Myanmar|NP Nepal|KP North Korea|OM Oman|PK Pakistan|PS Palestine|PH Philippines|QA Qatar|SA Saudi Arabia|SG Singapore|KR South Korea|LK Sri Lanka|SY Syria|TJ Tajikistan|TH Thailand|TL Timor-Leste|TR Turkey|TM Turkmenistan|AE United Arab Emirates|UZ Uzbekistan|VN Vietnam|YE Yemen",
  Europe:
    "AL Albania|AD Andorra|AT Austria|BY Belarus|BE Belgium|BA Bosnia and Herzegovina|BG Bulgaria|HR Croatia|CZ Czechia|DK Denmark|EE Estonia|FI Finland|FR France|DE Germany|GR Greece|VA Holy See|HU Hungary|IS Iceland|IE Ireland|IT Italy|LV Latvia|LI Liechtenstein|LT Lithuania|LU Luxembourg|MT Malta|MD Moldova|MC Monaco|ME Montenegro|NL Netherlands|MK North Macedonia|NO Norway|PL Poland|PT Portugal|RO Romania|RU Russia|SM San Marino|RS Serbia|SK Slovakia|SI Slovenia|ES Spain|SE Sweden|CH Switzerland|UA Ukraine|GB United Kingdom",
  "North America":
    "AG Antigua and Barbuda|BS Bahamas|BB Barbados|BZ Belize|CA Canada|CR Costa Rica|CU Cuba|DM Dominica|DO Dominican Republic|SV El Salvador|GD Grenada|GT Guatemala|HT Haiti|HN Honduras|JM Jamaica|MX Mexico|NI Nicaragua|PA Panama|KN Saint Kitts and Nevis|LC Saint Lucia|VC Saint Vincent and the Grenadines|TT Trinidad and Tobago|US United States",
  "South America":
    "AR Argentina|BO Bolivia|BR Brazil|CL Chile|CO Colombia|EC Ecuador|GY Guyana|PY Paraguay|PE Peru|SR Suriname|UY Uruguay|VE Venezuela",
  Oceania:
    "AU Australia|FJ Fiji|KI Kiribati|MH Marshall Islands|FM Micronesia|NR Nauru|NZ New Zealand|PW Palau|PG Papua New Guinea|WS Samoa|SB Solomon Islands|TO Tonga|TV Tuvalu|VU Vanuatu",
};

export const WORLD: WorldCountry[] = (Object.keys(RAW) as Continent[])
  .flatMap((continent) =>
    RAW[continent].split("|").map((s) => ({ code: s.slice(0, 2), name: s.slice(3), continent })),
  )
  .sort((a, b) => a.name.localeCompare(b.name));

export const CONTINENTS: Continent[] = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];

export function findCountry(code: string) {
  return WORLD.find((c) => c.code === code.toUpperCase());
}

/** Approximate capital coordinates for established manufacturing hubs, used as globe markers. */
export const HUB_MARKERS: { code: string; location: [number, number] }[] = [
  { code: "CN", location: [31.23, 121.47] },
  { code: "IN", location: [19.07, 72.87] },
  { code: "VN", location: [10.82, 106.63] },
  { code: "BD", location: [23.81, 90.41] },
  { code: "TR", location: [41.01, 28.97] },
  { code: "MX", location: [25.68, -100.31] },
  { code: "ID", location: [-6.2, 106.85] },
  { code: "PK", location: [24.86, 67.0] },
  { code: "TH", location: [13.75, 100.5] },
  { code: "PL", location: [52.23, 21.01] },
  { code: "PT", location: [41.15, -8.61] },
  { code: "BR", location: [-23.55, -46.63] },
  { code: "MA", location: [33.57, -7.59] },
  { code: "EG", location: [30.04, 31.24] },
  { code: "DE", location: [48.14, 11.58] },
  { code: "US", location: [34.05, -118.24] },
];
