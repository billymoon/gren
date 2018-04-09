const fs = require('fs')

const minimist = require('minimist')
const bent = require('bent')
const { blue, yellow, magenta, red, cyan, bold } = require('colors/safe')

const argv = minimist(process.argv.slice(2))

const utilsType = me => Object.prototype.toString.call(me).split(/\W/)[2].toLowerCase()
const keyworthy = key => key && (/^[a-z][a-z0-9]*$/i.test(key) ? `.${bold(blue(key))}` : magenta('[') + yellow(`"${key}"`) + magenta(']')) || bold(blue('json'))

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

const outputter = stuff => console.log(recurse(stuff).sort(sorter).join('\n'))

void (async () => {
  if (!process.stdin.isTTY) {
    outputter(JSON.parse(fs.readFileSync(0)))
  } else if (argv._[0] && /^https?:\/\//.test(argv._[0])) {
    outputter(await bent('json')(argv._[0]))
  } else {
    outputter(JSON.parse(fs.readFileSync(argv._[0])))
  }
})()
