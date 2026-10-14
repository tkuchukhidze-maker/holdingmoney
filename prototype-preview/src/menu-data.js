// Curated transcription of the owner's "Batumis_Sakhli_Food_Menu_Corrected.pdf",
// "Batumis_Sakhli_Bar_Menu(2).pdf" and "Batumis_Sakhli_Wine_Menu.pdf".
// Currency GEL, and source PDFs state service charge is included.
// The other two branches have no verified menu files: NEVER copy Batumi's
// dishes/prices to those branches. This static catalog must be reviewed for
// publication/price changes before accepting live payments or requests.
function section(id, title, rows, group = 'food') {
  return {
    id, title, group,
    items: rows.trim().split('\n').map((line, i) => {
      const at = line.lastIndexOf('|');
      if (at < 1) throw new Error('Invalid menu row in ' + id + ': ' + line);
      const name = line.slice(0, at).trim();
      const price = Number(line.slice(at + 1).trim());
      if (!name || !Number.isFinite(price) || price <= 0) throw new Error('Invalid menu price: ' + line);
      return { id: id + '-' + (i + 1), name, price };
    }),
  };
}
const BATUMI_SECTIONS = [
  section('appetizers', 'აპეტაიზერი', `
ქართული ყველის დაფა|35
ხრაშუნა სულგუნის ჩხირები|24
ნადუღი პიტნით|15
ეკალა|30
სეზონური ფხალის ნაირსახეობა|30
მწნილის ნაირსახეობა|15
ლავაშის ჩიფსები|7
ქათმის ბატი-ბუტი|20
იმერული ყველი|17
სულგუნი|24
შებოლილი სულგუნი|26
`),
  section('cold', 'ცივი კერძები', `
კიტრი პომიდვრის სალათი გლეხურად|15
კიტრი პომიდვრის სალათი კახური ზეთით|17
კიტრი პომიდვრის სალათი ნიგვზით და ჯონჯოლით|20
გებჟალიის სალათი|30
ღორის კუჭმაჭი ტყემლით|25
მწყემსური სალათი|30
ლობიოს სალათი|20
`),
  section('main', 'მთავარი კერძები', `
რაჭული გობი|125
იმერული გობი|110
ამოლესილი ლობიო, მჟავის სალათით და კეცის მჭადით|16
ვარია წითელ ტყემალში|45
იმერული კუპატი ბროწეულის სოუსით|35
ხბოს ჩაშუშული საფერავში გამომცხვარი პიურეთი|35
ხბოს ოჯახური|28
ღორის ოჯახური|26
საქონლის სუკის ოსტრი პიურეთი|40
აფხაზურა, მეგრული აჯიკის პიურეთი და წითელი ღვინის სოუსით|38
წიწილა შქმერულად|45
შემწვარი გულ-ღვიძლი|22
შემწვარი კალმახი|24
ტაფის აჯაფსანდალი|18
კარტოფილი სახლურად|15
გამომცხვარი საქონლის ნეკნები გრილზე|65
ხბოს ნეკნები|65
ტაფაზე შებრაწული წიწილა კენკრაში გამომცხვარი მსხლით|65
ხაშლამა ნიახურის პიურეთი და გამომცხვარი ნიორით|65
`),
  section('soups', 'წვნიანები', `
ხინკლუკას წვნიანი შებოლილი სულგუნით|23
ხინკლის წვნიანი ტყლაპით|15
ჩიხირთმა სოფლის დედლით|18
სუპ-ხარჩო|28
სოკოს წვნიანი|15
ხაში|10
`),
  section('bakery', 'ჩვენთან გამომცხვარი', `
კეცის ხაჭაპური|25
ტაფის ხაჭაპური|22
ჭახრაკინა|22
ჭვიშტარი პიტნით|10
მჭადი კეცზე|5
ლობიანი|16
ლობიანი ლორითა და ჯონჯოლით|22
სახლური პიცა|32
სახლური პური|5
`),
  section('grill', 'მაყალი', `
ღორის მწვადი|27
ხბოს მწვადი|40
ქათმის მწვადი|20
შერეული ქაბაბი საწებელში|26
ქაბაბი ბებოს ლავაშში|26
`),
  section('khinkali', 'ხინკალი', `
ქალაქური|2.40
მთიულური|2.40
ყველის ხინკალი|4.00
სოკოს ხინკალი|2.10
კარტოფილის ხინკალი|1.80
`),
  section('snacks', 'სახლური ხემსი', `
კუპატის ხვეულა|17
ქაბაბის ხვეულა|17
ქათმის სტეიკის ხვეულა|16
ქათმის სტეიკის ბოქსი|16
კუბდარი ბაგეტში|17
`),
  section('sauces', 'სოუსები', `
ტყემალი|5
საწებელი|5
ბაჟე|10
`),
  section('desserts', 'დესერტები', `
მთის თაფლიანი ნამცხვარი|10
სახლური დესერტი|10
`),
  section('soft-drinks', 'უალკოჰოლო სასმელები', `
წყალი|3
წვენი|6
ტონიკი|6
მინერალური წყალი|4
ლიმონათი|6
სახლური ლიმონათი|20
`, 'bar'),
  section('coffee-tea', 'ყავა და ჩაი', `
ჩაი (შავი, მწვანე, ხილის)|7
ესპრესო|6
ამერიკანო|7
კაპუჩინო|8
ლატე|10
ცივი ყავა|12
ცივი ყავა ნაყინით|14
ცივი ჩაი (არომატებით)|12
`, 'bar'),
  section('spirits', 'ალკოჰოლური სასმელები', `
Stolichnaya 1 L|140
Stolichnaya 0.5 L|70
Absolut 1 L|150
Absolut 0.5 L|75
Olmeca|200
Captain Morgan Dark|210
Bacardi White|200
Gordon’s|200
Jameson|240
`, 'bar'),
  section('beer', 'ლუდი', `
შავი ლომი|10
ბავარია|8
პაულანერი|12
`, 'bar'),
  section('mixed', 'მიქს სასმელები', `
არაყი / რედ ბული|15
არაყი / წვენი|12
იაგერი / ენერგეტიკული|15
იაგერი / წვენი|13
კუბა ლიბრე|18
მოჰიტო|20
ტეკილა სანრაიზი|20
ჯინ ტონიკი|22
ბლუ ლაგუნა|25
ლონგ აილენდ ენერჯი|30
ლონგ აილენდ აის თი|27
ვისკი კოლა|21
`, 'bar'),
  section('classic-cocktails', 'კლასიკური კოქტეილები', `
ნეგრონი|25
ბულვარდიე|27
ოლდ ფეშენი|27
ვისკი საუერი|30
`, 'bar'),
  section('signature-cocktails', 'საავტორო კოქტეილები', `
სოფია|30
ტედი|30
მარაკუია|30
ვაშლის ფერია|30
კიტრის და ბაზილიკის სმეში|30
ტყემლიანი|30
`, 'bar'),
  section('white-wine', 'თეთრი ღვინო', `
თელიანი ველი — ხიხვი|55
თელიანი ველი — ცოლიკაური|55
ფრენდს ვაინი — წინანდალი|55
ფრენდს ვაინი — ქისი|55
კახური ევროპული თეთრი|35
ვინივერია — ქისი|60
ვინივერია — ცოლიკაური|55
ჩელტი — კრახუნა|60
ჩელტი — წინანდალი|70
ქართული მზე — რქაწითელი|60
თელიანი ველი — წინანდალი|55
ევროპული კახური თეთრი|35
`, 'wine'),
  section('qvevri-white', 'ქვევრის თეთრი ღვინო', `
ჩელტი — ქისი ქვევრი|65
გლეხური — ქისი ქვევრი|60
გლეხური — რქაწითელი ქვევრი|60
`, 'wine'),
  section('red-wine', 'წითელი ღვინო', `
თელიანი ველი — საფერავი|50
ვინივერია — საფერავი|55
ორგო — Cuvée|65
კახური საფერავი|35
`, 'wine'),
  section('semi-sweet-red', 'ნახევრად ტკბილი წითელი ღვინო', `
ფრენდს ვაინი — ქინძმარაული|65
ფრენდს ვაინი — ხვანჭკარა|65
ქართული მზე — ქინძმარაული|55
სამეფო ხვანჭკარა — ხვანჭკარა|90
`, 'wine'),
  section('semi-sweet-white', 'ნახევრად ტკბილი თეთრი ღვინო', `
სამეფო ღვინო — ტვიში|90
თელიანი ველი — ტვიში|60
`, 'wine'),
  section('rose', 'როზე', `თელიანი ველი — საფერავი როზე|50`, 'wine'),
  section('sparkling', 'ცქრიალა ღვინო', `
პროსეკო|80
თელიანი ველი ცქრიალა ღვინო|50
`, 'wine'),
];

