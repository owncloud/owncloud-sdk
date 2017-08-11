/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 25);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



var base64 = __webpack_require__(36)
var ieee754 = __webpack_require__(37)
var isArray = __webpack_require__(18)

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)))

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = __webpack_require__(28)


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.



/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var processNextTick = __webpack_require__(11);
/*</replacement>*/

/*<replacement>*/
var util = __webpack_require__(8);
util.inherits = __webpack_require__(5);
/*</replacement>*/

var Readable = __webpack_require__(19);
var Writable = __webpack_require__(12);

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var asap = __webpack_require__(16);

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

module.exports = Promise;

function Promise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('Promise constructor\'s argument is not a function');
  }
  this._99 = 0;
  this._44 = 0;
  this._7 = null;
  this._12 = null;
  if (fn === noop) return;
  doResolve(fn, this);
}
Promise._32 = null;
Promise._89 = null;
Promise._27 = noop;

Promise.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
}
function handle(self, deferred) {
  while (self._44 === 3) {
    self = self._7;
  }
  if (Promise._32) {
    Promise._32(self);
  }
  if (self._44 === 0) {
    if (self._99 === 0) {
      self._99 = 1;
      self._12 = deferred;
      return;
    }
    if (self._99 === 1) {
      self._99 = 2;
      self._12 = [self._12, deferred];
      return;
    }
    self._12.push(deferred);
    return;
  }
  handleResolved(self, deferred);
}

function handleResolved(self, deferred) {
  asap(function() {
    var cb = self._44 === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._44 === 1) {
        resolve(deferred.promise, self._7);
      } else {
        reject(deferred.promise, self._7);
      }
      return;
    }
    var ret = tryCallOne(cb, self._7);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }
  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR);
    }
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {
      self._44 = 3;
      self._7 = newValue;
      finale(self);
      return;
    } else if (typeof then === 'function') {
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._44 = 1;
  self._7 = newValue;
  finale(self);
}

function reject(self, newValue) {
  self._44 = 2;
  self._7 = newValue;
  if (Promise._89) {
    Promise._89(self, newValue);
  }
  finale(self);
}
function finale(self) {
  if (self._99 === 1) {
    handle(self, self._12);
    self._12 = null;
  }
  if (self._99 === 2) {
    for (var i = 0; i < self._12.length; i++) {
      handle(self, self._12[i]);
    }
    self._12 = null;
  }
}

function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
  var done = false;
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    reject(promise, reason);
  });
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/*jslint node:true */

var xml2js = __webpack_require__(17);
var xml2json = __webpack_require__(47);
var js2xml = __webpack_require__(21);
var json2xml = __webpack_require__(48);

module.exports = {
    xml2js: xml2js,
    xml2json: xml2json,
    js2xml: js2xml,
    json2xml: json2xml
};

/***/ }),
/* 5 */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/***/ }),
/* 6 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 7 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0).Buffer))

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = __webpack_require__(10).EventEmitter;
var inherits = __webpack_require__(5);

inherits(Stream, EE);
Stream.Readable = __webpack_require__(38);
Stream.Writable = __webpack_require__(43);
Stream.Duplex = __webpack_require__(44);
Stream.Transform = __webpack_require__(45);
Stream.PassThrough = __webpack_require__(46);

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};


/***/ }),
/* 10 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process, setImmediate) {// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.



module.exports = Writable;

/*<replacement>*/
var processNextTick = __webpack_require__(11);
/*</replacement>*/

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

/*<replacement>*/
var Buffer = __webpack_require__(0).Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = __webpack_require__(8);
util.inherits = __webpack_require__(5);
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: __webpack_require__(42)
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = __webpack_require__(9);
  } catch (_) {} finally {
    if (!Stream) Stream = __webpack_require__(10).EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = __webpack_require__(0).Buffer;

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

var Duplex;
function WritableState(options, stream) {
  Duplex = Duplex || __webpack_require__(2);

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // create the two objects needed to store the corked requests
  // they are not a linked list, as no new elements are inserted in there
  this.corkedRequestsFree = new CorkedRequest(this);
  this.corkedRequestsFree.next = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
  } catch (_) {}
})();

var Duplex;
function Writable(options) {
  Duplex = Duplex || __webpack_require__(2);

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;

  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) processNextTick(cb, er);else cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
        afterWrite(stream, state, finished, cb);
      }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    while (entry) {
      buffer[count] = entry;
      entry = entry.next;
      count += 1;
    }

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    state.corkedRequestsFree = holder.next;
    holder.next = null;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function (err) {
    var entry = _this.entry;
    _this.entry = null;
    while (entry) {
      var cb = entry.callback;
      state.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    if (state.corkedRequestsFree) {
      state.corkedRequestsFree.next = _this;
    } else {
      state.corkedRequestsFree = _this;
    }
  };
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(40).setImmediate))

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = __webpack_require__(0).Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.



module.exports = Transform;

var Duplex = __webpack_require__(2);

/*<replacement>*/
var util = __webpack_require__(8);
util.inherits = __webpack_require__(5);
/*</replacement>*/

util.inherits(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er) {
      done(stream, er);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

function done(stream, er) {
  if (er) return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {/*jslint node:true */

module.exports = {
    sanitize: function (text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },
    copyOptions: function (options) {
        var key, copy = {};
        for (key in options) {
            if (options.hasOwnProperty(key)) {
                copy[key] = options[key];
            }
        }
        return copy;
    },
    ensureFlagExists: function (item, options) {
        if (!(item in options) || typeof options[item] !== 'boolean') {
            options[item] = false;
        }
    },
    ensureSpacesExists: function (options) {
        if (!('spaces' in options) || (typeof options.spaces !== 'number' && typeof options.spaces !== 'string')) {
            options.spaces = 0;
        }
    },
    ensureKeyExists: function (key, options) {
        if (!(key + 'Key' in options) || typeof options[key + 'Key'] !== 'string') {
            options[key + 'Key'] = options.compact ? '_' + key : key;
        }
    },
    getCommandLineHelp: function (command, requiredArgs, optionalArgs) {
        var reqArgs = requiredArgs.reduce(function (res, arg) {return res + ' <' + arg.arg + '>';}, '');
        var output = 'Usage: ' + command + reqArgs + ' [options]' + '\n';
        requiredArgs.forEach(function (argument) {
            output += '  <' + argument.arg + '>' + Array(20 - argument.arg.length).join(' ') + argument.desc + '\n';
        });
        output += '\nOptions:' + '\n';
        optionalArgs.forEach(function (argument) {
            output += '  --' + argument.arg + Array(20 - argument.arg.length).join(' ') + argument.desc + '\n';
        });
        return output;
    },
    mapCommandLineArgs: function (requiredArgs, optionalArgs) {
        var options = {}, r, o, a = 2;
        for (r = 0; r < requiredArgs.length; r += 1) {
            if (a < process.argv.length && process.argv[a].substr(0, 1) !== '-' && process.argv[a] !== 'JASMINE_CONFIG_PATH=./jasmine.json') {
                options[requiredArgs[r].option] = process.argv[a++];
            } else {
                break;
            }
        }
        for (; a < process.argv.length; a += 1) {
            for (o = 0; o < optionalArgs.length; o += 1) {
                if (optionalArgs[o].alias === process.argv[a].slice(1) || optionalArgs[o].arg === process.argv[a].slice(2)) {
                    break;
                }
            }
            if (o < optionalArgs.length) {
                switch (optionalArgs[o].type) {
                    case 'file': case 'string': case 'number':
                        if (a + 1 < process.argv.length) {
                            a += 1;
                            options[optionalArgs[o].option] = (optionalArgs[o].type === 'number' ? Number(process.argv[a]) : process.argv[a]);
                        }
                        break;
                    case 'flag':
                        options[optionalArgs[o].option] = true; break;
                }
            }
        }
        return options;
    }
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// `requestFlush` is an implementation-specific method that attempts to kick
// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
// the event queue before yielding to the browser's own event loop.
var requestFlush;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory exhaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

// `requestFlush` is implemented using a strategy based on data collected from
// every available SauceLabs Selenium web driver worker at time of writing.
// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
// have WebKitMutationObserver but not un-prefixed MutationObserver.
// Must use `global` or `self` instead of `window` to work in both frames and web
// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.

/* globals self */
var scope = typeof global !== "undefined" ? global : self;
var BrowserMutationObserver = scope.MutationObserver || scope.WebKitMutationObserver;

// MutationObservers are desirable because they have high priority and work
// reliably everywhere they are implemented.
// They are implemented in all modern browsers.
//
// - Android 4-4.3
// - Chrome 26-34
// - Firefox 14-29
// - Internet Explorer 11
// - iPad Safari 6-7.1
// - iPhone Safari 7-7.1
// - Safari 6-7
if (typeof BrowserMutationObserver === "function") {
    requestFlush = makeRequestCallFromMutationObserver(flush);

// MessageChannels are desirable because they give direct access to the HTML
// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
// 11-12, and in web workers in many engines.
// Although message channels yield to any queued rendering and IO tasks, they
// would be better than imposing the 4ms delay of timers.
// However, they do not work reliably in Internet Explorer or Safari.

// Internet Explorer 10 is the only browser that has setImmediate but does
// not have MutationObservers.
// Although setImmediate yields to the browser's renderer, it would be
// preferrable to falling back to setTimeout since it does not have
// the minimum 4ms penalty.
// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
// Desktop to a lesser extent) that renders both setImmediate and
// MessageChannel useless for the purposes of ASAP.
// https://github.com/kriskowal/q/issues/396

// Timers are implemented universally.
// We fall back to timers in workers in most engines, and in foreground
// contexts in the following browsers.
// However, note that even this simple case requires nuances to operate in a
// broad spectrum of browsers.
//
// - Firefox 3-13
// - Internet Explorer 6-9
// - iPad Safari 4.3
// - Lynx 2.8.7
} else {
    requestFlush = makeRequestCallFromTimer(flush);
}

// `requestFlush` requests that the high priority event queue be flushed as
// soon as possible.
// This is useful to prevent an error thrown in a task from stalling the event
// queue if the exception handled by Node.js’s
// `process.on("uncaughtException")` or by a domain.
rawAsap.requestFlush = requestFlush;

// To request a high priority event, we induce a mutation observer by toggling
// the text of a text node between "1" and "-1".
function makeRequestCallFromMutationObserver(callback) {
    var toggle = 1;
    var observer = new BrowserMutationObserver(callback);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
    };
}

// The message channel technique was discovered by Malte Ubl and was the
// original foundation for this library.
// http://www.nonblocking.io/2011/06/windownexttick.html

// Safari 6.0.5 (at least) intermittently fails to create message ports on a
// page's first load. Thankfully, this version of Safari supports
// MutationObservers, so we don't need to fall back in that case.

// function makeRequestCallFromMessageChannel(callback) {
//     var channel = new MessageChannel();
//     channel.port1.onmessage = callback;
//     return function requestCall() {
//         channel.port2.postMessage(0);
//     };
// }

// For reasons explained above, we are also unable to use `setImmediate`
// under any circumstances.
// Even if we were, there is another bug in Internet Explorer 10.
// It is not sufficient to assign `setImmediate` to `requestFlush` because
// `setImmediate` must be called *by name* and therefore must be wrapped in a
// closure.
// Never forget.

// function makeRequestCallFromSetImmediate(callback) {
//     return function requestCall() {
//         setImmediate(callback);
//     };
// }

// Safari 6.0 has a problem where timers will get lost while the user is
// scrolling. This problem does not impact ASAP because Safari 6.0 supports
// mutation observers, so that implementation is used instead.
// However, if we ever elect to use timers in Safari, the prevalent work-around
// is to add a scroll event listener that calls for a flush.

// `setTimeout` does not call the passed callback if the delay is less than
// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
// even then.

function makeRequestCallFromTimer(callback) {
    return function requestCall() {
        // We dispatch a timeout with a specified delay of 0 for engines that
        // can reliably accommodate that request. This will usually be snapped
        // to a 4 milisecond delay, but once we're flushing, there's no delay
        // between events.
        var timeoutHandle = setTimeout(handleTimer, 0);
        // However, since this timer gets frequently dropped in Firefox
        // workers, we enlist an interval handle that will try to fire
        // an event 20 times per second until it succeeds.
        var intervalHandle = setInterval(handleTimer, 50);

        function handleTimer() {
            // Whichever timer succeeds will cancel both timers and
            // execute the callback.
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            callback();
        }
    };
}

// This is for `asap.js` only.
// Its name will be periodically randomized to break any code that depends on
// its existence.
rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

// ASAP was originally a nextTick shim included in Q. This was factored out
// into this ASAP package. It was later adapted to RSVP which made further
// amendments. These decisions, particularly to marginalize MessageChannel and
// to capture the MutationObserver implementation in a closure, were integrated
// back into ASAP proper.
// https://github.com/tildeio/rsvp.js/blob/cddf7232546a9cf858524b75cde6f9edf72620a7/lib/rsvp/asap.js

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)))

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

var sax = __webpack_require__(35);
var expat /*= require('node-expat');*/ = { on: function () { }, parse: function () { } };
var common = __webpack_require__(15);

var options;
var pureJsParser = true;
var currentElement;

function validateOptions(userOptions) {
    options = common.copyOptions(userOptions);
    common.ensureFlagExists('ignoreDeclaration', options);
    common.ensureFlagExists('ignoreInstruction', options);
    common.ensureFlagExists('ignoreAttributes', options);
    common.ensureFlagExists('ignoreText', options);
    common.ensureFlagExists('ignoreComment', options);
    common.ensureFlagExists('ignoreCdata', options);
    common.ensureFlagExists('ignoreDoctype', options);
    common.ensureFlagExists('compact', options);
    common.ensureFlagExists('alwaysArray', options);
    common.ensureFlagExists('alwaysChildren', options);
    common.ensureFlagExists('addParent', options);
    common.ensureFlagExists('trim', options);
    common.ensureFlagExists('nativeType', options);
    common.ensureFlagExists('sanitize', options);
    common.ensureKeyExists('declaration', options);
    common.ensureKeyExists('instruction', options);
    common.ensureKeyExists('attributes', options);
    common.ensureKeyExists('text', options);
    common.ensureKeyExists('comment', options);
    common.ensureKeyExists('cdata', options);
    common.ensureKeyExists('doctype', options);
    common.ensureKeyExists('type', options);
    common.ensureKeyExists('name', options);
    common.ensureKeyExists('elements', options);
    common.ensureKeyExists('parent', options);
    return options;
}

function nativeType(value) {
    var nValue = Number(value);
    if (!isNaN(nValue)) {
        return nValue;
    }
    var bValue = value.toLowerCase();
    if (bValue === 'true') {
        return true;
    } else if (bValue === 'false') {
        return false;
    }
    return value;
}

function addField(type, value, options) {
    if (options.compact) {
        if (!currentElement[options[type + 'Key']] && options.alwaysArray) {
            currentElement[options[type + 'Key']] = [];
        }
        if (currentElement[options[type + 'Key']] && !(currentElement[options[type + 'Key']] instanceof Array)) {
            currentElement[options[type + 'Key']] = [currentElement[options[type + 'Key']]];
        }
        if (currentElement[options[type + 'Key']] instanceof Array) {
            currentElement[options[type + 'Key']].push(value);
        } else {
            currentElement[options[type + 'Key']] = value;
        }
    } else {
        if (!currentElement[options.elementsKey]) {
            currentElement[options.elementsKey] = [];
        }
        var key, element = {};
        element[options.typeKey] = type;
        if (type === 'instruction' && typeof value === 'object') {
            for (key in value) {
                if (value.hasOwnProperty(key)) {
                    break;
                }
            }
            element[options.nameKey] = key;
            if (options.instructionHasAttributes) {
                element[options.attributesKey] = value[key][options.attributesKey];
            } else {
                element[options[type + 'Key']] = value[key];
            }
        } else {
            element[options[type + 'Key']] = value;
        }
        if (options.addParent) {
            element[options.parentKey] = currentElement;
        }
        currentElement[options.elementsKey].push(element);
    }
}

function onInstruction(instruction) {
    var attributes = {};
    if (instruction.body && (instruction.name.toLowerCase() === 'xml' || options.instructionHasAttributes)) {
        while (instruction.body) {
            var attribute = instruction.body.match(/([\w:-]+)\s*=\s*"([^"]*)"|'([^']*)'|(\w+)\s*/);
            if (!attribute) {
                break;
            }
            attributes[attribute[1]] = attribute[2];
            instruction.body = instruction.body.slice(attribute[0].length); // advance the string
        }
    }
    if (instruction.name.toLowerCase() === 'xml') {
        if (options.ignoreDeclaration) {
            return;
        }
        currentElement[options.declarationKey] = {};
        if (Object.keys(attributes).length) {
            currentElement[options.declarationKey][options.attributesKey] = attributes;
        }
        if (options.addParent) {
            currentElement[options.declarationKey][options.parentKey] = currentElement;
        }
    } else {
        if (options.ignoreInstruction) {
            return;
        }
        if (options.trim) {
            instruction.body = instruction.body.trim();
        }
        if (options.sanitize) {
            instruction.body = common.sanitize(instruction.body);
        }
        var value = {};
        if (options.instructionHasAttributes && Object.keys(attributes).length) {
            value[instruction.name] = {};
            value[instruction.name][options.attributesKey] = attributes;
        } else {
            value[instruction.name] = instruction.body;
        }
        addField('instruction', value, options);
    }
}

function onStartElement(name, attributes) {
    var key, element;
    if (typeof name === 'object') {
        attributes = name.attributes;
        name = name.name;
    }
    if (options.trim && attributes) {
        for (key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                attributes[key] = attributes[key].trim();
            }
        }
    }
    if (options.compact) {
        element = {};
        if (!options.ignoreAttributes && attributes && Object.keys(attributes).length) {
            element[options.attributesKey] = {};
            for (key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                    element[options.attributesKey][key] = attributes[key];
                }
            }
        }
        if (!(name in currentElement) && options.alwaysArray) {
            currentElement[name] = [];
        }
        if (currentElement[name] && !(currentElement[name] instanceof Array)) {
            currentElement[name] = [currentElement[name]];
        }
        if (currentElement[name] instanceof Array) {
            currentElement[name].push(element);
        } else {
            currentElement[name] = element;
        }
    } else {
        if (!currentElement[options.elementsKey]) {
            currentElement[options.elementsKey] = [];
        }
        element = {};
        element[options.typeKey] = 'element';
        element[options.nameKey] = name;
        if (!options.ignoreAttributes && attributes && Object.keys(attributes).length) {
            element[options.attributesKey] = attributes;
        }
        if (options.alwaysChildren) {
            element[options.elementsKey] = [];
        }
        currentElement[options.elementsKey].push(element);
    }
    // if (options.addParent) {
        element[options.parentKey] = currentElement;
    // }
    currentElement = element;
}

function onText(text) {
    if (options.ignoreText) {
        return;
    }
    if (!text.trim()) {
        return;
    }
    if (options.trim) {
        text = text.trim();
    }
    if (options.nativeType) {
        text = nativeType(text);
    }
    if (options.sanitize) {
        text = common.sanitize(text);
    }
    addField('text', text, options);
}

function onComment(comment) {
    if (options.ignoreComment) {
        return;
    }
    if (options.trim) {
        comment = comment.trim();
    }
    if (options.sanitize) {
        comment = common.sanitize(comment);
    }
    addField('comment', comment, options);
}

function onEndElement(name) {
    var parentElement = currentElement[options.parentKey];
    if (!options.addParent) {
        delete currentElement[options.parentKey];
    }
    currentElement = parentElement;
}

function onCdata(cdata) {
    if (options.ignoreCdata) {
        return;
    }
    if (options.trim) {
        cdata = cdata.trim();
    }
    addField('cdata', cdata, options);
}

function onDoctype(doctype) {
    if (options.ignoreDoctype) {
        return;
    }
    doctype = doctype.replace(/^ /, '');
    if (options.trim) {
        doctype = doctype.trim();
    }
    addField('doctype', doctype, options);
}

function onError(error) {
    error.note = error; //console.error(error);
}

module.exports = function (xml, userOptions) {

    var parser = pureJsParser ? sax.parser(true, {}) : parser = new expat.Parser('UTF-8');
    var result = {};
    currentElement = result;

    options = validateOptions(userOptions);

    if (pureJsParser) {
        parser.onopentag = onStartElement;
        parser.ontext = onText;
        parser.oncomment = onComment;
        parser.onclosetag = onEndElement;
        parser.onerror = onError;
        parser.oncdata = onCdata;
        parser.ondoctype = onDoctype;
        parser.onprocessinginstruction = onInstruction;
    } else {
        parser.on('startElement', onStartElement);
        parser.on('text', onText);
        parser.on('comment', onComment);
        parser.on('endElement', onEndElement);
        parser.on('error', onError);
        //parser.on('startCdata', onStartCdata);
        //parser.on('endCdata', onEndCdata);
        //parser.on('entityDecl', onEntityDecl);
    }

    if (pureJsParser) {
        parser.write(xml).close();
    } else {
        if (!parser.parse(xml)) {
            throw new Error('XML parsing error: ' + parser.getError());
        }
    }

    if (result[options.elementsKey]) {
        var temp = result[options.elementsKey];
        delete result[options.elementsKey];
        result[options.elementsKey] = temp;
        delete result.text;
    }

    return result;

};


/***/ }),
/* 18 */
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

module.exports = Readable;

/*<replacement>*/
var processNextTick = __webpack_require__(11);
/*</replacement>*/

/*<replacement>*/
var isArray = __webpack_require__(18);
/*</replacement>*/

