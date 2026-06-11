// ============================================================
// DEFAULT CONTENT
// This file contains the initial/fallback content for the site.
// Once the admin panel is set up with GitHub Gist, content is
// loaded from there instead. This file serves as a fallback.
// ============================================================

export interface Post {
  id: string;
  date: string;
  author: string;
  title: string;
  content: string;
}

export interface SiteImage {
  id: string;
  name: string;
  dataUrl: string;
  copyright: string;
  createdAt: string;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  email: string;
  phone: string;
  phoneNote: string;
  phoneLandline: string;
  address: { street: string; zip: string; city: string };
  bankAccount: { bank: string; accountNumber: string; blz: string; iban: string; bic: string };
  registry: { court: string; number: string };
  board: { name: string; role: string }[];
  responsibleContent: { name: string; street: string; zip: string; city: string };
  founded: string;
  members: string;
  bannerImage: string;
  bannerImageCredit: string;
  aboutImage: string;
  aboutImageCredit: string;
  pageContent: {
    homeWelcomeHtml: string;
    aboutMainHtml: string;
    huettennutzungIntroHtml: string;
    impressumHtml: string;
    datenschutzHtml: string;
  };
}

export interface ContentData {
  posts: Post[];
  siteConfig: SiteConfig;
  images: SiteImage[];
}

