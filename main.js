const config = require('./config.json')
const pg = require('pg-promise')()
const async = require('async')
const words = require('./words.json');

(async () => {
  try {
    let db = pg(config.sql)
    db = await db.connect()
    async.eachLimit(words, 1, (value, callback) => {
      inputWord(db, value, callback)
    }, (err) => {
      if (err) {
        console.error(err)
        process.exit()
      } else process.exit()
    })
  } catch (e) {
    console.error(e)
  }
})()

async function inputWord (db, word, callback) {
  try {
    console.log('new word data: ')
    console.log(word)
    let i = await db.any('SELECT * FROM public.kkutu_ko WHERE _id = $1', word.id)
    let dbWord = i[0]
    console.log('default word data: ')
    console.log(dbWord)

    if (!dbWord) {
      let thisOffset = 0
      word.mean = word.mean.replace(/(\/mean)/g, (match, p1, offset, string) => {
        thisOffset++
        return '＂' + thisOffset + '＂'
      })
      await db.any('INSERT INTO public.kkutu_ko (_id, type, mean, flag, theme) VALUES ($1, $2, $3, $4, $5)', [
        word.id, word.type, word.mean, word.flag, word.theme
      ])
      /* console.log('INSERT INTO public.kkutu_ko (_id, type, mean, flag, theme) VALUES (' + word.id + ', ' +
      word.type + ', ' + word.mean + ', ' + word.flag + ', ' + word.theme + ')') // test data */
    } else {
      let themeOffset = (dbWord.theme.match((/,/g)) || []).length
      let thisOffset = 1
      word.mean = word.mean.replace(/(\/mean)/g, (match, p1, offset, string) => {
        thisOffset++
        return '＂' + (themeOffset + thisOffset) + '＂'
      })
      if (dbWord.type === word.type || dbWord.mean === word.mean || dbWord.theme === word.theme) {
        console.log('same word. not update.')
      } else {
        await db.any('UPDATE public.kkutu_ko SET type=$1, mean=$2, theme=$3 WHERE _id = $4', [
          dbWord.type + ',' + word.type,
          dbWord.mean + '  ' + word.mean,
          dbWord.theme + ',' + word.theme,
          word.id
        ])
        /* console.log('UPDATE public.kkutu_ko SET type=' + dbWord.type + ',' + word.type +
          ', mean=' + dbWord.mean + '  ' + word.mean + ', theme=' + dbWord.theme + ',' + word.theme +
          ' WHERE _id = ' + word.id) // test code */
      }
    }
    console.log('success')
    i = await db.any('SELECT * FROM public.kkutu_ko WHERE _id = $1', word.id)
    console.log('inputed data: ')
    console.log(dbWord)
    callback()
  } catch (e) {
    callback(e)
  }
}
