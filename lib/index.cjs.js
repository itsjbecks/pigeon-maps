'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex
}

var React = require('react')
var React__default = _interopDefault(React)

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  } else {
    obj[key] = value
  }

  return obj
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object)

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object)
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable
      })
    keys.push.apply(keys, symbols)
  }

  return keys
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {}

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key])
      })
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key))
      })
    }
  }

  return target
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype)
  subClass.prototype.constructor = subClass
  subClass.__proto__ = superClass
}

function debounce(func, wait) {
  var timeout
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key]
    }

    var context = this
    clearTimeout(timeout)
    timeout = setTimeout(function () {
      return func.apply(context, args)
    }, wait)
  }
}
function parentHasClass(element, className) {
  while (element) {
    if (element.classList && element.classList.contains(className)) {
      return true
    }

    element = element.parentElement
  }

  return false
}
function parentPosition(element) {
  var rect = element.getBoundingClientRect()
  return {
    x: rect.left,
    y: rect.top,
  }
}

function osm(x, y, z) {
  var s = String.fromCharCode(97 + ((x + y + z) % 3))
  return 'https://' + s + '.tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png'
}

var ANIMATION_TIME = 300
var DIAGONAL_THROW_TIME = 1500
var SCROLL_PIXELS_FOR_ZOOM_LEVEL = 150
var MIN_DRAG_FOR_THROW = 40
var CLICK_TOLERANCE = 2
var DOUBLE_CLICK_DELAY = 300
var DEBOUNCE_DELAY = 60
var PINCH_RELEASE_THROW_DELAY = 300
var WARNING_DISPLAY_TIMEOUT = 300

var NOOP = function NOOP() {
  return true
}

var lng2tile = function lng2tile(lon, zoom) {
  return ((lon + 180) / 360) * Math.pow(2, zoom)
}

var lat2tile = function lat2tile(lat, zoom) {
  return (
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  )
}

function tile2lng(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180
}

function tile2lat(y, z) {
  var n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z)
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

function getMousePixel(dom, event) {
  var parent = parentPosition(dom)
  return [event.clientX - parent.x, event.clientY - parent.y]
}

function easeOutQuad(t) {
  return t * (2 - t)
}

var absoluteMinMax = [tile2lat(Math.pow(2, 10), 10), tile2lat(0, 10), tile2lng(0, 10), tile2lng(Math.pow(2, 10), 10)]
var hasWindow = typeof window !== 'undefined'
var performanceNow =
  hasWindow && window.performance && window.performance.now
    ? function () {
        return window.performance.now()
      }
    : (function () {
        var timeStart = new Date().getTime()
        return function () {
          return new Date().getTime() - timeStart
        }
      })()

var requestAnimationFrame = function requestAnimationFrame(callback) {
  if (hasWindow) {
    return (window.requestAnimationFrame || window.setTimeout)(callback)
  } else {
    callback(new Date().getTime())
    return null
  }
}

var cancelAnimationFrame = function cancelAnimationFrame(animFrame) {
  return hasWindow && animFrame ? (window.cancelAnimationFrame || window.clearTimeout)(animFrame) : false
}

function srcSet(dprs, url, x, y, z) {
  if (!dprs || dprs.length === 0) {
    return ''
  }

  return dprs
    .map(function (dpr) {
      return url(x, y, z, dpr) + (dpr === 1 ? '' : ' ' + dpr + 'x')
    })
    .join(', ')
}

