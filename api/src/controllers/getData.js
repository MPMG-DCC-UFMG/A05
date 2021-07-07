module.exports = (app) => {

  const Papa = require('papaparse')
  const fastcsv = require('fast-csv')
  const _ = require('lodash')
  const models = app.models.s07

  fs = require('fs')

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

    const boxplot = await models.getBoxplotData(competencia)

    const maxUppeFence = Math.max.apply(Math, boxplot.map(d => {
      const [q1, _, q3] = JSON.parse(d.percentils_25_50_75)
      const step = (q3 - q1) * 1.5
      return upperFence = q3 + step
    }))

    const maxKm = Math.max.apply(Math, boxplot.map(d => +d.maximo))

    const bins = 20
    const binsdWidth = (maxKm - maxUppeFence) / bins

    let histogram = await models.getHistogramData(competencia, maxUppeFence, binsdWidth)

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

    const data = await models.getDetails(where, pagination)

    //saveResultFile(data, competencia) 

    const result = {
      "draw": req.body.draw,
      "recordsFiltered": data.length,
      "recordsTotal": data.length,
      // PAGINATION
      "data": data.slice(pagination.start, pagination.start + pagination.length)
    }
    return res.json(result)
  }

  return controller
}

