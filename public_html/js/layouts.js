var graph = {};
var edgeNodes = [];
var setFileContent = function(fileName){
    var span = document.getElementById('file-name');
    while( span.firstChild ) {
        span.removeChild( span.firstChild );
    }
    span.appendChild( document.createTextNode(fileName) );
};
$(function () {

    var xmlObject = loadXMLDoc("samples/graph0.xml");
    var graphmlConverter = graphmlToJSON(xmlObject);
    atts = graphmlConverter.attributes;

    var cytoscapeJsGraph = {
        edges: graphmlConverter.objects[2],
        nodes: graphmlConverter.objects[1]
    };
    refreshCytoscape(cytoscapeJsGraph);
    setFileContent("graph0.graphml");    

});

$("#cose-bilkent").css("background-color", "grey");

function refreshCytoscape(graphData) { // on dom ready

    //---------- Add custom styling in graphData:
    var layout = {name: 'preset', fit: true};
    if (graphData.hasOwnProperty('layout')){
        layout = graphData.layout;    
    }

    if (cy.hasOwnProperty('destroy')){
        console.log('destroying cy instance');
        cy.destroy();    
    }
    
    cy = cytoscape({
        container: $('#cy')[0],
        style: [
            {
                selector: 'node',
                style: {
                    'content': 'data(name)',
                    'text-valign': 'center',
                    'color': 'white',
                    'text-outline-width': 2,
                    'text-outline-color': '#888',
                    'shape': 'rectangle',
                    'background-color': '#6495ed'//rgb(174, 199, 232)
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'background-color': 'black',
                    'line-color': 'black',
                    'target-arrow-color': 'black',
                    'text-outline-color': 'black',
                    'border-color': 'black',
                    'border-width': 5
                }
            },
            {
                selector: ':parent',
                style: {
                    'background-opacity': 0.333,
                    'text-valign': "bottom"
                }
            },
            {
                selector: 'edge',
                style: {
                    // label
                    'label': 'data(label)',
                    'text-valign': 'top',
                    'text-margin-y': -10,
                    'text-rotation': 'autorotate',
                    // 'text-outline-color': 'gray',
                    'color': 'gray',
                    // edge body
                    'target-arrow-shape': 'triangle', //'tee'
                    // 'background-color': 'black',
                    'line-color': 'gray',
                    'target-arrow-color': 'gray',
                    // 'target-arrow-color': 'red',
                    // 'source-arrow-color': 'black',
                    'width': 1,
                    //'line-style' : 'solid' //, 'dotted', 'dashed'
                    'curve-style': "bezier"
                }
            },
            {
                selector: 'edge:selected',
                style: {
                    'target-arrow-color': 'green',
                    // 'background-color': 'green',
                    'line-color': 'green',
                    'width': 3,
                    'opacity':1,
                    'color' : 'green'
                }
            },
            // {
            //     selector: 'node:highlighted',
            //     style: {
            //         'border-width': '10px'
            //     }
            // }
        ],

        elements: {
            nodes: graphData['nodes'],
            edges: graphData['edges']

        },

        layout: layout,
        showLabels: true,
        
        boxSelectionEnabled: true,
        motionBlur: true,
        wheelSensitivity: 0.1,
        ready: function(){
            var i = 0;
            this.on('tap', 'node', function(evt){
                if (i < 2){
                    edgeNodes[i++] = this._private.data.id;
                }
                else{
                    edgeNodes = [];
                    i = 0;
                }
            });

            var getNodesData = function () {
                var nodesData = {};
                var nodes = cy.nodes();
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    nodesData[node.id()] = {
                        width: node.width(),
                        height: node.height(),
                        x: node.position("x"),
                        y: node.position("y")
                    };
                }
                return nodesData;
            };

            var enableDragAndDropMode = function () {
                window.dragAndDropModeEnabled = true;
                $("#sbgn-network-container").addClass("target-cursor");
                cy.autolock(true);
                cy.autounselectify(true);
            };

            var disableDragAndDropMode = function () {
                window.dragAndDropModeEnabled = null;
                window.nodeToDragAndDrop = null;
                $("#sbgn-network-container").removeClass("target-cursor");
                cy.autolock(false);
                cy.autounselectify(false);
            };

            var lastMouseDownNodeInfo = null;
            this.on("mousedown", "node", function () {
                var self = this;
                lastMouseDownNodeInfo = {};
                lastMouseDownNodeInfo.lastMouseDownPosition = {
                    x: this.position("x"),
                    y: this.position("y")
                };
                lastMouseDownNodeInfo.node = this;
            });

            this.on("mouseup", "node", function () {
                if (lastMouseDownNodeInfo == null) {
                    return;
                }
                var node = lastMouseDownNodeInfo.node;
                var lastMouseDownPosition = lastMouseDownNodeInfo.lastMouseDownPosition;
                var mouseUpPosition = {
                    x: node.position("x"),
                    y: node.position("y")
                };
                if (mouseUpPosition.x != lastMouseDownPosition.x ||
                    mouseUpPosition.y != lastMouseDownPosition.y) {
                    var positionDiff = {
                        x: mouseUpPosition.x - lastMouseDownPosition.x,
                        y: mouseUpPosition.y - lastMouseDownPosition.y
                    };

                    var nodes;
                    if (node.selected()) {
                        nodes = cy.nodes(":visible").filter(":selected");
                    }
                    else {
                        nodes = [];
                        nodes.push(node);
                    }

                    var param = {
                        positionDiff: positionDiff,
                        nodes: nodes, move: false
                    };
                    editorActionsManager._do(new MoveNodeCommand(param));

                    lastMouseDownNodeInfo = null;
                    refreshUndoRedoButtonsStatus();
                }
            });
        }
    });
    
    addPanZoom();
    addViewUtil();
    addContextMenu();

    // Undo-redue handling
    ur = cy.undoRedo();

    cy.on("undo", function (e, name) {
        refreshUndoRedoButtonsStatus();
    });
    cy.on("redo", function (e, name) {
        refreshUndoRedoButtonsStatus();
    });
    cy.on("do", function (e, name) {
        refreshUndoRedoButtonsStatus();
    });

    ur.action("addNode", addNode, removeNodes);
    ur.action("createCompound", createCompoundForSelectedNodes, removeCompound);
};