/*<replacement>*/
var Buffer = __webpack_require__(0).Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = __webpack_require__(10);

/*<replacement>*/
var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = __webpack_require__(9);
  } catch (_) {} finally {
    if (!Stream) Stream = __webpack_require__(10).EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = __webpack_require__(0).Buffer;

/*<replacement>*/
var util = __webpack_require__(8);
util.inherits = __webpack_require__(5);
/*</replacement>*/

/*<replacement>*/
var debugUtil = __webpack_require__(39);
var debug = undefined;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var StringDecoder;

util.inherits(Readable, Stream);

var Duplex;
function ReadableState(options, stream) {
  Duplex = Duplex || __webpack_require__(2);

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = __webpack_require__(13).StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

var Duplex;
function Readable(options) {
  Duplex = Duplex || __webpack_require__(2);

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      var skipAdd;
      if (state.decoder && !addToFront && !encoding) {
        chunk = state.decoder.write(chunk);
        skipAdd = !state.objectMode && chunk.length === 0;
      }

      if (!addToFront) state.reading = false;

      // Don't add to the buffer if we've decoded to an empty string chunk and
      // we're not in object mode
      if (!skipAdd) {
        // if we want the data now, just emit it.
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = __webpack_require__(13).StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended) return 0;

  if (state.objectMode) return n === 0 ? 0 : 1;

  if (n === null || isNaN(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length) return state.buffer[0].length;else return state.length;
  }

  if (n <= 0) return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else {
      return state.length;
    }
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading) n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended) state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0) endReadable(this);

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      if (state.pipesCount === 1 && state.pipes[0] === dest && src.listenerCount('data') === 1 && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error) dest.on('error', onerror);else if (isArray(dest._events.error)) dest._events.error.unshift(onerror);else dest._events.error = [onerror, dest._events.error];

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var _i = 0; _i < len; _i++) {
      dests[_i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1) return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && !this._readableState.endEmitted) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function (ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0) return null;

  if (length === 0) ret = null;else if (objectMode) ret = list.shift();else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode) ret = list.join('');else if (list.length === 1) ret = list[0];else ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode) ret = '';else ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode) ret += buf.slice(0, cpy);else buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length) list[0] = buf.slice(cpy);else list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.



module.exports = PassThrough;

var Transform = __webpack_require__(14);

/*<replacement>*/
var util = __webpack_require__(8);
util.inherits = __webpack_require__(5);
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

var common = __webpack_require__(15);

function validateOptions(userOptions) {
    var options = common.copyOptions(userOptions);
    common.ensureFlagExists('ignoreDeclaration', options);
    common.ensureFlagExists('ignoreInstruction', options);
    common.ensureFlagExists('ignoreAttributes', options);
    common.ensureFlagExists('ignoreText', options);
    common.ensureFlagExists('ignoreComment', options);
    common.ensureFlagExists('ignoreCdata', options);
    common.ensureFlagExists('ignoreDoctype', options);
    common.ensureFlagExists('compact', options);
    common.ensureFlagExists('indentText', options);
    common.ensureFlagExists('indentCdata', options);
    common.ensureFlagExists('indentInstruction', options);
    common.ensureFlagExists('fullTagEmptyElement', options);
    common.ensureSpacesExists(options);
    if (typeof options.spaces === 'number') {
        options.spaces = Array(options.spaces + 1).join(' ');
    }
    common.ensureKeyExists('declaration', options);
    common.ensureKeyExists('instruction', options);
    common.ensureKeyExists('attributes', options);
    common.ensureKeyExists('text', options);
    common.ensureKeyExists('comment', options);
    common.ensureKeyExists('cdata', options);
    common.ensureKeyExists('doctype', options);
    common.ensureKeyExists('type', options);
    common.ensureKeyExists('name', options);
    common.ensureKeyExists('elements', options);
    return options;
}

function writeIndentation(options, depth, firstLine) {
    return (!firstLine && options.spaces ? '\n' : '') + Array(depth + 1).join(options.spaces);
}

function writeAttributes(attributes, options) {
    if (options.ignoreAttributes) {
        return '';
    }
    var key, result = '';
    for (key in attributes) {
        if (attributes.hasOwnProperty(key)) {
            result += ' ' + key + '="' + attributes[key] + '"';
        }
    }
    return result;
}

function writeDeclaration(declaration, options) {
    return options.ignoreDeclaration ? '' :  '<?xml' + writeAttributes(declaration[options.attributesKey], options) + '?>';
}

function writeInstruction(instruction, options) {
    if (options.ignoreInstruction) {
        return '';
    }
    var key;
    for (key in instruction) {
        if (instruction.hasOwnProperty(key)) {
            break;
        }
    }
    if (typeof instruction[key] === 'object') {
        return '<?' + key + writeAttributes(instruction[key][options.attributesKey], options) + '?>';
    } else {
        return '<?' + key + (instruction[key] ? ' ' + instruction[key] : '') + '?>';
    }
}

function writeComment(comment, options) {
    return options.ignoreComment ? '' : '<!--' + comment + '-->';
}

function writeCdata(cdata, options) {
    return options.ignoreCdata ? '' : '<![CDATA[' + cdata + ']]>';
}

function writeDoctype(doctype, options) {
    return options.ignoreDoctype ? '' : '<!DOCTYPE ' + doctype + '>';
}

function writeText(text, options) {
    return options.ignoreText ? '' : text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function hasContent(element, options) {
    var i;
    if (element.elements && element.elements.length) {
        for (i = 0; i < element.elements.length; ++i) {
            switch (element.elements[i][options.typeKey]) {
                case 'text':
                    if (options.indentText) {
                        return true;
                    }
                    break; // skip to next key
                case 'cdata':
                    if (options.indentCdata) {
                        return true;
                    }
                    break; // skip to next key
                case 'instruction':
                    if (options.indentInstruction) {
                        return true;
                    }
                    break; // skip to next key
                case 'doctype':
                case 'comment':
                case 'element':
                    return true;
                default:
                    return true;
            }
        }
    }
    return false;
}

function writeElement(element, options, depth) {
    var xml = '';
    xml += '<' + element.name;
    if (element[options.attributesKey]) {
        xml += writeAttributes(element[options.attributesKey], options);
    }
    if (options.fullTagEmptyElement || (element[options.elementsKey] && element[options.elementsKey].length) || (element[options.attributesKey] && element[options.attributesKey]['xml:space'] === 'preserve')) {
        xml += '>';
        if (element[options.elementsKey] && element[options.elementsKey].length) {
            xml += writeElements(element[options.elementsKey], options, depth + 1);
        }
        xml += options.spaces && hasContent(element, options) ? '\n' + Array(depth + 1).join(options.spaces) : '';
        xml += '</' + element.name + '>';
    } else {
        xml += '/>';
    }
    return xml;
}

function writeElements(elements, options, depth, firstLine) {
    return elements.reduce(function (xml, element) {
        var indent = writeIndentation(options, depth, firstLine && !xml);
        switch (element.type) {
            case 'element': return xml + indent + writeElement(element, options, depth);
            case 'comment': return xml + indent + writeComment(element[options.commentKey], options);
            case 'doctype': return xml + indent + writeDoctype(element[options.doctypeKey], options);
            case 'cdata': return xml + (options.indentCdata ? indent : '') + writeCdata(element[options.cdataKey], options);
            case 'text': return xml + (options.indentText ? indent : '') + writeText(element[options.textKey], options);
            case 'instruction':
                var instruction = {};
                instruction[element[options.nameKey]] = element[options.attributesKey] ? element : element[options.instructionKey];
                return xml + (options.indentInstruction ? indent : '') + writeInstruction(instruction, options);
        }
    }, '');
}

function hasContentCompact(element, options, anyContent) {
    var key;
    for (key in element) {
        if (element.hasOwnProperty(key)) {
            switch (key) {
                case options.parentKey:
                case options.attributesKey:
                    break; // skip to next key
                case options.textKey:
                    if (options.indentText || anyContent) {
                        return true;
                    }
                    break; // skip to next key
                case options.cdataKey:
                    if (options.indentCdata || anyContent) {
                        return true;
                    }
                    break; // skip to next key
                case options.instructionKey:
                    if (options.indentInstruction || anyContent) {
                        return true;
                    }
                    break; // skip to next key
                case options.doctypeKey:
                case options.commentKey:
                    return true;
                default:
                    return true;
            }
        }
    }
    return false;
}

function writeElementCompact(element, name, options, depth, indent) {
    var xml = '';
    if (name) {
        xml += '<' + name;
        if (element[options.attributesKey]) {
            xml += writeAttributes(element[options.attributesKey], options);
        }
        if (options.fullTagEmptyElement || hasContentCompact(element, options, true) || element[options.attributesKey] && element[options.attributesKey]['xml:space'] === 'preserve') {
            xml += '>';
        } else {
            xml += '/>';
            return xml;
        }
    }
    xml += writeElementsCompact(element, options, depth + 1, false);
    if (name) {
        xml += (indent ? writeIndentation(options, depth, false) : '') + '</' + name + '>';
    }
    return xml;
}

function writeElementsCompact(element, options, depth, firstLine) {
    var i, key, nodes, xml = '';
    for (key in element) {
        if (element.hasOwnProperty(key)) {
            nodes = element[key] instanceof Array ? element[key] : [element[key]];
            for (i = 0; i < nodes.length; ++i) {
                switch (key) {
                    case options.declarationKey: xml += writeDeclaration(nodes[i], options); break;
                    case options.instructionKey: xml += (options.indentInstruction ? writeIndentation(options, depth, firstLine) : '') + writeInstruction(nodes[i], options); break;
                    case options.attributesKey: case options.parentKey: break; // skip
                    case options.textKey: xml += (options.indentText ? writeIndentation(options, depth, firstLine) : '') + writeText(nodes[i], options); break;
                    case options.cdataKey: xml += (options.indentCdata ? writeIndentation(options, depth, firstLine) : '') + writeCdata(nodes[i], options); break;
                    case options.doctypeKey: xml += writeIndentation(options, depth, firstLine) + writeDoctype(nodes[i], options); break;
                    case options.commentKey: xml += writeIndentation(options, depth, firstLine) + writeComment(nodes[i], options); break;
                    default: xml += writeIndentation(options, depth, firstLine) + writeElementCompact(nodes[i], key, options, depth, hasContentCompact(nodes[i], options));
                }
                firstLine = firstLine && !xml;
            }
        }
    }
    return xml;
}

module.exports = function (js, options) {
    'use strict';
    options = validateOptions(options);
    var xml = '';
    if (options.compact) {
        xml = writeElementsCompact(js, options, 0, true);
    } else {
        if (js[options.declarationKey]) {
            xml += writeDeclaration(js[options.declarationKey], options);
        }
        if (js[options.elementsKey] && js[options.elementsKey].length) {
            xml += writeElements(js[options.elementsKey], options, 0, !xml);
        }
    }
    return xml;
};


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*fs-web@1.0.0#directory_entry*/

Object.defineProperty(exports, '__esModule', { value: true });
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}
var _path = __webpack_require__(22);
var _path2 = _interopRequireDefault(_path);
function DirectoryEntry(fullPath, type) {
    this.path = fullPath;
    this.name = _path2['default'].basename(fullPath);
    this.dir = _path2['default'].dirname(fullPath);
    this.type = type;
}
exports['default'] = DirectoryEntry;
module.exports = exports['default'];

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, global) {var __WEBPACK_AMD_DEFINE_RESULT__;/*! https://mths.be/utf8js v2.1.2 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from https://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from https://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	function checkScalarValue(codePoint) {
		if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
			throw Error(
				'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
				' is not a scalar value'
			);
		}
	}
	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			checkScalarValue(codePoint);
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function utf8encode(string) {
		var codePoints = ucs2decode(string);
		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				checkScalarValue(codePoint);
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var utf8 = {
		'version': '2.1.2',
		'encode': utf8encode,
		'decode': utf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		true
	) {
		!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
			return utf8;
		}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = utf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in utf8) {
				hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.utf8 = utf8;
	}

}(this));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(53)(module), __webpack_require__(7)))

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var owncloud = __webpack_require__(26);
var oc = new owncloud();

window.oc = oc;

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var ownCloud = __webpack_require__(27);

module.exports = ownCloud;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

/////////////////////////////
///////    GENERAL    ///////
/////////////////////////////

var Promise = __webpack_require__(1);
var parser = __webpack_require__(4);
var helperFile = __webpack_require__(49);
var apps = __webpack_require__(55);
var shares = __webpack_require__(56);
var users = __webpack_require__(58);
var groups = __webpack_require__(59);
var files = __webpack_require__(60);
var helpers = new helperFile();

/**
 * @class ownCloud
 * @classdesc
 * <b><i> The ownCloud class, the main class which holds all other classes like shares, apps etc.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *  <li><b>General</b>
 *      <ul>
 *          <li>login</li>
 *          <li>getConfig</li>
 *          <li>getVersion</li>
 *          <li>getCapabilities</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {string}  URL  URL of the ownCloud instance
 */
function ownCloud(instance) {
    var slash = '';
    instance = instance || '';

    if (instance.slice(-1) !== '/') {
        slash = '/';
    }

    var http = '';
    if (instance.slice(0, 4) !== "http") {
        http = 'http://';
    }
    var set = http + instance + slash;

    if (!instance) {
        set = '';
    }

    helpers.setInstance(set);

    this.apps = new apps(helpers);
    this.shares = new shares(helpers);
    this.users = new users(helpers);
    this.groups = new groups(helpers);
    this.files = new files(helpers);
}

/**
 * Logs in to the specified ownCloud instance (Updates capabilities)
 * @param   {string} username     name of the user to login
 * @param   {string} password     password of the user to login
 * @returns {Promise.<status>}    boolean: whether login was successful or not
 * @returns {Promise.<error>}     string: error message, if any.
 */
ownCloud.prototype.login = function(username, password) {
    helpers.setUsername(username);
    helpers.setPassword(password);

    /* jshint unused: false */
    return new Promise((resolve, reject) => {
        helpers._updateCapabilities()
            .then(body => {
                resolve(true);
            }).catch(error => {
                reject(error);
            });
    });
    /* jshint unused: true */
};

/**
 * Logs in to the specified ownCloud instance (Updates capabilities)
 * @param   {string}  instance    URL of the OC instance
 * @returns {boolean}             always true.
 */
ownCloud.prototype.setInstance = function(instance) {
    var slash = '';
    instance = instance || '';

    if (instance.slice(-1) !== '/') {
        slash = '/';
    }

    var http = '';
    if (instance.slice(0, 4) !== "http") {
        http = 'http://';
    }
    var set = http + instance + slash;

    if (!instance) {
        set = '';
    }

    helpers.setInstance(set);

    return true;
};

/**
 * Returns ownCloud config information
 * @returns {Promise.<configs>} object: {"version" : "1.7", "website" : "ownCloud" etc...}
 * @returns {Promise.<error>}     string: error message, if any.
 */
ownCloud.prototype.getConfig = function() {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', '', 'config')
            .then(data => {
                var tree = parser.xml2js(data.body, {
                    compact: true
                });
                resolve(tree.ocs.data);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Gets the ownCloud version of the connected server
 * @returns {Promise.<version>} string: ownCloud version
 * @returns {Promise.<error>}     string: error message, if any.
 */
ownCloud.prototype.getVersion = function() {
    var self = this;
    var version = helpers.getVersion();

    /* jshint unused: false */
    return new Promise((resolve, reject) => {
        if (version === null) {
            helpers._updateCapabilities()
                .then(body => {
                    resolve(helpers.getVersion());
                }).catch(error => {
                    reject(error);
                });
        } else {
            resolve(version);
        }
    });
};

/**
 * Gets the ownCloud app capabilities
 * @returns {Promise.<capabilities>}    string: ownCloud version
 * @returns {Promise.<reject>}             object: capabilites
 */
ownCloud.prototype.getCapabilities = function() {
    var self = this;
    var capabilities = helpers.getCapabilities();
    /* jshint unused: false */
    return new Promise((resolve, reject) => {
        if (capabilities === null) {
            helpers._updateCapabilities()
                .then(body => {
                    resolve(body);
                }).catch(error => {
                    reject(error);
                });
        } else {
            resolve(capabilities);
        }
    });
};

module.exports = ownCloud;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = __webpack_require__(3);
__webpack_require__(29);
__webpack_require__(30);
__webpack_require__(31);
__webpack_require__(32);
__webpack_require__(34);


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Promise = __webpack_require__(3);

module.exports = Promise;
Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this;
  self.then(null, function (err) {
    setTimeout(function () {
      throw err;
    }, 0);
  });
};


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Promise = __webpack_require__(3);

module.exports = Promise;
Promise.prototype['finally'] = function (f) {
  return this.then(function (value) {
    return Promise.resolve(f()).then(function () {
      return value;
    });
  }, function (err) {
    return Promise.resolve(f()).then(function () {
      throw err;
    });
  });
};


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = __webpack_require__(3);

module.exports = Promise;

/* Static Functions */

var TRUE = valuePromise(true);
var FALSE = valuePromise(false);
var NULL = valuePromise(null);
var UNDEFINED = valuePromise(undefined);
var ZERO = valuePromise(0);
var EMPTYSTRING = valuePromise('');

function valuePromise(value) {
  var p = new Promise(Promise._27);
  p._44 = 1;
  p._7 = value;
  return p;
}
Promise.resolve = function (value) {
  if (value instanceof Promise) return value;

  if (value === null) return NULL;
  if (value === undefined) return UNDEFINED;
  if (value === true) return TRUE;
  if (value === false) return FALSE;
  if (value === 0) return ZERO;
  if (value === '') return EMPTYSTRING;

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then;
      if (typeof then === 'function') {
        return new Promise(then.bind(value));
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;
    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        if (val instanceof Promise && val.then === Promise.prototype.then) {
          while (val._44 === 3) {
            val = val._7;
          }
          if (val._44 === 1) return res(i, val._7);
          if (val._44 === 2) reject(val._7);
          val.then(function (val) {
            res(i, val);
          }, reject);
          return;
        } else {
          var then = val.then;
          if (typeof then === 'function') {
            var p = new Promise(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
      }
      args[i] = val;
      if (--remaining === 0) {
        resolve(args);
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
};

Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    });
  });
};

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// This file contains then/promise specific extensions that are only useful
// for node.js interop

var Promise = __webpack_require__(3);
var asap = __webpack_require__(33);

module.exports = Promise;

/* Static Functions */

Promise.denodeify = function (fn, argumentCount) {
  if (
    typeof argumentCount === 'number' && argumentCount !== Infinity
  ) {
    return denodeifyWithCount(fn, argumentCount);
  } else {
    return denodeifyWithoutCount(fn);
  }
};

var callbackFn = (
  'function (err, res) {' +
  'if (err) { rj(err); } else { rs(res); }' +
  '}'
);
function denodeifyWithCount(fn, argumentCount) {
  var args = [];
  for (var i = 0; i < argumentCount; i++) {
    args.push('a' + i);
  }
  var body = [
    'return function (' + args.join(',') + ') {',
    'var self = this;',
    'return new Promise(function (rs, rj) {',
    'var res = fn.call(',
    ['self'].concat(args).concat([callbackFn]).join(','),
    ');',
    'if (res &&',
    '(typeof res === "object" || typeof res === "function") &&',
    'typeof res.then === "function"',
    ') {rs(res);}',
    '});',
    '};'
  ].join('');
  return Function(['Promise', 'fn'], body)(Promise, fn);
}
function denodeifyWithoutCount(fn) {
  var fnLength = Math.max(fn.length - 1, 3);
  var args = [];
  for (var i = 0; i < fnLength; i++) {
    args.push('a' + i);
  }
  var body = [
    'return function (' + args.join(',') + ') {',
    'var self = this;',
    'var args;',
    'var argLength = arguments.length;',
    'if (arguments.length > ' + fnLength + ') {',
    'args = new Array(arguments.length + 1);',
    'for (var i = 0; i < arguments.length; i++) {',
    'args[i] = arguments[i];',
    '}',
    '}',
    'return new Promise(function (rs, rj) {',
    'var cb = ' + callbackFn + ';',
    'var res;',
    'switch (argLength) {',
    args.concat(['extra']).map(function (_, index) {
      return (
        'case ' + (index) + ':' +
        'res = fn.call(' + ['self'].concat(args.slice(0, index)).concat('cb').join(',') + ');' +
        'break;'
      );
    }).join(''),
    'default:',
    'args[argLength] = cb;',
    'res = fn.apply(self, args);',
    '}',
    
    'if (res &&',
    '(typeof res === "object" || typeof res === "function") &&',
    'typeof res.then === "function"',
    ') {rs(res);}',
    '});',
    '};'
  ].join('');

  return Function(
    ['Promise', 'fn'],
    body
  )(Promise, fn);
}

Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var callback =
      typeof args[args.length - 1] === 'function' ? args.pop() : null;
    var ctx = this;
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx);
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) {
          reject(ex);
        });
      } else {
        asap(function () {
          callback.call(ctx, ex);
        })
      }
    }
  }
};

Promise.prototype.nodeify = function (callback, ctx) {
  if (typeof callback != 'function') return this;

  this.then(function (value) {
    asap(function () {
      callback.call(ctx, null, value);
    });
  }, function (err) {
    asap(function () {
      callback.call(ctx, err);
    });
  });
};


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// rawAsap provides everything we need except exception management.
var rawAsap = __webpack_require__(16);
// RawTasks are recycled to reduce GC churn.
var freeTasks = [];
// We queue errors to ensure they are thrown in right order (FIFO).
// Array-as-queue is good enough here, since we are just dealing with exceptions.
var pendingErrors = [];
var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);

