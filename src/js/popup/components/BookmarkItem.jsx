import {autobind, debounce} from 'core-decorators'
import {connect} from 'react-redux'
import {createElement, PropTypes, PureComponent} from 'react'
import classNames from 'classnames'
import CSSModules from 'react-css-modules'

import {
  getBookmark,
  getBookmarkType,
  getClickType,
  getFlatTree,
  isFolder,
  isFolderOpened,
  openBookmark,
  openMultipleBookmarks,
  scrollIntoViewIfNeeded
} from '../functions'
import {
  putDragIndicator,
  removeDragIndicator,
  replaceTreeInfoByIndex,
  removeTreeInfosFromIndex,
  updateDragTarget,
  updateFocusTarget,
  updateMenuTarget,
  updateMousePosition
} from '../actions'
import {
  ROOT_ID,
  TYPE_BOOKMARK,
  TYPE_FOLDER,
  TYPE_ROOT_FOLDER,
  TYPE_SEPARATOR
} from '../constants'
import chromep from '../../common/lib/chromePromise'

import styles from '../../../css/popup/bookmark-item.css'

class BookmarkItem extends PureComponent {
  componentDidMount() {
    this.afterRender()
  }

  componentDidUpdate() {
    const {
      shouldKeepInView
    } = this.props

    this.afterRender()

    if (shouldKeepInView) {
      scrollIntoViewIfNeeded(this.baseEl)
    }
  }

  async getTooltip() {
    const {
      isSearching,
      itemInfo,
      options
    } = this.props

    const tooltipArr = []

    if (options.tooltip) {
      tooltipArr.push(itemInfo.title, itemInfo.url)
    }

    if (isSearching) {
      const breadcrumbArr = []

      let breadId = itemInfo.parentId
      while (breadId !== ROOT_ID) {
        const thisItemInfo = await getBookmark(breadId)

        breadcrumbArr.unshift(thisItemInfo.title)
        breadId = thisItemInfo.parentId
      }

      tooltipArr.unshift(
        `[${breadcrumbArr.join(' > ')}]`
      )
    }

    return tooltipArr.join('\n')
  }

  afterRender() {
    window.requestAnimationFrame(async () => {
      const {itemInfo} = this.props

      const bookmarkType = getBookmarkType(itemInfo)

      if (bookmarkType === TYPE_BOOKMARK) {
        const {baseEl} = this
        const tooltip = await this.getTooltip()

        if (baseEl && tooltip) {
          baseEl.title = tooltip
        }
      }
    })
  }

  @autobind
  async handleClick(evt) {
    evt.persist()
    evt.preventDefault()

    const {
      dispatch,
      itemInfo,
      options,
      treeIndex,
      trees
    } = this.props

    const bookmarkType = getBookmarkType(itemInfo)

    switch (bookmarkType) {
      case TYPE_ROOT_FOLDER:
      case TYPE_FOLDER:
        if (evt.button === 0) {
          if (options.opFolderBy) {
            if (!isFolderOpened(trees, itemInfo)) {
              dispatch(await this.openFolder())
            } else {
              dispatch(removeTreeInfosFromIndex(treeIndex + 1))
            }
          }
        } else {
          await openMultipleBookmarks(itemInfo, {
            isNewWindow: false,
            isWarnWhenOpenMany: options.warnOpenMany
          })
        }
        break

      case TYPE_SEPARATOR:
      case TYPE_BOOKMARK: {
        const clickType = getClickType(evt)
        await openBookmark(itemInfo, clickType, options)
        break
      }

      default:
    }
  }

  @autobind
  handleContextMenu(evt) {
    // disable native context menu
    evt.preventDefault()

    const {
      dispatch,
      itemInfo
    } = this.props

    dispatch([
      updateMousePosition({
        x: evt.clientX,
        y: evt.clientY
      }),
      updateMenuTarget(itemInfo)
    ])
  }

  @autobind
  async handleDragEnd() {
    const {
      dispatch,
      dragIndicator,
      dragTarget
    } = this.props

    if (dragIndicator) {
      await chromep.bookmarks.move(dragTarget.id, {
        parentId: dragIndicator.parentId,
        index: dragIndicator.index
      })
    }

    dispatch([
      removeDragIndicator(),
      updateDragTarget(null)
    ])
  }

  @autobind
  handleDragEnter(evt) {
    evt.persist()

    this._handleDragEnter(evt)
  }

  @debounce(50)
  async _handleDragEnter(evt) {
    const {
      dispatch,
      dragTarget,
      itemInfo,
      itemOffsetHeight,
      treeIndex
    } = this.props

    const actionList = []
    const isDragTarget = dragTarget.id === itemInfo.id
    const isPlaceAfter = evt.offsetY > itemOffsetHeight / 2

    const shouldRemoveDragIndicator = (() => {
      const isSiblingOfDragTarget = (
        dragTarget.parentId === itemInfo.parentId &&
        Math.abs(dragTarget.index - itemInfo.index) === 1
      )

      if (isSiblingOfDragTarget) {
        const isDragTargetAfterItemInfo = dragTarget.index - itemInfo.index > 0

        if (isPlaceAfter) {
          return isDragTargetAfterItemInfo
        } else {
          return !isDragTargetAfterItemInfo
        }
      }

      return (
        isDragTarget ||
        getBookmarkType(itemInfo) === TYPE_ROOT_FOLDER
      )
    })()

    // item cannot be the parent folder of itself
    if (!isDragTarget && isFolder(itemInfo)) {
      actionList.push(await this.openFolder())
    } else {
      actionList.push(removeTreeInfosFromIndex(treeIndex + 1))
    }

    if (shouldRemoveDragIndicator) {
      actionList.push(removeDragIndicator())
    } else {
      actionList.push(putDragIndicator(itemInfo, isPlaceAfter))
    }

    dispatch(actionList)
  }