var Map = /*#__PURE__*/ (function (_Component) {
  _inheritsLoose(Map, _Component)

  function Map(props) {
    var _ref, _props$defaultZoom, _ref2, _props$defaultCenter, _ref3, _props$width, _ref4, _props$height

    var _this

    _this = _Component.call(this, props) || this
    _this._dragStart = null
    _this._mouseDown = false
    _this._moveEvents = []
    _this._lastClick = null
    _this._lastTap = null
    _this._lastWheel = null
    _this._touchStartPixel = null
    _this._touchStartMidPoint = null
    _this._touchStartDistance = null
    _this._secondTouchEnd = null
    _this._warningClearTimeout = null
    _this._isAnimating = false
    _this._animationStart = null
    _this._animationEnd = null
    _this._zoomStart = null
    _this._centerTarget = null
    _this._zoomTarget = null
    _this._zoomAround = null
    _this._animFrame = null
    _this._boundsSynced = false
    _this._minMaxCache = null
    _this._resizeObserver = null

    _this.updateWidthHeight = function () {
      if (_this._containerRef) {
        var rect = _this._containerRef.getBoundingClientRect()

        if (rect && rect.width > 0 && rect.height > 0) {
          _this.setState({
            width: rect.width,
            height: rect.height,
          })

          return true
        }
      }

      return false
    }

    _this.wa = function () {
      var _window

      return (_window = window).addEventListener.apply(_window, arguments)
    }

    _this.wr = function () {
      var _window2

      return (_window2 = window).removeEventListener.apply(_window2, arguments)
    }

    _this.bindMouseEvents = function () {
      _this.wa('mousedown', _this.handleMouseDown)

      _this.wa('mouseup', _this.handleMouseUp)

      _this.wa('mousemove', _this.handleMouseMove)
    }

    _this.bindTouchEvents = function () {
      _this.wa('touchstart', _this.handleTouchStart, {
        passive: false,
      })

      _this.wa('touchmove', _this.handleTouchMove, {
        passive: false,
      })

      _this.wa('touchend', _this.handleTouchEnd, {
        passive: false,
      })
    }

    _this.unbindMouseEvents = function () {
      _this.wr('mousedown', _this.handleMouseDown)

      _this.wr('mouseup', _this.handleMouseUp)

      _this.wr('mousemove', _this.handleMouseMove)
    }

    _this.unbindTouchEvents = function () {
      _this.wr('touchstart', _this.handleTouchStart)

      _this.wr('touchmove', _this.handleTouchMove)

      _this.wr('touchend', _this.handleTouchEnd)
    }

    _this.bindResizeEvent = function () {
      _this.wa('resize', _this.updateWidthHeight)
    }

    _this.unbindResizeEvent = function () {
      _this.wr('resize', _this.updateWidthHeight)
    }

    _this.bindWheelEvent = function () {
      if (_this._containerRef) {
        _this._containerRef.addEventListener('wheel', _this.handleWheel, {
          passive: false,
        })
      }
    }

    _this.unbindWheelEvent = function () {
      if (_this._containerRef) {
        _this._containerRef.removeEventListener('wheel', _this.handleWheel)
      }
    }

    _this.setCenterZoomTarget = function (center, zoom, fromProps, zoomAround, animationDuration) {
      if (fromProps === void 0) {
        fromProps = false
      }

      if (zoomAround === void 0) {
        zoomAround = null
      }

      if (animationDuration === void 0) {
        animationDuration = ANIMATION_TIME
      }

      if (
        _this.props.animate &&
        (!fromProps ||
          _this.distanceInScreens(center, zoom, _this.state.center, _this.state.zoom) <= _this.props.animateMaxScreens)
      ) {
        if (_this._isAnimating) {
          cancelAnimationFrame(_this._animFrame)

          var _this$animationStep = _this.animationStep(performanceNow()),
            centerStep = _this$animationStep.centerStep,
            zoomStep = _this$animationStep.zoomStep

          _this._centerStart = centerStep
          _this._zoomStart = zoomStep
        } else {
          _this._isAnimating = true
          _this._centerStart = _this.limitCenterAtZoom([_this._lastCenter[0], _this._lastCenter[1]], _this._lastZoom)
          _this._zoomStart = _this._lastZoom

          _this.onAnimationStart()
        }

        _this._animationStart = performanceNow()
        _this._animationEnd = _this._animationStart + animationDuration

        if (zoomAround) {
          _this._zoomAround = zoomAround
          _this._centerTarget = _this.calculateZoomCenter(_this._lastCenter, zoomAround, _this._lastZoom, zoom)
        } else {
          _this._zoomAround = null
          _this._centerTarget = center
        }

        _this._zoomTarget = zoom
        _this._animFrame = requestAnimationFrame(_this.animate)
      } else {
        _this.stopAnimating()

        if (zoomAround) {
          var _center = _this.calculateZoomCenter(_this._lastCenter, zoomAround, _this._lastZoom, zoom)

          _this.setCenterZoom(_center, zoom, fromProps)
        } else {
          _this.setCenterZoom(center || _this.state.center, zoom, fromProps)
        }
      }
    }

    _this.setCenterZoomForChildren = function (center, zoom) {
      _this.setCenterZoomTarget(center || _this.state.center, zoom || _this.state.zoom, true)
    }

    _this.distanceInScreens = function (centerTarget, zoomTarget, center, zoom) {
      var _this$state = _this.state,
        width = _this$state.width,
        height = _this$state.height

      var l1 = _this.latLngToPixel(center, center, zoom)

      var l2 = _this.latLngToPixel(centerTarget, center, zoom)

      var z1 = _this.latLngToPixel(center, center, zoomTarget)

      var z2 = _this.latLngToPixel(centerTarget, center, zoomTarget)

      var w = (Math.abs(l1[0] - l2[0]) + Math.abs(z1[0] - z2[0])) / 2 / width
      var h = (Math.abs(l1[1] - l2[1]) + Math.abs(z1[1] - z2[1])) / 2 / height
      return Math.sqrt(w * w + h * h)
    }

    _this.animationStep = function (timestamp) {
      if (
        !_this._animationEnd ||
        !_this._animationStart ||
        !_this._zoomTarget ||
        !_this._zoomStart ||
        !_this._centerStart ||
        !_this._centerTarget
      ) {
        return {
          centerStep: _this.state.center,
          zoomStep: _this.state.zoom,
        }
      }

      var length = _this._animationEnd - _this._animationStart
      var progress = Math.max(timestamp - _this._animationStart, 0)
      var percentage = easeOutQuad(progress / length)
      var zoomDiff = (_this._zoomTarget - _this._zoomStart) * percentage
      var zoomStep = _this._zoomStart + zoomDiff

      if (_this._zoomAround) {
        var centerStep = _this.calculateZoomCenter(_this._centerStart, _this._zoomAround, _this._zoomStart, zoomStep)

        return {
          centerStep: centerStep,
          zoomStep: zoomStep,
        }
      } else {
        var _centerStep = [
          _this._centerStart[0] + (_this._centerTarget[0] - _this._centerStart[0]) * percentage,
          _this._centerStart[1] + (_this._centerTarget[1] - _this._centerStart[1]) * percentage,
        ]
        return {
          centerStep: _centerStep,
          zoomStep: zoomStep,
        }
      }
    }

    _this.animate = function (timestamp) {
      if (!_this._animationEnd || timestamp >= _this._animationEnd) {
        _this._isAnimating = false

        _this.setCenterZoom(_this._centerTarget, _this._zoomTarget, true)

        _this.onAnimationStop()
      } else {
        var _this$animationStep2 = _this.animationStep(timestamp),
          centerStep = _this$animationStep2.centerStep,
          zoomStep = _this$animationStep2.zoomStep

        _this.setCenterZoom(centerStep, zoomStep)

        _this._animFrame = requestAnimationFrame(_this.animate)
      }
    }

    _this.stopAnimating = function () {
      if (_this._isAnimating) {
        _this._isAnimating = false

        _this.onAnimationStop()

        cancelAnimationFrame(_this._animFrame)
      }
    }

    _this.limitCenterAtZoom = function (center, zoom) {
      var minMax = _this.getBoundsMinMax(zoom || _this.state.zoom)

      return [
        Math.max(Math.min(!center || isNaN(center[0]) ? _this.state.center[0] : center[0], minMax[1]), minMax[0]),
        Math.max(Math.min(!center || isNaN(center[1]) ? _this.state.center[1] : center[1], minMax[3]), minMax[2]),
      ]
    }

    _this.onAnimationStart = function () {
      _this.props.onAnimationStart && _this.props.onAnimationStart()
    }

    _this.onAnimationStop = function () {
      _this.props.onAnimationStop && _this.props.onAnimationStop()
    }

    _this.setCenterZoom = function (center, zoom, animationEnded) {
      if (animationEnded === void 0) {
        animationEnded = false
      }

      var limitedCenter = _this.limitCenterAtZoom(center, zoom)

      if (zoom && Math.round(_this.state.zoom) !== Math.round(zoom)) {
        var tileValues = _this.tileValues(_this.state)

        var nextValues = _this.tileValues({
          center: limitedCenter,
          zoom: zoom,
          width: _this.state.width,
          height: _this.state.height,
        })

        var oldTiles = _this.state.oldTiles

        _this.setState(
          {
            oldTiles: oldTiles
              .filter(function (o) {
                return o.roundedZoom !== tileValues.roundedZoom
              })
              .concat(tileValues),
          },
          NOOP
        )

        var loadTracker = {}

        for (var x = nextValues.tileMinX; x <= nextValues.tileMaxX; x++) {
          for (var y = nextValues.tileMinY; y <= nextValues.tileMaxY; y++) {
            var key = x + '-' + y + '-' + nextValues.roundedZoom
            loadTracker[key] = false
          }
        }

        _this._loadTracker = loadTracker
      }

      _this.setState(
        {
          center: limitedCenter,
          zoom: zoom || _this.state.zoom,
        },
        NOOP
      )

      var maybeZoom = _this.props.zoom ? _this.props.zoom : _this._lastZoom
      var maybeCenter = _this.props.center ? _this.props.center : _this._lastCenter

      if (
        zoom &&
        (animationEnded ||
          Math.abs(maybeZoom - zoom) > 0.001 ||
          Math.abs(maybeCenter[0] - limitedCenter[0]) > 0.00001 ||
          Math.abs(maybeCenter[1] - limitedCenter[1]) > 0.00001)
      ) {
        _this._lastZoom = zoom
        _this._lastCenter = [].concat(limitedCenter)

        _this.syncToProps(limitedCenter, zoom)
      }
    }

    _this.getBoundsMinMax = function (zoom) {
      if (_this.props.limitBounds === 'center') {
        return absoluteMinMax
      }

      var _this$state2 = _this.state,
        width = _this$state2.width,
        height = _this$state2.height

      if (
        _this._minMaxCache &&
        _this._minMaxCache[0] === zoom &&
        _this._minMaxCache[1] === width &&
        _this._minMaxCache[2] === height
      ) {
        return _this._minMaxCache[3]
      }

      var pixelsAtZoom = Math.pow(2, zoom) * 256
      var minLng = width > pixelsAtZoom ? 0 : tile2lng(width / 512, zoom)
      var minLat = height > pixelsAtZoom ? 0 : tile2lat(Math.pow(2, zoom) - height / 512, zoom)
      var maxLng = width > pixelsAtZoom ? 0 : tile2lng(Math.pow(2, zoom) - width / 512, zoom)
      var maxLat = height > pixelsAtZoom ? 0 : tile2lat(height / 512, zoom)
      var minMax = [minLat, maxLat, minLng, maxLng]
      _this._minMaxCache = [zoom, width, height, minMax]
      return minMax
    }

    _this.imageLoaded = function (key) {
      if (_this._loadTracker && key in _this._loadTracker) {
        _this._loadTracker[key] = true
        var unloadedCount = Object.values(_this._loadTracker).filter(function (v) {
          return !v
        }).length

        if (unloadedCount === 0) {
          _this.setState(
            {
              oldTiles: [],
            },
            NOOP
          )
        }
      }
    }

    _this.handleTouchStart = function (event) {
      if (!_this._containerRef) {
        return
      }

      if (event.target && parentHasClass(event.target, 'pigeon-drag-block')) {
        return
      }

      if (event.touches.length === 1) {
        var touch = event.touches[0]
        var pixel = getMousePixel(_this._containerRef, touch)

        if (_this.coordsInside(pixel)) {
          _this._touchStartPixel = [pixel]

          if (!_this.props.twoFingerDrag) {
            _this.stopAnimating()

            if (_this._lastTap && performanceNow() - _this._lastTap < DOUBLE_CLICK_DELAY) {
              event.preventDefault()

              var latLngNow = _this.pixelToLatLng(_this._touchStartPixel[0])

              _this.setCenterZoomTarget(
                null,
                Math.max(_this.props.minZoom, Math.min(_this.state.zoom + 1, _this.props.maxZoom)),
                false,
                latLngNow
              )
            } else {
              _this._lastTap = performanceNow()

              _this.trackMoveEvents(pixel)
            }
          }
        }
      } else if (event.touches.length === 2 && _this._touchStartPixel) {
        event.preventDefault()

        _this.stopTrackingMoveEvents()

        if (_this.state.pixelDelta || _this.state.zoomDelta) {
          _this.sendDeltaChange()
        }

        var t1 = getMousePixel(_this._containerRef, event.touches[0])
        var t2 = getMousePixel(_this._containerRef, event.touches[1])
        _this._touchStartPixel = [t1, t2]
        _this._touchStartMidPoint = [(t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2]
        _this._touchStartDistance = Math.sqrt(Math.pow(t1[0] - t2[0], 2) + Math.pow(t1[1] - t2[1], 2))
      }
    }

    _this.handleTouchMove = function (event) {
      if (!_this._containerRef) {
        _this._touchStartPixel = null
        return
      }

      if (event.touches.length === 1 && _this._touchStartPixel) {
        var touch = event.touches[0]
        var pixel = getMousePixel(_this._containerRef, touch)

        if (_this.props.twoFingerDrag) {
          if (_this.coordsInside(pixel)) {
            _this.showWarning('fingers')
          }
        } else {
          event.preventDefault()

          _this.trackMoveEvents(pixel)

          _this.setState(
            {
              pixelDelta: [pixel[0] - _this._touchStartPixel[0][0], pixel[1] - _this._touchStartPixel[0][1]],
            },
            NOOP
          )
        }
      } else if (
        event.touches.length === 2 &&
        _this._touchStartPixel &&
        _this._touchStartMidPoint &&
        _this._touchStartDistance
      ) {
        var _this$state3 = _this.state,
          width = _this$state3.width,
          height = _this$state3.height,
          zoom = _this$state3.zoom
        event.preventDefault()
        var t1 = getMousePixel(_this._containerRef, event.touches[0])
        var t2 = getMousePixel(_this._containerRef, event.touches[1])
        var midPoint = [(t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2]
        var midPointDiff = [midPoint[0] - _this._touchStartMidPoint[0], midPoint[1] - _this._touchStartMidPoint[1]]
        var distance = Math.sqrt(Math.pow(t1[0] - t2[0], 2) + Math.pow(t1[1] - t2[1], 2))
        var zoomDelta =
          Math.max(
            _this.props.minZoom,
            Math.min(_this.props.maxZoom, zoom + Math.log2(distance / _this._touchStartDistance))
          ) - zoom
        var scale = Math.pow(2, zoomDelta)
        var centerDiffDiff = [(width / 2 - midPoint[0]) * (scale - 1), (height / 2 - midPoint[1]) * (scale - 1)]

        _this.setState(
          {
            zoomDelta: zoomDelta,
            pixelDelta: [centerDiffDiff[0] + midPointDiff[0] * scale, centerDiffDiff[1] + midPointDiff[1] * scale],
          },
          NOOP
        )
      }
    }

    _this.handleTouchEnd = function (event) {
      if (!_this._containerRef) {
        _this._touchStartPixel = null
        return
      }

      if (_this._touchStartPixel) {
        var _this$props = _this.props,
          zoomSnap = _this$props.zoomSnap,
          twoFingerDrag = _this$props.twoFingerDrag,
          minZoom = _this$props.minZoom,
          maxZoom = _this$props.maxZoom
        var zoomDelta = _this.state.zoomDelta

        var _this$sendDeltaChange = _this.sendDeltaChange(),
          center = _this$sendDeltaChange.center,
          zoom = _this$sendDeltaChange.zoom

        if (event.touches.length === 0) {
          if (twoFingerDrag) {
            _this.clearWarning()
          } else {
            var oldTouchPixel = _this._touchStartPixel[0]
            var newTouchPixel = getMousePixel(_this._containerRef, event.changedTouches[0])

            if (
              Math.abs(oldTouchPixel[0] - newTouchPixel[0]) > CLICK_TOLERANCE ||
              Math.abs(oldTouchPixel[1] - newTouchPixel[1]) > CLICK_TOLERANCE
            ) {
              if (!_this._secondTouchEnd || performanceNow() - _this._secondTouchEnd > PINCH_RELEASE_THROW_DELAY) {
                event.preventDefault()

                _this.throwAfterMoving(newTouchPixel, center, zoom)
              }
            }

            _this._touchStartPixel = null
            _this._secondTouchEnd = null
          }
        } else if (event.touches.length === 1) {
          event.preventDefault()
          var touch = getMousePixel(_this._containerRef, event.touches[0])
          _this._secondTouchEnd = performanceNow()
          _this._touchStartPixel = [touch]

          _this.trackMoveEvents(touch)

          if (zoomSnap) {
            var latLng = _this._touchStartMidPoint ? _this.pixelToLatLng(_this._touchStartMidPoint) : _this.state.center
            var zoomTarget

            if (twoFingerDrag && Math.round(_this.state.zoom) === Math.round(_this.state.zoom + zoomDelta)) {
              zoomTarget = Math.round(_this.state.zoom)
            } else {
              zoomTarget = zoomDelta > 0 ? Math.ceil(_this.state.zoom) : Math.floor(_this.state.zoom)
            }

            var _zoom = Math.max(minZoom, Math.min(zoomTarget, maxZoom))

            _this.setCenterZoomTarget(latLng, _zoom, false, latLng)
          }
        }
      }
    }

    _this.handleMouseDown = function (event) {
      if (!_this._containerRef) {
        return
      }

      var pixel = getMousePixel(_this._containerRef, event)

      if (
        event.button === 0 &&
        (!event.target || !parentHasClass(event.target, 'pigeon-drag-block')) &&
        _this.coordsInside(pixel)
      ) {
        _this.stopAnimating()

        event.preventDefault()

        if (_this._lastClick && performanceNow() - _this._lastClick < DOUBLE_CLICK_DELAY) {
          if (!parentHasClass(event.target, 'pigeon-click-block')) {
            var latLngNow = _this.pixelToLatLng(_this._mousePosition || pixel)

            _this.setCenterZoomTarget(
              null,
              Math.max(_this.props.minZoom, Math.min(_this.state.zoom + 1, _this.props.maxZoom)),
              false,
              latLngNow
            )
          }
        } else {
          _this._lastClick = performanceNow()
          _this._mouseDown = true
          _this._dragStart = pixel

          _this.trackMoveEvents(pixel)
        }
      }
    }

    _this.handleMouseMove = function (event) {
      if (!_this._containerRef) {
        return
      }

      _this._mousePosition = getMousePixel(_this._containerRef, event)

      if (_this._mouseDown && _this._dragStart) {
        _this.trackMoveEvents(_this._mousePosition)

        _this.setState(
          {
            pixelDelta: [_this._mousePosition[0] - _this._dragStart[0], _this._mousePosition[1] - _this._dragStart[1]],
          },
          NOOP
        )
      }
    }

    _this.handleMouseUp = function (event) {
      if (!_this._containerRef) {
        _this._mouseDown = false
        return
      }

      var pixelDelta = _this.state.pixelDelta

      if (_this._mouseDown) {
        _this._mouseDown = false
        var pixel = getMousePixel(_this._containerRef, event)

        if (
          _this.props.onClick &&
          (!event.target || !parentHasClass(event.target, 'pigeon-click-block')) &&
          (!pixelDelta || Math.abs(pixelDelta[0]) + Math.abs(pixelDelta[1]) <= CLICK_TOLERANCE)
        ) {
          var latLng = _this.pixelToLatLng(pixel)

          _this.props.onClick({
            event: event,
            latLng: latLng,
            pixel: pixel,
          })

          _this.setState(
            {
              pixelDelta: undefined,
            },
            NOOP
          )
        } else {
          var _this$sendDeltaChange2 = _this.sendDeltaChange(),
            center = _this$sendDeltaChange2.center,
            zoom = _this$sendDeltaChange2.zoom

          _this.throwAfterMoving(pixel, center, zoom)
        }
      }
    }

    _this.stopTrackingMoveEvents = function () {
      _this._moveEvents = []
    }

    _this.trackMoveEvents = function (coords) {
      var timestamp = performanceNow()

      if (
        _this._moveEvents.length === 0 ||
        timestamp - _this._moveEvents[_this._moveEvents.length - 1].timestamp > 40
      ) {
        _this._moveEvents.push({
          timestamp: timestamp,
          coords: coords,
        })

        if (_this._moveEvents.length > 2) {
          _this._moveEvents.shift()
        }
      }
    }

    _this.throwAfterMoving = function (coords, center, zoom) {
      var _this$state4 = _this.state,
        width = _this$state4.width,
        height = _this$state4.height
      var animate = _this.props.animate
      var timestamp = performanceNow()

      var lastEvent = _this._moveEvents.shift()

      if (lastEvent && animate) {
        var deltaMs = Math.max(timestamp - lastEvent.timestamp, 1)
        var delta = [
          ((coords[0] - lastEvent.coords[0]) / deltaMs) * 120,
          ((coords[1] - lastEvent.coords[1]) / deltaMs) * 120,
        ]
        var distance = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1])

        if (distance > MIN_DRAG_FOR_THROW) {
          var diagonal = Math.sqrt(width * width + height * height)
          var throwTime = (DIAGONAL_THROW_TIME * distance) / diagonal
          var lng = tile2lng(lng2tile(center[1], zoom) - delta[0] / 256.0, zoom)
          var lat = tile2lat(lat2tile(center[0], zoom) - delta[1] / 256.0, zoom)

          _this.setCenterZoomTarget([lat, lng], zoom, false, null, throwTime)
        }
      }

      _this.stopTrackingMoveEvents()
    }

    _this.sendDeltaChange = function () {
      var _this$state5 = _this.state,
        center = _this$state5.center,
        zoom = _this$state5.zoom,
        pixelDelta = _this$state5.pixelDelta,
        zoomDelta = _this$state5.zoomDelta
      var lat = center[0]
      var lng = center[1]

      if (pixelDelta || zoomDelta !== 0) {
        lng = tile2lng(
          lng2tile(center[1], zoom + zoomDelta) - (pixelDelta ? pixelDelta[0] / 256.0 : 0),
          zoom + zoomDelta
        )
        lat = tile2lat(
          lat2tile(center[0], zoom + zoomDelta) - (pixelDelta ? pixelDelta[1] / 256.0 : 0),
          zoom + zoomDelta
        )

        _this.setCenterZoom([lat, lng], zoom + zoomDelta)
      }

      _this.setState(
        {
          pixelDelta: undefined,
          zoomDelta: 0,
        },
        NOOP
      )

      return {
        center: _this.limitCenterAtZoom([lat, lng], zoom + zoomDelta),
        zoom: zoom + zoomDelta,
      }
    }

    _this.getBounds = function (center, zoom) {
      if (center === void 0) {
        center = _this.state.center
      }

      if (zoom === void 0) {
        zoom = _this.zoomPlusDelta()
      }

      var _this$state6 = _this.state,
        width = _this$state6.width,
        height = _this$state6.height
      return {
        ne: _this.pixelToLatLng([width - 1, 0], center, zoom),
        sw: _this.pixelToLatLng([0, height - 1], center, zoom),
      }
    }

    _this.syncToProps = function (center, zoom) {
      if (center === void 0) {
        center = _this.state.center
      }

      if (zoom === void 0) {
        zoom = _this.state.zoom
      }

      var onBoundsChanged = _this.props.onBoundsChanged

      if (onBoundsChanged) {
        var bounds = _this.getBounds(center, zoom)

        onBoundsChanged({
          center: center,
          zoom: zoom,
          bounds: bounds,
          initial: !_this._boundsSynced,
        })
        _this._boundsSynced = true
      }
    }

    _this.handleWheel = function (event) {
      var _this$props2 = _this.props,
        mouseEvents = _this$props2.mouseEvents,
        metaWheelZoom = _this$props2.metaWheelZoom,
        zoomSnap = _this$props2.zoomSnap,
        animate = _this$props2.animate

      if (!mouseEvents) {
        return
      }

      if (!metaWheelZoom || event.metaKey || event.ctrlKey) {
        event.preventDefault()
        var addToZoom = -event.deltaY / SCROLL_PIXELS_FOR_ZOOM_LEVEL

        if (!zoomSnap && _this._zoomTarget) {
          var stillToAdd = _this._zoomTarget - _this.state.zoom

          _this.zoomAroundMouse(addToZoom + stillToAdd, event)
        } else {
          if (animate) {
            _this.zoomAroundMouse(addToZoom, event)
          } else {
            if (!_this._lastWheel || performanceNow() - _this._lastWheel > ANIMATION_TIME) {
              _this._lastWheel = performanceNow()

              _this.zoomAroundMouse(addToZoom, event)
            }
          }
        }
      } else {
        _this.showWarning('wheel')
      }
    }

    _this.showWarning = function (warningType) {
      if (!_this.state.showWarning || _this.state.warningType !== warningType) {
        _this.setState({
          showWarning: true,
          warningType: warningType,
        })
      }

      if (_this._warningClearTimeout) {
        window.clearTimeout(_this._warningClearTimeout)
      }

      _this._warningClearTimeout = window.setTimeout(_this.clearWarning, WARNING_DISPLAY_TIMEOUT)
    }

    _this.clearWarning = function () {
      if (_this.state.showWarning) {
        _this.setState({
          showWarning: false,
        })
      }
    }

    _this.zoomAroundMouse = function (zoomDiff, event) {
      if (!_this._containerRef) {
        return
      }

      var zoom = _this.state.zoom
      var _this$props3 = _this.props,
        minZoom = _this$props3.minZoom,
        maxZoom = _this$props3.maxZoom,
        zoomSnap = _this$props3.zoomSnap
      _this._mousePosition = getMousePixel(_this._containerRef, event)

      if (!_this._mousePosition || (zoom === minZoom && zoomDiff < 0) || (zoom === maxZoom && zoomDiff > 0)) {
        return
      }

      var latLngNow = _this.pixelToLatLng(_this._mousePosition)

      var zoomTarget = zoom + zoomDiff

      if (zoomSnap) {
        zoomTarget = zoomDiff < 0 ? Math.floor(zoomTarget) : Math.ceil(zoomTarget)
      }

      zoomTarget = Math.max(minZoom, Math.min(zoomTarget, maxZoom))

      _this.setCenterZoomTarget(null, zoomTarget, false, latLngNow)
    }

    _this.zoomPlusDelta = function () {
      return _this.state.zoom + _this.state.zoomDelta
    }

    _this.pixelToLatLng = function (pixel, center, zoom) {
      if (center === void 0) {
        center = _this.state.center
      }

      if (zoom === void 0) {
        zoom = _this.zoomPlusDelta()
      }

      var _this$state7 = _this.state,
        width = _this$state7.width,
        height = _this$state7.height,
        pixelDelta = _this$state7.pixelDelta
      var pointDiff = [
        (pixel[0] - width / 2 - (pixelDelta ? pixelDelta[0] : 0)) / 256.0,
        (pixel[1] - height / 2 - (pixelDelta ? pixelDelta[1] : 0)) / 256.0,
      ]
      var tileX = lng2tile(center[1], zoom) + pointDiff[0]
      var tileY = lat2tile(center[0], zoom) + pointDiff[1]
      return [
        Math.max(absoluteMinMax[0], Math.min(absoluteMinMax[1], tile2lat(tileY, zoom))),
        Math.max(absoluteMinMax[2], Math.min(absoluteMinMax[3], tile2lng(tileX, zoom))),
      ]
    }

    _this.latLngToPixel = function (latLng, center, zoom) {
      if (center === void 0) {
        center = _this.state.center
      }

      if (zoom === void 0) {
        zoom = _this.zoomPlusDelta()
      }

      var _this$state8 = _this.state,
        width = _this$state8.width,
        height = _this$state8.height,
        pixelDelta = _this$state8.pixelDelta
      var tileCenterX = lng2tile(center[1], zoom)
      var tileCenterY = lat2tile(center[0], zoom)
      var tileX = lng2tile(latLng[1], zoom)
      var tileY = lat2tile(latLng[0], zoom)
      return [
        (tileX - tileCenterX) * 256.0 + width / 2 + (pixelDelta ? pixelDelta[0] : 0),
        (tileY - tileCenterY) * 256.0 + height / 2 + (pixelDelta ? pixelDelta[1] : 0),
      ]
    }

    _this.calculateZoomCenter = function (center, coords, oldZoom, newZoom) {
      var _this$state9 = _this.state,
        width = _this$state9.width,
        height = _this$state9.height

      var pixelBefore = _this.latLngToPixel(coords, center, oldZoom)

      var pixelAfter = _this.latLngToPixel(coords, center, newZoom)

      var newCenter = _this.pixelToLatLng(
        [width / 2 + pixelAfter[0] - pixelBefore[0], height / 2 + pixelAfter[1] - pixelBefore[1]],
        center,
        newZoom
      )

      return _this.limitCenterAtZoom(newCenter, newZoom)
    }

    _this.setRef = function (dom) {
      _this._containerRef = dom
    }

    _this.syncToProps = debounce(_this.syncToProps, DEBOUNCE_DELAY)
    _this._lastZoom =
      (_ref =
        (_props$defaultZoom = props.defaultZoom) !== null && _props$defaultZoom !== void 0
          ? _props$defaultZoom
          : props.zoom) !== null && _ref !== void 0
        ? _ref
        : 14
    _this._lastCenter =
      (_ref2 =
        (_props$defaultCenter = props.defaultCenter) !== null && _props$defaultCenter !== void 0
          ? _props$defaultCenter
          : props.center) !== null && _ref2 !== void 0
        ? _ref2
        : [0, 0]
    _this.state = {
      zoom: _this._lastZoom,
      center: _this._lastCenter,
      width:
        (_ref3 =
          (_props$width = props.width) !== null && _props$width !== void 0 ? _props$width : props.defaultWidth) !==
          null && _ref3 !== void 0
          ? _ref3
          : -1,
      height:
        (_ref4 =
          (_props$height = props.height) !== null && _props$height !== void 0 ? _props$height : props.defaultHeight) !==
          null && _ref4 !== void 0
          ? _ref4
          : -1,
      zoomDelta: 0,
      pixelDelta: undefined,
      oldTiles: [],
      showWarning: false,
      warningType: undefined,
    }
    return _this
  }

  var _proto = Map.prototype

  _proto.componentDidMount = function componentDidMount() {
    var _this2 = this

    this.props.mouseEvents && this.bindMouseEvents()
    this.props.touchEvents && this.bindTouchEvents()

    if (!this.props.width || !this.props.height) {
      if (!this.updateWidthHeight()) {
        requestAnimationFrame(this.updateWidthHeight)
      }

      this.bindResizeEvent()
    }

    this.bindWheelEvent()
    this.syncToProps()

    if (typeof window.ResizeObserver !== 'undefined') {
      this._resizeObserver = new window.ResizeObserver(function () {
        _this2.updateWidthHeight()
      })

      this._resizeObserver.observe(this._containerRef)
    }
  }

  _proto.componentWillUnmount = function componentWillUnmount() {
    this.props.mouseEvents && this.unbindMouseEvents()
    this.props.touchEvents && this.unbindTouchEvents()
    this.unbindWheelEvent()

    if (!this.props.width || !this.props.height) {
      this.unbindResizeEvent()
    }

    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
    }
  }

  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    var _prevProps$center

    if (this.props.mouseEvents !== prevProps.mouseEvents) {
      this.props.mouseEvents ? this.bindMouseEvents() : this.unbindMouseEvents()
    }

    if (this.props.touchEvents !== prevProps.touchEvents) {
      this.props.touchEvents ? this.bindTouchEvents() : this.unbindTouchEvents()
    }

    if (this.props.width && this.props.width !== prevProps.width) {
      this.setState({
        width: this.props.width,
      })
    }

    if (this.props.height && this.props.height !== prevProps.height) {
      this.setState({
        height: this.props.height,
      })
    }

    if (!this.props.center && !this.props.zoom) {
      return
    }

    if (
      (!this.props.center ||
        (this.props.center[0] ===
          (prevProps === null || prevProps === void 0
            ? void 0
            : (_prevProps$center = prevProps.center) === null || _prevProps$center === void 0
            ? void 0
            : _prevProps$center[0]) &&
          this.props.center[1] === prevProps.center[1])) &&
      this.props.zoom === prevProps.zoom
    ) {
      return
    }

    var currentCenter = this._isAnimating ? this._centerTarget : this.state.center
    var currentZoom = this._isAnimating ? this._zoomTarget : this.state.zoom

    if (currentCenter && currentZoom) {
      var _this$props$center, _this$props$zoom

      var nextCenter =
        (_this$props$center = this.props.center) !== null && _this$props$center !== void 0
          ? _this$props$center
          : currentCenter
      var nextZoom =
        (_this$props$zoom = this.props.zoom) !== null && _this$props$zoom !== void 0 ? _this$props$zoom : currentZoom

      if (
        Math.abs(nextZoom - currentZoom) > 0.001 ||
        Math.abs(nextCenter[0] - currentCenter[0]) > 0.0001 ||
        Math.abs(nextCenter[1] - currentCenter[1]) > 0.0001
      ) {
        this.setCenterZoomTarget(nextCenter, nextZoom, true)
      }
    }
  }

  _proto.coordsInside = function coordsInside(pixel) {
    var _this$state10 = this.state,
      width = _this$state10.width,
      height = _this$state10.height

    if (pixel[0] < 0 || pixel[1] < 0 || pixel[0] >= width || pixel[1] >= height) {
      return false
    }

    var parent = this._containerRef

    if (parent) {
      var pos = parentPosition(parent)
      var element = document.elementFromPoint(pixel[0] + pos.x, pixel[1] + pos.y)
      return parent === element || parent.contains(element)
    } else {
      return false
    }
  }

  _proto.tileValues = function tileValues(_ref5) {
    var center = _ref5.center,
      zoom = _ref5.zoom,
      pixelDelta = _ref5.pixelDelta,
      zoomDelta = _ref5.zoomDelta,
      width = _ref5.width,
      height = _ref5.height
    var roundedZoom = Math.round(zoom + (zoomDelta || 0))
    var zoomDiff = zoom + (zoomDelta || 0) - roundedZoom
    var scale = Math.pow(2, zoomDiff)
    var scaleWidth = width / scale
    var scaleHeight = height / scale
    var tileCenterX = lng2tile(center[1], roundedZoom) - (pixelDelta ? pixelDelta[0] / 256.0 / scale : 0)
    var tileCenterY = lat2tile(center[0], roundedZoom) - (pixelDelta ? pixelDelta[1] / 256.0 / scale : 0)
    var halfWidth = scaleWidth / 2 / 256.0
    var halfHeight = scaleHeight / 2 / 256.0
    var tileMinX = Math.floor(tileCenterX - halfWidth)
    var tileMaxX = Math.floor(tileCenterX + halfWidth)
    var tileMinY = Math.floor(tileCenterY - halfHeight)
    var tileMaxY = Math.floor(tileCenterY + halfHeight)
    return {
      tileMinX: tileMinX,
      tileMaxX: tileMaxX,
      tileMinY: tileMinY,
      tileMaxY: tileMaxY,
      tileCenterX: tileCenterX,
      tileCenterY: tileCenterY,
      roundedZoom: roundedZoom,
      zoomDelta: zoomDelta || 0,
      scaleWidth: scaleWidth,
      scaleHeight: scaleHeight,
      scale: scale,
    }
  }

  _proto.renderTiles = function renderTiles() {
    var _this3 = this

    var _this$state11 = this.state,
      oldTiles = _this$state11.oldTiles,
      width = _this$state11.width,
      height = _this$state11.height
    var dprs = this.props.dprs
    var mapUrl = this.props.provider || osm

    var _this$tileValues = this.tileValues(this.state),
      tileMinX = _this$tileValues.tileMinX,
      tileMaxX = _this$tileValues.tileMaxX,
      tileMinY = _this$tileValues.tileMinY,
      tileMaxY = _this$tileValues.tileMaxY,
      tileCenterX = _this$tileValues.tileCenterX,
      tileCenterY = _this$tileValues.tileCenterY,
      roundedZoom = _this$tileValues.roundedZoom,
      scaleWidth = _this$tileValues.scaleWidth,
      scaleHeight = _this$tileValues.scaleHeight,
      scale = _this$tileValues.scale

    var tiles = []

    for (var i = 0; i < oldTiles.length; i++) {
      var old = oldTiles[i]
      var zoomDiff = old.roundedZoom - roundedZoom

      if (Math.abs(zoomDiff) > 4 || zoomDiff === 0) {
        continue
      }

      var pow = 1 / Math.pow(2, zoomDiff)
      var xDiff = -(tileMinX - old.tileMinX * pow) * 256
      var yDiff = -(tileMinY - old.tileMinY * pow) * 256

      var _xMin = Math.max(old.tileMinX, 0)

      var _yMin = Math.max(old.tileMinY, 0)

      var _xMax = Math.min(old.tileMaxX, Math.pow(2, old.roundedZoom) - 1)

      var _yMax = Math.min(old.tileMaxY, Math.pow(2, old.roundedZoom) - 1)

      for (var x = _xMin; x <= _xMax; x++) {
        for (var y = _yMin; y <= _yMax; y++) {
          tiles.push({
            key: x + '-' + y + '-' + old.roundedZoom,
            url: mapUrl(x, y, old.roundedZoom),
            srcSet: srcSet(dprs, mapUrl, x, y, old.roundedZoom),
            left: xDiff + (x - old.tileMinX) * 256 * pow,
            top: yDiff + (y - old.tileMinY) * 256 * pow,
            width: 256 * pow,
            height: 256 * pow,
            active: false,
          })
        }
      }
    }

    var xMin = Math.max(tileMinX, 0)
    var yMin = Math.max(tileMinY, 0)
    var xMax = Math.min(tileMaxX, Math.pow(2, roundedZoom) - 1)
    var yMax = Math.min(tileMaxY, Math.pow(2, roundedZoom) - 1)

    for (var _x = xMin; _x <= xMax; _x++) {
      for (var _y = yMin; _y <= yMax; _y++) {
        tiles.push({
          key: _x + '-' + _y + '-' + roundedZoom,
          url: mapUrl(_x, _y, roundedZoom),
          srcSet: srcSet(dprs, mapUrl, _x, _y, roundedZoom),
          left: (_x - tileMinX) * 256,
          top: (_y - tileMinY) * 256,
          width: 256,
          height: 256,
          active: true,
        })
      }
    }

    var boxStyle = {
      width: scaleWidth,
      height: scaleHeight,
      position: 'absolute',
      top: 'calc((100% - ' + height + 'px) / 2)',
      left: 'calc((100% - ' + width + 'px) / 2)',
      overflow: 'hidden',
      willChange: 'transform',
      transform: 'scale(' + scale + ', ' + scale + ')',
      transformOrigin: 'top left',
    }
    var boxClassname = this.props.boxClassname || 'pigeon-tiles-box'
    var left = -((tileCenterX - tileMinX) * 256 - scaleWidth / 2)
    var top = -((tileCenterY - tileMinY) * 256 - scaleHeight / 2)
    var tilesStyle = {
      position: 'absolute',
      width: (tileMaxX - tileMinX + 1) * 256,
      height: (tileMaxY - tileMinY + 1) * 256,
      willChange: 'transform',
      transform: 'translate(' + left + 'px, ' + top + 'px)',
    }
    return /*#__PURE__*/ React__default.createElement(
      'div',
      {
        style: boxStyle,
        className: boxClassname,
      },
      /*#__PURE__*/ React__default.createElement(
        'div',
        {
          className: 'pigeon-tiles',
          style: tilesStyle,
        },
        tiles.map(function (tile) {
          return /*#__PURE__*/ React__default.createElement('img', {
            key: tile.key,
            src: tile.url,
            srcSet: tile.srcSet,
            width: tile.width,
            height: tile.height,
            loading: 'lazy',
            onLoad: function onLoad() {
              return _this3.imageLoaded(tile.key)
            },
            alt: '',
            style: {
              position: 'absolute',
              left: tile.left,
              top: tile.top,
              willChange: 'transform',
              transformOrigin: 'top left',
              opacity: 1,
            },
          })
        })
      )
    )
  }

  _proto.renderOverlays = function renderOverlays() {
    var _this4 = this

    var _this$state12 = this.state,
      width = _this$state12.width,
      height = _this$state12.height,
      center = _this$state12.center
    var mapState = {
      bounds: this.getBounds(),
      zoom: this.zoomPlusDelta(),
      center: center,
      width: width,
      height: height,
    }
    var childrenWithProps = React__default.Children.map(this.props.children, function (child) {
      if (!child) {
        return null
      }

      if (!(/*#__PURE__*/ React__default.isValidElement(child))) {
        return child
      }

      var _child$props = child.props,
        anchor = _child$props.anchor,
        position = _child$props.position,
        offset = _child$props.offset

      var c = _this4.latLngToPixel(anchor || position || center)

      return /*#__PURE__*/ React__default.cloneElement(child, {
        left: c[0] - (offset ? offset[0] : 0),
        top: c[1] - (offset ? offset[1] : 0),
        latLngToPixel: _this4.latLngToPixel,
        pixelToLatLng: _this4.pixelToLatLng,
        setCenterZoom: _this4.setCenterZoomForChildren,
        mapProps: _this4.props,
        mapState: mapState,
      })
    })
    var childrenStyle = {
      position: 'absolute',
      width: width,
      height: height,
      top: 'calc((100% - ' + height + 'px) / 2)',
      left: 'calc((100% - ' + width + 'px) / 2)',
    }
    return /*#__PURE__*/ React__default.createElement(
      'div',
      {
        className: 'pigeon-overlays',
        style: childrenStyle,
      },
      childrenWithProps
    )
  }

  _proto.renderAttribution = function renderAttribution() {
    var _this$props4 = this.props,
      attribution = _this$props4.attribution,
      attributionPrefix = _this$props4.attributionPrefix

    if (attribution === false) {
      return null
    }

    var style = {
      position: 'absolute',
      bottom: 0,
      right: 0,
      fontSize: '11px',
      padding: '2px 5px',
      background: 'rgba(255, 255, 255, 0.7)',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      color: '#333',
    }
    var linkStyle = {
      color: '#0078A8',
      textDecoration: 'none',
    }
    return /*#__PURE__*/ React__default.createElement(
      'div',
      {
        key: 'attr',
        className: 'pigeon-attribution',
        style: style,
      },
      attributionPrefix === false
        ? null
        : /*#__PURE__*/ React__default.createElement(
            'span',
            null,
            attributionPrefix ||
              /*#__PURE__*/ React__default.createElement(
                'a',
                {
                  href: 'https://pigeon-maps.js.org/',
                  style: linkStyle,
                  target: '_blank',
                  rel: 'noreferrer noopener',
                },
                'Pigeon'
              ),
            ' | '
          ),
      attribution ||
        /*#__PURE__*/ React__default.createElement(
          'span',
          null,
          ' © ',
          /*#__PURE__*/ React__default.createElement(
            'a',
            {
              href: 'https://www.openstreetmap.org/copyright',
              style: linkStyle,
              target: '_blank',
              rel: 'noreferrer noopener',
            },
            'OpenStreetMap'
          ),
          ' contributors'
        )
    )
  }

  _proto.renderWarning = function renderWarning() {
    var _this$props5 = this.props,
      metaWheelZoom = _this$props5.metaWheelZoom,
      metaWheelZoomWarning = _this$props5.metaWheelZoomWarning,
      twoFingerDrag = _this$props5.twoFingerDrag,
      twoFingerDragWarning = _this$props5.twoFingerDragWarning,
      warningZIndex = _this$props5.warningZIndex
    var _this$state13 = this.state,
      showWarning = _this$state13.showWarning,
      warningType = _this$state13.warningType,
      width = _this$state13.width,
      height = _this$state13.height

    if ((metaWheelZoom && metaWheelZoomWarning) || (twoFingerDrag && twoFingerDragWarning)) {
      var style = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: showWarning ? 100 : 0,
        transition: 'opacity 300ms',
        background: 'rgba(0,0,0,0.5)',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 22,
        fontFamily: '"Arial", sans-serif',
        textAlign: 'center',
        zIndex: warningZIndex,
      }
      var meta =
        typeof window !== 'undefined' && window.navigator && window.navigator.platform.toUpperCase().indexOf('MAC') >= 0
          ? '⌘'
          : 'ctrl'
      var warningText = warningType === 'fingers' ? twoFingerDragWarning : metaWheelZoomWarning
      return /*#__PURE__*/ React__default.createElement(
        'div',
        {
          className: 'pigeon-overlay-warning',
          style: style,
        },
        warningText.replace('META', meta)
      )
    } else {
      return null
    }
  }

  _proto.render = function render() {
    var _this$props6 = this.props,
      touchEvents = _this$props6.touchEvents,
      twoFingerDrag = _this$props6.twoFingerDrag
    var _this$state14 = this.state,
      width = _this$state14.width,
      height = _this$state14.height
    var containerStyle = {
      width: this.props.width ? width : '100%',
      height: this.props.height ? height : '100%',
      position: 'relative',
      display: 'inline-block',
      overflow: 'hidden',
      background: '#dddddd',
      touchAction: touchEvents ? (twoFingerDrag ? 'pan-x pan-y' : 'none') : 'auto',
    }
    var hasSize = !!(width && height)
    return /*#__PURE__*/ React__default.createElement(
      'div',
      {
        style: containerStyle,
        ref: this.setRef,
      },
      hasSize && this.renderTiles(),
      hasSize && this.renderOverlays(),
      hasSize && this.renderAttribution(),
      hasSize && this.renderWarning()
    )
  }

  return Map
})(React.Component)
Map.defaultProps = {
  animate: true,
  metaWheelZoom: false,
  metaWheelZoomWarning: 'Use META + wheel to zoom!',
  twoFingerDrag: false,
  twoFingerDragWarning: 'Use two fingers to move the map',
  zoomSnap: true,
  mouseEvents: true,
  touchEvents: true,
  warningZIndex: 100,
  animateMaxScreens: 5,
  minZoom: 1,
  maxZoom: 18,
  limitBounds: 'center',
  dprs: [],
}

