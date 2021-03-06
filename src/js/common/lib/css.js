/* @flow */

import _forEach from 'lodash/forEach'

const sheet: Object = genStyleEl().sheet

function genStyleEl(): Object {
  const styleEl: Object = document.createElement('style')

  document.head.appendChild(styleEl)

  return styleEl
}

export const set = (styleList: Object): void => {
  _forEach(styleList, (props: Object, styleSelector: string): void => {
    let styleValue: string = ''

    _forEach(props, (propValue: number | string, propName: string) => {
      styleValue += `${propName}:${propValue};`
    })

    sheet.insertRule(
      styleSelector + '{' + styleValue + '}',
      sheet.cssRules.length
    )
  })
}

export const unsetAll = (): void => {
  while (sheet.cssRules[0]) {
    sheet.deleteRule(0)
  }
}
