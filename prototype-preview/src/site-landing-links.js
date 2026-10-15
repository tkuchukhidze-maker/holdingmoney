// Adjust routing at runtime without modifying any approved .dc.html source.
// The source includes #houses for both Restaurants and Hotels; these must
// lead to separate venue choice pages before opening a specific property.
const HEADER_ENTRIES = [
  ['Restaurants', '/restaurants'],
  ['Hotels', '/hotels'],
];

const VENUE_FOOTER_LINKS = [
  ['Tbilisis Sakhlshi', '/restaurants/tbilisi'],
  ['Batumis Sakhlshi', '/restaurants/batumi'],
  ['Kutaisis Sakhlshi', '/restaurants/kutaisi'],
  ['Hotel Magnolia', '/hotels/magnolia'],
  ['Chateau Mere', '/hotels/chateau-mere'],
];

export function prepareSiteNavigation(screen, source) {
  // Embedded registration cards must not manufacture a signed-in identity.
  source = source.replace(/<button type="button" onClick="{{register}}"([^>]*)>რეგისტრაცია<\/button>/g,
    '<a href="/register"$1>რეგისტრაცია</a>');
  if (['Batumi', 'Kutaisi', 'Tbilisi'].includes(screen)) {
    source = source.replace(/href="#booking"/g, 'href="/restaurants/' + screen.toLowerCase() + '/book"');
    return source.replace(/href="#menu"/g, 'href="/restaurants/' + screen.toLowerCase() + '/menu"')
      .replace(/href="#register"/g, 'href="/register"');
  }
  if (['Magnolia', 'ChateauMere'].includes(screen)) {
    const slug = screen === 'Magnolia' ? 'magnolia' : 'chateau-mere';
    return source.replace(/href="#register"/g, 'href="/register"').replace(/href="#booking"/g, 'href="/hotels/' + slug + '/book"').replace(/status: '(ხელმისაწვდომია|ცოტა დარჩა)'/g, "status: 'დასადასტურებელია'");
  }
  if (screen !== 'Main') return source;
  let result = source;
  for (const [text, href] of HEADER_ENTRIES) {
    const old = `<a href="#houses" style="text-decoration: none; padding: 10px 0">${text}</a>`;
    if (!result.includes(old)) throw new Error('Approved Main navigation changed: ' + text);
    result = result.replace(old, old.replace('href="#houses"', `href="${href}"`));
  }

  // The two large hero category cards use the same old #houses anchor.
  // Keep their approved visual markup exactly, changing only the destination.
  let categoryCards = 0;
  result = result.replace(/<a href="#houses"(?=[^>]*min-height: 540px;)/g, () => {
    categoryCards += 1;
    return `<a href="${categoryCards === 1 ? '/restaurants' : '/hotels'}"`;
  });
  if (categoryCards !== 2) throw new Error('Expected Restaurants and Hotels hero cards');

  for (const [text, href] of VENUE_FOOTER_LINKS) {
    const old = `<a href="#houses" style="text-decoration: none">${text}</a>`;
    if (result.includes(old)) result = result.replace(old, old.replace('href="#houses"', `href="${href}"`));
  }

  // Do not keep call-to-action buttons that do nothing. These navigate to
  // venue selection; no real booking is claimed or recorded in this preview.
  result = result.replace(
    /<button type="button"([^>]+)>Find a table<\/button>/,
    '<a href="/restaurants"$1>Find a table</a>',
  );
  result = result.replace(
    /<button type="button"([^>]+)>Check availability<\/button>/,
    '<a href="/hotels"$1>Check availability</a>',
  );
  return result;
}
