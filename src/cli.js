const fs = require('fs')
const vm = require('vm')

const minimist = require('minimist')
const bent = require('bent')
const _ = require('lodash')
const chalk = require('chalk')
var colorize = require('json-colorizer');

function gronToObject(str) {
  const lines = str.trim().split('\n')
  const sandbox = _.compact(lines).reduce((obj, line) => {
    const splitLine = line.split('=');
    const rawKey = splitLine[0];
    const rawValue = splitLine[1];
    return _.set(obj, rawKey.trim(), null);
  }, {});

  const script = new vm.Script(str);
  const context = new vm.createContext(sandbox);
  script.runInContext(context);
  return sandbox.json;
}

const argv = minimist(process.argv.slice(2))
const { blue, yellow, magenta, red, cyan, white } = new chalk.constructor({ enabled: !argv.u })

const utilsType = me => Object.prototype.toString.call(me).split(/\W/)[2].toLowerCase()
const keyworthy = key => key && (/^[a-z][a-z0-9]*$/i.test(key) ? `.${blue.bold(key)}` : magenta('[') + yellow(`"${key}"`) + magenta(']')) || blue.bold('json')

const colorFilters = {
  string: yellow,
  number: red,
  boolean: cyan
}

const recurse = (val, key, path = [], arr, out = []) => {
  if (arr) {
    path.push(key)
  } else {
    path.push(keyworthy(key))
  }

  if (utilsType(val) === 'object') {
    out.push(`${path.join('')} = ${magenta('{}')};`)
    Object.entries(val).forEach(([ key, val ]) => {
      recurse(val, key, path, false, out)
      path.pop()
    })
  } else if (utilsType(val) === 'array') {
    out.push(`${path.join('')} = ${magenta('[]')};`)
    val.forEach((val, index) => {
      recurse(val, magenta('[') + red(index) + magenta(']'), path, true, out)
      path.pop()
    })
  } else {
    out.push(`${path.join('')} = ${colorFilters[utilsType(val)](JSON.stringify(val))};`)
  }

  return out
}

const sorter = (a, b) => a.slice(0, a.indexOf(' ')) < b.slice(0, b.indexOf(' ')) ? -1 : 1

const formatter = stuff => recurse(stuff).sort(sorter).join('\n')

const c = chalk.constructor({ enabled: true })
const defaultColors = {
    BRACE: c.magenta,
    BRACKET: c.magenta,
    COLON: c.white,
    COMMA: c.white,
    STRING_KEY: c.blue.bold,
    STRING_LITERAL: c.yellow,
    NUMBER_LITERAL: c.red,
    BOOLEAN_LITERAL: c.cyan,
    NULL_LITERAL: c.cyan
}

const pretty = obj => colorize(JSON.stringify(obj || {}, null,2), { colors: defaultColors })

void (async () => {
  let src = ''
  if (!process.stdin.isTTY) {
    src = JSON.parse(fs.readFileSync(0))
  } else if (argv._[0] && /^https?:\/\//.test(argv._[0])) {
    src = await bent('json')(argv._[0])
  } else {
    src = JSON.parse(fs.readFileSync(argv._[0]))
  }
  if (argv.g) {
    str = src
    const value = _.get(str, argv.g)
    if (typeof value === 'string' || typeof value === 'number') {
      console.log(value)
    } else {
      console.log(pretty(value))
    }
  } else {
    let str = formatter(src)
    if (argv.f) {
      str = str.split('\n').filter(item => RegExp(argv.f, argv.i ? 'i' : '').test(item)).join('\n')
    }
    if (argv.u) {
      console.log(pretty(gronToObject(str)))
    } else {
      console.log(str)
    }
  }
})()
