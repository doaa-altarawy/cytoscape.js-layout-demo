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
$("#addNode").click(function () {
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
                var borderWidth = $("#new-node-border-width").val();

                if (w == "") {
                    w = null;
                }
                else {
                    w = Number(w);
                }
                if (borderWidth == "") {
                    borderWidth = null;
                }
                else {
                    borderWidth = Number(borderWidth);
                }


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
                addNode(name, x, y, w, h, color, shape,borderColor, borderWidth );
                $(this).dialog("close");
            }
        }
    });
});
var addNode = function (name, x_, y_, w, h, color, shape, borderColor, borderWidth) {
    var id_ = IDGenerator.generate();

    css = {};
    css["content"] = name;
    css["background-color"] = color;
    css["shape"] = shape;
    css['border-width'] = borderWidth ;
    css['border-color'] = borderColor;

    cy.add({
        group: "nodes",
        data: {id: id_, width: w, height: h},
        position: {x: x_, y: y_},
        css: css
    });

    cy.layout({
        name: "preset"
    });
}

$("#addEdge").click(function (e) {
    if (edgeNodes.length != 2){
        return;
    }
    var target = edgeNodes[1];
    var source = edgeNodes[0];
    var edge = new Object();
    edge['group'] = "edges";
    edge['data'] = {source: source, target: target};
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

});
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
    var nodesToAdd = [];
    var par = null;
    if (nodes[0]._private.data.parent != null)
        par = nodes[0]._private.data.parent;
    for (var i = 0; i < nodes.length; i++) {
        nodesToAdd[i] = new Object();
        if (nodes[i]._private.data.parent != null && nodes[i]._private.data.parent != par){
            return;
        }
    }
    var num = nodes.length;
    var pNode = new Object();
    pNode['data'] = {id: IDGenerator.generate()};
    pNode['group'] = 'nodes';
    pNode.position = new Object();

    if (par != null){
        pNode['data'].parent = par;
    }

    var xs = 0;
    var ys = 0;
    var edges = cy.edges();
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].unselect();
        nodesToAdd[i].group = 'nodes';
        nodesToAdd[i].data = {id: nodes[i]._private.data.id, parent: pNode.data['id']};
        nodesToAdd[i].position = {x: nodes[i].position('x'), y: nodes[i].position('y')};
        nodesToAdd[i].css = new Object();
        nodesToAdd[i].css['shape'] = nodes[i].css("shape");
        nodesToAdd[i].css['background-color'] = nodes[i].css("background-color");
        nodesToAdd[i].css['content'] = nodes[i].css("content");
        nodesToAdd[i].css['text-valign'] = nodes[i].css("text-valign");
        nodesToAdd[i].css['text-outline-color'] = nodes[i].css("text-outline-color");
        nodesToAdd[i].css['text-outline-width'] = nodes[i].css("text-outline-width");
        if (nodes[i].isParent()){
            addChild(nodesToAdd, nodes[i]);
        }

        xs += nodes[i].position('x');
        ys += nodes[i].position('y');
        cy.remove(nodes[i]);
    }
    cy.remove('edge');
    pNode['position'] = {x: xs / num, y: ys / num};
    cy.add(pNode);

    for (var i = 0; i < nodesToAdd.length; i++) {

        cy.add(nodesToAdd[i]);

    }
    for (var i = 0; i < edges.length; i++) {
        cy.add(edges[i]);
    }

    cy.style(
        cytoscape.stylesheet()
        .selector('node')
        .css({
            'content': 'data(name)',
            'text-valign': 'center',
            'color': 'white',
            'text-outline-width': 2,
            'text-outline-color': '#888'
        })
        .selector(':selected')
        .css({
            'background-color': 'black',
            'line-color': 'black',
            'target-arrow-color': 'black',
            'source-arrow-color': 'black',
            'text-outline-color': 'black',
            'border-color': 'black',
            'border-width': 3
        })
        .selector('edge:selected')
        .css({
            'background-color': 'black',
            'line-color': 'black',
            'target-arrow-color': 'black',
            'source-arrow-color': 'black',
            'text-outline-color': 'black',
            'width': 4,
            'opacity':.5
        })
        .selector('edge')
        .css({
            'background-color': 'black',
            'line-color': 'black',
            'color': 'black',
            'target-arrow-color': 'red',
            'source-arrow-color': 'black',
            'text-outline-color': 'black'
        })
        .selector('node:parent')
        .css({
            'content': 'data(name)',
            'text-valign': 'bottom',
            'color': 'white',
            'text-outline-width': 2,
            'text-outline-color': '#888',
        })
    );
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