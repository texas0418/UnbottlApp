/**
 * Plain-language definitions for the terms a venue's own menu already uses.
 *
 * Every entry here is written for the moment someone is holding a list and does
 * not recognise a word on it. That is the whole design constraint, and it rules
 * out a few things:
 *
 *   - No tasting-note poetry. "Notes of forest floor" helps nobody decide.
 *   - Answer the question actually being asked, which is almost always "will I
 *     like this?" — so lead with what it tastes like, not where it is grown.
 *   - Two sentences. Someone is reading this with a waiter standing there.
 *   - No house style about "the noble grape of Bordeaux". It reads as showing
 *     off, and showing off is what makes wine lists intimidating in the first
 *     place.
 *
 * The text is written for Unbottl rather than taken from a reference work.
 * Encyclopaedia entries carry licensing that follows the app — Wikipedia's
 * share-alike especially — and none of it is written for a person mid-decision.
 *
 * `terms` are matched case-insensitively against whole words, so "Rolle" does
 * not fire inside "Rolled". Aliases exist because menus disagree with each
 * other: Shiraz and Syrah are the same grape, Rolle is Vermentino.
 */

export type GlossaryCategory = 'grape' | 'spirit' | 'style' | 'character';

export interface GlossaryEntry {
  /** Canonical display name. */
  term: string;
  /** Everything that should resolve to this entry, including `term`. */
  aliases: string[];
  category: GlossaryCategory;
  /** Two sentences, tops. Tastes-like first. */
  definition: string;
}

