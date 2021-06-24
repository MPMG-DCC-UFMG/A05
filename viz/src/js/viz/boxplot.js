boxplot = (data, svg, measures, maxUppeFence, perc, controls) => {

  const { margin, innerWidth, innerHeight } = measures

  // QUARTILES
  const quartiles = data.sort((a, b) => a.competencia - b.competencia)
    .map(d => {
      const q = JSON.parse(d.percentils_25_50_75)
      q.unshift(d.minimo)
      q.push(d.maximo)
      return {
        competencia: d.competencia,
        stats: q
      }
    })

  // EIXO Y
  const yAxis = d3.axisLeft(d3.scaleBand()
    .domain(quartiles.map(d => {
      const year = +d.competencia.slice(4)
      const month = +d.competencia.slice(-2) - 1
      return capitalize(
        d.competencia.length == 6 ? // 201501 
          new Date(year, month).toLocaleString('pt-br', { month: 'short' }) :
          d.competencia)
    }))
    .range([margin.top, innerHeight])
    .paddingInner(0.3)
    .paddingOuter(0.2)
  )
  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left - 1},0)`)
    .call(yAxis)

  // max RECEBE maxUppeFence
  /*if (!controls.checkHistogram.is(":checked")) {
    quartiles.map(d => d.stats[d.stats.length - 1] = maxUppeFence)
  }*/

  const stats = quartiles.map(d => d3.boxplotStats(d.stats))

  let minDomain = d3.min(quartiles.map(a => d3.min(a.stats)))
  let maxDomain = d3.max(quartiles.map(a => d3.max(a.stats)))

  if (!controls.checkBoxplot.is(":checked")) {
    minDomain = maxUppeFence
  }

  if (!controls.checkHistogram.is(":checked")) {
    maxDomain = maxUppeFence
    // max RECEBE maxUppeFence
    /*stats.map(d => {
      d.points.map(p => p.outlier = false)
      d.whiskers[1].start = maxUppeFence
      d.whiskers[1].end = d.fiveNums[3]
    })*/
  }

  const scale = d3.scaleLinear()
    .domain([minDomain, maxDomain])
    .range([margin.left, innerWidth])

  //  EIXO X
  const xAxis = d3.axisBottom(scale);
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(xAxis.tickFormat(thousandFormat))

  // EIXO X GRID
  svg.append("g")
    .attr("class", "x-axis-grid")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(xAxis.tickSize(-innerHeight).tickFormat('').tickSizeOuter(0))

  if (!controls.checkBoxplot.is(":checked"))
    return scale

  const band = d3.scaleBand()
    .domain(d3.range(stats.length))
    .range([margin.top, innerHeight])
    .paddingInner(0.3)
    .paddingOuter(0.2)
  /*.paddingInner(options.includes('minimalStyle') ? 0 : 0.3)
  .paddingOuter(options.includes('minimalStyle') ? 2 : 0.2)*/

  const plot = d3.boxplot()
    .scale(scale)
    .jitter(false)
    .opacity(0.7)
    .showInnerDots(false)
    //.symbol(options.includes('useSymbolTick') ? d3.boxplotSymbolTick : d3.boxplotSymbolDot)
    .bandwidth(band.bandwidth())
    //.boxwidth(options.includes('minimalStyle') ? 3 : band.bandwidth())
    .boxwidth(band.bandwidth())
    //.vertical(vertical)
    .key(d => d)

  const boxplots = svg.append("g").attr('class', 'boxplots')

  const mediaMediana = +data.reduce((sum, d) => +JSON.parse(d.percentils_25_50_75)[1] + sum, 0) / data.length

  boxplots.append("line")
    .attr('class', 'mediana')
    .attr('stroke', "steelblue")
    .attr('opacity', .5)
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', 4)
    .attr('x1', scale(mediaMediana))
    .attr('y1', 0)
    .attr('x2', scale(mediaMediana))
    .attr('y2', -innerHeight + margin.top + 25)
    .transition()
    .attr('transform', `translate(${[0, innerHeight - margin.bottom + 10]})`)

  boxplots.append("text")
    .attr('class', 'mediana-text')
    .attr("fill", "steelblue")
    .attr("text-anchor", "middle")
    .attr('x', scale(mediaMediana))
    .attr('y', 0)
    .text(`${mediaMediana.toLocaleString('pt-br')}km`)
    .transition()
    .attr('transform', `translate(${[0, + margin.bottom + 10]})`)

  boxplots.selectAll('.boxplot')
    .data(stats)
    .join('g')
    .attr('class', 'boxplot')
    .transition()
    .attr('transform', (_, i) => `translate(${[0, band(i)]})`)
    .attr('color', "steelblue")
    .call(plot)

  const normalScale = d3.scaleLinear()
    .domain([minDomain, maxUppeFence])
    .range([margin.left, scale(maxUppeFence)])

  const xAxisNormal = d3.axisBottom(normalScale)
  svg.append("g")
    .attr("class", "x-axis-normal")
    .call(xAxisNormal.tickValues([minDomain]).tickFormat(kmFormat))
    .append("text")
    .attr("fill", "steelblue")
    .attr("text-anchor", "middle")
    .attr("x", scale((maxUppeFence - margin.left) / 2))
    .attr("y", "-5")
    .text(`Normal (${perc}%)`)

  return scale
}