//-------------------------------------------------------------------

function addViewUtil(){
    cy.viewUtilities({
        node: {
            highlighted: {
                'border-width': '5px',
                'border-color': 'red'
            }, // styles for when nodes are highlighted.
            unhighlighted: {// styles for when nodes are unhighlighted.
            'opacity': function (ele) {
                    return ele.css('opacity');
                } 
            }           
        },
        edge: {
            highlighted: {'width': '5px'}, 
            unhighlighted: {
                'opacity': function (ele) {return ele.css('opacity');}
            }
        },
        searchBy: ["name"]
      });
}

//-------------------------------------------------------------------

function addContextMenu(){
    var options = {
    // List of initial menu items
    menuItems: [      
      {
        id: 'highlight',
        title: 'Highlight',
        selector: 'node',
        onClickFunction: function (event) {
            event.cyTarget.highlight()
        }
      },
      {
        id: 'unhighlight',
        title: 'Unhighlight',
        selector: 'node',
        hasTrailingDivider: true, // Whether the item will have a trailing divider
        onClickFunction: function (event) {
            event.cyTarget.unhighlight()
        }
      },
      {
        id: 'select',
        title: 'Select',
        selector: 'node',
        hasTrailingDivider: true, 
        onClickFunction: function (event) {
            event.cyTarget.select();
        }
      },
      {
        id: 'hide', 
        title: 'hide', 
        selector: 'node', 
        onClickFunction: function (event) {
            event.cyTarget.hide();
        }
      },
      {
        id: 'delete', // ID of menu item
        title: 'Delete', // Title of menu item
        // If the selector is not truthy no elements will have this menu item on cxttap
        disabled: false, // Whether the item will be created as disabled
        show: true, // Whether the item will be shown or not
        // hasTrailingDivider: true, // Whether the item will have a trailing divider
        // Filters the elements to have this menu item on cxttap
        selector: 'edge', 
        onClickFunction: function (event) { // The function to be executed on click
            event.cyTarget.remove();
        }
      },
      {
        id: 'unhighlightAll',
        title: 'Unhighlight All',
        selector: '',
        hasTrailingDivider: true, 
        coreAsWell: true,
        onClickFunction: function (event) {
            cy.nodes().unhighlight();
        }
     }, 
     {
        id: 'geneBank',
        title: 'Open GeneBank',
        selector: 'node',
        hasTrailingDivider: true, 
        onClickFunction: function (event) {
            var url = "https://www.ncbi.nlm.nih.gov/gene/?term=" + event.cyTarget.data('name');
            window.open(url,'_blank');
        }
     },
     {
        id: 'showGeneExpr',
        title: 'Gene expression for highlighted',
        selector: '',
        hasTrailingDivider: true,
        coreAsWell: true,
        onClickFunction: function (event) {
            $('#show-gene-expr').trigger('click');
        }
      }
    ],
    // css classes that menu items will have
    menuItemClasses: ['custom-menu-item'],
    contextMenuClasses: ['custom-context-menu']
   };

    cy.contextMenus( options );
}

