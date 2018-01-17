const config = require('./config.json')
const pg = require('pg-promise')()
const words = require('./words.json');

(async () => {
  try {
    let db = pg(config.sql)
    db = await db.connect()
    words.forEach(async (value, index, thisarr) => {
      await inputWord(db, value)
    })
  } catch (e) {
    console.error(e)
  }
})()

async function inputWord (db, word) {
  console.log('new word data: ')
  console.log(word)
  let i = await db.any('SELECT * FROM public.kkutu_ko WHERE _id = $1', word.id)
  console.log('default word data: ')
  console.log(i[0])
  try {
    if (!i[0]) {
      await db.any('INSERT INTO public.kkutu_ko (_id, type, mean, flag, theme) VALUES ($1, $2, $3, $4, $5)', [
        word.id, word.type, word.mean, word.flag, word.theme
      ])
    } else {
      if (i[0].type !== word.type &&
      i[0].mean !== word.mean &&
      i[0].theme !== word.theme) {
        await db.any('UPDATE public.kkutu_ko SET type=$1, mean=$2, theme=$3 WHERE _id = $4', [
          i[0].type + ',' + word.type,
          i[0].mean + '  ' + word.mean,
          i[0].theme + ',' + word.theme,
          word.id
        ])
      } else {
        console.log('same word. not update.')
      }
    }
    console.log('success')
    i = await db.any('SELECT * FROM public.kkutu_ko WHERE _id = $1', word.id)
    console.log('inputed data: ')
    console.log(i[0])
  } catch (e) {
    console.log('error')
    console.error(e)
  }
}