function throwFirstError() {
    if (pendingErrors.length) {
        throw pendingErrors.shift();
    }
}

/**
 * Calls a task as soon as possible after returning, in its own event, with priority
 * over other events like animation, reflow, and repaint. An error thrown from an
 * event will not interrupt, nor even substantially slow down the processing of
 * other events, but will be rather postponed to a lower priority event.
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
module.exports = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    rawAsap(rawTask);
}

// We wrap tasks with recyclable task objects.  A task object implements
// `call`, just like a function.
function RawTask() {
    this.task = null;
}

// The sole purpose of wrapping the task is to catch the exception and recycle
// the task object after its single use.
RawTask.prototype.call = function () {
    try {
        this.task.call();
    } catch (error) {
        if (asap.onerror) {
            // This hook exists purely for testing purposes.
            // Its name will be periodically randomized to break any code that
            // depends on its existence.
            asap.onerror(error);
        } else {
            // In a web browser, exceptions are not fatal. However, to avoid
            // slowing down the queue of pending tasks, we rethrow the error in a
            // lower priority turn.
            pendingErrors.push(error);
            requestErrorThrow();
        }
    } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
    }
};


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Promise = __webpack_require__(3);

module.exports = Promise;
Promise.enableSynchronous = function () {
  Promise.prototype.isPending = function() {
    return this.getState() == 0;
  };

  Promise.prototype.isFulfilled = function() {
    return this.getState() == 1;
  };

  Promise.prototype.isRejected = function() {
    return this.getState() == 2;
  };

  Promise.prototype.getValue = function () {
    if (this._44 === 3) {
      return this._7.getValue();
    }

    if (!this.isFulfilled()) {
      throw new Error('Cannot get a value of an unfulfilled promise.');
    }

    return this._7;
  };

  Promise.prototype.getReason = function () {
    if (this._44 === 3) {
      return this._7.getReason();
    }

    if (!this.isRejected()) {
      throw new Error('Cannot get a rejection reason of a non-rejected promise.');
    }

    return this._7;
  };

  Promise.prototype.getState = function () {
    if (this._44 === 3) {
      return this._7.getState();
    }
    if (this._44 === -1 || this._44 === -2) {
      return 0;
    }

    return this._44;
  };
};

Promise.disableSynchronous = function() {
  Promise.prototype.isPending = undefined;
  Promise.prototype.isFulfilled = undefined;
  Promise.prototype.isRejected = undefined;
  Promise.prototype.getValue = undefined;
  Promise.prototype.getReason = undefined;
  Promise.prototype.getState = undefined;
};


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {;(function (sax) { // wrapper for non-node envs
  sax.parser = function (strict, opt) { return new SAXParser(strict, opt) }
  sax.SAXParser = SAXParser
  sax.SAXStream = SAXStream
  sax.createStream = createStream

  // When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
  // When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
  // since that's the earliest that a buffer overrun could occur.  This way, checks are
  // as rare as required, but as often as necessary to ensure never crossing this bound.
  // Furthermore, buffers are only tested at most once per write(), so passing a very
  // large string into write() might have undesirable effects, but this is manageable by
  // the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
  // edge case, result in creating at most one complete copy of the string passed in.
  // Set to Infinity to have unlimited buffers.
  sax.MAX_BUFFER_LENGTH = 64 * 1024

  var buffers = [
    'comment', 'sgmlDecl', 'textNode', 'tagName', 'doctype',
    'procInstName', 'procInstBody', 'entity', 'attribName',
    'attribValue', 'cdata', 'script'
  ]

  sax.EVENTS = [
    'text',
    'processinginstruction',
    'sgmldeclaration',
    'doctype',
    'comment',
    'opentagstart',
    'attribute',
    'opentag',
    'closetag',
    'opencdata',
    'cdata',
    'closecdata',
    'error',
    'end',
    'ready',
    'script',
    'opennamespace',
    'closenamespace'
  ]

  function SAXParser (strict, opt) {
    if (!(this instanceof SAXParser)) {
      return new SAXParser(strict, opt)
    }

    var parser = this
    clearBuffers(parser)
    parser.q = parser.c = ''
    parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH
    parser.opt = opt || {}
    parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags
    parser.looseCase = parser.opt.lowercase ? 'toLowerCase' : 'toUpperCase'
    parser.tags = []
    parser.closed = parser.closedRoot = parser.sawRoot = false
    parser.tag = parser.error = null
    parser.strict = !!strict
    parser.noscript = !!(strict || parser.opt.noscript)
    parser.state = S.BEGIN
    parser.strictEntities = parser.opt.strictEntities
    parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES)
    parser.attribList = []

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (parser.opt.xmlns) {
      parser.ns = Object.create(rootNS)
    }

    // mostly just for error reporting
    parser.trackPosition = parser.opt.position !== false
    if (parser.trackPosition) {
      parser.position = parser.line = parser.column = 0
    }
    emit(parser, 'onready')
  }

  if (!Object.create) {
    Object.create = function (o) {
      function F () {}
      F.prototype = o
      var newf = new F()
      return newf
    }
  }

  if (!Object.keys) {
    Object.keys = function (o) {
      var a = []
      for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
      return a
    }
  }

  function checkBufferLength (parser) {
    var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
    var maxActual = 0
    for (var i = 0, l = buffers.length; i < l; i++) {
      var len = parser[buffers[i]].length
      if (len > maxAllowed) {
        // Text/cdata nodes can get big, and since they're buffered,
        // we can get here under normal conditions.
        // Avoid issues by emitting the text node now,
        // so at least it won't get any bigger.
        switch (buffers[i]) {
          case 'textNode':
            closeText(parser)
            break

          case 'cdata':
            emitNode(parser, 'oncdata', parser.cdata)
            parser.cdata = ''
            break

          case 'script':
            emitNode(parser, 'onscript', parser.script)
            parser.script = ''
            break

          default:
            error(parser, 'Max buffer length exceeded: ' + buffers[i])
        }
      }
      maxActual = Math.max(maxActual, len)
    }
    // schedule the next check for the earliest possible buffer overrun.
    var m = sax.MAX_BUFFER_LENGTH - maxActual
    parser.bufferCheckPosition = m + parser.position
  }

  function clearBuffers (parser) {
    for (var i = 0, l = buffers.length; i < l; i++) {
      parser[buffers[i]] = ''
    }
  }

  function flushBuffers (parser) {
    closeText(parser)
    if (parser.cdata !== '') {
      emitNode(parser, 'oncdata', parser.cdata)
      parser.cdata = ''
    }
    if (parser.script !== '') {
      emitNode(parser, 'onscript', parser.script)
      parser.script = ''
    }
  }

  SAXParser.prototype = {
    end: function () { end(this) },
    write: write,
    resume: function () { this.error = null; return this },
    close: function () { return this.write(null) },
    flush: function () { flushBuffers(this) }
  }

  var Stream
  try {
    Stream = __webpack_require__(9).Stream
  } catch (ex) {
    Stream = function () {}
  }

  var streamWraps = sax.EVENTS.filter(function (ev) {
    return ev !== 'error' && ev !== 'end'
  })

  function createStream (strict, opt) {
    return new SAXStream(strict, opt)
  }

  function SAXStream (strict, opt) {
    if (!(this instanceof SAXStream)) {
      return new SAXStream(strict, opt)
    }

    Stream.apply(this)

    this._parser = new SAXParser(strict, opt)
    this.writable = true
    this.readable = true

    var me = this

    this._parser.onend = function () {
      me.emit('end')
    }

    this._parser.onerror = function (er) {
      me.emit('error', er)

      // if didn't throw, then means error was handled.
      // go ahead and clear error, so we can write again.
      me._parser.error = null
    }

    this._decoder = null

    streamWraps.forEach(function (ev) {
      Object.defineProperty(me, 'on' + ev, {
        get: function () {
          return me._parser['on' + ev]
        },
        set: function (h) {
          if (!h) {
            me.removeAllListeners(ev)
            me._parser['on' + ev] = h
            return h
          }
          me.on(ev, h)
        },
        enumerable: true,
        configurable: false
      })
    })
  }

  SAXStream.prototype = Object.create(Stream.prototype, {
    constructor: {
      value: SAXStream
    }
  })

  SAXStream.prototype.write = function (data) {
    if (typeof Buffer === 'function' &&
      typeof Buffer.isBuffer === 'function' &&
      Buffer.isBuffer(data)) {
      if (!this._decoder) {
        var SD = __webpack_require__(13).StringDecoder
        this._decoder = new SD('utf8')
      }
      data = this._decoder.write(data)
    }

    this._parser.write(data.toString())
    this.emit('data', data)
    return true
  }

  SAXStream.prototype.end = function (chunk) {
    if (chunk && chunk.length) {
      this.write(chunk)
    }
    this._parser.end()
    return true
  }

  SAXStream.prototype.on = function (ev, handler) {
    var me = this
    if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
      me._parser['on' + ev] = function () {
        var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments)
        args.splice(0, 0, ev)
        me.emit.apply(me, args)
      }
    }

    return Stream.prototype.on.call(me, ev, handler)
  }

  // this really needs to be replaced with character classes.
  // XML allows all manner of ridiculous numbers and digits.
  var CDATA = '[CDATA['
  var DOCTYPE = 'DOCTYPE'
  var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace'
  var XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
  var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

  // http://www.w3.org/TR/REC-xml/#NT-NameStartChar
  // This implementation works on strings, a single character at a time
  // as such, it cannot ever support astral-plane characters (10000-EFFFF)
  // without a significant breaking change to either this  parser, or the
  // JavaScript language.  Implementation of an emoji-capable xml parser
  // is left as an exercise for the reader.
  var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/

  var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/

  var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/
  var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/

  function isWhitespace (c) {
    return c === ' ' || c === '\n' || c === '\r' || c === '\t'
  }

  function isQuote (c) {
    return c === '"' || c === '\''
  }

  function isAttribEnd (c) {
    return c === '>' || isWhitespace(c)
  }

  function isMatch (regex, c) {
    return regex.test(c)
  }

  function notMatch (regex, c) {
    return !isMatch(regex, c)
  }

  var S = 0
  sax.STATE = {
    BEGIN: S++, // leading byte order mark or whitespace
    BEGIN_WHITESPACE: S++, // leading whitespace
    TEXT: S++, // general stuff
    TEXT_ENTITY: S++, // &amp and such.
    OPEN_WAKA: S++, // <
    SGML_DECL: S++, // <!BLARG
    SGML_DECL_QUOTED: S++, // <!BLARG foo "bar
    DOCTYPE: S++, // <!DOCTYPE
    DOCTYPE_QUOTED: S++, // <!DOCTYPE "//blah
    DOCTYPE_DTD: S++, // <!DOCTYPE "//blah" [ ...
    DOCTYPE_DTD_QUOTED: S++, // <!DOCTYPE "//blah" [ "foo
    COMMENT_STARTING: S++, // <!-
    COMMENT: S++, // <!--
    COMMENT_ENDING: S++, // <!-- blah -
    COMMENT_ENDED: S++, // <!-- blah --
    CDATA: S++, // <![CDATA[ something
    CDATA_ENDING: S++, // ]
    CDATA_ENDING_2: S++, // ]]
    PROC_INST: S++, // <?hi
    PROC_INST_BODY: S++, // <?hi there
    PROC_INST_ENDING: S++, // <?hi "there" ?
    OPEN_TAG: S++, // <strong
    OPEN_TAG_SLASH: S++, // <strong /
    ATTRIB: S++, // <a
    ATTRIB_NAME: S++, // <a foo
    ATTRIB_NAME_SAW_WHITE: S++, // <a foo _
    ATTRIB_VALUE: S++, // <a foo=
    ATTRIB_VALUE_QUOTED: S++, // <a foo="bar
    ATTRIB_VALUE_CLOSED: S++, // <a foo="bar"
    ATTRIB_VALUE_UNQUOTED: S++, // <a foo=bar
    ATTRIB_VALUE_ENTITY_Q: S++, // <foo bar="&quot;"
    ATTRIB_VALUE_ENTITY_U: S++, // <foo bar=&quot
    CLOSE_TAG: S++, // </a
    CLOSE_TAG_SAW_WHITE: S++, // </a   >
    SCRIPT: S++, // <script> ...
    SCRIPT_ENDING: S++ // <script> ... <
  }

  sax.XML_ENTITIES = {
    'amp': '&',
    'gt': '>',
    'lt': '<',
    'quot': '"',
    'apos': "'"
  }

  sax.ENTITIES = {
    'amp': '&',
    'gt': '>',
    'lt': '<',
    'quot': '"',
    'apos': "'",
    'AElig': 198,
    'Aacute': 193,
    'Acirc': 194,
    'Agrave': 192,
    'Aring': 197,
    'Atilde': 195,
    'Auml': 196,
    'Ccedil': 199,
    'ETH': 208,
    'Eacute': 201,
    'Ecirc': 202,
    'Egrave': 200,
    'Euml': 203,
    'Iacute': 205,
    'Icirc': 206,
    'Igrave': 204,
    'Iuml': 207,
    'Ntilde': 209,
    'Oacute': 211,
    'Ocirc': 212,
    'Ograve': 210,
    'Oslash': 216,
    'Otilde': 213,
    'Ouml': 214,
    'THORN': 222,
    'Uacute': 218,
    'Ucirc': 219,
    'Ugrave': 217,
    'Uuml': 220,
    'Yacute': 221,
    'aacute': 225,
    'acirc': 226,
    'aelig': 230,
    'agrave': 224,
    'aring': 229,
    'atilde': 227,
    'auml': 228,
    'ccedil': 231,
    'eacute': 233,
    'ecirc': 234,
    'egrave': 232,
    'eth': 240,
    'euml': 235,
    'iacute': 237,
    'icirc': 238,
    'igrave': 236,
    'iuml': 239,
    'ntilde': 241,
    'oacute': 243,
    'ocirc': 244,
    'ograve': 242,
    'oslash': 248,
    'otilde': 245,
    'ouml': 246,
    'szlig': 223,
    'thorn': 254,
    'uacute': 250,
    'ucirc': 251,
    'ugrave': 249,
    'uuml': 252,
    'yacute': 253,
    'yuml': 255,
    'copy': 169,
    'reg': 174,
    'nbsp': 160,
    'iexcl': 161,
    'cent': 162,
    'pound': 163,
    'curren': 164,
    'yen': 165,
    'brvbar': 166,
    'sect': 167,
    'uml': 168,
    'ordf': 170,
    'laquo': 171,
    'not': 172,
    'shy': 173,
    'macr': 175,
    'deg': 176,
    'plusmn': 177,
    'sup1': 185,
    'sup2': 178,
    'sup3': 179,
    'acute': 180,
    'micro': 181,
    'para': 182,
    'middot': 183,
    'cedil': 184,
    'ordm': 186,
    'raquo': 187,
    'frac14': 188,
    'frac12': 189,
    'frac34': 190,
    'iquest': 191,
    'times': 215,
    'divide': 247,
    'OElig': 338,
    'oelig': 339,
    'Scaron': 352,
    'scaron': 353,
    'Yuml': 376,
    'fnof': 402,
    'circ': 710,
    'tilde': 732,
    'Alpha': 913,
    'Beta': 914,
    'Gamma': 915,
    'Delta': 916,
    'Epsilon': 917,
    'Zeta': 918,
    'Eta': 919,
    'Theta': 920,
    'Iota': 921,
    'Kappa': 922,
    'Lambda': 923,
    'Mu': 924,
    'Nu': 925,
    'Xi': 926,
    'Omicron': 927,
    'Pi': 928,
    'Rho': 929,
    'Sigma': 931,
    'Tau': 932,
    'Upsilon': 933,
    'Phi': 934,
    'Chi': 935,
    'Psi': 936,
    'Omega': 937,
    'alpha': 945,
    'beta': 946,
    'gamma': 947,
    'delta': 948,
    'epsilon': 949,
    'zeta': 950,
    'eta': 951,
    'theta': 952,
    'iota': 953,
    'kappa': 954,
    'lambda': 955,
    'mu': 956,
    'nu': 957,
    'xi': 958,
    'omicron': 959,
    'pi': 960,
    'rho': 961,
    'sigmaf': 962,
    'sigma': 963,
    'tau': 964,
    'upsilon': 965,
    'phi': 966,
    'chi': 967,
    'psi': 968,
    'omega': 969,
    'thetasym': 977,
    'upsih': 978,
    'piv': 982,
    'ensp': 8194,
    'emsp': 8195,
    'thinsp': 8201,
    'zwnj': 8204,
    'zwj': 8205,
    'lrm': 8206,
    'rlm': 8207,
    'ndash': 8211,
    'mdash': 8212,
    'lsquo': 8216,
    'rsquo': 8217,
    'sbquo': 8218,
    'ldquo': 8220,
    'rdquo': 8221,
    'bdquo': 8222,
    'dagger': 8224,
    'Dagger': 8225,
    'bull': 8226,
    'hellip': 8230,
    'permil': 8240,
    'prime': 8242,
    'Prime': 8243,
    'lsaquo': 8249,
    'rsaquo': 8250,
    'oline': 8254,
    'frasl': 8260,
    'euro': 8364,
    'image': 8465,
    'weierp': 8472,
    'real': 8476,
    'trade': 8482,
    'alefsym': 8501,
    'larr': 8592,
    'uarr': 8593,
    'rarr': 8594,
    'darr': 8595,
    'harr': 8596,
    'crarr': 8629,
    'lArr': 8656,
    'uArr': 8657,
    'rArr': 8658,
    'dArr': 8659,
    'hArr': 8660,
    'forall': 8704,
    'part': 8706,
    'exist': 8707,
    'empty': 8709,
    'nabla': 8711,
    'isin': 8712,
    'notin': 8713,
    'ni': 8715,
    'prod': 8719,
    'sum': 8721,
    'minus': 8722,
    'lowast': 8727,
    'radic': 8730,
    'prop': 8733,
    'infin': 8734,
    'ang': 8736,
    'and': 8743,
    'or': 8744,
    'cap': 8745,
    'cup': 8746,
    'int': 8747,
    'there4': 8756,
    'sim': 8764,
    'cong': 8773,
    'asymp': 8776,
    'ne': 8800,
    'equiv': 8801,
    'le': 8804,
    'ge': 8805,
    'sub': 8834,
    'sup': 8835,
    'nsub': 8836,
    'sube': 8838,
    'supe': 8839,
    'oplus': 8853,
    'otimes': 8855,
    'perp': 8869,
    'sdot': 8901,
    'lceil': 8968,
    'rceil': 8969,
    'lfloor': 8970,
    'rfloor': 8971,
    'lang': 9001,
    'rang': 9002,
    'loz': 9674,
    'spades': 9824,
    'clubs': 9827,
    'hearts': 9829,
    'diams': 9830
  }

  Object.keys(sax.ENTITIES).forEach(function (key) {
    var e = sax.ENTITIES[key]
    var s = typeof e === 'number' ? String.fromCharCode(e) : e
    sax.ENTITIES[key] = s
  })

  for (var s in sax.STATE) {
    sax.STATE[sax.STATE[s]] = s
  }

  // shorthand
  S = sax.STATE

  function emit (parser, event, data) {
    parser[event] && parser[event](data)
  }

  function emitNode (parser, nodeType, data) {
    if (parser.textNode) closeText(parser)
    emit(parser, nodeType, data)
  }

  function closeText (parser) {
    parser.textNode = textopts(parser.opt, parser.textNode)
    if (parser.textNode) emit(parser, 'ontext', parser.textNode)
    parser.textNode = ''
  }

  function textopts (opt, text) {
    if (opt.trim) text = text.trim()
    if (opt.normalize) text = text.replace(/\s+/g, ' ')
    return text
  }

  function error (parser, er) {
    closeText(parser)
    if (parser.trackPosition) {
      er += '\nLine: ' + parser.line +
        '\nColumn: ' + parser.column +
        '\nChar: ' + parser.c
    }
    er = new Error(er)
    parser.error = er
    emit(parser, 'onerror', er)
    return parser
  }

  function end (parser) {
    if (parser.sawRoot && !parser.closedRoot) strictFail(parser, 'Unclosed root tag')
    if ((parser.state !== S.BEGIN) &&
      (parser.state !== S.BEGIN_WHITESPACE) &&
      (parser.state !== S.TEXT)) {
      error(parser, 'Unexpected end')
    }
    closeText(parser)
    parser.c = ''
    parser.closed = true
    emit(parser, 'onend')
    SAXParser.call(parser, parser.strict, parser.opt)
    return parser
  }

  function strictFail (parser, message) {
    if (typeof parser !== 'object' || !(parser instanceof SAXParser)) {
      throw new Error('bad call to strictFail')
    }
    if (parser.strict) {
      error(parser, message)
    }
  }

  function newTag (parser) {
    if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]()
    var parent = parser.tags[parser.tags.length - 1] || parser
    var tag = parser.tag = { name: parser.tagName, attributes: {} }

    // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
    if (parser.opt.xmlns) {
      tag.ns = parent.ns
    }
    parser.attribList.length = 0
    emitNode(parser, 'onopentagstart', tag)
  }

  function qname (name, attribute) {
    var i = name.indexOf(':')
    var qualName = i < 0 ? [ '', name ] : name.split(':')
    var prefix = qualName[0]
    var local = qualName[1]

    // <x "xmlns"="http://foo">
    if (attribute && name === 'xmlns') {
      prefix = 'xmlns'
      local = ''
    }

    return { prefix: prefix, local: local }
  }

  function attrib (parser) {
    if (!parser.strict) {
      parser.attribName = parser.attribName[parser.looseCase]()
    }

    if (parser.attribList.indexOf(parser.attribName) !== -1 ||
      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
      parser.attribName = parser.attribValue = ''
      return
    }

    if (parser.opt.xmlns) {
      var qn = qname(parser.attribName, true)
      var prefix = qn.prefix
      var local = qn.local

      if (prefix === 'xmlns') {
        // namespace binding attribute. push the binding into scope
        if (local === 'xml' && parser.attribValue !== XML_NAMESPACE) {
          strictFail(parser,
            'xml: prefix must be bound to ' + XML_NAMESPACE + '\n' +
            'Actual: ' + parser.attribValue)
        } else if (local === 'xmlns' && parser.attribValue !== XMLNS_NAMESPACE) {
          strictFail(parser,
            'xmlns: prefix must be bound to ' + XMLNS_NAMESPACE + '\n' +
            'Actual: ' + parser.attribValue)
        } else {
          var tag = parser.tag
          var parent = parser.tags[parser.tags.length - 1] || parser
          if (tag.ns === parent.ns) {
            tag.ns = Object.create(parent.ns)
          }
          tag.ns[local] = parser.attribValue
        }
      }

      // defer onattribute events until all attributes have been seen
      // so any new bindings can take effect. preserve attribute order
      // so deferred events can be emitted in document order
      parser.attribList.push([parser.attribName, parser.attribValue])
    } else {
      // in non-xmlns mode, we can emit the event right away
      parser.tag.attributes[parser.attribName] = parser.attribValue
      emitNode(parser, 'onattribute', {
        name: parser.attribName,
        value: parser.attribValue
      })
    }

    parser.attribName = parser.attribValue = ''
  }

  function openTag (parser, selfClosing) {
    if (parser.opt.xmlns) {
      // emit namespace binding events
      var tag = parser.tag

      // add namespace info to tag
      var qn = qname(parser.tagName)
      tag.prefix = qn.prefix
      tag.local = qn.local
      tag.uri = tag.ns[qn.prefix] || ''

      if (tag.prefix && !tag.uri) {
        strictFail(parser, 'Unbound namespace prefix: ' +
          JSON.stringify(parser.tagName))
        tag.uri = qn.prefix
      }

      var parent = parser.tags[parser.tags.length - 1] || parser
      if (tag.ns && parent.ns !== tag.ns) {
        Object.keys(tag.ns).forEach(function (p) {
          emitNode(parser, 'onopennamespace', {
            prefix: p,
            uri: tag.ns[p]
          })
        })
      }

      // handle deferred onattribute events
      // Note: do not apply default ns to attributes:
      //   http://www.w3.org/TR/REC-xml-names/#defaulting
      for (var i = 0, l = parser.attribList.length; i < l; i++) {
        var nv = parser.attribList[i]
        var name = nv[0]
        var value = nv[1]
        var qualName = qname(name, true)
        var prefix = qualName.prefix
        var local = qualName.local
        var uri = prefix === '' ? '' : (tag.ns[prefix] || '')
        var a = {
          name: name,
          value: value,
          prefix: prefix,
          local: local,
          uri: uri
        }

        // if there's any attributes with an undefined namespace,
        // then fail on them now.
        if (prefix && prefix !== 'xmlns' && !uri) {
          strictFail(parser, 'Unbound namespace prefix: ' +
            JSON.stringify(prefix))
          a.uri = prefix
        }
        parser.tag.attributes[name] = a
        emitNode(parser, 'onattribute', a)
      }
      parser.attribList.length = 0
    }

    parser.tag.isSelfClosing = !!selfClosing

    // process the tag
    parser.sawRoot = true
    parser.tags.push(parser.tag)
    emitNode(parser, 'onopentag', parser.tag)
    if (!selfClosing) {
      // special case for <script> in non-strict mode.
      if (!parser.noscript && parser.tagName.toLowerCase() === 'script') {
        parser.state = S.SCRIPT
      } else {
        parser.state = S.TEXT
      }
      parser.tag = null
      parser.tagName = ''
    }
    parser.attribName = parser.attribValue = ''
    parser.attribList.length = 0
  }

  function closeTag (parser) {
    if (!parser.tagName) {
      strictFail(parser, 'Weird empty close tag.')
      parser.textNode += '</>'
      parser.state = S.TEXT
      return
    }

    if (parser.script) {
      if (parser.tagName !== 'script') {
        parser.script += '</' + parser.tagName + '>'
        parser.tagName = ''
        parser.state = S.SCRIPT
        return
      }
      emitNode(parser, 'onscript', parser.script)
      parser.script = ''
    }

    // first make sure that the closing tag actually exists.
    // <a><b></c></b></a> will close everything, otherwise.
    var t = parser.tags.length
    var tagName = parser.tagName
    if (!parser.strict) {
      tagName = tagName[parser.looseCase]()
    }
    var closeTo = tagName
    while (t--) {
      var close = parser.tags[t]
      if (close.name !== closeTo) {
        // fail the first time in strict mode
        strictFail(parser, 'Unexpected close tag')
      } else {
        break
      }
    }

    // didn't find it.  we already failed for strict, so just abort.
    if (t < 0) {
      strictFail(parser, 'Unmatched closing tag: ' + parser.tagName)
      parser.textNode += '</' + parser.tagName + '>'
      parser.state = S.TEXT
      return
    }
    parser.tagName = tagName
    var s = parser.tags.length
    while (s-- > t) {
      var tag = parser.tag = parser.tags.pop()
      parser.tagName = parser.tag.name
      emitNode(parser, 'onclosetag', parser.tagName)

      var x = {}
      for (var i in tag.ns) {
        x[i] = tag.ns[i]
      }

      var parent = parser.tags[parser.tags.length - 1] || parser
      if (parser.opt.xmlns && tag.ns !== parent.ns) {
        // remove namespace bindings introduced by tag
        Object.keys(tag.ns).forEach(function (p) {
          var n = tag.ns[p]
          emitNode(parser, 'onclosenamespace', { prefix: p, uri: n })
        })
      }
    }
    if (t === 0) parser.closedRoot = true
    parser.tagName = parser.attribValue = parser.attribName = ''
    parser.attribList.length = 0
    parser.state = S.TEXT
  }

  function parseEntity (parser) {
    var entity = parser.entity
    var entityLC = entity.toLowerCase()
    var num
    var numStr = ''

    if (parser.ENTITIES[entity]) {
      return parser.ENTITIES[entity]
    }
    if (parser.ENTITIES[entityLC]) {
      return parser.ENTITIES[entityLC]
    }
    entity = entityLC
    if (entity.charAt(0) === '#') {
      if (entity.charAt(1) === 'x') {
        entity = entity.slice(2)
        num = parseInt(entity, 16)
        numStr = num.toString(16)
      } else {
        entity = entity.slice(1)
        num = parseInt(entity, 10)
        numStr = num.toString(10)
      }
    }
    entity = entity.replace(/^0+/, '')
    if (isNaN(num) || numStr.toLowerCase() !== entity) {
      strictFail(parser, 'Invalid character entity')
      return '&' + parser.entity + ';'
    }

    return String.fromCodePoint(num)
  }

  function beginWhiteSpace (parser, c) {
    if (c === '<') {
      parser.state = S.OPEN_WAKA
      parser.startTagPosition = parser.position
    } else if (!isWhitespace(c)) {
      // have to process this as a text node.
      // weird, but happens.
      strictFail(parser, 'Non-whitespace before first tag.')
      parser.textNode = c
      parser.state = S.TEXT
    }
  }

  function charAt (chunk, i) {
    var result = ''
    if (i < chunk.length) {
      result = chunk.charAt(i)
    }
    return result
  }

  function write (chunk) {
    var parser = this
    if (this.error) {
      throw this.error
    }
    if (parser.closed) {
      return error(parser,
        'Cannot write after close. Assign an onready handler.')
    }
    if (chunk === null) {
      return end(parser)
    }
    if (typeof chunk === 'object') {
      chunk = chunk.toString()
    }
    var i = 0
    var c = ''
    while (true) {
      c = charAt(chunk, i++)
      parser.c = c

      if (!c) {
        break
      }

      if (parser.trackPosition) {
        parser.position++
        if (c === '\n') {
          parser.line++
          parser.column = 0
        } else {
          parser.column++
        }
      }

      switch (parser.state) {
        case S.BEGIN:
          parser.state = S.BEGIN_WHITESPACE
          if (c === '\uFEFF') {
            continue
          }
          beginWhiteSpace(parser, c)
          continue

        case S.BEGIN_WHITESPACE:
          beginWhiteSpace(parser, c)
          continue

        case S.TEXT:
          if (parser.sawRoot && !parser.closedRoot) {
            var starti = i - 1
            while (c && c !== '<' && c !== '&') {
              c = charAt(chunk, i++)
              if (c && parser.trackPosition) {
                parser.position++
                if (c === '\n') {
                  parser.line++
                  parser.column = 0
                } else {
                  parser.column++
                }
              }
            }
            parser.textNode += chunk.substring(starti, i - 1)
          }
          if (c === '<' && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
            parser.state = S.OPEN_WAKA
            parser.startTagPosition = parser.position
          } else {
            if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) {
              strictFail(parser, 'Text data outside of root node.')
            }
            if (c === '&') {
              parser.state = S.TEXT_ENTITY
            } else {
              parser.textNode += c
            }
          }
          continue

        case S.SCRIPT:
          // only non-strict
          if (c === '<') {
            parser.state = S.SCRIPT_ENDING
          } else {
            parser.script += c
          }
          continue

        case S.SCRIPT_ENDING:
          if (c === '/') {
            parser.state = S.CLOSE_TAG
          } else {
            parser.script += '<' + c
            parser.state = S.SCRIPT
          }
          continue

        case S.OPEN_WAKA:
          // either a /, ?, !, or text is coming next.
          if (c === '!') {
            parser.state = S.SGML_DECL
            parser.sgmlDecl = ''
          } else if (isWhitespace(c)) {
            // wait for it...
          } else if (isMatch(nameStart, c)) {
            parser.state = S.OPEN_TAG
            parser.tagName = c
          } else if (c === '/') {
            parser.state = S.CLOSE_TAG
            parser.tagName = ''
          } else if (c === '?') {
            parser.state = S.PROC_INST
            parser.procInstName = parser.procInstBody = ''
          } else {
            strictFail(parser, 'Unencoded <')
            // if there was some whitespace, then add that in.
            if (parser.startTagPosition + 1 < parser.position) {
              var pad = parser.position - parser.startTagPosition
              c = new Array(pad).join(' ') + c
            }
            parser.textNode += '<' + c
            parser.state = S.TEXT
          }
          continue

        case S.SGML_DECL:
          if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
            emitNode(parser, 'onopencdata')
            parser.state = S.CDATA
            parser.sgmlDecl = ''
            parser.cdata = ''
          } else if (parser.sgmlDecl + c === '--') {
            parser.state = S.COMMENT
            parser.comment = ''
            parser.sgmlDecl = ''
          } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
            parser.state = S.DOCTYPE
            if (parser.doctype || parser.sawRoot) {
              strictFail(parser,
                'Inappropriately located doctype declaration')
            }
            parser.doctype = ''
            parser.sgmlDecl = ''
          } else if (c === '>') {
            emitNode(parser, 'onsgmldeclaration', parser.sgmlDecl)
            parser.sgmlDecl = ''
            parser.state = S.TEXT
          } else if (isQuote(c)) {
            parser.state = S.SGML_DECL_QUOTED
            parser.sgmlDecl += c
          } else {
            parser.sgmlDecl += c
          }
          continue

        case S.SGML_DECL_QUOTED:
          if (c === parser.q) {
            parser.state = S.SGML_DECL
            parser.q = ''
          }
          parser.sgmlDecl += c
          continue

        case S.DOCTYPE:
          if (c === '>') {
            parser.state = S.TEXT
            emitNode(parser, 'ondoctype', parser.doctype)
            parser.doctype = true // just remember that we saw it.
          } else {
            parser.doctype += c
            if (c === '[') {
              parser.state = S.DOCTYPE_DTD
            } else if (isQuote(c)) {
              parser.state = S.DOCTYPE_QUOTED
              parser.q = c
            }
          }
          continue

        case S.DOCTYPE_QUOTED:
          parser.doctype += c
          if (c === parser.q) {
            parser.q = ''
            parser.state = S.DOCTYPE
          }
          continue

        case S.DOCTYPE_DTD:
          parser.doctype += c
          if (c === ']') {
            parser.state = S.DOCTYPE
          } else if (isQuote(c)) {
            parser.state = S.DOCTYPE_DTD_QUOTED
            parser.q = c
          }
          continue

        case S.DOCTYPE_DTD_QUOTED:
          parser.doctype += c
          if (c === parser.q) {
            parser.state = S.DOCTYPE_DTD
            parser.q = ''
          }
          continue

        case S.COMMENT:
          if (c === '-') {
            parser.state = S.COMMENT_ENDING
          } else {
            parser.comment += c
          }
          continue

        case S.COMMENT_ENDING:
          if (c === '-') {
            parser.state = S.COMMENT_ENDED
            parser.comment = textopts(parser.opt, parser.comment)
            if (parser.comment) {
              emitNode(parser, 'oncomment', parser.comment)
            }
            parser.comment = ''
          } else {
            parser.comment += '-' + c
            parser.state = S.COMMENT
          }
          continue

        case S.COMMENT_ENDED:
          if (c !== '>') {
            strictFail(parser, 'Malformed comment')
            // allow <!-- blah -- bloo --> in non-strict mode,
            // which is a comment of " blah -- bloo "
            parser.comment += '--' + c
            parser.state = S.COMMENT
          } else {
            parser.state = S.TEXT
          }
          continue

        case S.CDATA:
          if (c === ']') {
            parser.state = S.CDATA_ENDING
          } else {
            parser.cdata += c
          }
          continue

        case S.CDATA_ENDING:
          if (c === ']') {
            parser.state = S.CDATA_ENDING_2
          } else {
            parser.cdata += ']' + c
            parser.state = S.CDATA
          }
          continue

        case S.CDATA_ENDING_2:
          if (c === '>') {
            if (parser.cdata) {
              emitNode(parser, 'oncdata', parser.cdata)
            }
            emitNode(parser, 'onclosecdata')
            parser.cdata = ''
            parser.state = S.TEXT
          } else if (c === ']') {
            parser.cdata += ']'
          } else {
            parser.cdata += ']]' + c
            parser.state = S.CDATA
          }
          continue

        case S.PROC_INST:
          if (c === '?') {
            parser.state = S.PROC_INST_ENDING
          } else if (isWhitespace(c)) {
            parser.state = S.PROC_INST_BODY
          } else {
            parser.procInstName += c
          }
          continue

        case S.PROC_INST_BODY:
          if (!parser.procInstBody && isWhitespace(c)) {
            continue
          } else if (c === '?') {
            parser.state = S.PROC_INST_ENDING
          } else {
            parser.procInstBody += c
          }
          continue

        case S.PROC_INST_ENDING:
          if (c === '>') {
            emitNode(parser, 'onprocessinginstruction', {
              name: parser.procInstName,
              body: parser.procInstBody
            })
            parser.procInstName = parser.procInstBody = ''
            parser.state = S.TEXT
          } else {
            parser.procInstBody += '?' + c
            parser.state = S.PROC_INST_BODY
          }
          continue

        case S.OPEN_TAG:
          if (isMatch(nameBody, c)) {
            parser.tagName += c
          } else {
            newTag(parser)
            if (c === '>') {
              openTag(parser)
            } else if (c === '/') {
              parser.state = S.OPEN_TAG_SLASH
            } else {
              if (!isWhitespace(c)) {
                strictFail(parser, 'Invalid character in tag name')
              }
              parser.state = S.ATTRIB
            }
          }
          continue

        case S.OPEN_TAG_SLASH:
          if (c === '>') {
            openTag(parser, true)
            closeTag(parser)
          } else {
            strictFail(parser, 'Forward-slash in opening tag not followed by >')
            parser.state = S.ATTRIB
          }
          continue

        case S.ATTRIB:
          // haven't read the attribute name yet.
          if (isWhitespace(c)) {
            continue
          } else if (c === '>') {
            openTag(parser)
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH
          } else if (isMatch(nameStart, c)) {
            parser.attribName = c
            parser.attribValue = ''
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, 'Invalid attribute name')
          }
          continue

        case S.ATTRIB_NAME:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE
          } else if (c === '>') {
            strictFail(parser, 'Attribute without value')
            parser.attribValue = parser.attribName
            attrib(parser)
            openTag(parser)
          } else if (isWhitespace(c)) {
            parser.state = S.ATTRIB_NAME_SAW_WHITE
          } else if (isMatch(nameBody, c)) {
            parser.attribName += c
          } else {
            strictFail(parser, 'Invalid attribute name')
          }
          continue

        case S.ATTRIB_NAME_SAW_WHITE:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE
          } else if (isWhitespace(c)) {
            continue
          } else {
            strictFail(parser, 'Attribute without value')
            parser.tag.attributes[parser.attribName] = ''
            parser.attribValue = ''
            emitNode(parser, 'onattribute', {
              name: parser.attribName,
              value: ''
            })
            parser.attribName = ''
            if (c === '>') {
              openTag(parser)
            } else if (isMatch(nameStart, c)) {
              parser.attribName = c
              parser.state = S.ATTRIB_NAME
            } else {
              strictFail(parser, 'Invalid attribute name')
              parser.state = S.ATTRIB
            }
          }
          continue

        case S.ATTRIB_VALUE:
          if (isWhitespace(c)) {
            continue
          } else if (isQuote(c)) {
            parser.q = c
            parser.state = S.ATTRIB_VALUE_QUOTED
          } else {
            strictFail(parser, 'Unquoted attribute value')
            parser.state = S.ATTRIB_VALUE_UNQUOTED
            parser.attribValue = c
          }
          continue

        case S.ATTRIB_VALUE_QUOTED:
          if (c !== parser.q) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_Q
            } else {
              parser.attribValue += c
            }
            continue
          }
          attrib(parser)
          parser.q = ''
          parser.state = S.ATTRIB_VALUE_CLOSED
          continue

        case S.ATTRIB_VALUE_CLOSED:
          if (isWhitespace(c)) {
            parser.state = S.ATTRIB
          } else if (c === '>') {
            openTag(parser)
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH
          } else if (isMatch(nameStart, c)) {
            strictFail(parser, 'No whitespace between attributes')
            parser.attribName = c
            parser.attribValue = ''
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, 'Invalid attribute name')
          }
          continue

        case S.ATTRIB_VALUE_UNQUOTED:
          if (!isAttribEnd(c)) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_U
            } else {
              parser.attribValue += c
            }
            continue
          }
          attrib(parser)
          if (c === '>') {
            openTag(parser)
          } else {
            parser.state = S.ATTRIB
          }
          continue

        case S.CLOSE_TAG:
          if (!parser.tagName) {
            if (isWhitespace(c)) {
              continue
            } else if (notMatch(nameStart, c)) {
              if (parser.script) {
                parser.script += '</' + c
                parser.state = S.SCRIPT
              } else {
                strictFail(parser, 'Invalid tagname in closing tag.')
              }
            } else {
              parser.tagName = c
            }
          } else if (c === '>') {
            closeTag(parser)
          } else if (isMatch(nameBody, c)) {
            parser.tagName += c
          } else if (parser.script) {
            parser.script += '</' + parser.tagName
            parser.tagName = ''
            parser.state = S.SCRIPT
          } else {
            if (!isWhitespace(c)) {
              strictFail(parser, 'Invalid tagname in closing tag')
            }
            parser.state = S.CLOSE_TAG_SAW_WHITE
          }
          continue

        case S.CLOSE_TAG_SAW_WHITE:
          if (isWhitespace(c)) {
            continue
          }
          if (c === '>') {
            closeTag(parser)
          } else {
            strictFail(parser, 'Invalid characters in closing tag')
          }
          continue

        case S.TEXT_ENTITY:
        case S.ATTRIB_VALUE_ENTITY_Q:
        case S.ATTRIB_VALUE_ENTITY_U:
          var returnState
          var buffer
          switch (parser.state) {
            case S.TEXT_ENTITY:
              returnState = S.TEXT
              buffer = 'textNode'
              break

            case S.ATTRIB_VALUE_ENTITY_Q:
              returnState = S.ATTRIB_VALUE_QUOTED
              buffer = 'attribValue'
              break

            case S.ATTRIB_VALUE_ENTITY_U:
              returnState = S.ATTRIB_VALUE_UNQUOTED
              buffer = 'attribValue'
              break
          }

          if (c === ';') {
            parser[buffer] += parseEntity(parser)
            parser.entity = ''
            parser.state = returnState
          } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
            parser.entity += c
          } else {
            strictFail(parser, 'Invalid character in entity name')
            parser[buffer] += '&' + parser.entity + c
            parser.entity = ''
            parser.state = returnState
          }

          continue

        default:
          throw new Error(parser, 'Unknown state: ' + parser.state)
      }
    } // while

    if (parser.position >= parser.bufferCheckPosition) {
      checkBufferLength(parser)
    }
    return parser
  }

  /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
  /* istanbul ignore next */
  if (!String.fromCodePoint) {
    (function () {
      var stringFromCharCode = String.fromCharCode
      var floor = Math.floor
      var fromCodePoint = function () {
        var MAX_SIZE = 0x4000
        var codeUnits = []
        var highSurrogate
        var lowSurrogate
        var index = -1
        var length = arguments.length
        if (!length) {
          return ''
        }
        var result = ''
        while (++index < length) {
          var codePoint = Number(arguments[index])
          if (
            !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
            codePoint < 0 || // not a valid Unicode code point
            codePoint > 0x10FFFF || // not a valid Unicode code point
            floor(codePoint) !== codePoint // not an integer
          ) {
            throw RangeError('Invalid code point: ' + codePoint)
          }
          if (codePoint <= 0xFFFF) { // BMP code point
            codeUnits.push(codePoint)
          } else { // Astral code point; split in surrogate halves
            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            codePoint -= 0x10000
            highSurrogate = (codePoint >> 10) + 0xD800
            lowSurrogate = (codePoint % 0x400) + 0xDC00
            codeUnits.push(highSurrogate, lowSurrogate)
          }
          if (index + 1 === length || codeUnits.length > MAX_SIZE) {
            result += stringFromCharCode.apply(null, codeUnits)
            codeUnits.length = 0
          }
        }
        return result
      }
      /* istanbul ignore next */
      if (Object.defineProperty) {
        Object.defineProperty(String, 'fromCodePoint', {
          value: fromCodePoint,
          configurable: true,
          writable: true
        })
      } else {
        String.fromCodePoint = fromCodePoint
      }
    }())
  }
})( false ? this.sax = {} : exports)

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0).Buffer))

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}


