var refreshUndoRedoButtonsStatus = function(){

    if (editorActionsManager.isUndoStackEmpty()) {
        $("#undo").parent("li").addClass("disabled");
    }
    else {
        $("#undo").parent("li").removeClass("disabled");
    }

    if (editorActionsManager.isRedoStackEmpty()) {
        $("#redo").parent("li").addClass("disabled");
    }
    else {
        $("#redo").parent("li").removeClass("disabled");
    }
}

////////////// KEYBOARD EVENTS ///////////////////////

$(document).keydown(function (e) {
// Undo / Redo from keyboard
    if (e.ctrlKey) {
        window.ctrlKeyDown = true;
        if (e.which === 90) {
            editorActionsManager.undo();
            refreshUndoRedoButtonsStatus();
//    $(document.activeElement).attr("value");
        }
        else if (e.which === 89) {
            editorActionsManager.redo();
            refreshUndoRedoButtonsStatus();
        }
    }
// Delete selected
    if(e.which === 46) {
        $("#delete").click();
    }
});


///////////////////// EDIT ////////////////////////////

$("#undo").click(function (e) {
    editorActionsManager.undo();
    refreshUndoRedoButtonsStatus();
});

$("#redo").click(function (e) {
    editorActionsManager.redo();
    refreshUndoRedoButtonsStatus();
});

$("#delete").click(function (e) {
    var selectedEles = cy.$(":selected");

    if(selectedEles.length == 0){
        return;
    }

    editorActionsManager._do(new RemoveElesCommand(selectedEles));
    refreshUndoRedoButtonsStatus();
});

$("#addEdge").click(function (e) {

   editorActionsManager._do(new AddEdgeSelectedCommand({
       source: cy.$("node:selected")[0].data('id'),
       target: cy.$("node:selected")[1].data('id'),
       firstTime: true
   }));
    
    refreshUndoRedoButtonsStatus();
});

///////////////////// VIEW ////////////////////////////

var getSelectedNodesForExpandCollapse = function(){

    var selectedNodes = cy.nodes(":selected");

    for(var i = 0; i < selectedNodes.length; i++)
        if(selectedNodes[i].data("expanded-collapsed") == null)
            selectedNodes[i].data("expanded-collapsed", "expanded");

    return selectedNodes;

}

$("#collapse-selected").click(function (e) {
    var nodes = getSelectedNodesForExpandCollapse().filter("[expanded-collapsed='expanded']");
    var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(nodes, "collapse");

    if (!thereIs) {
        return;
    }

    /*
     if (window.rearrangeAfterExpandCollapse == null) {
     window.rearrangeAfterExpandCollapse =
     (sbgnStyleRules['rearrange-after-expand-collapse'] == 'true');
     }

     if (rearrangeAfterExpandCollapse)
     editorActionsManager._do(new CollapseGivenNodesCommand({
     nodes: nodes,
     firstTime: true
     }));
     else*/

    editorActionsManager._do(new SimpleCollapseGivenNodesCommand(nodes));
    refreshUndoRedoButtonsStatus();

});

$("#expand-selected").click(function (e) {
    var nodes = getSelectedNodesForExpandCollapse().filter("[expanded-collapsed='collapsed']");
    var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(nodes, "expand");

    if (!thereIs) {
        return;
    }
/*
    if (window.rearrangeAfterExpandCollapse == null) {
        window.rearrangeAfterExpandCollapse =
            (sbgnStyleRules['rearrange-after-expand-collapse'] == 'true');
    }
    if (rearrangeAfterExpandCollapse)
        editorActionsManager._do(new ExpandGivenNodesCommand({
            nodes: nodes,
            firstTime: true
        }));
    else*/
    editorActionsManager._do(new SimpleExpandGivenNodesCommand(nodes));
    refreshUndoRedoButtonsStatus();
});

$("#collapse-all").click(function (e) {
    var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(cy.nodes(":visible"), "collapse");

    if (!thereIs) {
        return;
    }

    editorActionsManager._do(new SimpleCollapseGivenNodesCommand(cy.nodes()));
    refreshUndoRedoButtonsStatus();
});

$("#expand-all").click(function (e) {
    var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(cy.nodes(":visible"), "expand");

    if (!thereIs) {
        return;
    }

    editorActionsManager._do(new SimpleExpandAllNodesCommand({
        firstTime: true
    }));
    refreshUndoRedoButtonsStatus();
});

///////////////////// LOAD & SAVE //////////////////////////////


