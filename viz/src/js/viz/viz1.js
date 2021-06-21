$(function () {

  plot = (data, update) => {
    const height = 600
    const width = $("#main")[0].scrollWidth
    const margin = {
      top: 25,
      bottom: 25,
      right: 25,
      left: 25,
    }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    let svg = undefined

    console.log(update)

    if (update) {
      svg = d3.select("#main").select("svg").select("g")
      svg.selectAll("*").remove()
    } else {
      svg = d3.select("#main").append("svg")
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

    $("#total").html(parseInt(boxplotData.reduce((sum, d) => d.qtde + sum, 0) / boxplotData.length))
    $("#incomuns").html(parseInt(histogramData.reduce((sum, d) => d.bin_height + sum, 0) / histogramData.length))

    const measures = { height, width, margin, innerWidth, innerHeight }

    const scaleBoxplot = boxplot(boxplotData, svg, measures)
    histogram(histogramNest, svg, measures, scaleBoxplot, maxUppeFence, bins)

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
    }).catch(function (error) {
      displayError("Sem conexão com o servidor!")
      console.log(error)
    }).then(function (data) {
      plot(data, update)
    }).fin
  }

  $("#periodo").change(() => getData($("#periodo").val(), true))

  getData($("#periodo").val(), false)

})
