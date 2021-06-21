module.exports = (app) => {

  fs = require('fs')

  const hive = app.services.hive
  const controller = {}

  saveResultFile = (data, competencia) => {
    const filename = `src/data/${competencia}.json`
    fs.writeFile(filename, JSON.stringify(data), 'utf8', function (err) {
      if (err) console.log(err)
    })
  }

  dataFromFile = (competencia) => {
    const filename = `src/data/${competencia}.json`
    if (fs.existsSync(filename)) {
      return fs.readFileSync(filename, 'utf8')
    }
    return []
  }

  dataFromDB = async (sql) => {
    if (!sql)
      return []
    console.log(sql)
    const p = hive.query(sql)
    return await p // wait until the promise resolves (*)
  }

  getBoxplotData = async (competencia) => {

    mainSelect = (field = '', groupBy = '', where = '') =>
      `SELECT ${field} count(cns) qtde, percentile_approx(distancia_maxima, array(0.25, 0.5, 0.75)) percentils_25_50_75, 
      min(distancia_maxima) minimo, max(distancia_maxima) maximo
      FROM s07_distancia_maxima_mensal  
      WHERE distancia_maxima > 0 ${where} ${groupBy}`

    let sql, field, groupBy, where = ''
    switch (true) {

      // TODAS
      case (competencia == "todas"):
        field = "'todas' as competencia,"
        sql = mainSelect(field)
        break

      // POR ANOS
      case (competencia == "anos"):
        field = 'SUBSTR(competencia, 1, 4) as competencia,'
        groupBy = 'GROUP BY SUBSTR(competencia, 1, 4)'
        sql = mainSelect(field, groupBy)
        break

      // POR MESES DE UM ANO
      case (competencia.length == 4):
        field = 'competencia,'
        groupBy = 'GROUP BY competencia'
        where = `AND SUBSTR(competencia, 1, 4) = '${competencia}'`
        sql = mainSelect(field, groupBy, where)
        break
    }

    const data = await dataFromDB(sql)
    return data

  }

  getHistogramData = async (competencia, maxUppeFence, bins) => {

    subSelect = (bins, maxUppeFence, field = '', groupBy = '', where = '') =>
      `SELECT ${field} histogram_numeric(distancia_maxima , ${bins}) as bins
      FROM s07_distancia_maxima_mensal WHERE distancia_maxima > ${maxUppeFence}
      ${where}      
      ${groupBy}`

    let sql, field, groupBy = ''
    switch (true) {

      // TODAS
      case (competencia == "todas"):
        sql = `SELECT 'todas' as competencia, 
              cast(hist.x as int) as bin_center, cast(hist.y as bigint) as bin_height
              FROM (${subSelect(bins, maxUppeFence)}) t lateral view explode(bins) exploded_table as hist`
        break

      // POR ANOS
      case (competencia == "anos"):
        field = 'SUBSTR(competencia, 1, 4) as competencia,'
        groupBy = 'GROUP BY SUBSTR(competencia, 1, 4)'
        sql = `SELECT t.competencia as competencia,
              cast(hist.x as int) as bin_center, cast(hist.y as bigint) as bin_height
              FROM (${subSelect(bins, maxUppeFence, field, groupBy)}) t lateral view explode(bins) exploded_table as hist`
        break

      // POR MESES DE UM ANO
      case (competencia.length == 4):
        field = 'competencia,'
        groupBy = 'GROUP BY competencia'
        where = `AND SUBSTR(competencia, 1, 4) = '${competencia}'`
        sql = `SELECT t.competencia as competencia,
              cast(hist.x as int) as bin_center, cast(hist.y as bigint) as bin_height
              FROM (${subSelect(bins, maxUppeFence, field, groupBy, where)}) t lateral view explode(bins) exploded_table as hist`
        break
    }
    const data = dataFromDB(sql)
    return data
  }

  controller.viz1 = async (req, res) => {

    console.log(req.body)

    const { competencia, update } = req.body

    if (!update) {
      // VERIFICA SE O ARQUIVO DE RESULTADO (../data/*.json) EXISTE E POSSUI DADOS
      const dataFile = dataFromFile(competencia)
      if (dataFile != 0) {
        console.log("DATA FROM FILE")
        return res.status(200).json(JSON.parse(dataFile))
      }
    }

    const boxplot = await getBoxplotData(competencia)

    const maxUppeFence = Math.max.apply(Math, boxplot.map(d => {
      const [q1, _, q3] = JSON.parse(d.percentils_25_50_75)
      const step = (q3 - q1) * 1.5
      return upperFence = q3 + step
    }))

    const bins = 20

    const histogram = await getHistogramData(competencia, maxUppeFence, bins)

    const date = new Date().toString()

    const periodo = competencia == "todas" ? "Todas" : competencia == "anos" ? "Por Ano" : competencia

    const data = { date, boxplot, histogram, periodo, maxUppeFence, bins}

    saveResultFile(data, competencia)

    return res.status(200).json(data)

  }

  return controller
}