//-----------------------------------------------------------------

function addPanZoom(){
    var panProps = ({
        zoomFactor: 0.05, // zoom factor per zoom tick
        zoomDelay: 45, // how many ms between zoom ticks
        minZoom: 0.1, // min zoom level
        maxZoom: 10, // max zoom level
        fitPadding: 50, // padding when fitting
        panSpeed: 10, // how many ms in between pan ticks
        panDistance: 10, // max pan distance per tick
        panDragAreaSize: 75, // the length of the pan drag box in which the vector for panning is calculated (bigger = finer control of pan speed and direction)
        panMinPercentSpeed: 0.25, // the slowest speed we can pan by (as a percent of panSpeed)
        panInactiveArea: 3, // radius of inactive area in pan drag box
        panIndicatorMinOpacity: 0.5, // min opacity of pan indicator (the draggable nib); scales from this to 1.0
        autodisableForMobile: true, // disable the panzoom completely for mobile (since we don't really need it with gestures like pinch to zoom)

        // icon class names
        sliderHandleIcon: 'fa fa-minus',
        zoomInIcon: 'fa fa-plus',
        zoomOutIcon: 'fa fa-minus',
        resetIcon: 'fa fa-expand'    
    });

    cy.panzoom(panProps);
}

// -----------------------------------------------------------------