var Marker = function Marker(props) {
  var width =
    typeof props.width !== 'undefined'
      ? props.width
      : typeof props.height !== 'undefined'
      ? (props.height * 29) / 34
      : 29
  var height =
    typeof props.height !== 'undefined'
      ? props.height
      : typeof props.width !== 'undefined'
      ? (props.width * 34) / 29
      : 34

  var _useState = React.useState(props.hover || false),
    internalHover = _useState[0],
    setInternalHover = _useState[1]

  var hover = typeof props.hover === 'undefined' ? internalHover : props.hover
  var color = props.color || '#93C0D0'

  var eventParameters = function eventParameters(event) {
    return {
      event: event,
      anchor: props.anchor,
      payload: props.payload,
    }
  }

  return /*#__PURE__*/ React__default.createElement(
    'div',
    {
      style: _objectSpread2(
        {
          position: 'absolute',
          transform: 'translate(' + (props.left - width / 2) + 'px, ' + (props.top - (height - 1)) + 'px)',
          filter: hover ? 'drop-shadow(0 0 4px rgba(0, 0, 0, .3))' : '',
          pointerEvents: 'none',
          cursor: 'pointer',
        },
        props.style || {}
      ),
      className: props.className ? props.className + ' pigeon-click-block' : 'pigeon-click-block',
    },
    /*#__PURE__*/ React__default.createElement(
      'svg',
      {
        width: width,
        height: height,
        viewBox: '0 0 61 71',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
      },
      /*#__PURE__*/ React__default.createElement(
        'g',
        {
          style: {
            pointerEvents: 'auto',
          },
          onClick: props.onClick
            ? function (event) {
                return props.onClick(eventParameters(event))
              }
            : null,
          onContextMenu: props.onContextMenu
            ? function (event) {
                return props.onContextMenu(eventParameters(event))
              }
            : null,
          onMouseOver: function onMouseOver(event) {
            props.onMouseOver && props.onMouseOver(eventParameters(event))
            setInternalHover(true)
          },
          onMouseOut: function onMouseOut(event) {
            props.onMouseOut && props.onMouseOut(eventParameters(event))
            setInternalHover(false)
          },
        },
        /*#__PURE__*/ React__default.createElement('path', {
          d:
            'M52 31.5C52 36.8395 49.18 42.314 45.0107 47.6094C40.8672 52.872 35.619 57.678 31.1763 61.6922C30.7916 62.0398 30.2084 62.0398 29.8237 61.6922C25.381 57.678 20.1328 52.872 15.9893 47.6094C11.82 42.314 9 36.8395 9 31.5C9 18.5709 18.6801 9 30.5 9C42.3199 9 52 18.5709 52 31.5Z',
          fill: color,
          stroke: 'white',
          strokeWidth: '4',
        }),
        /*#__PURE__*/ React__default.createElement('circle', {
          cx: '30.5',
          cy: '30.5',
          r: '8.5',
          fill: 'white',
          opacity: hover ? 0.98 : 0.6,
        })
      )
    ),
    props === null || props === void 0 ? void 0 : props.children
  )
}

