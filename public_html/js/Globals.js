function Globals() {
}
;
Globals.elements = {};
Globals.elements.nodes = {};
Globals.elements.edges = {};

var done = {};

var addNodeToCy = function (node) {
  if (node.data.parent != null && done[node.data.parent] == null) {
    addNodeToCy(Globals.elements.nodes[node.data.parent]);
  }
  if (done[node.data.id] == true) {
    return;
  }
  cy.add({
    group: "nodes",
    data: node.data,
    position: node.position,
    css: node.css
  });

  done[node.data.id] = true;
}

Globals.createElements = function(){
  var nodes = cy.$("node");
  var edges = cy.$("edge");
  
  edges.removeData();
  edges.remove();

  nodes.removeData();
  nodes.remove();
  
  done = {};
  
  for (var id in Globals.elements.nodes) {
    var node = Globals.elements.nodes[id];
    addNodeToCy(node);
  }

  done = {};

  for (var id in Globals.elements.edges) {
    var edge = Globals.elements.edges[id];
    cy.add({
      group: "edges",
      data: edge.data,
      css: edge.css
    });
  }

  cy.layout({
    name: "preset"
  });
  
  Globals.elements.nodes = {};
  Globals.elements.edges = {};
}

Globals.refreshElements = function () {
  Globals.elements.nodes = {};
  Globals.elements.edges = {};
  
  var nodes = cy.$("node");
  var edges = cy.$("edge");

  for(var i = 0; i < nodes.length; i++){
    var cynode = nodes[i];
    var css = {};
    css.shape = cynode.css().shape;
    css["background-color"] = cynode.css()["background-color"];
    css["content"] = cynode.css()["content"];
    Globals.elements.nodes[cynode.data("id")] = {
      data: cynode.data(),
      position: cynode.position(),
      css: css
    }; 
  }
  
  for(var i = 0; i < edges.length; i++){
    var cyedge = edges[i];
    Globals.elements.edges[cyedge.data("id")] = {
      data: cyedge.data(),
      css: cyedge.css()
    }; 
  }

  Globals.createElements();
}
//Globals.idToElement = {};