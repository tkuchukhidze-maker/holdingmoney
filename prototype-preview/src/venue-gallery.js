// Airbnb-inspired discovery principle: an accessible, image-first photo tour.
// All currently available photos are archived illustrative references;
// never describe them as verified photographs of the actual room/dish/venue.
const PHOTO_SETS = Object.freeze({
  Batumi: ['/photos/batumi.webp', '/photos/holding-interiors.webp', '/photos/editorial.webp'],
  Kutaisi: ['/photos/kutaisi.webp', '/photos/holding-interiors.webp', '/photos/editorial.webp'],
  Tbilisi: ['/photos/holding-interiors.webp', '/photos/editorial.webp'],
  Magnolia: ['/photos/magnolia.webp', '/photos/editorial.webp', '/photos/holding-interiors.webp'],
  ChateauMere: ['/photos/editorial.webp', '/photos/holding-interiors.webp'],
});

export function photosForVenue(screen) {
  return Object.prototype.hasOwnProperty.call(PHOTO_SETS, screen) ? PHOTO_SETS[screen] : [];
}

export function createGalleryTrigger(screen, doc = document) {
  const photos = photosForVenue(screen);
  if (!photos.length) return null;
  const trigger = doc.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ec-gallery-trigger';
  trigger.textContent = '▣ ფოტოები';
  trigger.setAttribute('aria-label', 'საილუსტრაციო ფოტოების დათვალიერება');
  trigger.addEventListener('click', () => openVenueGallery(screen, doc));
  return trigger;
}

export function openVenueGallery(screen, doc = document) {
  const photos = photosForVenue(screen);
  if (!photos.length) return null;
  const dialog = doc.createElement('dialog');
  dialog.className = 'ec-gallery-dialog';
  dialog.setAttribute('aria-label', 'საილუსტრაციო ფოტოების გალერეა');
  const shell = doc.createElement('div');
  shell.className = 'ec-gallery-shell';
  const top = doc.createElement('div');
  top.className = 'ec-gallery-top';
  const title = doc.createElement('strong');
  title.textContent = 'ფოტოების დათვალიერება';
  const close = doc.createElement('button');
  close.type = 'button';
  close.textContent = '✕ დახურვა';
  close.setAttribute('aria-label', 'გალერეის დახურვა');
  close.addEventListener('click', () => dialog.close());
  top.append(title, close);
  const note = doc.createElement('p');
  note.textContent = 'საილუსტრაციო ფოტოები — რეალური ობიექტის საბოლოო ფოტოგალერეა მოგვიანებით დაემატება.';
  const figure = doc.createElement('figure');
  const main = doc.createElement('img');
  main.className = 'ec-gallery-main';
  main.alt = 'საილუსტრაციო ფოტო';
  const caption = doc.createElement('figcaption');
  figure.append(main, caption);
  const controls = doc.createElement('div');
  controls.className = 'ec-gallery-controls';
  const previous = doc.createElement('button');
  previous.type = 'button';
  previous.textContent = '← წინა';
  const next = doc.createElement('button');
  next.type = 'button';
  next.textContent = 'შემდეგი →';
  controls.append(previous, next);
  const thumbs = doc.createElement('div');
  thumbs.className = 'ec-gallery-thumbs';
  let active = 0;
  const buttons = [];
  const show = (i) => {
    active = (i + photos.length) % photos.length;
    main.src = photos[active];
    main.alt = 'საილუსტრაციო ფოტო ' + (active + 1) + ' / ' + photos.length;
    caption.textContent = (active + 1) + ' / ' + photos.length + ' · საილუსტრაციო ვიზუალი';
    buttons.forEach((btn, n) => btn.setAttribute('aria-pressed', String(n === active)));
  };
  photos.forEach((src, i) => {
    const button = doc.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'ფოტო ' + (i + 1));
    const img = doc.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    button.appendChild(img);
    button.addEventListener('click', () => show(i));
    buttons.push(button);
    thumbs.appendChild(button);
  });
  previous.addEventListener('click', () => show(active - 1));
  next.addEventListener('click', () => show(active + 1));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(active - 1);
    if (event.key === 'ArrowRight') show(active + 1);
  });
  shell.append(top, note, figure, controls, thumbs);
  dialog.appendChild(shell);
  doc.body.appendChild(dialog);
  show(0);
  dialog.showModal();
  return dialog;
}
