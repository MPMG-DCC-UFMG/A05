module.exports = (app) => {

  const query = (sql) => {

    return new Promise((resolve, reject) => {
      process.conn.createStatement(function (err, statement) {
        if (err) {
          console.log(`erro1: ${err}`)
          reject(err)
        }
        statement.executeQuery(sql, function (err, resultset) {
          if (err) {
            console.log(`erro2: ${err}`)
            reject(err)
          }
          resultset.toObjArray(function (err, results) { 
            if (err) {
              console.log(`erro3: ${err}`)
              reject(err)
            }
            resolve(results)
          })

        })
      })
    })

  }

  return { query }

}