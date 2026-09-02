export const UI_STYLES = [
  {
    id: 'soft',
    name: 'Suave',
    desc: 'Cantos arredondados, sombras leves e o visual padrão do Voxel Studio.'
  },
  {
    id: 'aggressive',
    name: 'Agressivo',
    desc: 'Cantos duros, botões táteis e aquele visual mais mecânico.'
  },
  {
    id: 'liquid',
    name: 'Liquid Glass',
    desc: 'Painéis translúcidos, blur e reflexos — como vidro líquido.'
  }
];

const STYLE_CLASSES = ['ui-style-soft', 'ui-style-aggressive', 'ui-style-liquid'];

export function getSavedUiStyle(user) {
  const fromUser = user?.uiStyle;
  const fromStore = localStorage.getItem('pulsecord_ui_style');
  const candidate = fromUser || fromStore;
  if (candidate === 'aggressive' || candidate === 'soft' || candidate === 'liquid') {
    return candidate;
  }
  if (localStorage.getItem('pulsecord_rounded_buttons') === 'false') return 'aggressive';
  return 'soft';
}

export function applyUiStyle(style) {
  const next = UI_STYLES.some((s) => s.id === style) ? style : 'soft';
  const targets = [document.documentElement, document.body];

  targets.forEach((el) => {
    STYLE_CLASSES.forEach((cls) => el.classList.remove(cls));
    el.classList.remove('rounded-mode');
    el.classList.add(`ui-style-${next}`);
    if (next !== 'aggressive') el.classList.add('rounded-mode');
  });

  localStorage.setItem('pulsecord_ui_style', next);
  localStorage.setItem('pulsecord_rounded_buttons', next !== 'aggressive' ? 'true' : 'false');
  return next;
}