$("#save-file").click(function (e) {

    var sbgnmlText = jsonToGraphml.createGraphml(atts);

    var blob = new Blob([sbgnmlText], {
        type: "text/plain;charset=utf-8;",
    });
    var filename = "" + new Date().getTime() + ".graphml";;
    saveAs(blob, filename);

});



//////////////////////////////////////////////////////////////////////////////////////////////

var tempName = "cose2";
$("#cose2").click( function (e) {
    tempName = "cose2";
    whitenBackgrounds();
    $("#cose2").css("background-color", "grey");
});
$("#cose").click( function (e) {
    tempName = "cose";
    whitenBackgrounds();
    $("#cose").css("background-color", "grey");
});
$("#cola").click( function (e) {
    tempName = "cola";
    whitenBackgrounds();
    $("#cola").css("background-color", "grey");
});
$("#springy").click( function (e) {
    tempName = "springy";
    whitenBackgrounds();
    $("#springy").css("background-color", "grey");
});
$("#arbor").click( function (e) {
    tempName = "arbor";
    whitenBackgrounds();
    $("#arbor").css("background-color", "grey");
});

var cose2LayoutProp = new COSE2Layout({
    el: '#cose2-layout-table'
});

var coseLayoutProp = new COSELayout({
    el: '#cose-layout-table'
});
var colaLayoutProp = new COLALayout({
    el: '#cola-layout-table'
});
var arborLayoutProp = new ARBORLayout({
    el: '#arbor-layout-table'
});
var springyLayoutProp = new SPRINGYLayout({
    el: '#springy-layout-table'
});
$("#add-node-dialog").hide();
$("#addNodeMenu").click(function () {
    $("#add-node-dialog").dialog({
        modal: true,
        draggable: false,
        resizable: false,
        position: ['center', 'center'],
        show: 'blind',
        hide: 'blind',
        width: 250,
        dialogClass: 'ui-dialog-osx',
        buttons: {
            "Done": function () {
                var name = $("#new-node-name").val();
                var w = $("#new-node-width").val();
                var h = $("#new-node-height").val();
                var x = $("#new-node-x").val();
                var y = $("#new-node-y").val();
                var color = $("#new-node-color").val();
                var shape = $("#new-node-shape").val();
                var borderColor = $("#new-node-border-color").val();
//                var borderWidth = $("#new-node-border-width").val();

                if (w == "") {
                    w = null;
                }
                else {
                    w = Number(w);
                }
 /*               if (borderWidth == "") {
                    borderWidth = null;
                }
                else {
                    borderWidth = Number(borderWidth);
                }

*/
                if (h == "") {
                    h = null;
                }
                else {
                    h = Number(h);
                }

                if (x == "") {
                    x = null;
                }
                else {
                    x = Number(x);
                }

                if (y == "") {
                    y = null;
                }
                else {
                    y = Number(y);
                }

                var newNode = {
                    name: name,
                    x: x,
                    y: y,
                    w: w,
                    h: h,
                    color: color,
                    shape: shape,
                    borderColor: borderColor,
                    firstTime: true
                };

                editorActionsManager._do(new AddNodeCommand(newNode));
                refreshUndoRedoButtonsStatus();

                //addNode(name, x, y, w, h, color, shape,borderColor/*, borderWidth */);
                $(this).dialog("close");
            }
        }
    });
});
/*
$("#addEdge").click(function (e) {
    if (cy.$("node:selected").length !=  2)
        return;
    var edge = new Object();
    edge.id = IDGenerator.generate();
    edge.group = 'edges';
    edge.data = {source: cy.$("node:selected")[0].data('id'), target: cy.$("node:selected")[1].data('id')}
    cy.add(edge);
});

$("#delete").click(function (e) {
    var allNodes = cy.$('node');


    var tNodes = cy.$('node:selected');
    var tEdges = cy.$('edge:selected');
    for (var i = 0; i < tEdges.length; i++)
    {
        cy.remove(tEdges[i]);
    }
    for (var i = 0; i < tNodes.length; i++)
    {
        deleteNode(tNodes[i]);
    }
    cy.layout({
        name: "preset"
    });

});*/
var addChild = function(children, theChild){
    var len = children.length;
    for (var i = 0; i < theChild.children().length; i++){
        children[len++] = theChild.children()[i];
    }
    children.length = len;
    for (var i = 0 ; i < theChild.children().length; i++){
        if (theChild.children()[i].isParent()){
            addChild(children, theChild.children()[i]);
        }
    }
};
var deleteNode = function(theNode){
    var children = theNode.children();
    var len = children.length;
    var allEdges = cy.$('edge');
    var parData = null;
    if (theNode.isChild()){
        parData = theNode._private.data.parent
    }
    for (var i = 0; i < children.length; i++){
        if (children[i].isParent())
            addChild(children, children[i]);
    }
    cy.remove(theNode);
    if (children != null && len > 0 ){

        for(var a = 0; a < len; a++){
            children[a]._private.data.parent = parData;

        }
        cy.add(children);
        cy.add(allEdges);
    }
};
$("#makeCompound").click(function (e) {
    var nodes = cy.$('node:selected');

    editorActionsManager._do(new CreateCompundForSelectedNodesCommand({
        nodesToMakeCompound: nodes,
        firstTime: true
    }));
});
$("#layout-properties").click(function (e) {
    if (tempName !== '') {
        switch (tempName) {
            case 'cose2':
                cose2LayoutProp.render();
                break;
            case 'cose':
                coseLayoutProp.render();
                break;
            case 'cola':
                colaLayoutProp.render();
                break;
            case 'arbor':
                arborLayoutProp.render();
                break;
            case 'springy':
                springyLayoutProp.render();
                break;
        }
    }

});