/***/ }),
/* 37 */
/***/ (function(module, exports) {

exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

var Stream = (function (){
  try {
    return __webpack_require__(9); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = __webpack_require__(19);
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = __webpack_require__(12);
exports.Duplex = __webpack_require__(2);
exports.Transform = __webpack_require__(14);
exports.PassThrough = __webpack_require__(20);


/***/ }),
/* 39 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(41);
exports.setImmediate = setImmediate;
exports.clearImmediate = clearImmediate;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7), __webpack_require__(6)))

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {
/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)))

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(12)


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(2)


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(14)


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(20)


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

var common = __webpack_require__(15);
var xml2js = __webpack_require__(17);

function validateOptions (userOptions) {
    var options = common.copyOptions(userOptions);
    common.ensureSpacesExists(options);
    return options;
}

module.exports = function(xml, userOptions) {
    'use strict';
    var options, js, json, parentKey;
    options = validateOptions(userOptions);
    js = xml2js(xml, options);
    parentKey = 'compact' in options && options.compact ? '_parent' : 'parent';
    // parentKey = ptions.compact ? '_parent' : 'parent'; // consider this
    if ('addParent' in options && options.addParent) {
        json = JSON.stringify(js, function (k, v) { return k === parentKey? '_' : v; }, options.spaces);
    } else {
        json = JSON.stringify(js, null, options.spaces);
    }
    return json.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
};


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {var js2xml = __webpack_require__(21);

module.exports = function (json, options) {
    'use strict';
    if (json instanceof Buffer) {
        json = json.toString();
    }
    var js = null;
    if (typeof (json) === 'string') {
        try {
            js = JSON.parse(json);
        } catch (e) {
            throw new Error("The JSON structure is invalid");
        }
    } else {
        js = json;
    }
    return js2xml(js, options);
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0).Buffer))

/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {/////////////////////////////
///////    HELPERS    ///////
/////////////////////////////

var Promise = __webpack_require__(1);
var request = __webpack_require__(50);
var parser = __webpack_require__(4);
var fs = __webpack_require__(51);
var utf8 = __webpack_require__(24);
var fileInfo = __webpack_require__(54);

/**
 * @class helpers
 * @classdesc
 * <b><i>This is a class for helper functions, dont mess with this until sure!</i></b><br><br>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 */
function helpers() {
    this.OCS_BASEPATH = 'ocs/v1.php/';
    this.OCS_SERVICE_SHARE = 'apps/files_sharing/api/v1';
    this.OCS_SERVICE_PRIVATEDATA = 'privatedata';
    this.OCS_SERVICE_CLOUD = 'cloud';

    // constants from lib/public/constants.php
    this.OCS_PERMISSION_READ = 1;
    this.OCS_PERMISSION_UPDATE = 2;
    this.OCS_PERMISSION_CREATE = 4;
    this.OCS_PERMISSION_DELETE = 8;
    this.OCS_PERMISSION_SHARE = 16;
    this.OCS_PERMISSION_ALL = 31;

    // constants from lib/public/share.php
    this.OCS_SHARE_TYPE_USER = 0;
    this.OCS_SHARE_TYPE_GROUP = 1;
    this.OCS_SHARE_TYPE_LINK = 3;
    this.OCS_SHARE_TYPE_REMOTE = 6;

    this.instance = null;
    this._username = null;
    this._password = null;
    this._version = null;
    this._capabilities = null;
}

/**
 * sets the OC instance
 * @param   {string}    instance    instance to be used for communication
 */
helpers.prototype.setInstance = function(instance) {
    this.instance = instance;
};

/**
 * sets the username
 * @param   {string}    username    username to be used for logging in
 */
helpers.prototype.setUsername = function(username) {
    this._username = username;

    var instancePath = '/' + this.instance.split('/').slice(3).join('/');

    this._davPath = instancePath + 'remote.php/dav/files/' +
        encodeURIComponent(this._encodeString(this._username));

    this._webdavUrl = this.instance + 'remote.php/webdav';
};

/**
 * sets the password
 * @param   {string}    password    password to be used for logging in
 */
helpers.prototype.setPassword = function(password) {
    this._password = password;
};

/**
 * gets the OC version
 * @returns {string}    OC version
 */
helpers.prototype.getVersion = function() {
    return this._version;
};

/**
 * Gets all capabilities of the logged in user
 * @returns {object}    all capabilities
 */
helpers.prototype.getCapabilities = function() {
    return this._capabilities;
};

/**
 * Updates the capabilities of user logging in.
 * @returns {Promise.<capabilities>}    object: all capabilities
 * @returns {Promise.<error>}           string: error message, if any.
 */
helpers.prototype._updateCapabilities = function() {
    var self = this;
    return new Promise((resolve, reject) => {
        self._makeOCSrequest('GET', self.OCS_SERVICE_CLOUD, "capabilities")
            .then(data => {
                var body = parser.xml2js(data.body, {
                    compact: true
                });
                body = self._cleanseJson(body).ocs.data;

                self._capabilities = body.capabilities;
                self._version = body.version.string + '-' + body.version.edition;

                resolve(self._capabilities);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Makes an OCS API request.
 * @param   {string} method     method of request (GET, POST etc.)
 * @param   {string} service    service (cloud, privatedata etc.)
 * @param   {string} action     action (apps?filter=enabled, capabilities etc.)
 * @param   {string} [data]     formData for POST and PUT requests
 * @returns {Promise.<data>}    object: {response: response, body: request body}
 * @returns {Promise.<error>}   string: error message, if any.
 */
helpers.prototype._makeOCSrequest = function(method, service, action, data) {
    var self = this;
    var err = null;

    if (!this.instance) {
        err = "Please specify a server URL first";
    }

    if (!this._username || !this._password) {
        err = "Please specify a username AND password first.";
    }

    // Set the headers
    var headers = {
        authorization: "Basic " + new Buffer(this._username + ":" + this._password).toString('base64'),
        'OCS-APIREQUEST': true
    };

    var slash = '';

    if (service) {
        slash = '/';
    }

    var path = this.OCS_BASEPATH + service + slash + action;

    //Configure the request
    var options = {
        url: this.instance + path,
        method: method,
        headers: headers,
    };

    if (method === 'PUT' || method === 'DELETE') {
        options.headers['content-type'] = 'application/x-www-form-urlencoded';
        options.form = data;
    } else {
        options.headers['content-type'] = 'multipart/form-data';
        options.formData = data;
    }

    return new Promise((resolve, reject) => {
        // Start the request
        request(options, function(error, response, body) {
            if (err) {
                reject(err);
            }

            var validXml = self._isValidXML(body);
            var validJson = self._isValidJSON(body);

            if (error) {
                error = "Please provide a valid owncloud instance";
            }

            if (validJson) {
                body = JSON.parse(body);
                if ("message" in body) {
                    error = body.message;
                } else {
                    error = "Please provide a valid owncloud instance";
                }
            }

            if (!error && !validXml) {
                error = "Please provide a valid owncloud instance";
                body = null;
            }

            if (!error) {
                var tree = parser.xml2js(body, {
                    compact: true
                });
                tree = self._cleanseJson(tree);
                error = self._checkOCSstatus(tree);
            }

            if (error) {
                reject(error);
            } else {
                resolve({
                    response: response,
                    body: body
                });
            }
        });
    });
};

/**
 * Makes a DAV request.
 * @param   {string} method          method of request (PROPFIND, MKCOL etc.)
 * @param   {string} path            path of file/folder
 * @param   {object} [headerData]    headerData to be set before the request
 * @param   {object} [body]          body of request
 * @returns {Promise.<body>}         string: parsed response
 * @returns {Promise.<error>}        string: error message, if any.
 */
helpers.prototype._makeDAVrequest = function(method, path, headerData, body) {
    var self = this;
    var err = null;

    if (!this.instance) {
        err = "Please specify a server URL first";
    }

    if (!this._username || !this._password) {
        err = "Please specify a username AND password first.";
    }

    path = self._normalizePath(path);
    path = encodeURIComponent(path);
    path = path.split('%2F').join('/'); // '/' => %2F
    var url = self._webdavUrl + self._encodeString(path);

    // Set the headers
    var headers = {
        authorization: "Basic " + new Buffer(this._username + ":" + this._password).toString('base64')
    };

    //Configure the request
    var options = {
        url: url,
        method: method,
        headers: headers
    };

    for (var key in headerData) {
        options.headers[key] = headerData[key];
    }

    options.body = body;

    return new Promise((resolve, reject) => {
        if (err) {
            reject(err);
        }

        // Start the request
        request(options, function(error, response, body) {
            if (error) {
                reject(error);
            }

            if ([200, 207].indexOf(response.statusCode) > -1) {
                self._parseDAVresponse(resolve, reject, body);
            } else if ([201, 204].indexOf(response.statusCode) > -1) {
                resolve(true);
            } else {
                var err = self._parseDAVerror(body);
                reject(err);
            }
        });
    });
};

/**
 * Parses a DAV response.
 */
helpers.prototype._parseDAVresponse = function(resolve, reject, body) {
    var tree = parser.xml2js(body, {
        compact: true
    });
    var xmlns = tree['d:multistatus']._attributes;
    var replacedXMLns = {};

    for (var ns in xmlns) {
        var changedKey = ns.split(':')[1];
        replacedXMLns[changedKey] = xmlns[ns];
    }

    tree = this._keepNamespace(tree, replacedXMLns);
    tree = this._cleanseJson(tree)['{DAV:}multistatus']['{DAV:}response'];
    var items = [];

    if (tree.constructor !== Array) {
        tree = [tree];
    }

    for (var item = 0; item < tree.length; item++) {
        items.push(this._parseDAVelement(tree[item]));
    }

    resolve(items);
};

/**
 * Parses a DAV response element.
 */
helpers.prototype._parseDAVelement = function(item) {
    var name = item['{DAV:}href'];
    var attrs = item['{DAV:}propstat']['{DAV:}prop'];
    var fileType = name.substr(-1) === '/' ? 'dir' : 'file';

    var start = 0;
    name = name.split('/');
    for (var i = 0; i < name.length; i++) {
        if (name[i] === 'webdav') {
            start = i;
            break;
        }
    }
    name.splice(0, start + 1);
    name = '/' + name.join('/');

    name = decodeURIComponent(name);

    name = utf8.encode(name);
    name = utf8.decode(name);

    var file = new fileInfo(name, fileType, attrs);
    return file;
};

/**
 * performs a simple GET request
 * @param   {string}    url     url to perform GET on
 * @returns {Promise.<data>}    object: {response: response, body: request body}
 * @returns {Promise.<error>}   string: error message, if any.
 */
helpers.prototype._get = function(url) {
    var err = null;

    if (!this.instance) {
        err = "Please specify a server URL first";
    }

    if (!this._username || !this._password) {
        err = "Please specify a username AND password first.";
    }

    var headers = {
        authorization: "Basic " + new Buffer(this._username + ":" + this._password).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    //Configure the request
    var options = {
        url: url,
        method: 'GET',
        headers: headers
    };

    return new Promise((resolve, reject) => {
        if (err) {
            reject(err);
            return;
        }

        // Start the request
        request(options, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve({
                    response: response,
                    body: body
                });
            }
        });
    });
};

/**
 * performs a GET request and writes the output into a file
 * @param   {string}  url       url to perform GET on
 * @param   {string}  fileName  name of the file to write the response into
 * @returns {Promise.<data>}    object: {response: response, body: request body}
 * @returns {Promise.<error>}   string: error message, if any.
 */
helpers.prototype._writeData = function(url, fileName) {
    var self = this;
    var err = null;

    if (!this.instance) {
        err = "Please specify a server URL first";
    }

    if (!this._username || !this._password) {
        err = "Please specify a username AND password first.";
    }

    var headers = {
        authorization: "Basic " + new Buffer(this._username + ":" + this._password).toString('base64'),
        'Content-Type': 'application/octet-stream'
    };

    //Configure the request
    var options = {
        url: url,
        method: 'GET',
        headers: headers
    };

    return new Promise((resolve, reject) => {
        if (err) {
            reject(err);
            return;
        }

        var isPossible = 1;

        try {
            fs.closeSync(fs.openSync(fileName, 'w'));
        } catch (error) {
            isPossible = 0;
            reject(error.message);
            return;
        }

        // Start the request
        /* jshint unused : false */
        request(options, function(err2, response, body) {
                if (err2) {
                    reject(err2);
                }

                if (response.statusCode === 200 && isPossible === 1 && body.split('\n')[0] !== "<!DOCTYPE html>") {
                    resolve(true);
                } else {
                    try {
                        var err = self._parseDAVerror(body);
                        reject(err);
                    } catch (error) {
                        if (body.search("<li class=\"error\">") > -1) {
                            reject('specified file/folder could not be located');
                        } else {
                            reject("Current user is not logged in");
                        }
                    }
                }
            })
            .on('error', function(error) {
                reject(error);
                return;
            })
            .pipe(fs.createWriteStream(fileName));
        /* jshint unused : true */
    });
};

/**
 * performs a PUT request from a file
 * @param   {string} path       path where to put at OC instance
 * @param   {string} localPath  path of the file to read the data from
 * @param   {object} headers    extra headers to add for the PUT request
 * @returns {Promise.<data>}    object: {response: response, body: request body}
 * @returns {Promise.<error>}   string: error message, if any.
 */
helpers.prototype._readFile = function(path, localPath, headers) {
    var self = this;

    return new Promise((resolve, reject) => {
        try {
            path = self._normalizePath(path);
            path = encodeURIComponent(path);
            path = path.split('%2F').join('/'); // '/' => %2F
            var url = self._webdavUrl + self._encodeString(path);

            /* jshint unused : false */
            fs.createReadStream(localPath)
                .pipe(request.put({
                    url: url,
                    headers: headers
                }, function(error, response, body) {
                    if (response.statusCode >= 400) {
                        var parsedError = self._parseDAVerror(body);
                        parsedError = parsedError || 'not allowed';
                        reject(parsedError);
                    } else {
                        resolve(true);
                    }
                }));
            /* jshint unused : true */
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * checks whether a path's extension is ".ZIP"
 * @param   {string}    path    path to check
 * @return  {boolean}           true if extension is ".ZIP"
 */
helpers.prototype._checkExtensionZip = function(path) {
    var extension = path.slice(-4);
    if (extension !== '.zip') {
        path += '.zip';
    }
    return path;
};

/**
 * Parses a DAV response error.
 */
helpers.prototype._parseDAVerror = function(body) {
    var tree = parser.xml2js(body, {
        compact: true
    });
    tree = this._cleanseJson(tree);

    if (tree['{DAV:}error']['{http://sabredav.org/ns:}message']) {
        return tree['{DAV:}error']['{http://sabredav.org/ns:}message'];
    }
    return tree;
};

/**
 * Checks whether a response body is valid XML
 * @param   {string}    body    the response to be checked
 * @return  {Boolean}           true if valid XML, else false
 */
helpers.prototype._isValidXML = function(body) {
    try {
        parser.xml2js(body);
    } catch (e) {
        return false;
    }
    return true;
};

/**
 * Checks whether a response body is valid JSON
 * @param   {string}    body    the response to be checked
 * @return  {Boolean}           true if valid JSON, else false
 */
helpers.prototype._isValidJSON = function(body) {
    try {
        JSON.parse(body);
    } catch (e) {
        return false;
    }
    return true;
};

/**
 * Makes sure path starts with a '/'
 * @param   {string}    path    to the remote file share
 * @returns {string}            normalized path
 */
helpers.prototype._normalizePath = function(path) {
    if (!path) {
        path = '';
    }

    if (path.length === 0) {
        return '/';
    }

    if (path[0] !== '/') {
        path = '/' + path;
    }

    return path;
};

/**
 * Checks the status code of an OCS request
 * @param   {object} json                         parsed response
 * @param   {array}  [acceptedCodes = [100] ]     array containing accepted codes
 * @returns {string}                              error message or NULL
 */
helpers.prototype._checkOCSstatus = function(json, acceptedCodes) {
    if (!acceptedCodes) {
        acceptedCodes = [100];
    }

    var meta;
    if (json.ocs) {
        meta = json.ocs.meta;
    }
    var ret;

    if (meta && acceptedCodes.indexOf(parseInt(meta.statuscode)) === -1) {
        ret = meta.message;

        if (Object.keys(meta.message).length === 0) {
            // no error message returned, return the whole message
            ret = json;
        }
    }

    return ret;
};

/**
 * Returns the status code of the xml response
 * @param   {object}    json    parsed response
 * @return  {integer}           status-code
 */
helpers.prototype._checkOCSstatusCode = function(json) {
    if (json.ocs) {
        var meta = json.ocs.meta;
        return parseInt(meta.statuscode);
    }
    return null;
};

/**
 * Encodes the string according to UTF-8 standards
 * @param   {string}    path    path to be encoded
 * @returns {string}            encoded path
 */
helpers.prototype._encodeString = function(path) {
    return utf8.encode(path);
};

/**
 * converts all of object's "true" or "false" entries to booleans
 * @param   {object}    object  object to be typcasted
 * @return  {object}            typecasted object
 */
helpers.prototype._convertObjectToBool = function(object) {
    if (typeof(object) !== "object") {
        return object;
    }

    for (var key in object) {
        if (object[key] === "true") {
            object[key] = true;
        }
        if (object[key] === "false") {
            object[key] = false;
        }
    }

    return object;
};

/**
 * Handles Provisionging API boolean response
 */
helpers.prototype._OCSuserResponseHandler = function(data, resolve, reject) {
    var tree = parser.xml2js(data.body, {
        compact: true
    });
    tree = this._cleanseJson(tree);

    var statuscode = parseInt(this._checkOCSstatusCode(tree));
    if (statuscode === 999) {
        reject("Provisioning API has been disabled at your instance");
    }

    resolve(true);
};

/**
 * Recursive listing of all files and sub-folders
 * @param   {string}  path         local path to be recursively listed
 * @param   {string}  pathToStore  path to be stored at the OC instance
 * @returns {array}                array of objects : {
 *                                       path: path of the folder to be stored
 *                                       at the OC instance,
 *                                       localPath: localPath of the folder,
 *                                       files: contents of the folder
 *                                 }
 */
helpers.prototype._getAllFileInfo = function(path, pathToStore) {
    function getAllFileInfo(path, pathToStore, localPath) {
        var fl = 0;
        var baseAddr = pathToStore;

        for (var j = 0; j < filesToPut.length; j++) {
            if (filesToPut[j].path === baseAddr) {
                fl = 1;
                break;
            }
        }

        if (fl === 0) {
            var count = filesToPut.length;
            filesToPut[count] = {};
            filesToPut[count].path = baseAddr;
            filesToPut[count].localPath = localPath; ////////
            filesToPut[count].files = [];
            count++;
        }


        if (path.slice(-1) !== '/') {
            path += '/';
        }

        var files = fs.readdirSync(path);

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var stat = fs.statSync(path + file);

            if (stat.isDirectory()) {
                getAllFileInfo(path + file + '/', pathToStore + file + '/', localPath + file + '/');
            } else {
                baseAddr = pathToStore;
                fl = 0;

                for (j = 0; j < filesToPut.length; j++) {
                    if (filesToPut[j].path === baseAddr) {
                        filesToPut[j].files.push(file);
                        fl = 1;
                        break;
                    }
                }

                if (fl === 0) {
                    var count2 = filesToPut.length;
                    filesToPut[count2] = {};
                    filesToPut[count2].path = baseAddr;
                    filesToPut[count2].localPath = localPath; ////////
                    filesToPut[count2].files = [file];
                    count2++;
                }
            }
        }
    }

    var filesToPut = [];
    var targetPath = pathToStore;
    var localPath = path;

    if (!targetPath || targetPath === '') {
        targetPath = '/';
    }

    targetPath = this._normalizePath(targetPath);
    var slash = '';
    if (targetPath.slice(-1) !== '/') {
        targetPath += '/';
    }
    if (localPath.slice(-1) !== '/') {
        localPath += '/';
    }
    if (targetPath.slice(0, 1) !== '/') {
        slash = '/';
    }

    var pathToAdd = localPath.split('/');
    pathToAdd = pathToAdd.filter(function(n) {
        return n !== '';
    });
    var slash2 = '/';

    if (pathToAdd[pathToAdd.length - 1] === '.') {
        pathToAdd[pathToAdd.length - 1] = '';
        slash = '';
        slash2 = '';
    }

    pathToAdd = targetPath + slash + pathToAdd[pathToAdd.length - 1] + slash2;
    getAllFileInfo(path, pathToAdd, localPath);
    return filesToPut;
};

/**
 * gets the MTime of a file/folder
 * @param   {string}    path    path of the file/folder
 * @returns {Date}              MTime
 */
helpers.prototype._getMTime = function(path) {
    var info = fs.statSync(path);
    return info.mtime;
};

/**
 * gets the size of a file/folder
 * @param   {string}    path    path of the file/folder
 * @returns {integer}           size of folder
 */
helpers.prototype._getFileSize = function(path) {
    var info = fs.statSync(path);
    return parseInt(info.size);
};

/**
 * performs a PUT request from a file
 * @param   {string}  source     source path of the file to move/copy
 * @param   {string}  target     target path of the file to move/copy
 * @param   {object}  headers    extra headers to add for the PUT request
 * @returns {Promise.<status>}   boolean: whether the operation was successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
helpers.prototype._webdavMoveCopy = function(source, target, method) {
    var self = this;

    return new Promise((resolve, reject) => {
        if (method !== "MOVE" && method !== "COPY") {
            reject('Please specify a valid method');
            return;
        }

        source = self._normalizePath(source);

        target = self._normalizePath(target);
        target = encodeURIComponent(target);
        target = target.split('%2F').join('/');

        var headers = {
            'Destination': self._webdavUrl + target
        };

        self._makeDAVrequest(method, source, headers).then(data => {
            resolve(data);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * gets the fileName from a path
 * @param  {string}  path  path to get fileName from
 * @return {string}        fileName
 */
helpers.prototype._getFileName = function(path) {
    var pathSplit = path.split('/');
    pathSplit = pathSplit.filter(function(n) {
        return n !== '';
    });
    return pathSplit[pathSplit.length - 1];
};

/**
 * the XML parser used, gives JS objects with "_text" property at the end.
 * this function removes it.
 * @param  {object}  json  js Object to cleanse
 * @return {object}        cleansed object
 */
helpers.prototype._cleanseJson = function(json) {
    for (var key in json) {
        var a = recursiveCleanse(json[key]);
        json[key] = a;
    }
    return json;
};

/**
 * [description]
 * @param  {[type]} json [description]
 * @param  {[type]} ns   [description]
 * @return {[type]}      [description]
 */
helpers.prototype._keepNamespace = function(json, ns) {
    var nsKeys = Object.keys(ns);

    for (var key in json) {
        var parseKey = parseKeyNS(key);
        if (key.indexOf(':') > -1 && nsKeys.indexOf(parseKey) > -1) {
            var index = nsKeys.indexOf(parseKey);
            var prop = '{' + ns[nsKeys[index]] + '}' + key.split(':')[1];

            json[prop] = json[key];
            json[prop] = recursiveNS(json[prop], ns);
        } else {
            json[key] = recursiveNS(json[key], ns);
        }
    }

    json = this._deleteDuplicates(json, ns);
    return json;
};

/**
 * _keepNamespace just pushes all {DAV:} instead of d:
 * this function removes all d: and return just {DAV:}
 * @param  {object} json object from which to delete d:
 * @param  {array}  ns   all namespaces (eg. d, oc, s etc.)
 * @return {object}      only {DAV:} object
 */
helpers.prototype._deleteDuplicates = function(json, ns) {
    var ret = {};
    var nsKeys = Object.keys(ns);
    if (json.constructor === Array) {
        ret = [];
    }

    if (typeof(json) !== 'object') {
        return json;
    }

    for (var key in json) {
        if (json.constructor === Array) {
            ret.push(recursiveDeleteDuplicates(json[key], ns));
        }
        if (key.indexOf(':') > -1) {
            var parseKey = parseKeyNS(key);
            if (nsKeys.indexOf(parseKey) === -1) {
                ret[key] = recursiveDeleteDuplicates(json[key], ns);
            }
        } else if (json.constructor !== Array) {
            ret[key] = json[key];
        }
    }
    return ret;
};

/**
 * HELPER FOR _keepNamespace()
 */
function recursiveNS(json, ns) {
    if (typeof(json) !== 'object') {
        return json;
    }
    var nsKeys = Object.keys(ns);

    for (var key in json) {
        var parseKey = parseKeyNS(key);
        if (key.indexOf(':') > -1 && nsKeys.indexOf(parseKey) > -1) {
            var index = nsKeys.indexOf(parseKey);
            var prop = '{' + ns[nsKeys[index]] + '}' + key.split(':')[1];

            json[prop] = json[key];
            json[prop] = recursiveNS(json[prop], ns);
        } else {
            json[key] = recursiveNS(json[key], ns);
        }
    }
    return json;
}

/**
 * HELPER FOR _cleanseJson()
 */
function recursiveCleanse(json) {
    if (typeof(json) !== 'object') {
        return json;
    }

    for (var key in json) {
        if (key === '_text') {
            return json[key];
        }
        json[key] = recursiveCleanse(json[key]);
    }
    return json;
}

/**
 * HELPER FOR _keepNamespace()
 */
function recursiveDeleteDuplicates(json, ns) {
    if (typeof(json) !== 'object') {
        return json;
    }

    var nsKeys = Object.keys(ns);
    var ret = {};
    if (json.constructor === Array) {
        ret = [];
    }
    for (var key in json) {
        if (json.constructor === Array) {
            ret.push(recursiveDeleteDuplicates(json[key], ns));
        }
        if (key.indexOf(':') > -1) {
            var parseKey = parseKeyNS(key);
            if (nsKeys.indexOf(parseKey) === -1) {
                ret[key] = recursiveDeleteDuplicates(json[key], ns);
            }
        } else if (json.constructor !== Array) {
            ret[key] = json[key];
        }
    }
    return ret;
}

/**
 * parses a key from d: to d and {DAV:} to DAV
 * @param  {string} key key to be parsed
 * @return {string}     parsed key
 */
function parseKeyNS(key) {
    var parseKey = key.split(':')[0];
    if (parseKey.slice(0, 1) === '{') {
        parseKey = parseKey.slice(1);
    }

    return parseKey;
}

module.exports = helpers;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0).Buffer))

/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// Browser Request
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// UMD HEADER START 
(function (root, factory) {
    if (true) {
        // AMD. Register as an anonymous module.
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
  }
}(this, function () {
// UMD HEADER END

var XHR = XMLHttpRequest
if (!XHR) throw new Error('missing XMLHttpRequest')
request.log = {
  'trace': noop, 'debug': noop, 'info': noop, 'warn': noop, 'error': noop
}

var DEFAULT_TIMEOUT = 3 * 60 * 1000 // 3 minutes

//
// request
//

function request(options, callback) {
  // The entry-point to the API: prep the options object and pass the real work to run_xhr.
  if(typeof callback !== 'function')
    throw new Error('Bad callback given: ' + callback)

  if(!options)
    throw new Error('No options given')

  var options_onResponse = options.onResponse; // Save this for later.

  if(typeof options === 'string')
    options = {'uri':options};
  else
    options = JSON.parse(JSON.stringify(options)); // Use a duplicate for mutating.

  options.onResponse = options_onResponse // And put it back.

  if (options.verbose) request.log = getLogger();

  if(options.url) {
    options.uri = options.url;
    delete options.url;
  }

  if(!options.uri && options.uri !== "")
    throw new Error("options.uri is a required argument");

  if(typeof options.uri != "string")
    throw new Error("options.uri must be a string");

  var unsupported_options = ['proxy', '_redirectsFollowed', 'maxRedirects', 'followRedirect']
  for (var i = 0; i < unsupported_options.length; i++)
    if(options[ unsupported_options[i] ])
      throw new Error("options." + unsupported_options[i] + " is not supported")

  options.callback = callback
  options.method = options.method || 'GET';
  options.headers = options.headers || {};
  options.body    = options.body || null
  options.timeout = options.timeout || request.DEFAULT_TIMEOUT

  if(options.headers.host)
    throw new Error("Options.headers.host is not supported");

  if(options.json) {
    options.headers.accept = options.headers.accept || 'application/json'
    if(options.method !== 'GET')
      options.headers['content-type'] = 'application/json'

    if(typeof options.json !== 'boolean')
      options.body = JSON.stringify(options.json)
    else if(typeof options.body !== 'string')
      options.body = JSON.stringify(options.body)
  }
  
  //BEGIN QS Hack
  var serialize = function(obj) {
    var str = [];
    for(var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }
  
  if(options.qs){
    var qs = (typeof options.qs == 'string')? options.qs : serialize(options.qs);
    if(options.uri.indexOf('?') !== -1){ //no get params
        options.uri = options.uri+'&'+qs;
    }else{ //existing get params
        options.uri = options.uri+'?'+qs;
    }
  }
  //END QS Hack
  
  //BEGIN FORM Hack
  var multipart = function(obj) {
    //todo: support file type (useful?)
    var result = {};
    result.boundry = '-------------------------------'+Math.floor(Math.random()*1000000000);
    var lines = [];
    for(var p in obj){
        if (obj.hasOwnProperty(p)) {
            lines.push(
                '--'+result.boundry+"\n"+
                'Content-Disposition: form-data; name="'+p+'"'+"\n"+
                "\n"+
                obj[p]+"\n"
            );
        }
    }
    lines.push( '--'+result.boundry+'--' );
    result.body = lines.join('');
    result.length = result.body.length;
    result.type = 'multipart/form-data; boundary='+result.boundry;
    return result;
  }
  
  if(options.form){
    if(typeof options.form == 'string') throw('form name unsupported');
    if(options.method === 'POST'){
        var encoding = (options.encoding || 'application/x-www-form-urlencoded').toLowerCase();
        options.headers['content-type'] = encoding;
        switch(encoding){
            case 'application/x-www-form-urlencoded':
                options.body = serialize(options.form).replace(/%20/g, "+");
                break;
            case 'multipart/form-data':
                var multi = multipart(options.form);
                //options.headers['content-length'] = multi.length;
                options.body = multi.body;
                options.headers['content-type'] = multi.type;
                break;
            default : throw new Error('unsupported encoding:'+encoding);
        }
    }
  }
  //END FORM Hack

  // If onResponse is boolean true, call back immediately when the response is known,
  // not when the full request is complete.
  options.onResponse = options.onResponse || noop
  if(options.onResponse === true) {
    options.onResponse = callback
    options.callback = noop
  }

  // XXX Browsers do not like this.
  //if(options.body)
  //  options.headers['content-length'] = options.body.length;

  // HTTP basic authentication
  if(!options.headers.authorization && options.auth)
    options.headers.authorization = 'Basic ' + b64_enc(options.auth.username + ':' + options.auth.password);

  return run_xhr(options)
}

var req_seq = 0
function run_xhr(options) {
  var xhr = new XHR
    , timed_out = false
    , is_cors = is_crossDomain(options.uri)
    , supports_cors = ('withCredentials' in xhr)

  req_seq += 1
  xhr.seq_id = req_seq
  xhr.id = req_seq + ': ' + options.method + ' ' + options.uri
  xhr._id = xhr.id // I know I will type "_id" from habit all the time.

  if(is_cors && !supports_cors) {
    var cors_err = new Error('Browser does not support cross-origin request: ' + options.uri)
    cors_err.cors = 'unsupported'
    return options.callback(cors_err, xhr)
  }

  xhr.timeoutTimer = setTimeout(too_late, options.timeout)
  function too_late() {
    timed_out = true
    var er = new Error('ETIMEDOUT')
    er.code = 'ETIMEDOUT'
    er.duration = options.timeout

    request.log.error('Timeout', { 'id':xhr._id, 'milliseconds':options.timeout })
    return options.callback(er, xhr)
  }

  // Some states can be skipped over, so remember what is still incomplete.
  var did = {'response':false, 'loading':false, 'end':false}

  xhr.onreadystatechange = on_state_change
  xhr.open(options.method, options.uri, true) // asynchronous
  if(is_cors)
    xhr.withCredentials = !! options.withCredentials
  xhr.send(options.body)
  return xhr

  function on_state_change(event) {
    if(timed_out)
      return request.log.debug('Ignoring timed out state change', {'state':xhr.readyState, 'id':xhr.id})

    request.log.debug('State change', {'state':xhr.readyState, 'id':xhr.id, 'timed_out':timed_out})

    if(xhr.readyState === XHR.OPENED) {
      request.log.debug('Request started', {'id':xhr.id})
      for (var key in options.headers)
        xhr.setRequestHeader(key, options.headers[key])
    }

    else if(xhr.readyState === XHR.HEADERS_RECEIVED)
      on_response()

    else if(xhr.readyState === XHR.LOADING) {
      on_response()
      on_loading()
    }

    else if(xhr.readyState === XHR.DONE) {
      on_response()
      on_loading()
      on_end()
    }
  }

  function on_response() {
    if(did.response)
      return

    did.response = true
    request.log.debug('Got response', {'id':xhr.id, 'status':xhr.status})
    clearTimeout(xhr.timeoutTimer)
    xhr.statusCode = xhr.status // Node request compatibility

    // Detect failed CORS requests.
    if(is_cors && xhr.statusCode == 0) {
      var cors_err = new Error('CORS request rejected: ' + options.uri)
      cors_err.cors = 'rejected'

      // Do not process this request further.
      did.loading = true
      did.end = true

      return options.callback(cors_err, xhr)
    }

    options.onResponse(null, xhr)
  }

  function on_loading() {
    if(did.loading)
      return

    did.loading = true
    request.log.debug('Response body loading', {'id':xhr.id})
    // TODO: Maybe simulate "data" events by watching xhr.responseText
  }

  function on_end() {
    if(did.end)
      return

    did.end = true
    request.log.debug('Request done', {'id':xhr.id})

    xhr.body = xhr.responseText
    if(options.json) {
      try        { xhr.body = JSON.parse(xhr.responseText) }
      catch (er) { return options.callback(er, xhr)        }
    }

    options.callback(null, xhr, xhr.body)
  }

} // request

request.withCredentials = false;
request.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;

//
// defaults
//

request.defaults = function(options, requester) {
  var def = function (method) {
    var d = function (params, callback) {
      if(typeof params === 'string')
        params = {'uri': params};
      else {
        params = JSON.parse(JSON.stringify(params));
      }
      for (var i in options) {
        if (params[i] === undefined) params[i] = options[i]
      }
      return method(params, callback)
    }
    return d
  }
  var de = def(request)
  de.get = def(request.get)
  de.post = def(request.post)
  de.put = def(request.put)
  de.head = def(request.head)
  return de
}

//
// HTTP method shortcuts
//

var shortcuts = [ 'get', 'put', 'post', 'head' ];
shortcuts.forEach(function(shortcut) {
  var method = shortcut.toUpperCase();
  var func   = shortcut.toLowerCase();

  request[func] = function(opts) {
    if(typeof opts === 'string')
      opts = {'method':method, 'uri':opts};
    else {
      opts = JSON.parse(JSON.stringify(opts));
      opts.method = method;
    }

    var args = [opts].concat(Array.prototype.slice.apply(arguments, [1]));
    return request.apply(this, args);
  }
})

//
// CouchDB shortcut
//

request.couch = function(options, callback) {
  if(typeof options === 'string')
    options = {'uri':options}

  // Just use the request API to do JSON.
  options.json = true
  if(options.body)
    options.json = options.body
  delete options.body

  callback = callback || noop

  var xhr = request(options, couch_handler)
  return xhr

  function couch_handler(er, resp, body) {
    if(er)
      return callback(er, resp, body)

    if((resp.statusCode < 200 || resp.statusCode > 299) && body.error) {
      // The body is a Couch JSON object indicating the error.
      er = new Error('CouchDB error: ' + (body.error.reason || body.error.error))
      for (var key in body)
        er[key] = body[key]
      return callback(er, resp, body);
    }

    return callback(er, resp, body);
  }
}

//
// Utility
//

function noop() {}

function getLogger() {
  var logger = {}
    , levels = ['trace', 'debug', 'info', 'warn', 'error']
    , level, i

  for(i = 0; i < levels.length; i++) {
    level = levels[i]

    logger[level] = noop
    if(typeof console !== 'undefined' && console && console[level])
      logger[level] = formatted(console, level)
  }

  return logger
}

function formatted(obj, method) {
  return formatted_logger

  function formatted_logger(str, context) {
    if(typeof context === 'object')
      str += ' ' + JSON.stringify(context)

    return obj[method].call(obj, str)
  }
}

// Return whether a URL is a cross-domain request.
function is_crossDomain(url) {
  var rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/

  // jQuery #8138, IE may throw an exception when accessing
  // a field from window.location if document.domain has been set
  var ajaxLocation
  try { ajaxLocation = location.href }
  catch (e) {
    // Use the href attribute of an A element since IE will modify it given document.location
    ajaxLocation = document.createElement( "a" );
    ajaxLocation.href = "";
    ajaxLocation = ajaxLocation.href;
  }

  var ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || []
    , parts = rurl.exec(url.toLowerCase() )

  var result = !!(
    parts &&
    (  parts[1] != ajaxLocParts[1]
    || parts[2] != ajaxLocParts[2]
    || (parts[3] || (parts[1] === "http:" ? 80 : 443)) != (ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? 80 : 443))
    )
  )

  //console.debug('is_crossDomain('+url+') -> ' + result)
  return result
}

// MIT License from http://phpjs.org/functions/base64_encode:358
function b64_enc (data) {
    // Encodes string using MIME base64 algorithm
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];

    if (!data) {
        return data;
    }

    // assume utf8 data
    // data = this.utf8_encode(data+'');

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1<<16 | o2<<8 | o3;

        h1 = bits>>18 & 0x3f;
        h2 = bits>>12 & 0x3f;
        h3 = bits>>6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    switch (data.length % 3) {
        case 1:
            enc = enc.slice(0, -2) + '==';
        break;
        case 2:
            enc = enc.slice(0, -1) + '=';
        break;
    }

    return enc;
}
    return request;
//UMD FOOTER START
}));
//UMD FOOTER END


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*fs-web@1.0.0#fs*/

Object.defineProperty(exports, '__esModule', { value: true });
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key))
                    newObj[key] = obj[key];
            }
        }
        newObj['default'] = obj;
        return newObj;
    }
}
function _defaults(obj, defaults) {
    var keys = Object.getOwnPropertyNames(defaults);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = Object.getOwnPropertyDescriptor(defaults, key);
        if (value && value.configurable && obj[key] === undefined) {
            Object.defineProperty(obj, key, value);
        }
    }
    return obj;
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}
var _core = __webpack_require__(52);
var _directory_entry = __webpack_require__(23);
var _directory_entry2 = _interopRequireDefault(_directory_entry);
_directory_entry2['default'].prototype.readFile = function (callback) {
    if (this.type !== 'file') {
        throw new TypeError('Not a file.');
    }
    return (0, _core.readFile)(this.path, callback);
};
_defaults(exports, _interopRequireWildcard(_core));
exports.DirectoryEntry = _directory_entry2['default'];

