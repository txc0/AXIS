// The ONLY place prices are calculated. The browser never decides what something costs.
export function createPricer(db) {
  const product = db.prepare(
    "SELECT slug, name, price, image FROM products WHERE slug = ? AND active = 1 AND category <> 'custom'"
  );
  const option = db.prepare('SELECT key, name, price FROM builder_options WHERE grp = ? AND key = ? AND active = 1');

  function priceLine(item) {
    if (item.kind === 'product') {
      const p = product.get(item.slug);
      return p && { kind: 'product', slug: p.slug, name: p.name, price: p.price, image: p.image };
    }
    const { vessel, land, plants, accents } = item.config;
    const v = option.get('vessel', vessel);
    const l = option.get('land', land);
    const ps = [...new Set(plants)].map(k => option.get('plant', k));
    const as = [...new Set(accents)].map(k => option.get('accent', k));
    if (!v || !l || ps.some(x => !x) || as.some(x => !x)) return null;
    return {
      kind: 'custom',
      config: { vessel, land, plants: ps.map(o => o.key), accents: as.map(o => o.key) },
      name: `Custom ${v.name} terrarium`,
      price: [v, l, ...ps, ...as].reduce((sum, o) => sum + o.price, 0),
      image: 'cu',
    };
  }

  function quote(items) {
    const lines = items.map((item, index) => {
      const line = priceLine(item);
      return line ? { index, valid: true, ...line } : { index, valid: false };
    });
    return { lines, total: lines.reduce((sum, l) => sum + (l.price || 0), 0) };
  }

  return { quote };
}