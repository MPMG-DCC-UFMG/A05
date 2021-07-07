module.exports = (app) => {

  const hive = app.services.hive

  dataFromDB = async (sql) => {
    if (!sql)
      return []
    console.log(sql)
    const p = hive.query(sql)
    return await p // wait until the promise resolves (*)
  }

  const getBoxplotData = async (competencia) => {

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

  const getHistogramData = async (competencia, maxUppeFence, binsdWidth) => {

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

  const getDetails = async (where, pagination) => {

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

  return { getBoxplotData, getHistogramData, getDetails }

}