  @autobind
  handleDragStart() {
    const {
      dispatch,
      itemInfo,
      treeIndex
    } = this.props

    dispatch([
      removeTreeInfosFromIndex(treeIndex + 1),
      updateDragTarget(itemInfo)
    ])
  }

  @autobind
  handleMouse(evt) {
    const {
      dispatch,
      focusTarget,
      itemInfo
    } = this.props

    evt.persist()

    switch (evt.type) {
      case 'mouseenter':
        if (focusTarget !== itemInfo) {
          dispatch(updateFocusTarget(itemInfo))
        }
        break

      case 'mouseleave':
        if (focusTarget === itemInfo) {
          dispatch(updateFocusTarget(null))
        }
        break

      default:
    }

    this._handleMouse(evt)
  }

  @debounce(200)
  async _handleMouse(evt) {
    const {
      dispatch,
      itemInfo,
      options,
      isSearching,
      treeIndex,
      trees
    } = this.props

    switch (evt.type) {
      case 'mouseenter':
        if (!isSearching && !options.opFolderBy) {
          if (isFolder(itemInfo)) {
            if (!isFolderOpened(trees, itemInfo)) {
              dispatch(await this.openFolder())
            }
          } else {
            dispatch(removeTreeInfosFromIndex(treeIndex + 1))
          }
        }
        break

      default:
    }
  }

  async openFolder() {
    const {
      itemInfo,
      treeIndex
    } = this.props

    const nextTreeIndex = treeIndex + 1
    const treeInfo = await getFlatTree(itemInfo.id)

    return replaceTreeInfoByIndex(nextTreeIndex, treeInfo)
  }

  render() {
    const {
      isSearching,
      isSelected,
      isUnclickable,
      itemInfo
    } = this.props

    const bookmarkType = getBookmarkType(itemInfo)
    const itemTitle = itemInfo.title || itemInfo.url || null
    const thisStyleName = classNames(
      'main',
      {
        'root-folder': bookmarkType === TYPE_ROOT_FOLDER,
        selected: isSelected,
        separator: bookmarkType === TYPE_SEPARATOR,
        unclickable: isUnclickable
      }
    )

    let iconSrc = null
    switch (bookmarkType) {
      case TYPE_ROOT_FOLDER:
      case TYPE_FOLDER:
        iconSrc = '/img/folder.png'
        break

      case TYPE_BOOKMARK:
        iconSrc = `chrome://favicon/${itemInfo.url}`
        break

      default:
    }

    let isDraggable = false
    switch (bookmarkType) {
      case TYPE_FOLDER:
      case TYPE_BOOKMARK:
        if (!isSearching) {
          isDraggable = true
        }
        break

      default:
    }

    return (
      <li
        ref={(ref) => {
          this.baseEl = ref
        }}
        id={itemInfo.id}
        draggable={isDraggable}
        onDragEnd={this.handleDragEnd}
        onDragEnter={this.handleDragEnter}
        onDragStart={this.handleDragStart}
      >
        <a
          styleName={thisStyleName}
          href={itemInfo.url || ''}
          draggable={false}
          tabIndex='-1'
          onClick={this.handleClick}
          onContextMenu={this.handleContextMenu}
          onMouseEnter={this.handleMouse}
          onMouseLeave={this.handleMouse}
        >
          <img
            styleName='icon'
            src={iconSrc}
            alt=''
            hidden={iconSrc === null}
          />
          <span styleName='title'>{itemTitle}</span>
        </a>
      </li>
    )
  }
}

BookmarkItem.propTypes = {
  dispatch: PropTypes.func.isRequired,
  dragIndicator: PropTypes.object,
  dragTarget: PropTypes.object,
  focusTarget: PropTypes.object,
  isSearching: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isUnclickable: PropTypes.bool.isRequired,
  itemInfo: PropTypes.object.isRequired,
  itemOffsetHeight: PropTypes.number.isRequired,
  options: PropTypes.object.isRequired,
  shouldKeepInView: PropTypes.bool.isRequired,
  treeIndex: PropTypes.number.isRequired,
  trees: PropTypes.arrayOf(PropTypes.object).isRequired
}

const mapStateToProps = (state, ownProps) => {
  const {
    cutTarget,
    dragTarget,
    focusTarget,
    menuTarget
  } = state
  const {itemInfo} = ownProps

  const isCutTarget = Boolean(cutTarget && cutTarget.id === itemInfo.id)
  const isDragTarget = Boolean(dragTarget && dragTarget.id === itemInfo.id)
  const isFocusTarget = Boolean(focusTarget && focusTarget.id === itemInfo.id)
  const isMenuTarget = Boolean(menuTarget && menuTarget.id === itemInfo.id)

  return {
    dragIndicator: state.dragIndicator,
    dragTarget: dragTarget,
    focusTarget: focusTarget,
    isSearching: Boolean(state.searchKeyword),
    isSelected: isDragTarget || isFocusTarget || isMenuTarget,
    isUnclickable: isCutTarget || isDragTarget,
    itemOffsetHeight: state.itemOffsetHeight,
    options: state.options,
    shouldKeepInView: isFocusTarget || isMenuTarget,
    trees: state.trees
  }
}

export default connect(mapStateToProps)(
  CSSModules(BookmarkItem, styles, {allowMultiple: true})
)
