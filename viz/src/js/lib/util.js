thousandFormat = n => n.toLocaleString('pt-BR')

kmFormat = n => `${thousandFormat(d3.format(".0f")(n))}km`

displayLoading = (show = true) => {

  const loading = `<img style="width: 25px; height: 25px" src="img/loading.svg"/>`

  if (show) {
    $("#loading").html(loading)
    $("#status").html("Carregando da base de dado...")
    
    $("#total").html(loading)
    $("#incomuns").html(loading)
    return
  }
  $("#loading").html("")
  $("#status").html("")
  
  $("#total").html("")
  $("#incomuns").html("")
}

displayError = (errorMessage) => {

  const error = `<img style="width: 17px; height: 17px" src="img/error.svg"/>`

  $("#loading").html(error)
  $("#status").html(errorMessage)
  $("#total").html("")
  $("#incomuns").html("")
}

capitalize = (s) => s.toString()[0].toUpperCase() + s.toString().slice(1);