$("#perform-layout").click(function (e) {
    cy.layout().stop();
    cy.nodes().removeData("ports");
    cy.edges().removeData("portsource");
    cy.edges().removeData("porttarget");

    cy.nodes().data("ports", []);
    cy.edges().data("portsource", []);
    cy.edges().data("porttarget", []);
    switch (tempName) {
        case 'cose2':
            cose2LayoutProp.applyLayout();
            break;
        case 'cose':
            coseLayoutProp.applyLayout();
            break;
        case 'cola':
            colaLayoutProp.applyLayout();
            break;
        case 'arbor':
            arborLayoutProp.applyLayout();
            break;
        case 'springy':
            springyLayoutProp.applyLayout();
            break;
    }
});
var atts;

$("body").on("change", "#file-input", function (e) {
    var fileInput = document.getElementById('file-input');
    var file = fileInput.files[0];
    var textType = /text.*/;

    var reader = new FileReader();
    reader.onload = function (e)
    {
        var graphmlConverter = new graphmlToJSON(textToXmlObject(this.result));
        atts = graphmlConverter.attributes;

        var cytoscapeJsGraph = {
            edges: graphmlConverter.objects[2],
            nodes: graphmlConverter.objects[1]
        };
        //       console.log(JSON.stringify(graphmlConverter.objects[1][0]));
        refreshCytoscape(cytoscapeJsGraph);

    };
    reader.readAsText(file);
    setFileContent(file.name);
    $("#file-input").val(null);
});
$("#load-file").click(function (e) {
    $("#file-input").trigger('click');
});

$("#new").click(function(e){
    var graphData = new Object();
    graphData['nodes'] = undefined;
    graphData['edges'] = undefined;
    refreshCytoscape(graphData);

})

$("#save-as-png").click(function(evt){
    var pngContent = cy.png({scale : 3, full : true});

    // see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
    function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    // this is to remove the beginning of the pngContent: data:img/png;base64,
    var b64data = pngContent.substr(pngContent.indexOf(",") + 1);

    saveAs(b64toBlob(b64data, "image/png"), "network.png");

});

$("#quick-help").click(function (e) {
    e.preventDefault();
    $.fancybox(
        _.template($("#quick-help-template").html(), {}),
        {
            'autoDimensions': true,
            'width': 800,
            'height': 800,
            'transitionIn': 'none',
            'transitionOut': 'none',
            openEffect  : 'none',
            closeEffect : 'none',
            nextEffect  : 'none',
            prevEffect  : 'none',
            afterLoad  : function () {
                $.extend(this, {
                    aspectRatio : false,
                    width   : '100%',
                    height  : '100%',

                });
            }
        });
});

var loadSample = function(fileName){
  var xmlObject = loadXMLDoc("sample/" + fileName + ".xml");
  var graphmlConverter = graphmlToJSON(xmlObject);
  atts = graphmlConverter.attributes;

  var cytoscapeJsGraph = {
      edges: graphmlConverter.objects[2],
      nodes: graphmlConverter.objects[1]
  };
  refreshCytoscape(cytoscapeJsGraph);
  setFileContent(fileName + ".graphml");
};
$("#sample0").click(function (e){
    loadSample("graph0");
});
$("#sample1").click(function (e){
  loadSample("graph1");
});
$("#sample2").click(function (e){
  loadSample("graph2");
});
$("#sample3").click(function (e){
  loadSample("graph3");
});
$("#sample4").click(function (e){
  loadSample("graph4");
});
$("#sample5").click(function (e){
  loadSample("graph5");
});
