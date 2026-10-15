import type { CSSProperties } from 'react'

/**
 * Calligraphy honorifics from Islamic Phrase Icons
 * https://github.com/owaisalhashimi/Islamic-Phrase-Icons
 * (KFGQPC Arabic Symbols glyphs)
 */
export type PhraseIconType =
  | 'awj' // عز وجل
  | 'sta' // سبحانه وتعالى
  | 'tta' // تبارك وتعالى
  | 'saw' // صلى الله عليه وسلم
  | 'ahis' // عليه السلام
  | 'ahims' // عليهم السلام
  | 'rdhu' // رضي الله عنه
  | 'rdhuma'
  | 'rdhum'
  | 'rdha'
  | 'rdhuna'
  | 'rhmhu' // رحمه الله

const SPRITE = '/islamic-phrase-icons/sprite.min.svg'

const WIDTHS: Partial<Record<PhraseIconType, string>> = {
  awj: '2em',
  sta: '4em',
  tta: '3em',
  saw: '4em',
  ahis: '3em',
  ahims: '3em',
  rdhu: '3em',
  rdhuma: '3em',
  rdhum: '3em',
  rdha: '3em',
  rdhuna: '3em',
  rhmhu: '3em',
}

export function PhraseIcon({
  type,
  className = '',
  color,
  title,
}: {
  type: PhraseIconType
  className?: string
  color?: string
  title?: string
}) {
  const style: CSSProperties = {
    width: WIDTHS[type] || '1em',
    height: '1em',
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'middle',
    transform: type === 'awj' || type === 'rhmhu' ? 'translateY(20%)' : 'translateY(25%)',
    ['--ip-color' as string]: color || 'currentColor',
  }

  return (
    <i
      className={`ip ${type} ${className}`.trim()}
      data-ip={type}
      style={style}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      <svg
        style={{ height: '1em', width: '100%', fill: 'var(--ip-color, currentColor)' }}
        aria-hidden
      >
        <use href={`${SPRITE}#${type}`} xlinkHref={`${SPRITE}#${type}`} />
      </svg>
    </i>
  )
}

/** Convenience: محمد ﷺ */
export function ProphetName({
  name = 'محمد',
  className = '',
}: {
  name?: string
  className?: string
}) {
  return (
    <span className={className} style={{ whiteSpace: 'nowrap' }}>
      {name} <PhraseIcon type="saw" title="صلى الله عليه وسلم" />
    </span>
  )
}
