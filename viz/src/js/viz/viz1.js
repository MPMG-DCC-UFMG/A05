$(function () {

  const mainDiv = "#boxplotViz"
  const checkBoxplot = $("#displayNormalidade")
  const checkHistogram = $("#displayAnomalias")

  plot = (data, update) => {
    const height = 450
    const width = $(mainDiv)[0].scrollWidth// / 2 - 50
    const margin = {
      top: 30,
      bottom: 25,
      right: 25,
      left: 25,
    }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    let svg = undefined

    if (update) {
      svg = d3.select(mainDiv).select("svg").select("g")
      svg.selectAll("*").remove()
    } else {
      svg = d3.select(mainDiv).append("svg")
        .attr("class", "viz1")
        .attr("width", width)
        .attr("height", height)
        .attr("font-family", "sans-serif")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMinYMin meet")

        .append("g")
        .attr('transform', 'translate(' + [margin.left, margin.top] + ')')
    }

    const { boxplot: boxplotData, histogram: histogramData, maxUppeFence, bins } = data

    // NESTING HISTOGRAM DATA BY competencia
    const histogramNest = Array.from(d3.group(histogramData, d => d.competencia)).map(([k, v]) => { return { competencia: k, bins: v } })

    const total = +boxplotData.reduce((sum, d) => +d.qtde + sum, 0) / boxplotData.length
    const anomalias = +d3.format(".0f")(+histogramData.reduce((sum, d) => +d.bin_height + sum, 0) / histogramNest.length)
    const percAnomalis = d3.format(".2f")((+anomalias / +total) * 100).replace('.', ',')
    const normal = +d3.format(".0f")(total - anomalias)
    const percNormal = d3.format(".2f")((+normal / +total) * 100).replace('.', ',')
    const mediaMediana = +boxplotData.reduce((sum, d) => +JSON.parse(d.percentils_25_50_75)[1] + sum, 0) / boxplotData.length

    $("#cardTotal").html(total.toLocaleString('pt-BR'))
    $("#cardAnomalia").html(`${anomalias.toLocaleString('pt-BR')}`)
    $("#cardPercAnomalia").html(`<small>Possíveis anomalias</small><br>(${percAnomalis}%)`)
    $("#cardNormal").html(`${normal.toLocaleString('pt-BR')}`)
    $("#cardPercNormal").html(`<small>Normalidade</small><br>(${percNormal}%)`)

    $("#cardDistanciaMediana").html(`${mediaMediana.toLocaleString('pt-BR')}`)
    $("#cardDistanciaLimite").html(`${maxUppeFence.toLocaleString('pt-BR')}`)

    const measures = { height, width, margin, innerWidth, innerHeight }
    const controls = { checkBoxplot, checkHistogram }

    const scaleBoxplot = boxplot(boxplotData, svg, measures, maxUppeFence, percNormal, controls)
    histogram(histogramNest, svg, measures, scaleBoxplot, maxUppeFence, bins, percAnomalis, controls)

    //return { svg, measures: { height, width, margin, innerWidth, innerHeight } }
  }

  // EXIBI ICONES 'LOADING'
  getData = (update) => {
    const periodo = $("#periodo").val()
    displayLoading()
    d3.json(`${API_HOST}:${API_PORT}/api/get_data_viz_1/`, {
      method: "POST",
      body: JSON.stringify({
        "competencia": periodo
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    }).catch(error => {
      displayError("Sem conexão com o servidor!")
      console.log(error)
    }).then(data => {
      plot(data, update)
      displayLoading(false)
    })
  }

  displayViz = (type, display) => {
    const svg = d3.select(mainDiv).select("svg").select("g")
  }

  let where = []

  const dtViz1 = $("#detalheDistancias").DataTable({
    "language": {
      "url": "//cdn.datatables.net/plug-ins/1.10.25/i18n/Portuguese-Brasil.json"
    },
    "deferRender": true,
    "processing": true,
    "serverSide": true,
    "order": [],
    "searching": false,
    "processing": true,
    "deferLoading": 0,
    "ajax": {
      "url": `${API_HOST}:${API_PORT}/api/get_detail_viz_1/`,
      "type": "POST",
      "contentType": "application/json",
      "data": d => { return JSON.stringify({ ...d, where }) },
    },
    "columnDefs": [
      {
        // The `data` parameter refers to the data for the cell (defined by the
        // `data` option, which defaults to the column being worked with, in
        // this case `data: 0`.
        "render": cidades => {
          const cidadesUrl = JSON.parse(cidades).map(d => d.split().join("+")).join(",+MG/") + ",+MG/"
          const href = `https://www.google.com/maps/dir/${cidadesUrl}`
          const click = `<a href="${href}" target="_blank"><i class="fas fa-map"></i></a>`
          return `${click}<ul>${JSON.parse(cidades).map(
            d => `<li><small>${d}</small></li>`
          ).join("")}</ul>`
        },
        "targets": 4
      },
      { "className": "dt-center", "targets": "_all" },
      //{ "visible": false,  "targets": [ 3 ] }
    ],
  })

  displayLoading()

  checkBoxplot.change(() => {
    if (!checkBoxplot.is(":checked"))
      checkHistogram.prop('checked', true)
    getData(true)
  })

  checkHistogram.change(() => {
    if (!checkHistogram.is(":checked"))
      checkBoxplot.prop('checked', true)
    getData(true)
  })

  $("#periodo").change(() => getData(true))

  getData(false)

  getDataTable = (competencia, start, end, update) => {
    displayLoading()
    where = { competencia, start, end }
    $("#modalDetalhes").modal('show')
    dtViz1.ajax.reload()
    displayLoading(false)
  }


})