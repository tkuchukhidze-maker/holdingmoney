/** Shared browser behavior for asynchronously mounted public pages. */
export function installPageExperience(doc = document, win = window) {
  const root = doc.getElementById('root');
  if (!root) return;
  let pendingHash = win.location.hash;
  const navigateToHash = () => {
    if (!pendingHash) return;
    let id;
    try { id = decodeURIComponent(pendingHash.slice(1)); } catch { pendingHash = ''; return; }
    const target = doc.getElementById(id);
    if (!target) return;
    pendingHash = '';
    target.scrollIntoView({ block: 'start' });
  };
  // Browser anchor navigation runs before the asynchronously loaded screen
  // exists. Retry only until that target mounts; never jump on later edits.
  const observer = new MutationObserver(() => {
    if (!root.querySelector('.episode-loading')) root.removeAttribute('aria-busy');
    navigateToHash();
  });
  observer.observe(root, { childList: true, subtree: true });
  win.addEventListener('hashchange', () => { pendingHash = win.location.hash; navigateToHash(); });
  // Prototype forms have no submission endpoint. Enter must not reload the
  // page, erase the draft or append contact information to the URL.
  root.addEventListener('submit', event => event.preventDefault());
  return () => observer.disconnect();
}

export function renderUnavailableAccount(screen, doc = document) {
  const root = doc.getElementById('root');
  const main = doc.createElement('main');
  main.className = 'episode-message';
  const title = doc.createElement('h1');
  title.textContent = screen === 'Admin' ? 'მართვის პანელი მიუწვდომელია' : 'My Episode';
  const message = doc.createElement('p');
  message.textContent = screen === 'Admin'
    ? 'მართვის პანელი ამ საინფორმაციო ვერსიაში არ არის გააქტიურებული.'
    : 'ანგარიშის შექმნა და შესვლა ჯერ არ არის გააქტიურებული. ამ ეტაპზე შეგიძლიათ დაათვალიეროთ ობიექტები და შეადგინოთ მენიუს მონახაზი.';
  const links = doc.createElement('div');
  for (const [href, text] of [['/restaurants', 'რესტორნების ნახვა'], ['/hotels', 'სასტუმროების ნახვა']]) {
    const link = doc.createElement('a'); link.href = href; link.textContent = text; links.append(link);
  }
  main.append(title, message, links);
  root.replaceChildren(main);
  root.removeAttribute('aria-busy');
  doc.title = title.textContent + ' · Episode Holding';
}

export function renderPageError(root, message = 'გვერდის ჩატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.') {
  const doc = root.ownerDocument;
  const main = doc.createElement('main'); main.className = 'episode-message';
  const title = doc.createElement('h1'); title.textContent = message;
  const retry = doc.createElement('button'); retry.type = 'button'; retry.textContent = 'ხელახლა ცდა';
  retry.addEventListener('click', () => doc.defaultView.location.reload());
  const home = doc.createElement('a'); home.href = '/'; home.textContent = 'მთავარზე დაბრუნება';
  main.append(title, retry, home); root.replaceChildren(main); root.removeAttribute('aria-busy');
}
