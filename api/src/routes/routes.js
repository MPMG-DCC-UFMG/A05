module.exports = (app) => {

  const getData = app.controllers.getData;

  app.route("/api/get_data_viz_1/").post(getData.viz1)
  app.route("/api/get_detail_viz_1/").post(getData.detailViz1)


};