export const RESTAURANT_MENUS = Object.freeze({
  batumi: {
    venueKey: 'restaurant:batumi',
    name: 'ბათუმის სახლში',
    city: 'ბათუმი',
    currency: 'GEL',
    serviceIncluded: true,
    source: 'Owner-provided food, bar and wine PDF menus',
    verifiedCurrent: false,
    sections: BATUMI_SECTIONS,
  },
  kutaisi: {
    venueKey: 'restaurant:kutaisi',
    name: 'ქუთაისის სახლში',
    city: 'ქუთაისი',
    currency: 'GEL',
    serviceIncluded: null,
    source: null,
    verifiedCurrent: false,
    sections: [],
  },
  tbilisi: {
    venueKey: 'restaurant:tbilisi',
    name: 'თბილისის სახლში',
    city: 'თბილისი',
    currency: 'GEL',
    serviceIncluded: null,
    source: null,
    verifiedCurrent: false,
    sections: [],
  },
});

export function menuFor(slug) {
  return Object.prototype.hasOwnProperty.call(RESTAURANT_MENUS, slug) ? RESTAURANT_MENUS[slug] : null;
}
export function menuItem(menu, id) {
  for (const section of menu?.sections || []) {
    const item = section.items.find((item) => item.id === id);
    if (item) return item;
  }
  return null;
}