export const defaultContent: ContentData = {
  posts: [],

  siteConfig: {
    name: "Goldsteinfreunde Bad Nauheim e.V.",
    shortName: "Goldsteinfreunde",
    tagline: "Erhalt und Pflege des Goldsteinparks in Bad Nauheim seit 2011",
    email: "info@goldsteinfreunde.de",
    phone: "+49 160 5551160",
    phoneNote: "Vorsitzender Gerd Hildebrand",
    phoneLandline: "+49 6032 3075898",
    address: { street: "Adlerweg 27", zip: "61231", city: "Bad Nauheim" },
    bankAccount: {
      bank: "Sparkasse Oberhessen",
      accountNumber: "270 885 38",
      blz: "518 500 79",
      iban: "DE24518500790027088538",
      bic: "HELADEF1FRI",
    },
    registry: { court: "Amtsgericht Friedberg", number: "VR 2732" },
    board: [
      { name: "Gerd Hildebrand", role: "Vorsitzender" },
      { name: "Martina Exeler", role: "" },
      { name: "Christiane Allroggen", role: "" },
      { name: "Peter Hippeli", role: "" },
      { name: "Eckart Häberlin", role: "" },
    ],
    responsibleContent: {
      name: "Kai Uwe Neumann",
      street: "Rohrweihenweg 21",
      zip: "61231",
      city: "Bad Nauheim",
    },
    founded: "Juli 2011",
    members: "über 150",
    bannerImage: "/images/goldsteinpark-banner.jpg",
    bannerImageCredit: "Gerd Hildebrand",
    aboutImage: "/images/about-goldsteinpark.jpg",
    aboutImageCredit: "Privat",
    pageContent: {
      homeWelcomeHtml: `<h3>Willkommen!</h3>
<p>Wir sind ein anerkannt gemeinnütziger Verein, der sich seit Juli 2011 dem Erhalt und der Pflege des Goldsteinparks in Bad Nauheim verschrieben hat. Zu diesem Zweck veranstalten wir gemeinsame Pflanzaktionen und andere Events für Groß und Klein.</p>`,
      aboutMainHtml: `<p>Wir sind ein anerkannt gemeinnütziger Verein mit über 150 Mitgliedern, der sich seit Juli 2011 dem Erhalt und der Pflege des Goldsteinparks in Bad Nauheim verschrieben hat. Zu diesem Zweck veranstalten wir gemeinsame Pflanzaktionen und andere Events für Groß und Klein.</p>
<h3>Aufgaben des Vereins</h3>
<ul>
<li>Erhalt und die weitere ökologisch orientierte Ausgestaltung und Förderung der Park- und Grünanlagen für eine naturverträgliche Erholung in einem ästhetisch und gesundheitsbewussten Rahmen</li>
<li>Pflege- und Pflanzarbeiten durch die Mitglieder im Goldstein</li>
<li>Förderung des gesellschaftlichen Zusammenlebens durch die Organisation von Veranstaltungen</li>
<li>Erarbeitung von Konzepten zur Förderung der Attraktivität des Goldsteins</li>
<li>Förderung der schulischen und Erwachsenenbildung durch gezielte Nutzung der Parklandschaft in Verbindung mit praktischen und anschaulichen Informationsveranstaltungen über ökologische Zusammenhänge</li>
<li>Öffentlichkeitswirksame Darstellung der Ziele und Aktivitäten des Vereins</li>
</ul>`,
      huettennutzungIntroHtml: `<ul>
<li>Die rote Hütte der Goldsteinfreunde (neben dem KIKS UP) wird <strong>nur an Mitglieder</strong> vergeben und <strong>nicht öffentlich</strong> vermietet.</li>
<li>Einen ersten Überblick zum Belegungsplan der Hütte erhalten Sie im Kalender unten.</li>
<li>Nutzungsanfragen bitte ausschließlich per E-Mail an <a href="mailto:info@goldsteinfreunde.de">info@goldsteinfreunde.de</a>.</li>
</ul>`,
      impressumHtml: `<h2>Angaben gemäß § 5 TMG</h2>
<p>
<strong>Goldsteinfreunde Bad Nauheim e.V.</strong><br />
Adlerweg 27<br />
61231 Bad Nauheim
</p>

<h2>Vertreten durch</h2>
<p>Der Verein wird durch den Vorstand vertreten. Vorsitzender ist:</p>
<p>
Gerd Hildebrand<br />
Adlerweg 27<br />
61231 Bad Nauheim
</p>

<h2>Kontakt</h2>
<p>
Telefon: <a href="tel:+4960323075898">+49 6032 3075898</a><br />
E-Mail: <a href="mailto:info@goldsteinfreunde.de">info@goldsteinfreunde.de</a>
</p>

<h2>Registereintrag</h2>
<p>
Eintragung im Vereinsregister.<br />
Registergericht: Amtsgericht Friedberg<br />
Registernummer: VR 2732
</p>

<h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
<p>
Kai Uwe Neumann<br />
Rohrweihenweg 21<br />
61231 Bad Nauheim
</p>

<h2>Streitschlichtung</h2>
<p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>.</p>
<p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

<h2>Haftung für Inhalte</h2>
<p>Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
<p>Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>

<h2>Haftung für Links</h2>
<p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.</p>
<p>Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</p>

<h2>Urheberrecht</h2>
<p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>
<p>Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.</p>`,
      datenschutzHtml: `<p>Der Goldsteinfreunde Bad Nauheim e.V. (nachfolgend „wir" oder „uns") nimmt den Schutz Ihrer personenbezogenen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der datenschutzrechtlichen Vorgaben, insbesondere der Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG).</p>
<p>Mit dieser Datenschutzerklärung informieren wir Sie darüber, wie wir Ihre personenbezogenen Daten verarbeiten und welche Rechte Ihnen als Betroffener zustehen.</p>

<h2>1. Verantwortlicher</h2>
<p>Verantwortlicher für die Datenverarbeitung auf dieser Website ist:</p>
<p>
Goldsteinfreunde Bad Nauheim e.V.<br />
Adlerweg 27<br />
61231 Bad Nauheim<br />
E-Mail: <a href="mailto:info@goldsteinfreunde.de">info@goldsteinfreunde.de</a>
</p>

<h2>2. Datenschutzbeauftragter</h2>
<p>Für einen eingetragenen Verein besteht keine gesetzliche Pflicht zur Benennung eines Datenschutzbeauftragten (Art. 37 DSGVO). Bei Fragen zum Datenschutz wenden Sie sich bitte direkt an die oben genannte Kontaktadresse.</p>

<h2>3. Allgemeines zur Datenverarbeitung</h2>
<p>Diese Website ist bewusst einfach gehalten und verzichtet weitgehend auf die Verarbeitung personenbezogener Daten. Es werden keine Besuchertracking-Tools, keine Webanalyse-Software, keine Werbenetzwerke und keine Kontaktformulare für Besucher eingesetzt. Wir betreiben keine eigene Besucherstatistik und haben keine Einsicht in personenbezogene Besucherprofile.</p>

<h2>4. Rechtsgrundlage der Datenverarbeitung</h2>
<p>Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf Grundlage folgender Rechtsgrundlagen:</p>
<ul>
<li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse): Bereitstellung und Sicherheit der Website.</li>
<li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> (Einwilligung): Laden externer Inhalte (Karten, Kalender) erst nach ausdrücklicher Bestätigung durch Sie.</li>
<li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> (Vertragserfüllung): Bearbeitung von E-Mail-Anfragen im Rahmen bestehender Vereinsbeziehungen.</li>
</ul>

<h2>5. Hosting und Bereitstellung der Website</h2>
<p>Diese Website wird als statische Website über <strong>Cloudflare Pages</strong> (Anbieter: Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA) ausgeliefert. Cloudflare ist ein Content-Delivery-Network-Dienst, der die statischen Dateien dieser Website bereitstellt.</p>
<p>Beim Aufruf der Seiten verarbeitet Cloudflare technisch notwendige Verbindungsdaten, insbesondere:</p>
<ul>
<li>IP-Adresse des aufrufenden Systems</li>
<li>Datum und Uhrzeit des Abrufs</li>
<li>URL der aufgerufenen Seite</li>
<li>Referrer-URL (vorher besuchte Seite)</li>
<li>Browser-Typ und -Version</li>
<li>Betriebssystem des Nutzers</li>
</ul>
<p>Diese Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der sicheren und zuverlässigen Bereitstellung unserer Website). Es wird kein Tracking durch Cloudflare aktiviert und wir haben keinen Zugriff auf personenbezogene Besucherprofile.</p>
<p>Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert. Zudem werden sogenannte Standardvertragsklauseln (EU-Standardvertragsklauseln) eingesetzt, um ein angemessenes Datenschutzniveau bei Datenübermittlungen in Drittländer sicherzustellen (Art. 46 Abs. 2 lit. c DSGVO).</p>

<h2>6. Server-Log-Dateien</h2>
<p>Der Provider der Website (Cloudflare) erhebt und speichert automatisch Informationen in sogenannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:</p>
<ul>
<li>Browsertyp und Browserversion</li>
<li>verwendetes Betriebssystem</li>
<li>Referrer URL</li>
<li>Hostname des zugreifenden Rechners</li>
<li>Uhrzeit der Serveranfrage</li>
<li>IP-Adresse</li>
</ul>
<p>Diese Daten werden nicht mit anderen Datenquellen zusammengeführt. Die Speicherung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Stabilität und Sicherheit der Website).</p>

<h2>7. Zugriff auf Inhalte</h2>
<p>Die Inhalte der Website werden über eine eigene serverseitige Schnittstelle geladen. Besucher rufen dabei ausschließlich unsere Website-Domain auf; Zugangsdaten zu externen Diensten (z. B. GitHub) oder internen Systemen werden nicht an Besucher ausgeliefert.</p>

<h2>8. Externe Karten und Kalender (Einwilligungserfordernis)</h2>
<p>Auf unserer Website werden externe Inhalte von Drittanbietern eingebunden, die nicht automatisch geladen werden, sondern erst nach Ihrer ausdrücklichen und informierten Bestätigung:</p>

<h3>8.1 OpenStreetMap-Karte</h3>
<p>Auf der Seite „Über uns" wird eine OpenStreetMap-Karte über einen eingebetteten iframe dargestellt. Erst wenn Sie auf den Button „Karte anzeigen" klicken, wird eine Verbindung zu den Servern von OpenStreetMap (OpenStreetMap Foundation, St John's Innovation Centre, Cowley Road, Cambridge CB4 0WS, United Kingdom) hergestellt. Dabei können folgende Daten an OpenStreetMap übertragen werden:</p>
<ul>
<li>IP-Adresse</li>
<li>Browserinformationen</li>
<li>Zeitpunkt des Abrufs</li>
</ul>
<p>Die Datenverarbeitung erfolgt auf Grundlage Ihrer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO. Sie können Ihre Einwilligung jederzeit widerrufen, indem Sie die Seite verlassen.</p>

<h3>8.2 Google-Kalender</h3>
<p>Auf der Seite „Hüttennutzung" wird ein Google-Kalender über einen eingebetteten iframe dargestellt. Erst wenn Sie auf den Button „Kalender anzeigen" klicken, wird eine Verbindung zu den Servern von Google LLC (1600 Amphitheatre Parkway, Mountain View, CA 94043, USA) hergestellt. Dabei können folgende Daten an Google übertragen werden:</p>
<ul>
<li>IP-Adresse</li>
<li>Browserinformationen</li>
<li>Zeitpunkt des Abrufs</li>
</ul>
<p>Google verarbeitet diese Daten möglicherweise in den USA. Google ist unter dem EU-US Data Privacy Framework zertifiziert. Die Datenverarbeitung erfolgt auf Grundlage Ihrer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO. Sie können Ihre Einwilligung jederzeit widerrufen, indem Sie die Seite verlassen.</p>

<h2>9. E-Mail-Kontakt</h2>
<p>Auf dieser Website gibt es kein Kontaktformular. Wenn Sie uns per E-Mail kontaktieren, werden die von Ihnen übermittelten Daten (insbesondere E-Mail-Adresse, Name und Inhalte der Nachricht) ausschließlich zur Bearbeitung Ihrer Anfrage gespeichert und verarbeitet. Die Datenverarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. vorvertragliche Maßnahmen) oder Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung Ihrer Anfrage). Ihre Daten werden gelöscht, sobald sie für die Erreichung des Zweckes ihrer Erhebung nicht mehr erforderlich sind, sofern keine gesetzliche Aufbewahrungspflicht besteht.</p>

<h2>10. Cookies und lokale Speicherung</h2>

<h3>10.1 Besucher der Website</h3>
<p>Für normale Besucher werden keine Tracking-Cookies und keine vergleichbaren Speichertechnologien eingesetzt. Es werden keine Cookies zu Analyse-, Marketing- oder Werbezwecken gesetzt.</p>

<h3>10.2 Technisch notwendige Cookies im Admin-Bereich</h3>
<p>Der geschützte Admin-Bereich (zugänglich über <a href="#/admin">#/admin</a>) verwendet technisch notwendige Sitzungsfunktionen (Session-Cookies) für berechtigte Redakteurinnen und Redakteure. Diese Cookies sind für den Betrieb des redaktionellen Systems erforderlich und dienen der Authentifizierung und Sicherheit. Details:</p>
<ul>
<li><strong>Name:</strong> gf_admin_session (HttpOnly, Secure, SameSite=Strict)</li>
<li><strong>Zweck:</strong> Authentifizierung des Administrators</li>
<li><strong>Laufzeit:</strong> 8 Stunden</li>
<li><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Sicherheit des Admin-Bereichs)</li>
</ul>
<p>Zusätzlich wird ein Cookie zur Begrenzung der Login-Versuche gesetzt (gf_login_attempts), um Brute-Force-Angriffe zu verhindern.</p>

<h3>10.3 Lokale Speicherung (localStorage / sessionStorage)</h3>
<p>Im Admin-Bereich kann sessionStorage für clientseitige Zustandsverwaltung verwendet werden. Im Normalbetrieb werden keine Daten im localStorage gespeichert. Dies dient ausschließlich der Funktionalität des redaktionellen Systems.</p>

<h2>11. Datenspeicherung und Löschung</h2>
<p>Wir speichern personenbezogene Daten nur so lange, wie es für die Zwecke, für die sie verarbeitet werden, erforderlich ist oder wie es gesetzliche Aufbewahrungspflichten vorsehen. Sobald der Speicherungszweck entfällt bzw. gesetzliche Aufbewahrungsfristen ablaufen, werden die Daten gelöscht oder anonymisiert.</p>

<h2>12. Datenübermittlung in Drittländer</h2>
<p>Beim Aufruf unserer Website können Ihre personenbezogenen Daten (insbesondere IP-Adresse) an Server von Cloudflare (USA) und bei Nutzung der externen Inhalte an Server von OpenStreetMap (Vereinigtes Königreich) bzw. Google (USA) übertragen werden. Die Übermittlung erfolgt auf Grundlage:</p>
<ul>
<li>Ihrer ausdrücklichen Einwilligung gemäß Art. 49 Abs. 1 lit. a DSGVO</li>
<li>oder des EU-US Data Privacy Framework (Art. 45 DSGVO) für US-Unternehmen, die unter diesem Framework zertifiziert sind</li>
</ul>
<p>Wir setzen zudem EU-Standardvertragsklauseln ein, um ein angemessenes Datenschutzniveau sicherzustellen (Art. 46 Abs. 2 lit. c DSGVO).</p>

<h2>13. Ihre Rechte als Betroffener</h2>
<p>Sie haben im Rahmen der datenschutzrechtlichen Vorgaben folgende Rechte:</p>
<ul>
<li><strong>Auskunftsrecht</strong> (Art. 15 DSGVO): Sie können Auskunft darüber verlangen, ob und welche personenbezogenen Daten wir über Sie verarbeiten.</li>
<li><strong>Berichtigungsrecht</strong> (Art. 16 DSGVO): Sie können die Berichtigung unrichtiger personenbezogener Daten verlangen.</li>
<li><strong>Recht auf Löschung</strong> (Art. 17 DSGVO): Sie können die Löschung Ihrer personenbezogenen Daten verlangen, sofern keine gesetzliche Aufbewahrungspflicht besteht.</li>
<li><strong>Recht auf Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO): Sie können die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten verlangen.</li>
<li><strong>Recht auf Datenübertragbarkeit</strong> (Art. 20 DSGVO): Sie können verlangen, dass wir Ihnen Ihre personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format übergeben.</li>
<li><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO): Sie können der Verarbeitung Ihrer personenbezogenen Daten widersprechen, soweit diese auf Art. 6 Abs. 1 lit. f DSGVO beruht.</li>
<li><strong>Recht auf Widerruf einer Einwilligung</strong> (Art. 7 Abs. 3 DSGVO): Sie können eine erteilte Einwilligung jederzeit widerrufen, ohne dass die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung berührt wird.</li>
</ul>

<h2>14. Beschwerderecht bei der Aufsichtsbehörde</h2>
<p>Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren. In Hessen ist dies:</p>
<p>
Der Hessische Datenschutzbeauftragte<br />
Theodor-Heuss-Allee 9<br />
65175 Wiesbaden<br />
Telefon: +49 (0)611 1408-0<br />
E-Mail: poststelle@datenschutz.hessen.de<br />
Website: <a href="https://datenschutz.hessen.de" target="_blank" rel="noopener noreferrer">datenschutz.hessen.de</a>
</p>

<h2>15. Änderungen dieser Datenschutzerklärung</h2>
<p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte rechtliche Anforderungen oder Änderungen unseres Angebots anzupassen. Für Ihren erneuten Besuch gilt dann die jeweils aktuelle Datenschutzerklärung.</p>

<p><em>Stand: Juni 2026</em></p>`,
    },
  },
  images: [],
};

/** Format a date string (YYYY-MM-DD) to German date format. */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