/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*fs-web@1.0.0#core*/

Object.defineProperty(exports, '__esModule', { value: true });
exports.readFile = readFile;
exports.readString = readString;
exports.writeFile = writeFile;
exports.removeFile = removeFile;
exports.readdir = readdir;
exports.mkdir = mkdir;
exports.rmdir = rmdir;
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}
var _path = __webpack_require__(22);
var _path2 = _interopRequireDefault(_path);
var _directory_entry = __webpack_require__(23);
var _directory_entry2 = _interopRequireDefault(_directory_entry);
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}
function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2);
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
var DB_NAME = window.location.host + '_filesystem', OS_NAME = 'files', DIR_IDX = 'dir';
function init(callback) {
    var req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = function (e) {
        var db = e.target.result;
        var objectStore = db.createObjectStore(OS_NAME, { keyPath: 'path' });
        objectStore.createIndex(DIR_IDX, 'dir', { unique: false });
    };
    req.onsuccess = function (e) {
        callback(e.target.result);
    };
}
function initOS(type, callback) {
    init(function (db) {
        var trans = db.transaction([OS_NAME], type), os = trans.objectStore(OS_NAME);
        callback(os);
    });
}
var readFrom = function readFrom(fileName) {
    return new Promise(function (resolve, reject) {
        initOS('readonly', function (os) {
            var req = os.get(fileName);
            req.onerror = reject;
            req.onsuccess = function (e) {
                var res = e.target.result;
                if (res && res.data) {
                    resolve(res.data);
                } else {
                    reject('File not found');
                }
            };
        });
    });
};
function readFile(fileName) {
    return readFrom(fileName).then(function (data) {
        if (!(data instanceof ArrayBuffer)) {
            data = str2ab(data.toString());
        }
        return data;
    });
}
function readString(fileName) {
    return readFrom(fileName).then(function (data) {
        if (data instanceof ArrayBuffer) {
            data = ab2str(data);
        }
        return data;
    });
}
;
function writeFile(fileName, data) {
    return new Promise(function (resolve, reject) {
        initOS('readwrite', function (os) {
            var req = os.put({
                'path': fileName,
                'dir': _path2['default'].dirname(fileName),
                'type': 'file',
                'data': data
            });
            req.onerror = reject;
            req.onsuccess = function (e) {
                resolve();
            };
        });
    });
}
;
function removeFile(fileName) {
    return new Promise(function (resolve) {
        initOS('readwrite', function (os) {
            var req = os['delete'](fileName);
            req.onerror = req.onsuccess = function (e) {
                resolve();
            };
        });
    });
}
;
function withTrailingSlash(path) {
    var directoryWithTrailingSlash = path[path.length - 1] === '/' ? path : path + '/';
    return directoryWithTrailingSlash;
}
function readdir(directoryName) {
    return new Promise(function (resolve, reject) {
        initOS('readonly', function (os) {
            var dir = _path2['default'].dirname(withTrailingSlash(directoryName));
            var idx = os.index(DIR_IDX);
            var range = IDBKeyRange.only(dir);
            var req = idx.openCursor(range);
            req.onerror = function (e) {
                reject(e);
            };
            var results = [];
            req.onsuccess = function (e) {
                var cursor = e.target.result;
                if (cursor) {
                    var value = cursor.value;
                    var entry = new _directory_entry2['default'](value.path, value.type);
                    results.push(entry);
                    cursor['continue']();
                } else {
                    resolve(results);
                }
            };
        });
    });
}
;
function mkdir(fullPath) {
    return new Promise(function (resolve, reject) {
        initOS('readwrite', function (os) {
            var dir = withTrailingSlash(_path2['default']);
            var req = os.put({
                'path': fullPath,
                'dir': _path2['default'].dirname(dir),
                'type': 'directory'
            });
            req.onerror = reject;
            req.onsuccess = function (e) {
                resolve();
            };
        });
    });
}
;
function rmdir(fullPath) {
    return readdir(fullPath).then(function removeFiles(files) {
        if (!files || !files.length) {
            return removeFile(fullPath);
        }
        var file = files.shift(), func = file.type === 'directory' ? rmdir : removeFile;
        return func(file.name).then(function () {
            return removeFiles(files);
        });
    });
}
;