var COSEBilkentLayout = Backbone.View.extend({
    defaultLayoutProperties: {
        name: 'cose-bilkent',
        ready: function () {
        },
        // Called on `layoutstop`
        stop: function () {
        },
        // Number of iterations between consecutive screen positions update (0 -> only updated on the end)
        refresh: 0,
        // Whether to fit the network view after when done
        fit: true,
        // Padding on fit
        padding: 10,
        // Whether to enable incremental mode
        incremental: true,
        // Whether to use the JS console to print debug messages
        debug: false,
        // Node repulsion (non overlapping) multiplier
        nodeRepulsion: 4500,
        // Node repulsion (overlapping) multiplier
        nodeOverlap: 10,
        // Ideal edge (non nested) length
        idealEdgeLength: 50,
        // Divisor to compute edge forces
        edgeElasticity: 0.45,
        // Nesting factor (multiplier) to compute ideal edge length for nested edges
        nestingFactor: 0.1,
        // Gravity force (constant)
        gravity: 0.4,
        // Maximum number of iterations to perform
        numIter: 2500,
        // Initial temperature (maximum node displacement)
        initialTemp: 200,
        // Cooling factor (how the temperature is reduced between consecutive iterations
        coolingFactor: 0.95,
        // Lower temperature threshold (below this point the layout will end)
        minTemp: 1,
        // For enabling tiling
        tile: true,
        //whether to make animation while performing the layout
        animate: true
    },
    currentLayoutProperties: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        var temp = _.template($("#cose-bilkent-settings-template").html());
        self.template = temp(this.currentLayoutProperties);
    },
    copyProperties: function () {
        this.currentLayoutProperties = _.clone(this.defaultLayoutProperties);
    },
    applyLayout: function () {
        var options = {};
        for (var prop in this.currentLayoutProperties) {
            options[prop] = this.currentLayoutProperties[prop];
        }
        cy.layout(options);
    },
    render: function () {
        var self = this;
        var temp = _.template($("#cose-bilkent-settings-template").html());
        self.template = temp(this.currentLayoutProperties);
        $(self.el).html(self.template);

        $(self.el).dialog();

        $("#save-layout4").click( function (evt) {
            self.currentLayoutProperties.nodeRepulsion = Number(document.getElementById("node-repulsion4").value);
            self.currentLayoutProperties.nodeOverlap = Number(document.getElementById("node-overlap4").value);
            self.currentLayoutProperties.idealEdgeLength = Number(document.getElementById("ideal-edge-length4").value);
            self.currentLayoutProperties.edgeElasticity = Number(document.getElementById("edge-elasticity4").value);
            self.currentLayoutProperties.nestingFactor = Number(document.getElementById("nesting-factor4").value);
            self.currentLayoutProperties.gravity = Number(document.getElementById("gravity4").value);
            self.currentLayoutProperties.numIter = Number(document.getElementById("num-iter4").value);
            self.currentLayoutProperties.animate = document.getElementById("animate4").checked;
            self.currentLayoutProperties.refresh = Number(document.getElementById("refresh4").value);
            self.currentLayoutProperties.fit = document.getElementById("fit4").checked;
            self.currentLayoutProperties.padding = Number(document.getElementById("padding4").value);
            self.currentLayoutProperties.debug = document.getElementById("debug4").checked;
            self.currentLayoutProperties.initialTemp = Number(document.getElementById("initialTemp4").value);
            self.currentLayoutProperties.minTemp = Number(document.getElementById("minTemp4").value);
            self.currentLayoutProperties.coolingFactor = Number(document.getElementById("coolingFactor4").value);
            self.currentLayoutProperties.incremental = document.getElementById("incremental4").checked;
            self.currentLayoutProperties.tile = document.getElementById("tile4").checked;


            $(self.el).dialog('close');

        });

        $("#default-layout4").click( function (evt) {
            self.copyProperties();
            console.log("asd");
            var temp = _.template($("#cose-bilkent-settings-template").html());
            self.template = temp(self.currentLayoutProperties);
            $(self.el).html(self.template);
        });

        return this;
    }
});
var COSELayout = Backbone.View.extend({
    defaultLayoutProperties: {
        name: 'cose',
        ready: function () {
        },
        stop: function () {
        },
        animate: true,
        refresh: 4,
        fit: true,
        padding: 30,
        boundingBox: undefined,
        randomize: true,
        debug: false,
        nodeRepulsion: 400000,
        nodeOverlap: 10,
        idealEdgeLength: 10,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 250,
        numIter: 100,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1
    },
    currentLayoutProperties: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        var temp = self.template = _.template($("#cose-settings-template").html());
        self.template = temp(self.currentLayoutProperties);
    },
    copyProperties: function () {
        this.currentLayoutProperties = _.clone(this.defaultLayoutProperties);
    },
    applyLayout: function () {
        var options = {};
        for (var prop in this.currentLayoutProperties) {
            options[prop] = this.currentLayoutProperties[prop];
        }
        cy.layout(options);
    },
    render: function () {
        var self = this;
        var temp = self.template = _.template($("#cose-settings-template").html());
        self.template = temp(self.currentLayoutProperties);
        $(self.el).html(self.template);

        $(self.el).dialog();

        $("#save-layout").click( function (evt) {
            self.currentLayoutProperties.nodeRepulsion = Number(document.getElementById("node-repulsion").value);
            self.currentLayoutProperties.nodeOverlap = Number(document.getElementById("node-overlap").value);
            self.currentLayoutProperties.idealEdgeLength = Number(document.getElementById("ideal-edge-length").value);
            self.currentLayoutProperties.edgeElasticity = Number(document.getElementById("edge-elasticity").value);
            self.currentLayoutProperties.nestingFactor = Number(document.getElementById("nesting-factor").value);
            self.currentLayoutProperties.gravity = Number(document.getElementById("gravity").value);
            self.currentLayoutProperties.numIter = Number(document.getElementById("num-iter").value);
            self.currentLayoutProperties.animate = document.getElementById("animate").checked;
            self.currentLayoutProperties.refresh = Number(document.getElementById("refresh").value);
            self.currentLayoutProperties.fit = document.getElementById("fit").checked;
            self.currentLayoutProperties.padding = Number(document.getElementById("padding").value);
            self.currentLayoutProperties.randomize = document.getElementById("randomize").checked;
            self.currentLayoutProperties.debug = document.getElementById("debug").checked;
            self.currentLayoutProperties.initialTemp = Number(document.getElementById("initialTemp").value);
            self.currentLayoutProperties.minTemp = Number(document.getElementById("minTemp").value);


            $(self.el).dialog('close');

        });

        $("#default-layout").click( function (evt) {
            self.copyProperties();
            var temp = self.template = _.template($("#cose-settings-template").html());
            self.template = temp(self.currentLayoutProperties);
            $(self.el).html(self.template);
        });

        return this;
    }
});
var COLALayout = Backbone.View.extend({
    defaultLayoutProperties: {
        name: 'cola',
        animate: true, // whether to show the layout as it's running
        refresh: 1, // number of ticks per frame; higher is faster but more jerky
        maxSimulationTime: 4000, // max length in ms to run the layout
        ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
        fit: true, // on every layout reposition of nodes, fit the viewport
        padding: 30, // padding around the simulation
        boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        // layout event callbacks
        ready: function () {
        }, // on layoutready
        stop: function () {
        }, // on layoutstop

        // positioning options
        randomize: true, // use random node positions at beginning of layout
        avoidOverlap: true, // if true, prevents overlap of node bounding boxes
        handleDisconnected: true, // if true, avoids disconnected components from overlapping
        nodeSpacing: function (node) {
            return 10;
        }, // extra spacing around nodes
        flow: undefined, // use DAG/tree flow layout if specified, e.g. { axis: 'y', minSeparation: 30 }
        alignment: undefined, // relative alignment constraints on nodes, e.g. function( node ){ return { x: 0, y: 1 } }

        // different methods of specifying edge length
        // each can be a constant numerical value or a function like `function( edge ){ return 2; }`
        edgeLength: undefined, // sets edge length directly in simulation
        edgeSymDiffLength: undefined, // symmetric diff edge length in simulation
        edgeJaccardLength: undefined, // jaccard edge length in simulation

        // iterations of cola algorithm; uses default values on undefined
        unconstrIter: undefined, // unconstrained initial layout iterations
        userConstIter: undefined, // initial layout iterations with user-specified constraints
        allConstIter: undefined, // initial layout iterations with all constraints including non-overlap

        // infinite layout options
        infinite: false // overrides all other options for a forces-all-the-time mode
    },
    currentLayoutProperties: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        var temp = _.template($("#cola-settings-template").html());
        self.template = temp(self.currentLayoutProperties);
    },
    copyProperties: function () {
        this.currentLayoutProperties = _.clone(this.defaultLayoutProperties);
    },
    applyLayout: function () {
        var options = {};
        for (var prop in this.currentLayoutProperties) {
            options[prop] = this.currentLayoutProperties[prop];
        }
//        var options = clone(this.currentLayoutProperties);
        cy.layout(options);
    },
    render: function () {
        var self = this;
        var temp = _.template($("#cola-settings-template").html());
        self.template = temp(self.currentLayoutProperties);
        $(self.el).html(self.template);

        $(self.el).dialog();

        $("#save-layout1").click( function (evt) {
            self.currentLayoutProperties.animate = document.getElementById("animate1").checked;
            self.currentLayoutProperties.refresh = Number(document.getElementById("refresh1").value);
            self.currentLayoutProperties.maxSimulationTime = Number(document.getElementById("maxSimulationTime1").value);
            self.currentLayoutProperties.ungrabifyWhileSimulating = document.getElementById("ungrabifyWhileSimulating1").checked;
            self.currentLayoutProperties.fit = document.getElementById("fit1").checked;
            self.currentLayoutProperties.padding = Number(document.getElementById("padding1").value);
            self.currentLayoutProperties.randomize = document.getElementById("randomize1").checked;
            self.currentLayoutProperties.avoidOverlap = document.getElementById("avoidOverlap1").checked;
            self.currentLayoutProperties.handleDisconnected = document.getElementById("handleDisconnected1").checked;
            self.currentLayoutProperties.infinite = document.getElementById("infinite1").checked;


            $(self.el).dialog('close');
        });

        $("#default-layout1").click( function (evt) {
            self.copyProperties();
            var temp = _.template($("#cola-settings-template").html());
            self.template = temp(self.currentLayoutProperties);
            $(self.el).html(self.template);
        });

        return this;
    }
});
var ARBORLayout = Backbone.View.extend({
    defaultLayoutProperties: {
        name: 'arbor',
        animate: true, // whether to show the layout as it's running
        maxSimulationTime: 4000, // max length in ms to run the layout
        fit: true, // on every layout reposition of nodes, fit the viewport
        padding: 30, // padding around the simulation
        boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        ungrabifyWhileSimulating: false, // so you can't drag nodes during layout

        // callbacks on layout events
        ready: undefined, // callback on layoutready
        stop: undefined, // callback on layoutstop

        // forces used by arbor (use arbor default on undefined)
        repulsion: undefined,
        stiffness: undefined,
        friction: undefined,
        gravity: true,
        fps: undefined,
        precision: undefined,
        // static numbers or functions that dynamically return what these
        // values should be for each element
        // e.g. nodeMass: function(n){ return n.data('weight') }
        nodeMass: undefined,
        edgeLength: undefined,
        stepSize: 0.1, // smoothing of arbor bounding box

        // function that returns true if the system is stable to indicate
        // that the layout can be stopped
        stableEnergy: function (energy) {
            var e = energy;
            return (e.max <= 0.5) || (e.mean <= 0.3);
        },
        // infinite layout options
        infinite: false // overrides all other options for a forces-all-the-time mode
    },
    currentLayoutProperties: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        var temp = _.template($("#arbor-settings-template").html());
        self.template = temp(self.currentLayoutProperties);
    },
    copyProperties: function () {
        this.currentLayoutProperties = _.clone(this.defaultLayoutProperties);
    },
    applyLayout: function () {
        var options = {};
        for (var prop in this.currentLayoutProperties) {
            options[prop] = this.currentLayoutProperties[prop];
        }
        console.log(options);
        //cy.layout(options);
        ur.do("layout", options);
    },
    render: function () {
        var self = this;
        var temp = _.template($("#arbor-settings-template").html());
        self.template = temp(self.currentLayoutProperties);
        $(self.el).html(self.template);

        $(self.el).dialog();

        $("#save-layout2").click( function (evt) {
            self.currentLayoutProperties.animate = document.getElementById("animate2").checked;
            self.currentLayoutProperties.maxSimulationTime = Number(document.getElementById("maxSimulationTime2").value);
            self.currentLayoutProperties.fit = document.getElementById("fit2").checked;
            self.currentLayoutProperties.padding = Number(document.getElementById("padding2").value);
            self.currentLayoutProperties.gravity = document.getElementById("gravity2").checked;
            self.currentLayoutProperties.ungrabifyWhileSimulating = document.getElementById("ungrabifyWhileSimulating2").checked;
            self.currentLayoutProperties.stepSize = Number(document.getElementById("stepSize2").value);
            self.currentLayoutProperties.infinite = document.getElementById("infinite2").checked;


            $(self.el).dialog('close');
        });

        $("#default-layout2").click( function (evt) {
            self.copyProperties();
            var temp = _.template($("#arbor-settings-template").html());
            self.template = temp(self.currentLayoutProperties);
            $(self.el).html(self.template);
        });

        return this;
    }
});

