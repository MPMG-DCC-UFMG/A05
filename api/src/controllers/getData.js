module.exports = (app) => {

  const Papa = require('papaparse');
  const fastcsv = require('fast-csv')
  const _ = require('lodash');

  fs = require('fs')

  const hive = app.services.hive
  const controller = {}

  saveResultFile = (data, competencia) => {
    const filename = `src/data/${competencia}.json`
    fs.writeFile(filename, JSON.stringify(data), 'utf8', function (err) {
      if (err) console.log(err)
    })
  }

  dataFromFile = (file, extension, where) => {
    const filename = `src/data/${file}.${extension}`
    if (fs.existsSync(filename)) {
      if (extension == 'csv') {
        const { competencia, start, end } = where
        return {
          promise: (filename) => new Promise((resolve, reject) => {
            const file = fs.createReadStream(filename)
            const data = []
            Papa.parse(file, {
              header: true,
              worker: true,
              step: r => {
                let { distancia_maxima, competencia: competenciaRow } = r.data
                let push = +distancia_maxima >= +start && +distancia_maxima <= +end
                if (competencia != 'todas') {
                  competenciaRow = competenciaRow.slice(0, competencia.length)
                  push &= competenciaRow == competencia
                }
                if (push) {
                  // OBJECT PARA ARRAY
                  const d = Object.keys(r.data).map(k => r.data[k])
                  d["cidades"] =
                    data.push(d)
                }
              },
              complete: () => resolve(data),
              error: () => reject("erro")
            })
          }),
          filename
        }
      }
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

  getHistogramData = async (competencia, maxUppeFence, binsdWidth) => {

    const binIndex = `FLOOR((distancia_maxima-${maxUppeFence})/${binsdWidth})+1`

    query = (groupBy, where = `1 = 1`) =>
      `SELECT ${groupBy} competencia, ${binIndex} bin_index, COUNT(*) bin_height
       FROM s07_distancia_maxima_mensal 
       WHERE distancia_maxima >= ${maxUppeFence} and ${where}
       GROUP BY ${groupBy}, ${binIndex}
       ORDER BY 1, 2`

    let sql, where, groupBy = ''
    switch (true) {

      // TODAS
      case (competencia == "todas"):
        groupBy = "'todas'"
        sql = query(groupBy)
        break

      // POR ANOS
      case (competencia == "anos"):
        groupBy = "SUBSTR(competencia, 1, 4)"
        sql = query(groupBy)
        break

      // POR MESES DE UM ANO
      case (competencia.length == 4):
        groupBy = 'competencia'
        where = `SUBSTR(competencia, 1, 4) = '${competencia}'`
        sql = query(groupBy, where)
        break
    }
    const data = dataFromDB(sql)
    return data
  }

  getDetails = async (where, pagination) => {

    const { competencia, start, end } = where

    query = (where) =>
      `SELECT cns as cns, nome as nome, competencia as competencia, tipo_vinculo as tipo_vinculo,
       list_cidades as list_cidades, qtd_cidades as qtd_cidades, distancia_maxima as distancia_maxima
       FROM s07_distancia_maxima_mensal 
       WHERE distancia_maxima >= ${start} and distancia_maxima <= ${end} and ${where}
       ORDER BY  distancia_maxima
       LIMIT ${pagination.start},${pagination.length}`

    let whereSql = ""
    switch (true) {

      // TODAS
      case (competencia == "todas"):
        whereSql = `1 = 1`
        break

      // POR MESES DE UM ANO
      case (competencia.length == 4):
        whereSql = `SUBSTR(competencia, 1, 4) = '${competencia}'`
        break

      // POR MESES DE UM ANO
      case (competencia.length == 6):
        whereSql = `competencia = '${competencia}'`
        break
    }

    const data = dataFromDB(query(whereSql))
    return data

  }

  controller.viz1 = async (req, res) => {

    const { competencia, update } = req.body

    if (!update) {
      // VERIFICA SE O ARQUIVO DE RESULTADO (../data/*.json) EXISTE E POSSUI DADOS
      const dataFile = dataFromFile(competencia, "json")
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

    const maxKm = Math.max.apply(Math, boxplot.map(d => +d.maximo))

    const bins = 20
    const binsdWidth = (maxKm - maxUppeFence) / bins

    let histogram = await getHistogramData(competencia, maxUppeFence, binsdWidth)

    // UNIFICA O ÚLTIMO E PENÚLTIMO BIN QUANDO EXISTER DE MAIS DE ${bins}
    // ESSE PROBLEMA ACONTECE DEVIDO A TRUNCATE DE CASAS DECIMAIS
    if (histogram.length > bins) {
      histogram = histogram.reduce((arr, d) => {
        let { competencia, bin_index, bin_height } = d
        bin_index = +bin_index
        bin_height = +bin_height
        if (bin_index > bins)
          arr[bins - 1].bin_height += bin_height
        else
          arr.push({ competencia, bin_index, bin_height })
        return arr
      }, [])
    }
    // ADICIONA O COMEÇO (start) E O FIM (end) DE CADA BIN EM KM E A QUANTIDADE DE BINS
    histogram = histogram.map(d => {
      const start = maxUppeFence + (binsdWidth * (+d.bin_index - 1))
      const end = start + binsdWidth
      return { ...d, start, end }
    })

    const date = new Date().toString()

    const periodo = competencia == "todas" ? "Todas" : competencia == "anos" ? "Por Ano" : competencia

    const data = { date, boxplot, histogram, periodo, maxUppeFence, binsdWidth, bins }

    saveResultFile(data, competencia)

    return res.status(200).json(data)

  }

  controller.detailViz1 = async (req, res) => {

    const { where, update } = req.body

    const pagination = _.pick(req.body, ['start', 'length'])

    if (!update) {
      // VERIFICA SE O ARQUIVO DE RESULTADO EXISTE E POSSUI DADOS
      const { promise, filename } = dataFromFile("details", "csv", where)
      const p = promise(filename)
      const data = await p
      if (data != 0) {
        console.log("DATA FROM FILE")
        const result = {
          "draw": req.body.draw,
          "recordsFiltered": data.length,
          "recordsTotal": data.length,
          // PAGINATION

          "data": data.slice(pagination.start, pagination.start + pagination.length)
        }
        return res.json(result)
      }
    }

    const data = await getDetails(where, pagination)

    //saveResultFile(data, competencia) 

    const result = JSON.stringify({
      "draw": req.body.draw,
      "recordsFiltered": 0,
      "recordsTotal": 0,
      "data": data
    });

    console.log(result)
    res.send(result);
  }

  return controller
}