/***/ }),
/* 53 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 54 */
/***/ (function(module, exports) {

/*jshint camelcase: false */

/**
 * @class fileInfo
 * @classdesc fileInfo class, stores information regarding a file/folder
 * @param   {string}    name     name of file/folder
 * @param   {string}    type     "file" => file ; "dir" => folder
 * @param   {string}    attr     attributes of file like size, time added etc.
 */
function fileInfo(name, type, attr) {
    this.name = name;
    this.type = type;
    this.fileInfo = {};

    for (var key in attr) {
        this.fileInfo[key] = attr[key];
    }
}

/**
 * Gets the name of file/folder
 * @returns {string}    name of file/folder
 */
fileInfo.prototype.getName = function() {
    var name = this.name.split('/');
    name = name.filter(function(n) {
        return n !== '';
    });
    var send = name[name.length - 1];

    return send;
};

/**
 * Gets path of file/folder
 * @returns {string}    Path of file/folder
 */
fileInfo.prototype.getPath = function() {
    var name = this.name.split('/');
    name = name.filter(function(n) {
        return n !== '';
    });
    var send = '/';
    for (var i = 0; i < name.length - 1; i++) {
        send += name[i] + '/';
    }

    return send;
};

/**
 * Gets size of the file/folder
 * @returns {integer}   Size of file/folder
 */
fileInfo.prototype.getSize = function() {
	return parseInt(this.fileInfo['{DAV:}getcontentlength']) || null;
};

/**
 * Gets ETag of file/folder
 * @returns {string}    ETag of file/folder
 */
fileInfo.prototype.getETag = function() {
	return this.fileInfo['{DAV:}getetag'] || null;
};

/**
 * Gets content-type of file/folder
 * @returns {string}    content-type of file/folder
 */
fileInfo.prototype.getContentType = function() {
	var type = this.fileInfo['{DAV:}getcontenttype'];
	if (this.isDir()) {
		type = 'httpd/unix-directory';
	}
	return type;
};

/**
 * Gets last modified time of file/folder
 * @returns {integer}   Last modified time of file/folder
 */
fileInfo.prototype.getLastModified = function() {
	return new Date(this.fileInfo['{DAV:}getlastmodified']);
};

/**
 * Checks wether the information is for a folder
 * @returns {boolean}   true if folder
 */
fileInfo.prototype.isDir = function() {
    return this.type === 'dir' ? true : false;
};

module.exports = fileInfo;


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

///////////////////////////////////
///////    APP MANGEMENT    ///////
///////////////////////////////////

var Promise = __webpack_require__(1);
var parser = __webpack_require__(4);
var helpers;

/**
 * @class apps
 * @classdesc
 * <b><i> The apps class, has all the OC-Apps related methods.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>Apps Management</b>
 *       <ul>
 *           <li>getApps</li>
 *           <li>getAttribute</li>
 *           <li>setAttribute</li>
 *           <li>deleteAttribute</li>
 *           <li>enableApp</li>
 *           <li>disableApp</li>
 *       </ul>
 *    </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object}    helperFile    instance of the helpers class
 */
function apps(helperFile) {
    helpers = helperFile;
}

/**
 * Gets all enabled and non-enabled apps downloaded on the instance.
 * @returns    {Promise.<apps>}     object: {for each app: Boolean("enabled or not")}
 * @returns    {Promise.<error>}    string: error message, if any.
 */
apps.prototype.getApps = function() {
    var send = {};

    var allAppsP = helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, "apps");
    var allEnabledAppsP = helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, "apps?filter=enabled");

    return new Promise((resolve, reject) => {
        Promise.all([allAppsP, allEnabledAppsP])
            .then(apps => {
                var tree = parser.xml2js(apps[0].body, {
                    compact: true
                });
                tree = helpers._cleanseJson(tree);
                var statuscode = parseInt(helpers._checkOCSstatusCode(tree));
                if (statuscode === 999) {
                    reject("Provisioning API has been disabled at your instance");
                    return;
                }

                var allApps = parser.xml2js(apps[0].body, {
                    compact: true
                });
                allApps = helpers._cleanseJson(allApps).ocs.data.apps.element;

                var allEnabledApps = parser.xml2js(apps[1].body, {
                    compact: true
                });
                allEnabledApps = helpers._cleanseJson(allEnabledApps).ocs.data.apps.element;

                for (var i = 0; i < allApps.length; i++) {
                    send[allApps[i]] = false;
                }
                for (i = 0; i < allEnabledApps.length; i++) {
                    send[allEnabledApps[i]] = true;
                }

                resolve(send);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Returns an application attribute
 * @param    {string}    app     application ID (Generally app-name)
 * @param    {string}    key     attribute key or None to retrieve all values for the given application
 * @returns  {Promise.<attr>}    string: value of application's key
 * @returns  {Promise.<error>}   string: error message, if any.
 */
apps.prototype.getAttribute = function(app, key) {
    var send = "getattribute";
    if (app) {
        send += '/' + encodeURIComponent(app);

        if (key) {
            send += '/' + encodeURIComponent(helpers._encodeString(key));
        }
    }

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_PRIVATEDATA, send)
            .then(data => {
                var elements = parser.xml2js(data.body, {
                    compact: true
                });
                elements = helpers._cleanseJson(elements).ocs.data.element;

                if (key) {
                    if (!elements) {
                        reject(app + ' has no key named "' + key + '"');
                    } else {
                        var value = elements.value;
                        elements.value = Object.keys(value).length === 0 && value.constructor === Object ? '' : value;
                        resolve(elements.value);
                    }
                } else {
                    if (!elements) {
                        resolve({});
                        return;
                    }
                    if (elements.constructor !== Array) {
                        elements = [elements];
                    }
                    var allAttributes = {};
                    for (var i = 0; i < elements.length; i++) {
                        allAttributes[elements[i].key] = elements[i].value;
                    }
                    resolve(allAttributes);
                }
            })
            .catch(error => {
                reject(error);
            });
    });
};

/**
 * Sets an application attribute
 * @param       {string}   app      application ID (Generally app-name)
 * @param       {string}   key      attribute key or None to retrieve all values for the given application
 * @param       {string}   value    value to set of given attribute
 * @returns     {Promise.<status>}  boolean: true if successful
 * @returns     {Promise.<error>}   string: error message, if any.
 */
apps.prototype.setAttribute = function(app, key, value) {
    var self = this;
    var path = "setattribute/" + encodeURIComponent(app) + '/' + encodeURIComponent(helpers._encodeString(key));

    /* jshint unused: false */
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_PRIVATEDATA, path, {
                'value': helpers._encodeString(value)
            })
            .then(data => {
                resolve(true);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Deletes an application attribute
 * @param       {string}    app      application ID (generally app-name)
 * @param       {string}    key      attribute key to delete for the given application
 * @returns     {Promise.<status>}   boolean: true if successful
 * @returns     {Promise.<error>}    string: error message, if any.
 */
apps.prototype.deleteAttribute = function(app, key) {
    var self = this;
    var path = 'deleteattribute/' + encodeURIComponent(app) + '/' + encodeURIComponent(helpers._encodeString(key));

    /* jshint unused: false */
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_PRIVATEDATA, path)
            .then(data => {
                resolve(true);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Enables an app via the Provisioning API
 * @param       {string}    app      name of the app to be enabled
 * @returns     {Promise.<status>}   boolean: true if successful
 * @returns     {Promise.<error>}    string: error message, if any.
 */
apps.prototype.enableApp = function(appname) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname))
            .then(data => {
                if (!data.body) {
                    reject("No app found by the name \"" + appname + "\"");
                }
                helpers._OCSuserResponseHandler(data, resolve, reject);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Disables an app via the Provisioning API
 * @param       {string}    app      name of the app to be disabled
 * @returns     {Promise.<status>}   boolean: true if successful
 * @returns     {Promise.<error>}    string: error message, if any.
 */
apps.prototype.disableApp = function(appname) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_CLOUD, 'apps/' + encodeURIComponent(appname))
            .then(data => {
                helpers._OCSuserResponseHandler(data, resolve, reject);
            }).catch(error => {
                reject(error);
            });
    });
};

module.exports = apps;


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

/////////////////////////////
///////    SHARING    ///////
/////////////////////////////

var Promise = __webpack_require__(1);
var parser = __webpack_require__(4);
var utf8 = __webpack_require__(24);
var shareInfo = __webpack_require__(57);
var helpers;

/**
 * @class shares
 * @classdesc
 * <b><i> The shares class, has all the methods for share management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>Share Management</b>
 *      <ul>
 *          <li>shareFileWithLink</li>
 *          <li>updateShare</li>
 *          <li>shareFileWithUser</li>
 *          <li>shareFileWithGroup</li>
 *          <li>getShares</li>
 *          <li>isShared</li>
 *          <li>getShare</li>
 *          <li>listOpenRemoteShare</li>
 *          <li>acceptRemoteShare</li>
 *          <li>declineRemoteShare</li>
 *          <li>deleteShare</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param   {object}  helperFile  instance of the helpers class
 */
function shares(helperFile) {
    helpers = helperFile;
}

/**
 * Shares a remote file with link
 * @param   {string}    path             path to the remote file share
 * @param   {object}    optionalParams   {perms: integer, publicUpload: boolean, password: string}
 * @returns {Promise.<shareInfo>}        instance of class shareInfo
 * @returns {Promise.<error>}            string: error message, if any.
 */
shares.prototype.shareFileWithLink = function(path, optionalParams) {
    path = helpers._normalizePath(path);
    //path = helpers._encodeString(path);

    var postData = {
        'shareType': helpers.OCS_SHARE_TYPE_LINK,
        'path': path
    };

    if (optionalParams) {
        if (optionalParams.perms) {
            postData.permissions = optionalParams.perms;
        }
        if (optionalParams.password) {
            postData.password = optionalParams.password;
        }
        if (optionalParams.publicUpload && typeof(optionalParams.publicUpload) === "boolean") {
            postData.publicUpload = optionalParams.publicUpload.toString().toLowerCase();
        }
    }

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 'shares', postData)
            .then(data => {
                data.body = utf8.encode(data.body);
                var shareDetails = parser.xml2js(data.body, {
                    compact: true
                });
                shareDetails = helpers._cleanseJson(shareDetails);
                shareDetails = shareDetails.ocs.data;
                var share = new shareInfo(shareDetails);

                resolve(share);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Shares a remote file with specified user
 * @param   {string}    path             path to the remote file share
 * @param   {object}    optionalParams   {perms: integer, remoteUser: boolean}
 * @returns {Promise.<shareInfo>}        instance of class shareInfo
 * @returns {Promise.<error>}            string: error message, if any.
 */
shares.prototype.shareFileWithUser = function(path, username, optionalParams) {
    path = helpers._normalizePath(path);
    // path = helpers._encodeString(path);

    var postData = {
        'shareType': helpers.OCS_SHARE_TYPE_USER,
        'shareWith': username,
        'path': path
    };

    if (optionalParams) {
        if (optionalParams.perms) {
            postData.permissions = optionalParams.perms;
        }

        if (optionalParams.remoteUser) {
            postData.shareType = helpers.OCS_SHARE_TYPE_REMOTE;
        }
    }

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 'shares', postData)
            .then(data => {
                var shareData = parser.xml2js(data.body, {
                    compact: true
                });
                shareData = helpers._cleanseJson(shareData).ocs.data;

                var share = new shareInfo(shareData);
                resolve(share);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Shares a remote file with specified group
 * @param   {string}    path             path to the remote file share
 * @param   {object}    optionalParams   {perms: integer}
 * @returns {Promise.<shareInfo>}        instance of class shareInfo
 * @returns {Promise.<error>}            string: error message, if any.
 */
shares.prototype.shareFileWithGroup = function(path, groupName, optionalParams) {
    path = helpers._normalizePath(path);

    var postData = {
        'shareType': helpers.OCS_SHARE_TYPE_GROUP,
        'shareWith': groupName,
        'path': path
    };

    if (optionalParams && optionalParams.perms) {
        postData.permissions = optionalParams.perms;
    }

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE, 'shares', postData)
            .then(data => {
                var shareData = parser.xml2js(data.body, {
                    compact: true
                });
                shareData = helpers._cleanseJson(shareData).ocs.data;
                var share = new shareInfo(shareData);
                resolve(share);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Returns array of shares
 * @param   {string}  path            path to the file whose share needs to be checked
 * @param   {object}  optionalParams  object of values {"reshares": boolean,
 *                                    "subfiles": boolean, "shared_with_me": boolean}
 * @returns {Promise.<shareInfo>}     Array of instances of class shareInfo for all shares
 * @returns {Promise.<error>}         string: error message, if any.
 */
shares.prototype.getShares = function(path, optionalParams) {
    var data = 'shares';
    var send = {};

    if (path !== '') {
        data += '?';

        send.path = helpers._normalizePath(path);
        optionalParams = helpers._convertObjectToBool(optionalParams);

        if (optionalParams) {
            if (optionalParams.reshares && typeof(optionalParams.reshares) === "boolean") {
                send.reshares = optionalParams.reshares;
            }

            if (optionalParams.subfiles && typeof(optionalParams.subfiles) === "boolean") {
                send.subfiles = optionalParams.subfiles;
            }

            /*jshint camelcase: false */
            if (optionalParams.shared_with_me && typeof(optionalParams.shared_with_me) === "boolean") {
                send.shared_with_me = optionalParams.shared_with_me;
            }
            /*jshint camelcase: true */
        }

        var urlString = '';
        for (var key in send) {
            urlString += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(send[key]);
        }
        urlString = urlString.slice(1); // removing the first '&'

        data += urlString;
    }

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_SHARE, data)
            .then(data => {
                var elements = parser.xml2js(data.body, {
                    compact: true
                });
                elements = helpers._cleanseJson(elements).ocs.data.element || [];

                var shares = [];

                if (elements && elements.constructor !== Array) {
                    // just a single element
                    elements = [elements];
                }
                for (var i = 0; i < elements.length; i++) {
                    var share = new shareInfo(elements[i]);
                    shares.push(share);
                }

                resolve(shares);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Checks wether a path is already shared
 * @param   {string}    path    path to the share to be checked
 * @returns {Promise.<status>}  boolean: true if shared
 * @returns {Promise.<error>}   string: error message, if any.
 */
shares.prototype.isShared = function(path) {
    var self = this;

    return new Promise((resolve, reject) => {
        self.getShares(path)
            .then(shares => {
                resolve(shares.length > 0);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Gets share information about known share
 * @param   {integer}   shareId     ID of the share to be checked
 * @returns {Promise.<shareInfo>}   instance of class shareInfo
 * @returns {Promise.<error>}       string: error message, if any.
 */
shares.prototype.getShare = function(shareId) {
    return new Promise((resolve, reject) => {
        if (isNaN((parseInt(shareId)))) {
            reject("Please pass a valid share ID (Integer)");
            return;
        }
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_SHARE, 'shares/' + shareId.toString())
            .then(data => {
                var shareData = parser.xml2js(data.body, {
                    compact: true
                });
                shareData = helpers._cleanseJson(shareData).ocs.data.element;
                var share = new shareInfo(shareData);

                resolve(share);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * List all pending remote share
 * @returns {Promise.<shares>}  all open remote shares
 * @returns {Promise.<error>}     string: error message, if any.
 */
shares.prototype.listOpenRemoteShare = function() {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_SHARE, 'remote_shares/pending')
            .then(data => {
                var shares = parser.xml2js(data.body, {
                    compact: true
                });
                shares = helpers._cleanseJson(shares).ocs.data.element || [];
                resolve(shares);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Accepts a remote share
 * @param   {integer}   shareId   ID of the share to accept
 * @returns {Promise.<status>}    boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
shares.prototype.acceptRemoteShare = function(shareId) {
    return new Promise((resolve, reject) => {
        if (isNaN((parseInt(shareId)))) {
            reject("Please pass a valid share ID (Integer)", null);
            return;
        }

        /* jshint unused: false */
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_SHARE,
            'remote_shares/pending' + encodeURIComponent(shareId.toString())
        ).then(data => {
            resolve(true);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Declines a remote share
 * @param   {integer}   shareId   ID of the share to decline
 * @returns {Promise.<status>}    boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
shares.prototype.declineRemoteShare = function(shareId) {
    return new Promise((resolve, reject) => {
        if (isNaN((parseInt(shareId)))) {
            reject("Please pass a valid share ID (Integer)", null);
            return;
        }

        /* jshint unused: false */
        helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_SHARE,
            'remote_shares/pending' + encodeURIComponent(shareId.toString())
        ).then(data => {
            resolve(true);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Updates a given share
 * @param   {integer}  shareId         ID of the share to update
 * @param   {object}   optionalParams  {perms: integer, publicUpload: boolean, password: string}
 * @returns {Promise.<status>}         boolean: true if successful
 * @returns {Promise.<error>}          string: error message, if any.
 */
shares.prototype.updateShare = function(shareId, optionalParams) {
    var postData = {};
    var self = this;

    if (optionalParams) {
        if (optionalParams.perms) {
            postData.permissions = optionalParams.perms;
        }
        if (optionalParams.password) {
            postData.password = optionalParams.password;
        }
        if (optionalParams.publicUpload && typeof(optionalParams.publicUpload) === "boolean") {
            postData.publicUpload = optionalParams.publicUpload.toString().toLowerCase();
        }
    }

    /* jshint unused: false */
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('PUT', helpers.OCS_SERVICE_SHARE,
            'shares/' + shareId.toString(), postData, 1
        ).then(data => {
            resolve(true);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Deletes a share
 * @param   {integer}   shareId   ID of the share to delete
 * @returns {Promise.<status>}    boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
shares.prototype.deleteShare = function(shareId) {
    return new Promise((resolve, reject) => {
        if (isNaN((parseInt(shareId)))) {
            reject("Please pass a valid share ID (Integer)", null);
            return;
        }

        /* jshint unused: false */
        helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_SHARE,
            'shares/' + encodeURIComponent(shareId.toString())
        ).then(data => {
            resolve(true);
        }).catch(error => {
            reject(error);
        });
    });
};

module.exports = shares;


/***/ }),
/* 57 */
/***/ (function(module, exports) {

/*jshint camelcase: false */

/**
 * @class shareInfo
 * @classdesc shareInfo class, stores information regarding a share
 * @param {object} containing information like id, url etc. of the share
 */
function shareInfo(shareInfo) {
    this.shareInfo = {};

    // Below keys don't need to be stored
    var notNeededKeys = ['item_type', 'item_source', 'file_source', 'parent', 'storage', 'mail_send'];

    for (var key in shareInfo) {
        if (!(key in notNeededKeys)) {
            this.shareInfo[key] = shareInfo[key];
        }
    }
}

/**
 * Gets the ID of share
 * @returns {integer} ID of share
 */
shareInfo.prototype.getId = function() {
    return this._getInt('id');
};

/**
 * Gets share type of share
 * @returns {integer} Share type of share
 */
shareInfo.prototype.getShareType = function() {
    return this._getInt('share_type');
};

/**
 * Gets shareWith of the share
 * @returns {string} shareWith of share
 */
shareInfo.prototype.getShareWith = function() {
    if (this.shareInfo.hasOwnProperty('share_with')) {
        return this.shareInfo.share_with;
    }
    return null;
};

/**
 * Gets display name of share
 * @returns {string} display name of share
 */
shareInfo.prototype.getShareWithDisplayName = function() {
    if (this.shareInfo.hasOwnProperty('share_with_displayname')) {
        return this.shareInfo.share_with_displayname;
    }
    return null;
};

/**
 * Gets path of share
 * @returns {string} Path of share
 */
shareInfo.prototype.getPath = function() {
    if (this.shareInfo.hasOwnProperty('path')) {
        return this.shareInfo.path;
    }
    return null;
};

/**
 * Gets permissions of share
 * @returns {string} permissions of share
 */
shareInfo.prototype.getPermissions = function() {
    return this._getInt('permissions');
};

/**
 * Gets share time of share
 * @returns {integer} Share time of share
 */
shareInfo.prototype.getShareTime = function() {
    this._getInt('stime');
};

/**
 * Gets expiration time of share
 * @returns {integer} Expiration time of share
 */
shareInfo.prototype.getExpiration = function() {
    return this._getInt('expiration') || null;
};

/**
 * Gets token of share
 * @returns {string} token of share
 */
shareInfo.prototype.getToken = function() {
    if (this.shareInfo.hasOwnProperty('token')) {
        return this.shareInfo.token;
    }
    return null;
};

/**
 * Gets link of share
 * @returns {string} Link of share
 */
shareInfo.prototype.getLink = function() {
    if (this.shareInfo.hasOwnProperty('url')) {
        return this.shareInfo.url;
    }
    return null;
};

/**
 * Gets UID owner of share
 * @returns {string} UID owner of share
 */
shareInfo.prototype.getUidOwner = function() {
    if (this.shareInfo.hasOwnProperty('uid_file_owner')) {
        return this.shareInfo.uid_file_owner;
    }
    return null;
};

/**
 * Gets name of owner of share
 * @returns {string} name of owner of share
 */
shareInfo.prototype.getDisplaynameOwner = function() {
    if (this.shareInfo.hasOwnProperty('displayname_file_owner')) {
        return this.shareInfo.displayname_file_owner;
    }
    return null;
};

/**
 * Typecasts to integer
 * @param   {string}    [key]   Corresponding key element to be typecasted to an integer
 * @returns {integer}           typcasted integer
 */
shareInfo.prototype._getInt = function(key) {
    return parseInt(this.shareInfo[key]);
};

module.exports = shareInfo;


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

/////////////////////////////////////
///////    USER MANAGEMENT    ///////
/////////////////////////////////////

var Promise = __webpack_require__(1);
var parser = __webpack_require__(4);
var helpers;

/**
 * @class users
 * @classdesc
 * <b><i> The users class, has all the methods for user management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *     <li><b>User Management</b>
 *      <ul>
 *             <li>createUser</li>
 *          <li>deleteUser</li>
 *          <li>searchUsers</li>
 *          <li>userExists</li>
 *          <li>getUsers</li>
 *          <li>setUserAttribute</li>
 *          <li>addUserToGroup</li>
 *          <li>getUserGroups</li>
 *          <li>userIsInGroup</li>
 *          <li>getUser</li>
 *          <li>removeUserFromGroup</li>
 *          <li>addUserToSubadminGroup</li>
 *          <li>getUserSubadminGroups</li>
 *          <li>userIsInSubadminGroup</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object}    helperFile    instance of the helpers class
 */
function users(helperFile) {
    helpers = helperFile;
}

/**
 * Creates user via the provisioning API<br>
 * If user already exists, an error is given back : "User already exists"<br>
 * If provisoning API has been disabled, an error is given back saying the same.
 *
 * @param      {string}  username     username of the new user to be created
 * @param      {string}  password     password of the new user to be created
 * @returns {Promise.<status>}  boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
users.prototype.createUser = function(username, password) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD, 'users', {
            'password': password,
            'userid': username
        }).then(data => {
            helpers._OCSuserResponseHandler(data, resolve, reject);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Deletes a user via provisioning API
 * @param      {string}  username    name of user to be deleted
 * @returns {Promise.<status>}  boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
users.prototype.deleteUser = function(username) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_CLOUD, 'users/' + username)
            .then(data => {
                helpers._OCSuserResponseHandler(data, resolve, reject);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Searches for users via provisioning API
 * @param      {string}  usernname  username of the user to be searched
 * @returns {Promise.<users>}    array: all users matching the search query
 * @returns {Promise.<error>}      string: error message, if any.
 */
users.prototype.searchUsers = function(name) {
    var self = this;

    var action = 'users';
    if (name) {
        action += '?search=' + name;
    }

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, action)
            .then(data => {
                self.handleObjectResponse(resolve, reject, data, 'users');
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Checks a user via provisioning API
 * @param      {string}  username  name of user to be checked
 * @returns {Promise.<status>}  boolean: true if exists
 * @returns {Promise.<error>}     string: error message, if any.
 */
users.prototype.userExists = function(name) {
    var self = this;
    if (!name) {
        name = '';
    }

    return new Promise((resolve, reject) => {
        self.searchUsers(name).then(users => {
            resolve(users.indexOf(name) > -1);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Sets a user attribute via the Provisioning API
 * @param     {string}  username     name of the user to modify
 * @param     {string}  key       key of the attribute to be set (email, quota, display, password)
 * @param     {string}  value        value to be set
 * @returns {Promise.<status>}  boolean: true if successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
users.prototype.setUserAttribute = function(username, key, value) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('PUT', helpers.OCS_SERVICE_CLOUD, 'users/' + encodeURIComponent(username), {
            'key': helpers._encodeString(key),
            'value': helpers._encodeString(value)
        }).then(data => {
            helpers._OCSuserResponseHandler(data, resolve, reject);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Adds a user to group
 * @param   {string}  username   name of user to be added
 * @param   {string}  groupName  name of group user is to be added to
 * @returns {Promise.<status>}   boolean: true if successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
users.prototype.addUserToGroup = function(username, groupName) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD,
            'users/' + encodeURIComponent(username) + '/groups', {
                'groupid': groupName
            }
        ).then(data => {
            helpers._OCSuserResponseHandler(data, resolve, reject);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Get a list of groups associated to a user
 * @param   {string}  username   name of user to list groups
 * @returns {Promise.<groups>}   array: all groups which user is part of
 * @returns {Promise.<error>}    string: error message, if any.
 */
users.prototype.getUserGroups = function(username) {
    var self = this;

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD,
            'users/' + encodeURIComponent(username) + '/groups'
        ).then(data => {
            self.handleObjectResponse(resolve, reject, data, 'groups');
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Checks whether user is in group
 * @param   {string}  username   name of user
 * @param   {string}  groupName  name of group
 * @returns {Promise.<status>}   boolean: true if user is part of group
 * @returns {Promise.<error>}    string: error message, if any.
 */
users.prototype.userIsInGroup = function(username, groupName) {
    var self = this;

    return new Promise((resolve, reject) => {
        self.getUserGroups(username).then(groups => {
            resolve(groups.indexOf(groupName) > -1);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Retrieves information about a user
 * @param   {string}    username    name of the user
 * @returns {Promise.<userInfo>}    object: all user related information
 * @returns {Promise.<error>}       string: error message, if any.
 */
users.prototype.getUser = function(username) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD,
            'users/' + encodeURIComponent(username)
        ).then(data => {
            var tree = parser.xml2js(data.body, {
                compact: true
            });
            tree = helpers._cleanseJson(tree);
            var statusCode = parseInt(helpers._checkOCSstatusCode(tree));
            if (statusCode === 999) {
                reject("Provisioning API has been disabled at your instance");
                return;
            }

            var userInfo = tree.ocs.data || null;
            resolve(userInfo);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Removes user from a group
 * @param   {string}  username   name of user
 * @param   {string}  groupName  name of group
 * @returns {Promise.<status>}   boolean: true if successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
users.prototype.removeUserFromGroup = function(username, groupName) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_CLOUD,
            'users/' + encodeURIComponent(username) + '/groups', {
                'groupid': groupName
            }
        ).then(data => {
            helpers._OCSuserResponseHandler(data, resolve, reject);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Adds user to a subadmin group
 * @param   {string} username    name of user
 * @param   {string} groupName   name of group
 * @returns {Promise.<status>}   boolean: true if successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
users.prototype.addUserToSubadminGroup = function(username, groupName) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD,
            'users/' + encodeURIComponent(username) + '/subadmins', {
                'groupid': groupName
            }
        ).then(data => {
            helpers._OCSuserResponseHandler(data, resolve, reject);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Get a list of subadmin groups associated to a user
 * @param   {string}  username  name of user
 * @returns {Promise.<groups>}  array: all groups user is admin of
 * @returns {Promise.<error>}   string: error message, if any.
 */
users.prototype.getUserSubadminGroups = function(username) {
    var self = this;

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD,
            'users/' + encodeURIComponent(username) + '/subadmins'
        ).then(data => {
            self.handleObjectResponse(resolve, reject, data);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Checks whether user is in subadmin group
 * @param   {string}  username   name of user
 * @param   {string}  groupName  name of group
 * @returns {Promise.<status>}   boolean: true if user is admin of specified group
 * @returns {Promise.<error>}    string: error message, if any.
 */
users.prototype.userIsInSubadminGroup = function(username, groupName) {
    var self = this;

    return new Promise((resolve, reject) => {
        self.getUserSubadminGroups(username).then(groups => {
            resolve(groups.indexOf(groupName) > -1);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Get all users via Provisioning API
 * @returns {Promise.<users>}   array: all users
 * @returns {Promise.<error>}   string: error message, if any.
 */
users.prototype.getUsers = function() {
    return new Promise((resolve, reject) => {
        this.searchUsers('').then(users => {
            resolve(users);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * IS A RESPONSE HANDLER
 */
users.prototype.handleObjectResponse = function(resolve, reject, data, what) {
    var tree = parser.xml2js(data.body, {
        compact: true
    });
    tree = helpers._cleanseJson(tree);
    var statusCode = parseInt(helpers._checkOCSstatusCode(tree));
    if (statusCode === 999) {
        reject("Provisioning API has been disabled at your instance");
        return;
    }

    var toReturn;
    if (what) {
        toReturn = tree.ocs.data[what].element || [];
    } else {
        toReturn = tree.ocs.data.element || [];
    }
    if (toReturn && toReturn.constructor !== Array) {
        toReturn = [toReturn];
    }
    resolve(toReturn);
};

module.exports = users;


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

//////////////////////////////////////
///////    GROUP MANAGEMENT    ///////
//////////////////////////////////////

var Promise = __webpack_require__(1);
var parser = __webpack_require__(4);
var helpers;

/**
 * @class groups
 * @classdesc
 * <b><i> The groups class, has all the methods for group management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *  <li><b>Group Management</b>
 *      <ul>
 *          <li>createGroup</li>
 *          <li>deleteGroup</li>
 *          <li>getGroups</li>
 *          <li>getGroupMembers</li>
 *          <li>groupExists</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param {object}  helperFile  instance of the helpers class
 */
function groups(helperFile) {
    helpers = helperFile;
}

/**
 * creates a new group
 * @param   {string} groupName  name of group to be created
 * @returns {Promise.<status>}  boolean: true if successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
groups.prototype.createGroup = function(groupName) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('POST', helpers.OCS_SERVICE_CLOUD, 'groups', {
                'groupid': groupName
            })
            .then(data => {
                helpers._OCSuserResponseHandler(data, resolve, reject);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * deletes an existing group
 * @param   {string} groupName  name of group to be created
 * @returns {Promise.<status>}  boolean: true if successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
groups.prototype.deleteGroup = function(groupName) {
    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('DELETE', helpers.OCS_SERVICE_CLOUD, 'groups/' + groupName)
            .then(data => {
                helpers._OCSuserResponseHandler(data, resolve, reject);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Gets all groups in the instance
 * @returns {Promise.<groups>}  array: all group-names
 * @returns {Promise.<error>}   string: error message, if any.
 */
groups.prototype.getGroups = function() {
    var self = this;

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, 'groups')
            .then(data => {
                self.handleObjectResponse(resolve, reject, data, 'groups');
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Gets all the members of a group
 * @param   {string} groupName  name of group to list members
 * @returns {Promise.<users>}   array: all usernames who are part of the group
 * @returns {Promise.<error>}   string: error message, if any.
 */
groups.prototype.getGroupMembers = function(groupName) {
    var self = this;

    return new Promise((resolve, reject) => {
        helpers._makeOCSrequest('GET', helpers.OCS_SERVICE_CLOUD, 'groups/' + encodeURIComponent(groupName))
            .then(data => {
                self.handleObjectResponse(resolve, reject, data, 'users');
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * checks whether a group exists
 * @param   {string} groupName  name of group to check
 * @returns {Promise.<status>}  boolean: true if group exists
 * @returns {Promise.<error>}   string: error message, if any.
 */
groups.prototype.groupExists = function(groupName) {
    var self = this;

    return new Promise((resolve, reject) => {
        self.getGroups().then(groups => {
            resolve(groups.indexOf(groupName) > -1);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * IS A RESPONSE HANDLER
 */
groups.prototype.handleObjectResponse = function(resolve, reject, data, what) {
    var tree = parser.xml2js(data.body, {
        compact: true
    });
    tree = helpers._cleanseJson(tree);

    var statusCode = parseInt(helpers._checkOCSstatusCode(tree));
    if (statusCode === 999) {
        reject("Provisioning API has been disabled at your instance");
        return;
    }

    var toReturn = tree.ocs.data[what].element || [];
    if (toReturn && toReturn.constructor !== Array) {
        // single element
        toReturn = [toReturn];
    }
    resolve(toReturn);
};

module.exports = groups;


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(__dirname, Buffer) {//////////////////////////////////////
///////    FILES MANAGEMENT    ///////
//////////////////////////////////////

var Promise = __webpack_require__(1);
var helpers;

/**
 * @class files
 * @classdesc
 * <b><i> The files class, has all the methods for your owncloud files management.</i></b><br><br>
 * Supported Methods are:
 * <ul>
 *  <li><b>Files Management</b>
 *      <ul>
 *          <li>list</li>
 *          <li>getFileContents</li>
 *          <li>putFileContents</li>
 *          <li>mkdir</li>
 *          <li>createFolder</li>
 *          <li>delete</li>
 *          <li>fileInfo</li>
 *          <li>getFile</li>
 *          <li>getDirectoryAsZip</li>
 *          <li>putFile</li>
 *          <li>putDirectory</li>
 *          <li>move</li>
 *          <li>copy</li>
 *      </ul>
 *  </li>
 * </ul>
 *
 * @author Noveen Sachdeva
 * @version 1.0.0
 * @param   {object}    helperFile  instance of the helpers class
 */
function files(helperFile) {
    helpers = helperFile;
}

/**
 * Returns the listing/contents of the given remote directory
 * @param   {string}    remotePath    path of the file/folder at OC instance
 * @param   {string}    depth         0: only file/folder, 1: upto 1 depth, infinity: infinite depth
 * @returns {Promise.<fileInfo>}      Array[objects]: each object is an instance of class fileInfo
 * @returns {Promise.<error>}         string: error message, if any.
 */
files.prototype.list = function(path, depth) {
    if (path[path.length - 1] !== '/') {
        path += '/';
    }

    var headersToSend = {};
    if (!isNaN((parseInt(depth))) || depth === "infinity") {
        depth = depth.toString();
        headersToSend.depth = depth;
    }

    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('PROPFIND', path, headersToSend).then(files => {
            resolve(files);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Returns the contents of a remote file
 * @param   {string}  remotePath    path of the remote file at OC instance
 * @returns {Promise.<contents>}    string: contents of file
 * @returns {Promise.<error>}       string: error message, if any.
 */
files.prototype.getFileContents = function(path) {
    path = helpers._normalizePath(path);

    return new Promise((resolve, reject) => {
        helpers._get(helpers._webdavUrl + helpers._encodeString(path)).then(data => {
            var response = data.response;
            var body = data.body;

            if (response.statusCode === 200) {
                resolve(body);
            } else {
                var err = helpers._parseDAVerror(body);
                reject(err);
            }
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Write data into a remote file
 * @param   {string} remotePath path of the file at OC instance
 * @param   {string} content    content to be put
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.putFileContents = function(path, content) {
    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('PUT', path, null, content).then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Creates a remote directory
 * @param   {string} remotePath path of the folder to be created at OC instance
 * @returns {Promise.<status>}  boolean: wether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.mkdir = function(path) {
    if (path[path.length - 1] !== '/') {
        path += '/';
    }

    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('MKCOL', path).then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Creates a remote directory
 * @param   {string}  remotePath  path of the folder to be created at OC instance
 * @returns {Promise.<status>}    boolean: wether the operation was successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
files.prototype.createFolder = function(path) {
    if (path[path.length - 1] !== '/') {
        path += '/';
    }

    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('MKCOL', path).then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Deletes a remote file or directory
 * @param   {string}  remotePath  path of the file/folder at OC instance
 * @returns {Promise.<status>}    boolean: wether the operation was successful
 * @returns {Promise.<error>}     string: error message, if any.
 */
files.prototype.delete = function(path) {
    return new Promise((resolve, reject) => {
        helpers._makeDAVrequest('DELETE', path).then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Returns the file info for the given remote file
 * @param   {string}  remotePath    path of the file/folder at OC instance
 * @returns {Promise.<fileInfo>}    object: instance of class fileInfo
 * @returns {Promise.<error>}       string: error message, if any.
 */
files.prototype.fileInfo = function(path) {
    return new Promise((resolve, reject) => {
        this.list(path, 0).then(fileInfo => {
            resolve(fileInfo[0]);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Downloads a remote file
 * @param   {string} remotePath path of the file at OC instance
 * @param   {string} localPath  path where to download
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.getFile = function(path, localPath) {
    path = helpers._normalizePath(path);
    localPath = localPath || __dirname + path;
    path = helpers._encodeString(path);
    path = encodeURIComponent(path);
    path = path.split('%2F').join('/');

    return new Promise((resolve, reject) => {
        helpers._writeData(helpers._webdavUrl + path, localPath)
            .then(status => {
                resolve(status);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Downloads a remote directory as zip
 * @param   {string} remotePath path of the folder at OC instance
 * @param   {string} localPath  path where to download
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.getDirectoryAsZip = function(path, localPath) {
    path = helpers._normalizePath(path);
    localPath = localPath || __dirname + path;
    localPath = helpers._checkExtensionZip(localPath);
    path = helpers._encodeString(path);
    path = encodeURIComponent(path);
    path = path.split('%2F').join('/');

    var url = helpers.instance + 'index.php/apps/files/ajax/download.php?dir=' + (path);

    return new Promise((resolve, reject) => {
        helpers._writeData(url, localPath)
            .then(status => {
                resolve(status);
            }).catch(error => {
                reject(error);
            });
    });
};

/**
 * Upload a file
 * @param   {string}  remotePath path of the file to be created at OC instance
 * @param   {string}  localPath  path of the file to be uploaded
 * @param   {boolean} keepMTime  also update the remote file to the same mtime as the local one, defaults to true
 * @returns {Promise.<status>}   boolean: whether the operation was successful
 * @returns {Promise.<error>}    string: error message, if any.
 */
files.prototype.putFile = function(path, localPath, keepMTime) {
    keepMTime = keepMTime || true;
    var headers = {};

    if (!path || path === '' || path === '/') {
        path = helpers._getFileName(localPath);
    }

    if (keepMTime) {
        headers['X-OC-MTIME'] = helpers._getMTime(localPath);
    }

    headers['Content-Length'] = helpers._getFileSize(localPath);
    headers.authorization = "Basic " + new Buffer(helpers._username + ":" + helpers._password).toString('base64');

    return new Promise((resolve, reject) => {
        helpers._readFile(path, localPath, headers).then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Upload a directory with all its contents
 * @param   {string} remotePath path of the folder to be created at OC instance
 * @param   {string} localPath  path of the folder to be uploaded
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.putDirectory = function(targetPath, localPath) {
    /* jshint unused : false */
    var self = this;

    var filesToPut = helpers._getAllFileInfo(localPath, targetPath);
    var folderPromises = [];
    var allFiles = 0;
    var count = 0;

    for (var i = 0; i < filesToPut.length; i++) {
        allFiles += filesToPut[i].files.length;
        var folder = filesToPut[i].path;

        if (folderPromises.length > 0) {
            Promise.all(folderPromises).then(status => {
                folderPromises.push(self.mkdir(folder));
            });
        } else {
            folderPromises.push(self.mkdir(folder));
        }
    }

    return new Promise((resolve, reject) => {
        Promise.all(folderPromises).then(status => {
            for (var i = 0; i < filesToPut.length; i++) {
                var folder = filesToPut[i].path;
                for (var j = 0; j < filesToPut[i].files.length; j++) {
                    self.putFile(
                        folder + filesToPut[i].files[j],
                        filesToPut[i].localPath + filesToPut[i].files[j]
                    ).then(status2 => {
                        if (status2 === true) {
                            count++;
                        }

                        if (count === allFiles) {
                            resolve(true);
                        }
                    }).catch(error => {
                        reject(error);
                        return;
                    });
                }
            }
        }).catch(error => {
            reject(error);
            return;
        });
    });
    /* jshint unused : true */
};

/**
 * Moves a remote file or directory
 * @param   {string} source     initial path of file/folder
 * @param   {string} target     path where to move file/folder finally
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.move = function(source, target) {
    return new Promise((resolve, reject) => {
        helpers._webdavMoveCopy(source, target, 'MOVE').then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

/**
 * Copies a remote file or directory
 * @param   {string} source     initial path of file/folder
 * @param   {string} target     path where to copy file/folder finally
 * @returns {Promise.<status>}  boolean: whether the operation was successful
 * @returns {Promise.<error>}   string: error message, if any.
 */
files.prototype.copy = function(source, target) {
    return new Promise((resolve, reject) => {
        helpers._webdavMoveCopy(source, target, 'COPY').then(status => {
            resolve(status);
        }).catch(error => {
            reject(error);
        });
    });
};

module.exports = files;

/* WEBPACK VAR INJECTION */}.call(exports, "/", __webpack_require__(0).Buffer))

/***/ })
/******/ ]);