$(function () {

  const mainDiv = "#boxplotViz"

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
    /*console.log(Array.from(histogramNest, ([key, values]) => Object() { [key]: values }))

    console.log(d3.max(histogramNest.map(d => d3.max(d.values.map(v => v.bin_height)))s))*/

    const total = +boxplotData.reduce((sum, d) => +d.qtde + sum, 0) / boxplotData.length
    const anomalias = +d3.format(".0f")(+histogramData.reduce((sum, d) => +d.bin_height + sum, 0) / histogramNest.length)
    const percAnomalis = d3.format(".2f")((+anomalias / +total) * 100).replace('.', ',')
    const normal = +d3.format(".0f")(total - anomalias)
    const percNormal = d3.format(".2f")((+normal / +total) * 100).replace('.', ',')
    const mediaMediana = +boxplotData.reduce((sum, d) => +JSON.parse(d.percentils_25_50_75)[1] + sum, 0) / boxplotData.length

    $("#cardTotal").html(total.toLocaleString('pt-BR'))
    $("#cardAnomalia").html(`${anomalias.toLocaleString('pt-BR')}`)
    $("#cardPercAnomalia").html(`<small>Anomalias</small> (${percAnomalis}%)`)
    $("#cardNormal").html(`${normal.toLocaleString('pt-BR')}`)
    $("#cardPercNormal").html(`<small>Normal</small> (${percNormal}%)`)

    $("#cardDistanciaMediana").html(`${mediaMediana.toLocaleString('pt-BR')}<small>km</small>`)
    $("#cardDistanciaLimite").html(`${maxUppeFence.toLocaleString('pt-BR')}<small>km</small>`)

    const measures = { height, width, margin, innerWidth, innerHeight }

    const scaleBoxplot = boxplot(boxplotData, svg, measures, maxUppeFence, percNormal)
    histogram(histogramNest, svg, measures, scaleBoxplot, maxUppeFence, bins, percAnomalis)

    //return { svg, measures: { height, width, margin, innerWidth, innerHeight } }
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
      "url": 'http://localhost:7000/api/get_detail_viz_1/',
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
          const click = `<a href="${href}" target="_blank"><i class="fas fa-eye"></i></a>`
          return `<ul>${JSON.parse(cidades).map(
            d => `<li><small>${d}</small></li>`
          ).join("")}</ul><br>${click}`
        },
        "targets": 4
      },
      //{ "visible": false,  "targets": [ 3 ] }
    ],
    /*"fields": [{
      "label": "CNS:",
      "name": "cns"
    }, {
      "label": "Nome:",
      "name": "nome"
    }, {
      "label": "Competencia:",
      "name": "competencia"
    }, {
      "label": "Cidades:",
      "name": "list_cidades"
    }, {
      "label": "Qtd. cidades:",
      "name": "qtd_cidades"
    }, {
      "label": "Distância máxima:",
      "name": "distancia_maxima",
    }],*/
    /*"dom": '<"toolbar"><"top"i>rft<"bottom"lp><"clear">',
    "autoWidth": false,
    "processing": true,
    "serverSide": true,
    "orderable": false,
    "ordering": false,
    "searching": true,
    "responsive": true,
    "deferLoading": 0, // here
    "ajax": {
      "url": 'http://localhost:7000/api/get_detail_viz_1/',
      "type": "POST",
      "data": d => { return { ...d, where } },
    },
    //"pageLength": 10,
    //PREVENT AJAX PRE-CALLING
    "deferLoading": 57,*/
  });

  displayLoading()

  // EXIBI ICONES 'LOADING'
  getData = (periodo, update) => {
    displayLoading()
    d3.json('http://localhost:7000/api/get_data_viz_1/', {
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

  $("#periodo").change(() => getData($("#periodo").val(), true))

  getData($("#periodo").val(), false)

  getDataTable = (competencia, start, end, update) => {
    displayLoading()
    where = { competencia, start, end }
    $("#modalDetalhes").modal('show')
    dtViz1.ajax.reload()
    displayLoading(false)
  }


})