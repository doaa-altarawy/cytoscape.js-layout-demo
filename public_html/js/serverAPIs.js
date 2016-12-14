// Communication with the server


// Messenger.options = {
//     extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-right',
//     theme: 'flat'
// };

// specifies code that should run once the browser is done loading
$(function(){
    // for flask and jquery
    //$SCRIPT_ROOT = {{ request.script_root|tojson|safe }};

    // prevent right click browser default on svgDisplay div (svg)
    // window.oncontextmenu = function (ev) {            
    //     ev.preventDefault();
    //     //return false;     // cancel default menu
    // }    
  
    var drawGraph = function(jsonGraph){
        var layout = {
            name: 'cose',
            fit: true
        };
        if (jsonGraph.hasOwnProperty('fixPositions')){
            layout.name = 'present'; // fix node position
        }
        var cytoscapeJsGraph = {
            edges: jsonGraph.edges,
            nodes: jsonGraph.nodes,
            layout: layout
        };
        console.log('----------------');
        console.log(cytoscapeJsGraph);

        refreshCytoscape(cytoscapeJsGraph);        
    };
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // get Modal form for loading
    $('#loadGraphDialog').on('click', function(){    
        console.log("load Graph...");    
        $.get("/_loadDemoGraphList", {formId:'chooseGraphForm'})
            .done(function(data) {
                // console.log(data);
                $('div#formHolder').html(data);
                // bind ok button action
                $('#submitBtn').bind('click', function(){
                        //var formData = new FormData($("#inputForm"));
                        graphName = $("#dataset").val();
                        count = Number($('#numOfGenes').val())
                        startNo = Number($('#startGene').val())
                        geneID = $('#geneID').val()
                        //gold_standard = Number($('gold_standard:checked').val())
                        gold_standard = Number($('input[name=gold_standard]:checked').val())
                        console.log("graphName: "+graphName+ 
                            ", From: "+startNo+" ,To: "+count+ ", geneID: "+ geneID);
                        getDrawGraph(graphName, startNo, count, gold_standard, geneID);    
                        setFileContent(graphName);                     
                        $("#chooseGraphForm").modal('hide');
                        return false;
                  });
                $("div#chooseGraphForm").modal('show');
            })
            .fail(function() {
                console.log("A problem happened.");
            })
            .always(function() {
                //console.log("finished");
            });
        $('li.dropdown').removeClass('open');
        return false;           
    });

    // //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // $('a#loadDemoGraph').on('click', function() {
    //     console.log("loadDemoGraph...");
    //     getDrawGraph('');
    //     // close dropdowns
    //     $('li.dropdown').removeClass('open');
    //     return false;
    // });
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $('#reEvaluate').on('click', function(){
        // setTimeout('', 1000);
        getDrawGraph('');
        return false;
    });

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // get Modal form for run data
    $('#runAutoTest').on('click', function(){        
        $.get("/_runTest", {formId:'inputForm'})
            .done(function(data) {
                //alert(data);
                $('div#formHolder').html(data);
                // bind ok button action
                $('#submitBtn').bind('click', submitForm);
                $("div#inputForm").modal('show');
            })
            .fail(function() {
                alert( "A problem happened." );
            })
            .always(function() {
                //alert( "finished" );
            });            
    });

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // get and Draw graph!
    var submitForm = function(){
         //var formData = new FormData($("#inputForm"));
         graphName = $("#dataset").val(); //not tested
         console.log("graphName: "+graphName);
         getDrawGraph(graphName);
         // $.ajax({
         //   type: "POST",
         //   url: "/_runTest",
         //   data: formData, //$("#inputForm").serialize(), // serializes the form's elements.
         //   contentType: 'multipart/form-data', //false,
         //   processData: false,
         //   success: function(data){
         //       //alert(data); // show response from the server
         //       console.log(data);
         //   },
         //   fail: function(){
         //      alert('failed!'); // show response from the server              
         //   }
         // });
        $("#inputForm").modal('hide');
        return false;
    };   

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Load a ready graph from server
    function getDrawGraph(graphName){
        getDrawGraph(graphName, 0, 50, 1, '');
    }
    function getDrawGraph(graphName, start, count, gold_standard, geneID){
      $.getJSON('/_loadGraph', 
            {graphName: graphName,
              startGene: start,
              numOfGenes: count,
              gold_standard: gold_standard,
              geneID: geneID})
        .done(function(ntdata) {
            console.log('Server data:');
            console.dir(ntdata);
            drawGraph(ntdata);
        });
    }     
}); //end anonymous func

//========================================================
// Edge edge weight form 
function showTextBox(text){
    weightChanged = false;
    $('#edgeWeight').val(text);
    $('#editEdgeWeightForm').modal('show');
    $('#edgeWeightSubmit').bind('click', function(){
        var newWeight = Number($('#edgeWeight').val());
        console.log("New weight: "+newWeight);
        if (newWeight == NaN){
            alert(newWeight+ " is not a number. \nPlease" 
                + "Enter a number between 0 and 1");
            return;
        }
        updateWeight(newWeight);
        $("#editEdgeWeightForm").modal('hide');
        return true;
    });
}// end(showTextBox)

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// check if a mouse event is a right click
// function isRightClick(e) {
//     var isRightMB;
//     e = e || window.event;

//     if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
//         isRightMB = e.which == 3; 
//     else if ("button" in e)  // IE, Opera 
//         isRightMB = e.button == 2; 
//     return isRightMB;            
// } 