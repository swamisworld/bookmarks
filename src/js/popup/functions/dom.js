import {
  getItemHeight,
  getItemOffsetHeight
} from '.'
import * as css from '../../common/lib/css'

import bookmarkItemStyles from '../../../css/popup/bookmark-item.css'
import bookmarkTreeStyles from '../../../css/popup/bookmark-tree.css'
import editorStyles from '../../../css/popup/editor.css'
import panelStyles from '../../../css/popup/panel.css'

export function getBookmarkListEls() {
  const getBookmarkListElsFromPanel = (...args) => {
    const selector = args
      .map(getClassSelector)
      .join(' > ')
    const els = document.querySelectorAll(selector)
    return Array.from(els)
  }

  const bookmarkListElsInMaster = getBookmarkListElsFromPanel(
    panelStyles.master,
    bookmarkTreeStyles.main,
    bookmarkTreeStyles.list
  )
  const bookmarkListElsInSlave = getBookmarkListElsFromPanel(
    panelStyles.slave,
    bookmarkTreeStyles.main,
    bookmarkTreeStyles.list
  )

  // it should NEVER happen
  if (
    bookmarkListElsInMaster.length < bookmarkListElsInSlave.length ||
    bookmarkListElsInMaster.length - bookmarkListElsInSlave.length > 1
  ) {
    throw new Error()
  }

  const bookmarkListEls = []
  const totalLength = bookmarkListElsInMaster.length + bookmarkListElsInSlave.length
  for (let i = 0; i < totalLength; i += 1) {
    const el = i % 2 === 0 ?
      bookmarkListElsInMaster.shift() :
      bookmarkListElsInSlave.shift()
    bookmarkListEls.push(el)
  }

  return bookmarkListEls
}

function getClassSelector(className) {
  // remove class name from compose
  className = className.split(' ')[0]

  return `.${className}`
}

export function resetBodySize() {
  const bodyStyle = document.body.style

  // reset to original size
  bodyStyle.height = ''
  bodyStyle.width = ''
}

export function scrollIntoViewIfNeeded(el) {
  const {
    bottom,
    top
  } = el.getBoundingClientRect()

  const {
    height: parentHeight,
    top: parentTop
  } = el.parentNode.getBoundingClientRect()

  const isScrolledOutOfBottomView = bottom > parentTop + parentHeight
  const isScrolledOutOfTopView = top < parentTop

  if (isScrolledOutOfBottomView || isScrolledOutOfTopView) {
    el.scrollIntoView(isScrolledOutOfTopView)
  }
}

export function setPredefinedStyleSheet(options) {
  const {
    fontFamily,
    fontSize,
    setWidth
  } = options

  const itemHeight = getItemHeight(options)
  const itemOffsetHeight = getItemOffsetHeight(options)
  const panelWidthSelector = [
    editorStyles.main,
    panelStyles.master,
    panelStyles.slave
  ]
    .map(getClassSelector)
    .join(',')

  css.set({
    body: {
      'font-family': fontFamily,
      'font-size': `${fontSize}px`
    },
    [getClassSelector(bookmarkItemStyles.icon)]: {
      // set the width same as item height, as it is a square
      width: `${itemHeight}px`
    },
    [getClassSelector(bookmarkItemStyles.main)]: {
      height: `${itemHeight}px`
    },
    [getClassSelector(bookmarkItemStyles.separator)]: {
      // set separator height depend on item height
      height: `${itemOffsetHeight / 2}px`
    },
    [panelWidthSelector]: {
      width: `${setWidth}px`
    }
  })
}
