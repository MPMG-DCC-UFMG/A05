histogram = (data, svg, measures, scaleBoxplot, maxUppeFence, bins) => {

  const { margin, innerHeight, innerWidth } = measures

  const yCompetencias = d3.scaleBand()
    .domain(d3.range(data.length))
    .range([margin.top, innerHeight])
    .paddingInner(0.3)
    .paddingOuter(0.2)

  const xBins = d3.scaleBand()
    .domain(d3.range(bins))
    .range([0, innerWidth - scaleBoxplot(maxUppeFence)])
    .paddingInner(0.05)
    .paddingOuter(0.1)

  const maxHeight = d3.max(data.map(({ bins }) => d3.max(bins.map(d => +d.bin_height))))

  const yHeight = d3.scaleLinear()
    .domain([0, maxHeight])
    .range([0, yCompetencias.bandwidth()])

  const hist = svg.selectAll(".hist")
    .data(data)
    .enter().append("g")
    .attr('class', 'hists')
    .attr('transform', () => `translate(${[scaleBoxplot(maxUppeFence), 0]})`)

  hist.transition()
    .attr('transform', (_, i) => `translate(${[scaleBoxplot(maxUppeFence), yCompetencias(i)]})`)

  const yCenter = yCompetencias.bandwidth() / 2

  const showValues = hist.selectAll(".value")
    .data(d => d.bins)
    .enter().append('text')
    .attr('class', 'value')
    .attr('opacity', 0)
    .attr("fill", '#b4464b')
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("x", (_, i) => xBins(i) + xBins.bandwidth() / 2)
    .attr("y", d => yCenter + - (yHeight(d.bin_height) / 2) - 5)
    .text(d => d.bin_height)

  hist.selectAll(".bins")
    .data(d => d.bins.map((d, i) => {
      d["index"] = i
      return d
    }))
    .enter().append('line')
    .attr('class', 'bins')
    .attr('stroke', '#b4464b')
    .attr('stroke-width', xBins.bandwidth())
    .attr('x1', (_, i) => xBins(i) + xBins.bandwidth() / 2)
    .attr('y1', d => yCenter + (yHeight(d.bin_height) / 2))
    .attr('x2', (_, i) => xBins(i) + xBins.bandwidth() / 2)
    .attr('y2', d => yCenter + - (yHeight(d.bin_height) / 2))

  hist.selectAll(".binsOver")
    .data((d, i) => d.bins)
    .enter().append('line')
    .attr('class', 'binsOver')
    .attr('stroke', '#b4464b')
    .attr('opacity', 00)
    .attr('stroke-width', xBins.bandwidth())
    .attr('x1', (_, i) => xBins(i) + xBins.bandwidth() / 2)
    .attr('y1', 0)
    .attr('x2', (_, i) => xBins(i) + xBins.bandwidth() / 2)
    .attr('y2', yCompetencias.bandwidth())
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget).attr('opacity', 0.05)
      showValues.attr('opacity', t => d == t ? 1 : 0)
    })
    .on("mouseout", (e) => {
      d3.select(e.currentTarget).attr('opacity', 0)
      showValues.attr('opacity', 0)
    })

  const maxDistance = scaleBoxplot.domain()[1]

  const outlierScale = d3.scaleLinear()
    .domain([maxUppeFence, maxDistance])
    .range([0, innerWidth - scaleBoxplot(maxUppeFence)])

  const xAxisOutlier = d3.axisBottom(outlierScale)
  svg.append("g")
    .attr("class", "x-axis-outlier")
    .attr('transform', (_, i) => `translate(${[scaleBoxplot(maxUppeFence), 0]})`)
    .call(xAxisOutlier.tickValues([maxUppeFence, maxDistance]))
    .append("text")
    .attr("fill", '#b4464b')
    .attr("text-anchor", "middle")
    .attr("x", (innerWidth - maxUppeFence) / 2)
    .attr("y", "-5")
    .text("incomuns")


}