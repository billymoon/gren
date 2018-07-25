const fs = require('fs')
const vm = require('vm')

const minimist = require('minimist')
const bent = require('bent')
const _ = require('lodash')
const chalk = require('chalk')
var colorize = require('json-colorizer');
const highlight = require('cli-highlight').highlight

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
// https://github.com/chalk/ansi-regex/blob/master/index.js
const ansiRegex = /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PRZcf-ntqry=><~]))/g
const stripansi = input => input.replace(ansiRegex, '')

const pretty = json => colorize(json, { colors: defaultColors })

const getInput = () => {
  const promise = new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {

      const chunks = []

      process.stdin.setEncoding('utf8')

      process.stdin.on('readable', () => {
        const chunk = process.stdin.read()
        if (chunk !== null) {
          chunks.push(chunk)
        }
      })

      process.stdin.on('end', () => {
        resolve(chunks.join(''))
      })

      // process.stdin.on('error', () => {
      //   reject({ err: 'no data' })
      // })

      // process.stdin.on('close', () => {
      //   reject({ err: 'no data' })
      // })
    } else if (argv._[0] && /^https?:\/\//.test(argv._[0])) {
      (bent('json')(argv._[0])).then(obj => resolve(JSON.stringify(obj)))
    } else if (argv._[0]) {
      resolve(fs.readFileSync(argv._[0], 'utf8'))
    } else {
      resolve(JSON.stringify({ error: 'no input' }))
    }
  })
  return promise
}

getInput().then(src => {
  const objectified = argv.i ? gronToObject(src) : JSON.parse(src)
  const obj = !argv.f ? objectified : gronToObject(stripansi(formatter(objectified)).split('\n').filter(item => RegExp(argv.f, argv.s ? '' : 'i').test(item)).join('\n'))
  // if we are getting a value, write out strings and numbers as is, highlight others
  // else 
  if (argv.g) {
    const value = _.get(obj, argv.g)
    if (typeof value === 'string' || typeof value === 'number') {
      process.stdout.write(value)
    } else {
      process.stdout.write(highlight(JSON.stringify(value, null, 2)))
    }
  } else {
    // if output arg set, output gren-ish
    // else output json
    if (argv.o) {
      process.stdout.write(formatter(obj))
    } else {
      process.stdout.write(highlight(JSON.stringify(obj, null, 2)))
    }
  }
})
