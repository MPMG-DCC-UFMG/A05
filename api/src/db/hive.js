require('dotenv').config();

module.exports = () => {
  const path = process.cwd()

  var JDBC = require('jdbc')
  var jinst = require('jdbc/lib/jinst')
  if (!jinst.isJvmCreated()) {
    jinst.addOption("-Xrs");
    jinst.setupClasspath([
      `${path}/src/drivers/hive-jdbc-uber-2.6.5.0-292.jar`,
      `${path}/src/drivers/slf4j-simple-1.6.1.jar`
    ]);
  }
  var config = {
    // SparkSQL configuration to your server
    url: 'jdbc:hive2://localhost:10000/trilhas',
    drivername: 'org.apache.hive.jdbc.HiveDriver',
    minpoolsize: 1,
    maxpoolsize: 100,
    user: process.env.HIVE_USER,
    password: process.env.HIVE_PASS,
    properties: {}
  };

  var hive = new JDBC(config)
  var conn = null

  //initialize
  hive.initialize(function (err) {
    if (err) {
      console.log("ERRO DE CONEXÃO:")
      console.log("RODANDO SEM ACESSO A BASE DE DADOS!!!")
      //console.log(err)
      //process.exit(1)
    }
  });

  hive.reserve(function (err, connObj) {
    console.log("TENTANDO CONEXÃO...")
    if (connObj) {
      console.log("USANDO CONEXÃO COM UUID: " + connObj.uuid);
      conn = connObj.conn
      return
    }
    console.log("ERRO DE CONEXÃO:")
    console.log("RODANDO SEM ACESSO A BASE DE DADOS!!!")
    //console.log(err)
    //process.exit(1)
  })

  return conn

}