function Overlay(props) {
  return /*#__PURE__*/ React__default.createElement(
    'div',
    {
      style: _objectSpread2(
        {
          position: 'absolute',
          transform: 'translate(' + props.left + 'px, ' + props.top + 'px)',
        },
        props.style || {}
      ),
      className: props.className ? props.className + ' pigeon-click-block' : 'pigeon-click-block',
    },
    props.children
  )
}

function isDescendentOf(element, ancestor) {
  while (element) {
    if (element === ancestor) {
      return true
    }

    element = element.parentElement
  }

  return false
}

var defaultState = {
  isDragging: false,
  startX: undefined,
  startY: undefined,
  startLeft: undefined,
  startTop: undefined,
  deltaX: 0,
  deltaY: 0,
}
function Draggable(props) {
  var dragRef = React.useRef()
  var propsRef = React.useRef(props)
  var stateRef = React.useRef(_objectSpread2({}, defaultState))

  var _useState = React.useState(defaultState),
    _state = _useState[0],
    _setState = _useState[1]

  propsRef.current = props

  var setState = function setState(stateUpdate) {
    var newState = _objectSpread2(_objectSpread2({}, stateRef.current), stateUpdate)

    stateRef.current = newState

    _setState(newState)
  }

  var _props$mapProps = props.mapProps,
    mouseEvents = _props$mapProps.mouseEvents,
    touchEvents = _props$mapProps.touchEvents
  React.useEffect(
    function () {
      var handleDragStart = function handleDragStart(event) {
        if (isDescendentOf(event.target, dragRef.current)) {
          event.preventDefault()
          setState({
            isDragging: true,
            startX: ('touches' in event ? event.touches[0] : event).clientX,
            startY: ('touches' in event ? event.touches[0] : event).clientY,
            startLeft: propsRef.current.left,
            startTop: propsRef.current.top,
            deltaX: 0,
            deltaY: 0,
          })

          if (propsRef.current.onDragStart) {
            var _propsRef$current = propsRef.current,
              _left = _propsRef$current.left,
              _top = _propsRef$current.top,
              offset = _propsRef$current.offset,
              pixelToLatLng = _propsRef$current.pixelToLatLng
            propsRef.current.onDragMove(
              pixelToLatLng([_left + (offset ? offset[0] : 0), _top + (offset ? offset[1] : 0)])
            )
          }
        }
      }

      var handleDragMove = function handleDragMove(event) {
        if (!stateRef.current.isDragging) {
          return
        }

        event.preventDefault()
        var x = ('touches' in event ? event.touches[0] : event).clientX
        var y = ('touches' in event ? event.touches[0] : event).clientY
        var deltaX = x - stateRef.current.startX
        var deltaY = y - stateRef.current.startY
        setState({
          deltaX: deltaX,
          deltaY: deltaY,
        })

        if (propsRef.current.onDragMove) {
          var _propsRef$current2 = propsRef.current,
            offset = _propsRef$current2.offset,
            pixelToLatLng = _propsRef$current2.pixelToLatLng
          var _stateRef$current = stateRef.current,
            _startLeft = _stateRef$current.startLeft,
            _startTop = _stateRef$current.startTop
          propsRef.current.onDragMove(
            pixelToLatLng([
              _startLeft + deltaX + (offset ? offset[0] : 0),
              _startTop + deltaY + (offset ? offset[1] : 0),
            ])
          )
        }
      }

      var handleDragEnd = function handleDragEnd(event) {
        var _propsRef$current$onD, _propsRef$current4

        if (!stateRef.current.isDragging) {
          return
        }

        event.preventDefault()
        var _propsRef$current3 = propsRef.current,
          offset = _propsRef$current3.offset,
          pixelToLatLng = _propsRef$current3.pixelToLatLng
        var _stateRef$current2 = stateRef.current,
          deltaX = _stateRef$current2.deltaX,
          deltaY = _stateRef$current2.deltaY,
          startLeft = _stateRef$current2.startLeft,
          startTop = _stateRef$current2.startTop
        ;(_propsRef$current$onD = (_propsRef$current4 = propsRef.current).onDragEnd) === null ||
        _propsRef$current$onD === void 0
          ? void 0
          : _propsRef$current$onD.call(
              _propsRef$current4,
              pixelToLatLng([
                startLeft + deltaX + (offset ? offset[0] : 0),
                startTop + deltaY + (offset ? offset[1] : 0),
              ])
            )
        setState({
          isDragging: false,
          startX: undefined,
          startY: undefined,
          startLeft: undefined,
          startTop: undefined,
          deltaX: 0,
          deltaY: 0,
        })
      }

      var wa = function wa(e, t, o) {
        return window.addEventListener(e, t, o)
      }

      var wr = function wr(e, t) {
        return window.removeEventListener(e, t)
      }

      if (mouseEvents) {
        wa('mousedown', handleDragStart)
        wa('mousemove', handleDragMove)
        wa('mouseup', handleDragEnd)
      }

      if (touchEvents) {
        wa('touchstart', handleDragStart, {
          passive: false,
        })
        wa('touchmove', handleDragMove, {
          passive: false,
        })
        wa('touchend', handleDragEnd, {
          passive: false,
        })
      }

      return function () {
        if (mouseEvents) {
          wr('mousedown', handleDragStart)
          wr('mousemove', handleDragMove)
          wr('mouseup', handleDragEnd)
        }

        if (touchEvents) {
          wr('touchstart', handleDragStart)
          wr('touchmove', handleDragMove)
          wr('touchend', handleDragEnd)
        }
      }
    },
    [mouseEvents, touchEvents]
  )
  var left = props.left,
    top = props.top,
    className = props.className,
    style = props.style
  var deltaX = _state.deltaX,
    deltaY = _state.deltaY,
    startLeft = _state.startLeft,
    startTop = _state.startTop,
    isDragging = _state.isDragging
  return /*#__PURE__*/ React__default.createElement(
    'div',
    {
      style: _objectSpread2(
        _objectSpread2(
          {
            cursor: isDragging ? 'grabbing' : 'grab',
          },
          style || {}
        ),
        {},
        {
          position: 'absolute',
          transform:
            'translate(' +
            (isDragging ? startLeft + deltaX : left) +
            'px, ' +
            (isDragging ? startTop + deltaY : top) +
            'px)',
        }
      ),
      ref: dragRef,
      className: 'pigeon-drag-block' + (className ? ' ' + className : ''),
    },
    props.children
  )
}

