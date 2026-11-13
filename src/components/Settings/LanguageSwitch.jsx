import { LANGS, setLang, useLang, useT } from '../../i18n/index.js';

/** EN / VI switch, used on the title screen and in Settings. */
export default function LanguageSwitch({ className = '', full = false }) {
  const lang = useLang();
  const t = useT();
  return (
    <div className={`lang ${className}`} role="group" aria-label={t('Language')}>
      {LANGS.map(([id, short, name]) => (
        <button key={id} className={lang === id ? 'is-on' : ''} aria-pressed={lang === id} lang={id} title={name} onClick={() => setLang(id)}>{full ? name.toUpperCase() : short}</button>
      ))}
    </div>
  );
}
