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
    console.log('default word data: ')
    console.log(i[0])

    if (!i[0]) {
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
      let themeOffset = (i[0].theme.match((/,/g)) || []).length
      let thisOffset = 1
      word.mean = word.mean.replace(/(\/mean)/g, (match, p1, offset, string) => {
        thisOffset++
        return '＂' + (themeOffset + thisOffset) + '＂'
      })
      console.log(i[0].mean !== word.mean)
      if (i[0].type !== word.type || i[0].mean !== word.mean || i[0].theme !== word.theme) {
        await db.any('UPDATE public.kkutu_ko SET type=$1, mean=$2, theme=$3 WHERE _id = $4', [
          i[0].type + ',' + word.type,
          i[0].mean + '  ' + word.mean,
          i[0].theme + ',' + word.theme,
          word.id
        ])
        /* console.log('UPDATE public.kkutu_ko SET type=' + i[0].type + ',' + word.type +
          ', mean=' + i[0].mean + '  ' + word.mean + ', theme=' + i[0].theme + ',' + word.theme +
          ' WHERE _id = ' + word.id) // test code */
      } else {
        console.log('same word. not update.')
      }
    }
    console.log('success')
    i = await db.any('SELECT * FROM public.kkutu_ko WHERE _id = $1', word.id)
    console.log('inputed data: ')
    console.log(i[0])
    callback()
  } catch (e) {
    callback(e)
  }
}
