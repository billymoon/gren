var colorize = require('json-colorizer');

var chalk = require('chalk')

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

const pretty = json => colorize(json, { colors: defaultColors })

console.log(pretty('{"in":"pink"}'))
console.log(pretty(require('fs').readFileSync('package.json', 'utf8')))
console.log(pretty(require('fs').readFileSync('lots.json', 'utf8')))
