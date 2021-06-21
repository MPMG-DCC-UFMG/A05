boxplot = (data, svg, measures) => {

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

  const stats = quartiles.map(d => d3.boxplotStats(d.stats))

  const domain = [
    d3.min(quartiles.map(a => d3.min(a.stats))),
    d3.max(quartiles.map(a => d3.max(a.stats)))
  ]

  const scale = d3.scaleLinear()
    .domain(domain)
    .range([margin.left, innerWidth])

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

  boxplots.selectAll('.boxplot').data(stats)
    .join('g')
    .attr('class', 'boxplot')
    .transition()
    .attr('transform', (_, i) => `translate(${[0, band(i)]})`)
    .attr('color', "steelblue")
    .call(plot)

  const xAxis = d3.axisBottom(scale);
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(xAxis)

  svg.append("g")
    .attr("class", "x-axis-grid")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(xAxis.tickSize(-innerHeight).tickFormat('').tickSizeOuter(0))

  const yAxis = d3.axisLeft(d3.scaleBand()
    .domain(quartiles.map(d => capitalize(
      d.competencia.length == 6 ? // 201501 
        new Date(_, +d.competencia.slice(-2), _).toLocaleString('pt-br', { month: 'short' }) :
        d.competencia)
    ))
    .range([margin.top, innerHeight])
    .paddingInner(0.3)
    .paddingOuter(0.2)
  )

  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left - 1},0)`)
    .call(yAxis)

  return scale
}