export const glossary: GlossaryEntry[] = [
  // ── Grapes on the list ────────────────────────────────────────────────────
  {
    term: 'Cabernet Sauvignon',
    aliases: ['cabernet sauvignon', 'cabernet', 'cab sauv'],
    category: 'grape',
    definition:
      'A firm, dark red that tastes of blackcurrant and often a little cedar or pencil shaving from the barrel. It has real grip, which is why it is the classic partner for red meat.',
  },
  {
    term: 'Merlot',
    aliases: ['merlot'],
    category: 'grape',
    definition:
      'Softer and rounder than Cabernet, with plum and dark cherry rather than blackcurrant. A good choice if you want red wine without the grip.',
  },
  {
    term: 'Cabernet Franc',
    aliases: ['cabernet franc', 'cab franc'],
    category: 'grape',
    definition:
      'A lighter red with a leafy, peppery edge alongside the red fruit. Usually blended in small amounts to add lift to Cabernet Sauvignon and Merlot.',
  },
  {
    term: 'Pinot Noir',
    aliases: ['pinot noir', 'pinot'],
    category: 'grape',
    definition:
      'The lightest of the well-known reds — red cherry and raspberry, silky rather than grippy. Works with fish and chicken in a way most reds do not.',
  },
  {
    term: 'Shiraz',
    aliases: ['shiraz', 'syrah'],
    category: 'grape',
    definition:
      'A big, dark red with blackberry, black pepper and often something smoky. Shiraz and Syrah are the same grape; Australia says Shiraz, France says Syrah.',
  },
  {
    term: 'Grenache',
    aliases: ['grenache', 'garnacha'],
    category: 'grape',
    definition:
      'Ripe strawberry and raspberry, warm and generous, with soft tannins. It is the backbone of most southern French rosé.',
  },
  {
    term: 'Cinsault',
    aliases: ['cinsault', 'cinsaut'],
    category: 'grape',
    definition:
      'A pale, light grape used mainly to soften a blend and keep it refreshing. In rosé it is what makes the wine delicate rather than heavy.',
  },
  {
    term: 'Rolle',
    aliases: ['rolle', 'vermentino'],
    category: 'grape',
    definition:
      'A crisp white grape with citrus and a faint saline finish, common in Provence. You may see it called Vermentino — same grape, Italian name.',
  },
  {
    term: 'Sauvignon Blanc',
    aliases: ['sauvignon blanc', 'sauv blanc'],
    category: 'grape',
    definition:
      'Sharp and aromatic — grapefruit, passion fruit, fresh-cut grass. Very dry and high in acidity, which makes it good with goat cheese and shellfish.',
  },
  {
    term: 'Chardonnay',
    aliases: ['chardonnay'],
    category: 'grape',
    definition:
      'The white that varies most by winemaking: unoaked it is lean and citrusy, oaked it turns buttery and full. Worth asking a server which style this one is.',
  },

  // ── Spirits and cocktail ingredients on the list ──────────────────────────
  {
    term: 'Mezcal',
    aliases: ['mezcal', 'mescal'],
    category: 'spirit',
    definition:
      "Tequila's smoky cousin, made from agave roasted in earth pits before distilling. If you like a smoky whisky, you will probably like this.",
  },
  {
    term: 'Gin',
    aliases: ['gin'],
    category: 'spirit',
    definition:
      'A clear spirit flavoured with juniper, which is where the pine-like note comes from. Beyond that, distillers vary the botanicals wildly — some are citrus-forward, some floral.',
  },
  {
    term: 'Vodka',
    aliases: ['vodka'],
    category: 'spirit',
    definition:
      'Distilled to be as neutral as possible, so it carries whatever it is mixed with rather than adding flavour. Differences between brands are mostly texture.',
  },
  {
    term: 'Bourbon',
    aliases: ['bourbon'],
    category: 'spirit',
    definition:
      'American whiskey made mostly from corn and aged in new charred oak, which gives it vanilla and caramel. Sweeter and rounder than Scotch.',
  },
  {
    term: 'Prosecco',
    aliases: ['prosecco'],
    category: 'spirit',
    definition:
      'Italian sparkling wine, made in a way that keeps it fresh and fruity — pear and green apple. Lighter and less bready than Champagne, and far cheaper.',
  },

  // ── Styles ────────────────────────────────────────────────────────────────
  {
    term: 'IPA',
    aliases: ['ipa', 'india pale ale'],
    category: 'style',
    definition:
      'A hop-forward beer, bitter and often citrusy or piney. The bitterness is the point; if that is not for you, ask for a lager or a wheat beer.',
  },
  {
    term: 'Stout',
    aliases: ['stout'],
    category: 'style',
    definition:
      'Dark beer made with roasted malt, so it tastes of coffee and chocolate. Usually smoother and less heavy than it looks.',
  },
  {
    term: 'Pilsner',
    aliases: ['pilsner', 'pils'],
    category: 'style',
    definition:
      'A pale, crisp lager with a clean bitter finish. The most refreshing thing on most beer lists.',
  },
  {
    term: 'Wheat beer',
    aliases: ['wheat beer', 'hefeweizen', 'witbier'],
    category: 'style',
    definition:
      'Cloudy and soft, brewed with wheat as well as barley, often tasting faintly of banana and clove. Barely bitter at all.',
  },
  {
    term: 'Rosé',
    aliases: ['rose', 'rosé'],
    category: 'style',
    definition:
      'Made from red grapes with the skins left in only briefly, which is where the colour goes. Most dry rosé tastes of strawberry and citrus, and is served properly cold.',
  },

  // ── Character words that appear in tasting notes ──────────────────────────
  {
    term: 'Tannins',
    aliases: ['tannin', 'tannins', 'tannic'],
    category: 'character',
    definition:
      'The drying, grippy feeling on your gums from red wine, coming from grape skins and oak. High tannin is why a big red suits fatty meat — the fat softens the grip.',
  },
  {
    term: 'Body',
    aliases: ['body', 'full-bodied', 'light-bodied'],
    category: 'character',
    definition:
      'How heavy the wine feels in your mouth, not how strong it tastes. Light-bodied is closer to water, full-bodied closer to cream.',
  },
  {
    term: 'Dry',
    aliases: ['dry', 'off-dry'],
    category: 'character',
    definition:
      'Dry means not sweet — no sugar left after fermentation. It is often confused with tannin, which is the drying sensation rather than the absence of sugar.',
  },
  {
    term: 'Acidity',
    aliases: ['acidity', 'acidic', 'crisp'],
    category: 'character',
    definition:
      'The tartness that makes your mouth water, like a squeeze of lemon. High acidity is what makes a wine feel refreshing and helps it cut through rich food.',
  },
];