var commonStyle = {
  position: 'absolute',
  top: 10,
  left: 10,
}
var commonButtonStyle = {
  width: 28,
  height: 28,
  borderRadius: 2,
  boxShadow: '0 1px 4px -1px rgba(0,0,0,.3)',
  background: 'white',
  lineHeight: '26px',
  fontSize: '20px',
  fontWeight: 700,
  color: '#666',
  marginBottom: 1,
  cursor: 'pointer',
  border: 'none',
  display: 'block',
  outline: 'none',
}
function ZoomControl(_ref) {
  var style = _ref.style,
    buttonStyle = _ref.buttonStyle,
    setCenterZoom = _ref.setCenterZoom,
    mapState = _ref.mapState,
    mapProps = _ref.mapProps
  return /*#__PURE__*/ React__default.createElement(
    'div',
    {
      className: 'pigeon-zoom-buttons pigeon-drag-block',
      style: style ? _objectSpread2(_objectSpread2({}, commonStyle), style) : commonStyle,
    },
    /*#__PURE__*/ React__default.createElement(
      'button',
      {
        className: 'pigeon-zoom-in',
        style: buttonStyle ? _objectSpread2(_objectSpread2({}, commonButtonStyle), buttonStyle) : commonButtonStyle,
        onClick: function onClick() {
          return setCenterZoom(mapState.center, Math.min(mapState.zoom + 1, mapProps.maxZoom))
        },
      },
      '+'
    ),
    /*#__PURE__*/ React__default.createElement(
      'button',
      {
        className: 'pigeon-zoom-out',
        style: buttonStyle ? _objectSpread2(_objectSpread2({}, commonButtonStyle), buttonStyle) : commonButtonStyle,
        onClick: function onClick() {
          return setCenterZoom(mapState.center, Math.max(mapState.zoom - 1, mapProps.minZoom))
        },
      },
      '\u2013'
    )
  )
}

exports.Draggable = Draggable
exports.Map = Map
exports.Marker = Marker
exports.Overlay = Overlay
exports.ZoomControl = ZoomControl
