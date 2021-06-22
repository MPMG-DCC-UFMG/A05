$(function () {

  const mainDiv = "#boxplotViz"

  plot = (data, update) => {
    const height = 600
    const width = $(mainDiv)[0].scrollWidth
    const margin = {
      top: 25,
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

    displayLoading(false)

    const total = +boxplotData.reduce((sum, d) => +d.qtde + sum, 0) / boxplotData.length
    const anomalias = +d3.format(".0f")(+histogramData.reduce((sum, d) => +d.bin_height + sum, 0) / histogramNest.length)
    const percAnomalis = d3.format(".2f")(+anomalias / +total).replace('.', ',')
    const normal = +d3.format(".0f")(total - anomalias)
    const percNormal = d3.format(".2f")(+normal / +total).replace('.', ',')

    $("#cardTotal").html(total.toLocaleString('pt-BR'))
    $("#cardAnomalia").html(`${anomalias.toLocaleString('pt-BR')}`)
    $("#cardPercAnomalia").html(`Anomalias (${percAnomalis}%)`)
    $("#cardNormal").html(`${normal.toLocaleString('pt-BR')}`)
    $("#cardPercNormal").html(`Normal (${percNormal}%)`)

    const measures = { height, width, margin, innerWidth, innerHeight }

    const scaleBoxplot = boxplot(boxplotData, svg, measures, maxUppeFence, percNormal)
    histogram(histogramNest, svg, measures, scaleBoxplot, maxUppeFence, bins, percAnomalis)

    //return { svg, measures: { height, width, margin, innerWidth, innerHeight } }
  }

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
    })
  }

  $("#periodo").change(() => getData($("#periodo").val(), true))

  getData($("#periodo").val(), false)

  getDataTable = (start, end, update) => {
    displayLoading()
    d3.json('http://localhost:7000/api/get_detail_viz_1/', {
      method: "POST",
      body: JSON.stringify({
        "competencia": $("#periodo").val(),
        start,
        end,
        update
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    }).catch(error => {
      displayError("Sem conexão com o servidor!")
      console.log(error)
    }).then(data => {
      console.log(data)
    })
  }


  /*Papa.parse("data/s07_distancia_maxima_sample.csv", {
    download: true,
    complete: function (example) {
      console.log(example.data)
      $(document).ready(function () {
        $('#distancia').DataTable({
          data: example.data,
          dataSrc: "",
          columns: [
            { title: "cns" },
            { title: "nome" },
            { title: "competencia" },
            { title: "list_cidades" },
            { title: "qtd_cidades" },
            { title: "distancia_maxima" }
          ]
        })
      })
    }
  })
}*/


})