var SPRINGYLayout = Backbone.View.extend({
    defaultLayoutProperties: {
        name: 'springy',
        animate: false, // whether to show the layout as it's running
        maxSimulationTime: 4000, // max length in ms to run the layout
        ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
        fit: true, // whether to fit the viewport to the graph
        padding: 30, // padding on fit
        boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        random: false, // whether to use random initial positions
        infinite: true, // overrides all other options for a forces-all-the-time mode
        ready: undefined, // callback on layoutready
        stop: undefined, // callback on layoutstop

        // springy forces
        stiffness: 400,
        repulsion: 400,
        damping: 0.5
    },
    currentLayoutProperties: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        var temp = _.template($("#springy-settings-template").html());
        self.template = temp(self.currentLayoutProperties);
    },
    copyProperties: function () {
        this.currentLayoutProperties = _.clone(this.defaultLayoutProperties);
    },
    applyLayout: function () {
        var options = {};
        for (var prop in this.currentLayoutProperties) {
            options[prop] = this.currentLayoutProperties[prop];
        }
        console.log(options);
        cy.layout(options);
    },
    render: function () {
        var self = this;
        var temp = _.template($("#springy-settings-template").html());
        self.template = temp(self.currentLayoutProperties);
        $(self.el).html(self.template);

        $(self.el).dialog();

        $("#save-layout3").click( function (evt) {
            self.currentLayoutProperties.animate = document.getElementById("animate3").checked;
            self.currentLayoutProperties.maxSimulationTime = Number(document.getElementById("maxSimulationTime3").value);
            self.currentLayoutProperties.ungrabifyWhileSimulating = document.getElementById("ungrabifyWhileSimulating3").checked;
            self.currentLayoutProperties.fit = document.getElementById("fit3").checked;
            self.currentLayoutProperties.padding = Number(document.getElementById("padding3").value);
            self.currentLayoutProperties.random = document.getElementById("random3").checked;
            self.currentLayoutProperties.infinite = document.getElementById("infinite3").checked;
            self.currentLayoutProperties.stiffness = Number(document.getElementById("stiffness3").value);
            self.currentLayoutProperties.repulsion = Number(document.getElementById("repulsion3").value);
            self.currentLayoutProperties.damping = Number(document.getElementById("damping3").value);

            $(self.el).dialog('close');
        });

        $("#default-layout3").click( function (evt) {
            self.copyProperties();
            var temp = _.template($("#springy-settings-template").html());
            self.template = temp(self.currentLayoutProperties);
            $(self.el).html(self.template);
        });

        return this;
    }
});


var whitenBackgrounds = function(){
    $("#cose-bilkent").css("background-color", "white");
    $("#cose").css("background-color", "white");
    $("#cola").css("background-color", "white");
    $("#springy").css("background-color", "white");
    $("#arbor").css("background-color", "white");
};

function performLayout(){
    cy.layout().stop();
    cy.nodes().removeData("ports");
    cy.edges().removeData("portsource");
    cy.edges().removeData("porttarget");

    cy.nodes().data("ports", []);
    cy.edges().data("portsource", []);
    cy.edges().data("porttarget", []);
    switch (tempName) {
        case 'cose-bilkent':
            coseBilkentLayoutProp.applyLayout();
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
}
